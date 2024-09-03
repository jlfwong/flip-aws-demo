# flip.energy AWS demo

This repo contains a prototype of energy devices interacting with https://flip.energy/.

It includes...

- Terraform files for setting up the necessary AWS services to interface with IoT core (IAM profiles, SQS, etc.)
- Scripts for device provisioning (IoT Thing creation, certificate provisioning)
- A mock implementation of an energy device which reports telemetry to Flip and receives commands
- A mock implementation of a web interface for registering

# Setup

- Create an AWS account
- Create a supabase account
- Download aws cli
- Log in with your aws account using the aws cli

## Apply terraform configuration and populate AWS configuration files

This creates and configures all of the necessary services in AWS. For example,
this creates the IAM roles and users, the provisioning certificate, and the SQS
queue for messages.

This is actually two steps:

1. Create the S3 bucket and dynamodb table needed for terraform to manage its own state via terraform's [S3 backend](https://developer.hashicorp.com/terraform/language/settings/backends/s3
2. Create everything else

   cd terraform
   scripts/setup-terraform-backend.sh
   scripts/apply.sh

Use your an email account you have access to in the terraform setup. This will
be used by supabase to send authentication related emails.

## Configure supabase authentication

### Configuring email templates in Supabase

The recommended authentication mechanism for server side rendering in Supabase uses
manual OTP verification for passwordless email authentication. To make this work, you
need to modify the email templates Supabase uses by default.

To do this:

1. Go to the [Auth templates](https://supabase.com/dashboard/project/_/auth/templates) page in your Supabase dashboard.
2. In the `Confirm signup` template, change `{{ .ConfirmationURL }}` to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&redirect_to={{ .RedirectTo }}`.
3. In the `Magic link` tempalte, change it to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&redirect_to={{ .RedirectTo }}`
4. Update the [Redirect URLs list](https://supabase.com/dashboard/project/_/auth/url-configuration) to include `http://localhost:3000/**`.

See: https://supabase.com/docs/guides/auth/server-side/nextjs?queryGroups=router&router=app

### Configuring SMTP configuration in Supabase (optional)

Supabase has extremely [restrictive rate
limits](https://supabase.com/docs/guides/auth/auth-smtp) for sending emails.
This can make debugging issues related to authentication annoying. To work
around this problem, you can configure [Amazon SES](https://aws.amazon.com/ses/)
for email sending.

The relevant SES keys can be found in the terraform output after running
`apply.sh` by looking in `terraform/output/aws-config.json`:

- `smtp_host`
- `smtp_username`
- `smtp_password`

Take these values and `Enable Custom SMTP` on the [Auth settings
page](https://supabase.com/dashboard/project/_/settings/auth) on Supabase. For
the sender email, choose the same email you entered into the terraform
configuration.

## Set up environment variables

For the Next.JS app to boot, environment variables must be set in a `.env` file.
See comments in `safe-env.ts` for where to retrieve these.

# Workflows

## Provision a device

Provisioning a device means "create a device in AWS IoT Core, and generate the
files needed on-device to communicate". In a real production environment, this
would be part of the manufacturing process. This is where e.g. the
device-specific certificates are created to be flashed onto the device.

    cd device-provisioning-service
    npm install
    npm run provision-device -- my-cool-battery device-artifacts/my-cool-battery

## Boot a device

In a real production environment, this would be equivalent to turning on the
physical battery (assuming it already has access to the internet). Once running,
devices will begin reporting telemetry back to central servers. Several devices
can be running in parallel.

    cd on-device-client
    npm install
    npm run run-device -- ../device-provisioning-service/device-artifacts/my-cool-battery

## Register and enroll a device

Even after a device is provisioned and started, for a homeowner to enroll it
into VPP programs, physical address information needs to be associated with the
device. To prove the user has physical access to the device, the device
generates a registration URL containing a message signed with the device's
private key. When the registration URL loads, it examines the message to
identify the device, then fetches the device's public key from AWS IoT Core and
verifies the signature. The user can then associate the device with their
account, and commission that device with Flip.

    cd web-server
    npm install
    npm run dev
    cd ../on-device-client
    npm install
    npm run
    npm run generate-registration-url -- ../device-provisioning-service/device-artifacts/my-cool-battery http://localhost:3000/devices/register

From there, open the URL generated by the script and follow the registration
instructions.

## Open questions:

- How to ensure FIFO delivery of commands?
  - IoT rules can't publish directly to FIFO queues. This might not be an issue in practice because commands will be published by a lambda or a server, not by an IoT rule. For telemetry, out of order delivery seems like it shouldn't be a problem, provided we have accurate timestamps
- How to deal with SQS message retention limits

# Technical Architecture

TODO

- System architecture
- Provisioning security
- Fault tolerance
- Clock skew
- Costs
- Scaling concerns (e.g. lambda concurrenc, lambda batch sizes, SQS queue sizes)
