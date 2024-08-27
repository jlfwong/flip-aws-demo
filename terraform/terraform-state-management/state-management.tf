# This is the terraform configuration to create the resources needed
# for state management of terraform itself. We use S3 for backend storage,
# and dynamodb for locking.
#
# This is separate from the main terraform file because this needs to be run
# first, and should have its own independent state file.
#
# See: https://developer.hashicorp.com/terraform/language/settings/backends/s3

provider "aws" {
  region = var.region
}

resource "aws_s3_bucket" "terraform_state" {
  bucket = var.terraform_state_s3_bucket

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_dynamodb_table" "terraform_state_lock" {
  name           = var.terraform_state_locking_dynamodb_table
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}