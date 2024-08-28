terraform {
  backend "s3" {}
}

variable "region" {
  type = string
  description = "The AWS region to use"
}

variable "project_name" {
  type = string
  description = "The name of this project. Will be used to prefix resources."
}

provider "aws" {
  region = var.region
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

# Ideally this would be FIFO, but AWS doesn't allow
# IoT Rules to publish to FIFO queues
resource "aws_sqs_queue" "telemetry_queue" {
  name                      = "${var.project_name}-telemetry-queue"
  delay_seconds             = 0
  max_message_size          = 262144
  message_retention_seconds = 1209600  # Updated to maximum (14 days)
  receive_wait_time_seconds = 10
}

# IAM Role for IoT Rule
resource "aws_iam_role" "iot_rule_role" {
  name = "${var.project_name}-iot-rule-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "iot.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for IoT Rule to publish to SQS
resource "aws_iam_role_policy" "iot_rule_sqs_policy" {
  name = "${var.project_name}-iot-rule-sqs-policy"
  role = aws_iam_role.iot_rule_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.telemetry_queue.arn
      }
    ]
  })
}

# AWS IoT Rule
resource "aws_iot_topic_rule" "telemetry_rule" {
  name        = "${replace(var.project_name, "-", "_")}_telemetry_rule"
  description = "Route telemetry messages to SQS FIFO queue"
  enabled     = true
  sql         = "SELECT *, topic() as mqtt_topic, timestamp() as mqtt_received_at FROM 'devices/+/telemetry'"
  sql_version = "2016-03-23"

  sqs {
    queue_url = aws_sqs_queue.telemetry_queue.id
    role_arn  = aws_iam_role.iot_rule_role.arn
    use_base64 = false
  }
}

# Output SQS Queue URL
output "sqs_queue_url" {
  value = aws_sqs_queue.telemetry_queue.url
}

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

# IAM User for web server
resource "aws_iam_user" "web_server_user" {
  name = "${var.project_name}-web-server-user"
}

resource "aws_iam_access_key" "web_server_user_key" {
  user = aws_iam_user.web_server_user.name
}

# IAM Policy for web server user
resource "aws_iam_user_policy" "web_server_user_policy" {
  name = "${var.project_name}-web-server-user-policy"
  user = aws_iam_user.web_server_user.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "iot:DescribeThing",
          "iot:ListThingPrincipals",
          "iot:DescribeCertificate"
        ]
        Resource = "*"
      }
    ]
  })
}

# Output the access key and secret for the web server user
output "web_server_user_access_key" {
  value     = aws_iam_access_key.web_server_user_key.id
  sensitive = true
}

output "web_server_user_secret_key" {
  value     = aws_iam_access_key.web_server_user_key.secret
  sensitive = true
}