# Provider configuration
provider "aws" {
  region = "us-west-2"  # or your preferred region
}

# Variables
variable "project_name" {
  default = "flip-aws-demo"
  description = "A name to prefix resources and tags"
}

locals {
  common_tags = {
    Project = var.project_name
    ManagedBy = "Terraform"
  }
}

# IAM User for device provisioning
resource "aws_iam_user" "device_provisioning_user" {
  name = "${var.project_name}-device-provisioning-user"
  tags = local.common_tags
}

# IAM Policy for device provisioning
resource "aws_iam_user_policy" "device_provisioning_policy" {
  name = "${var.project_name}-device-provisioning-policy"
  user = aws_iam_user.device_provisioning_user.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "iot:CreateThing",
          "iot:CreateKeysAndCertificate",
          "iot:AttachThingPrincipal",
          "iot:AttachPolicy"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# IoT policy for devices
resource "aws_iot_policy" "device_policy" {
  name = "${var.project_name}-shared-device-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "iot:Connect",
          "iot:Publish",
          "iot:Subscribe",
          "iot:Receive"
        ]
        Resource = [
          "arn:aws:iot:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:client/$${iot:Connection.Thing.ThingName}",
          "arn:aws:iot:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:topic/devices/$${iot:Connection.Thing.ThingName}/*",
          "arn:aws:iot:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:topicfilter/devices/$${iot:Connection.Thing.ThingName}/*"
        ]
      }
    ]
  })

  tags = local.common_tags
}

# Data sources for current region and account ID
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# Output the names of created resources
output "iot_policy_name" {
  value = aws_iot_policy.device_policy.name
}

output "provisioning_user_name" {
  value = aws_iam_user.device_provisioning_user.name
}