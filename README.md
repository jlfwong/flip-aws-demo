# flip.energy AWS demo

This repo contains a prototype of energy devices interacting with https://flip.energy/.

It includes...
- Terraform files for setting up the necessary AWS services to interface with IoT core (IAM profiles, SQS, etc.)
- Scripts for device provisioning (IoT Thing creation, certificate provisioning)
- A mock implementation of an energy device which reports telemetry to Flip and receives commands