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
    scripts/setup-state-management.sh</dev/tty
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


## Open questions:
- How to ensure FIFO delivery of commands?
  - IoT rules can't publish directly to FIFO queues. This might not be an issue in    practice because commands will be published by a lambda or a server, not by an IoT rule. For telemetry, out of order delivery seems like it shouldn't be a problem, provided we have accurate timestamps
- How to deal with SQS message retention limits

# Technical Architecture

TODO
- System architecture
- Provisioning security
- Fault tolerance
- Clock skew
- Costs
- Scaling concerns (e.g. lambda concurrenc, lambda batch sizes, SQS queue sizes)