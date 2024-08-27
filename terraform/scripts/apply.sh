#!/bin/sh
set -eoux pipefail

source terraform-env.sh
terraform init \
  -backend-config="region=$TF_VAR_region" \
  -backend-config="bucket=$TF_VAR_terraform_backend_s3_bucket" \
  -backend-config="key=$TF_VAR_terraform_backend_s3_key" \
  -backend-config="dynamodb_table=$TF_VAR_terraform_backend_dynamodb_table" \
  -backend-config="encrypt=true"
terraform apply
mkdir -p output
terraform output -json > output/aws-config.json