#!/bin/sh
set -eoux pipefail

source terraform-env.sh
terraform -chdir=terraform-backend init
terraform -chdir=terraform-backend apply