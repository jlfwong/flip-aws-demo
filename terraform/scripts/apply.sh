#!/bin/sh
set -eoux pipefail

terraform apply
mkdir -p output
terraform output -json > output/aws-config.json