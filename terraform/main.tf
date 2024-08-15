# Provider configuration
provider "aws" {
  region = "us-west-2"  # or your preferred region
}

# Variables
variable "project_name" {
  default = "flip-aws-demo"
}

# IAM User for device provisioning
resource "aws_iam_user" "device_provisioning_user" {
  name = "${var.project_name}-device-provisioning-user"
}

resource "aws_iam_access_key" "device_provisioning_key" {
  user = aws_iam_user.device_provisioning_user.name
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
}

# Resource to fetch the Amazon Root CA
resource "null_resource" "download_root_ca" {
  provisioner "local-exec" {
    command = "mkdir -p output && curl https://www.amazontrust.com/repository/AmazonRootCA1.pem -o output/AmazonRootCA1.pem"
  }
}

# Data source to get the IoT endpoint
data "aws_iot_endpoint" "endpoint" {
  endpoint_type = "iot:Data-ATS"
}

# Data sources for current region and account ID
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# Output the names of created resources
output "aws_region" {
  value = data.aws_region.current.name
}

output "device_provisioning_access_key" {
  value = {
    access_key_id = aws_iam_access_key.device_provisioning_key.id
    secret_key = aws_iam_access_key.device_provisioning_key.secret
  }
  sensitive = true
}

output "device_policy_name" {
  value = aws_iot_policy.device_policy.name
}

output "iot_endpoint" {
  value = data.aws_iot_endpoint.endpoint.endpoint_address
}