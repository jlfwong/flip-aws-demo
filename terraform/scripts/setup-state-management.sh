#!/bin/sh
set -eoux pipefail

terraform -chdir=terraform-state-management init
terraform -chdir=terraform-state-management apply -var-file='../config.tfvars'