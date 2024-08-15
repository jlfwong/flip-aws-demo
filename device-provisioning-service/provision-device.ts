import {
  IoTClient,
  CreateThingCommand,
  CreateKeysAndCertificateCommand,
  AttachThingPrincipalCommand,
  AttachPolicyCommand,
} from "@aws-sdk/client-iot";

interface AWSConfig {
  aws_region: {
    value: string;
  };
  device_policy_name: {
    value: string;
  };
  device_provisioning_access_key: {
    value: {
      access_key_id: string;
      secret_key: string;
    };
  };
  iot_endpoint: {
    value: string;
  };
}

import * as awsConfigRaw from "../terraform/output/aws-config.json";
const awsConfig = awsConfigRaw as AWSConfig;

const region = awsConfig.aws_region.value;
const iotPolicyName = awsConfig.device_policy_name.value;
const deviceProvisioningAccessKey =
  awsConfig.device_provisioning_access_key.value;

const iotClient = new IoTClient({
  region,
  credentials: {
    accessKeyId: deviceProvisioningAccessKey.access_key_id,
    secretAccessKey: deviceProvisioningAccessKey.secret_key,
  },
});

async function createIoTThing(thingName: string) {
  const command = new CreateThingCommand({ thingName });
  const response = await iotClient.send(command);
  console.log("IoT Thing created:", response.thingName);
  return response.thingArn!;
}

async function createCertificate() {
  const command = new CreateKeysAndCertificateCommand({ setAsActive: true });
  const response = await iotClient.send(command);
  console.log("Certificate created:", response.certificateId);
  return {
    certificateArn: response.certificateArn!,
    certificatePem: response.certificatePem!,
    privateKey: response.keyPair!.PrivateKey!,
  };
}

async function attachThingPrincipal(thingName: string, certificateArn: string) {
  const command = new AttachThingPrincipalCommand({
    thingName,
    principal: certificateArn,
  });
  await iotClient.send(command);
  console.log("Thing principal attached");
}

async function attachIoTPolicy(certificateArn: string) {
  const command = new AttachPolicyCommand({
    policyName: iotPolicyName,
    target: certificateArn,
  });
  await iotClient.send(command);
  console.log("IoT policy attached");
}

export async function provisionBattery(thingName: string) {
  try {
    const thingArn = await createIoTThing(thingName);
    const cert = await createCertificate();
    await attachThingPrincipal(thingName, cert.certificateArn);
    await attachIoTPolicy(cert.certificateArn);

    console.log("Battery provisioned successfully!");

    return {
      thingName,
      thingArn,
      certificateArn: cert.certificateArn,
      certificatePem: cert.certificatePem,
      iotEndpoint: awsConfig.iot_endpoint,
      privateKey: cert.privateKey,
    };
  } catch (error) {
    console.error("Error provisioning battery:", error);
    throw error;
  }
}
