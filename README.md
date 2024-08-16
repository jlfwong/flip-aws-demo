# flip.energy AWS demo

This repo contains a prototype of energy devices interacting with https://flip.energy/.

It includes...
- Terraform files for setting up the necessary AWS services to interface with IoT core (IAM profiles, SQS, etc.)
- Scripts for device provisioning (IoT Thing creation, certificate provisioning)
- A mock implementation of an energy device which reports telemetry to Flip and receives commands

TODO:
- Use s3 terraform backend: https://developer.hashicorp.com/terraform/language/settings/backends/s3

# Setup

- Download aws cli
- Log in with your aws account using the aws cli

## Apply terraform configuration and populate AWS configuration files

    cd terraform
    scripts/apply.sh</dev/tty

## Provision a device

    cd device-provisioning-service
    npm install
    npm run provision-device -- my-cool-battery device-artifacts/my-cool-battery

## Boot a device

    cd on-device-client
    npm install
    npm run run-device -- ../device-provisioning-service/device-artifacts/battery-100

Several devices can be running in parallel