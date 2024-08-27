#!/bin/sh
set -eoux pipefail

terraform init
terraform apply -var-file='config.tfvars'
mkdir -p output
terraform output -json > output/aws-config.json