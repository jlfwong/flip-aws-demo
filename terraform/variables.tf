variable "region" {
  type = string
  description = "The AWS region to use"
}

variable "project_name" {
  type = string
  description = "The name of this project. Will be used to prefix resources."
}

variable "terraform_state_s3_bucket" {
  type = string
  description = "Name of the S3 bucket for Terraform state"
}

variable "terraform_state_s3_key" {
  type = string
  description = "Name of the S3 key for Terraform state"
}

variable "terraform_state_locking_dynamodb_table" {
  type        = string
  description = "Name of the DynamoDB table for state locking"
}
