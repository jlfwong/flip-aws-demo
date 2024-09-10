terraform {
  backend "s3" {}
}

variable "region" {
  type        = string
  description = "The AWS region to use"
}

variable "project_name" {
  type        = string
  description = "The name of this project. Will be used to prefix resources."
}

variable "test_email" {
  type        = string
  description = "Email to use for testing. Set to use Amazon SES to send emails in debug"
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
  message_retention_seconds = 1209600 # Updated to maximum (14 days)
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
    queue_url  = aws_sqs_queue.telemetry_queue.id
    role_arn   = aws_iam_role.iot_rule_role.arn
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
    secret_key    = aws_iam_access_key.device_provisioning_key.secret
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

# SES Email Identity
resource "aws_ses_email_identity" "personal_email" {
  email = var.test_email
}

# IAM User for SMTP credentials
resource "aws_iam_user" "ses_smtp_user" {
  name = "ses-smtp-user"
}

# IAM User Policy for SES sending
resource "aws_iam_user_policy" "ses_smtp_policy" {
  name = "ses-smtp-policy"
  user = aws_iam_user.ses_smtp_user.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendRawEmail",
          "ses:SendEmail"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "random_password" "web_server_shared_secret" {
  length  = 32
  special = false
}

# Connection for API Destination
resource "aws_cloudwatch_event_connection" "telemetry_http_connection" {
  name               = "${var.project_name}-telemetry-http-connection"
  authorization_type = "API_KEY"

  auth_parameters {
    api_key {
      key   = "Authorization"
      value = "Bearer ${random_password.web_server_shared_secret.result}"
    }
  }
}

# API Destination for HTTP endpoint
resource "aws_cloudwatch_event_api_destination" "telemetry_http_destination" {
  name                             = "${var.project_name}-telemetry-http-destination"
  invocation_endpoint              = "https://83e9-157-131-170-91.ngrok-free.app/api/devices/telemetry"
  http_method                      = "POST"
  invocation_rate_limit_per_second = 300
  connection_arn                   = aws_cloudwatch_event_connection.telemetry_http_connection.arn
}

# EventBridge Pipe
resource "aws_pipes_pipe" "sqs_to_http" {
  name     = "${var.project_name}-sqs-to-http-pipe"
  role_arn = aws_iam_role.pipes_role.arn
  source   = aws_sqs_queue.telemetry_queue.arn
  target   = aws_cloudwatch_event_api_destination.telemetry_http_destination.arn

  source_parameters {
    sqs_queue_parameters {
      batch_size = 1
    }
  }
}

# IAM role for EventBridge Pipes
resource "aws_iam_role" "pipes_role" {
  name = "${var.project_name}-pipes-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "pipes.amazonaws.com"
        }
      }
    ]
  })
}

# IAM policy for Pipes to read from SQS and send to HTTP endpoint
resource "aws_iam_role_policy" "pipes_policy" {
  name = "${var.project_name}-pipes-policy"
  role = aws_iam_role.pipes_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.telemetry_queue.arn
      },
      {
        Effect = "Allow"
        Action = [
          "events:InvokeApiDestination"
        ]
        Resource = aws_cloudwatch_event_api_destination.telemetry_http_destination.arn
      }
    ]
  })
}

output "smtp_host" {
  value = "email-smtp.${var.region}.amazonaws.com"
}

# Generate SMTP credentials
resource "aws_iam_access_key" "ses_smtp_user_key" {
  user = aws_iam_user.ses_smtp_user.name
}

# Output SMTP credentials (Be cautious with these!)
output "smtp_username" {
  value = aws_iam_access_key.ses_smtp_user_key.id
}

output "smtp_password" {
  value     = aws_iam_access_key.ses_smtp_user_key.ses_smtp_password_v4
  sensitive = true
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

output "web_server_shared_secret" {
  value     = random_password.web_server_shared_secret
  sensitive = true
}
