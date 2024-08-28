// lib/verifySignature.ts
import { IoTClient, DescribeThingCommand, ListThingPrincipalsCommand, DescribeCertificateCommand } from "@aws-sdk/client-iot";
import crypto from 'crypto';
import { safeGetEnv } from './safe-env';

const iotClient = new IoTClient({
  region: safeGetEnv('AWS_REGION'),
  credentials: {
    accessKeyId: safeGetEnv('AWS_ACCESS_KEY_ID'),
    secretAccessKey: safeGetEnv('AWS_SECRET_ACCESS_KEY')
  }
});

async function getValidPublicKeys(thingName: string): Promise<string[]> {
  const listPrincipalsCommand = new ListThingPrincipalsCommand({ thingName });
  const principalsResponse = await iotClient.send(listPrincipalsCommand);

  if (!principalsResponse.principals || principalsResponse.principals.length === 0) {
    throw new Error("No certificates found for thing");
  }

  const publicKeys = await Promise.all(
    principalsResponse.principals.map(principal => {
      const certificateId = principal.split('/')[1]; // Extract certificate ID from ARN
      return getPublicKeyFromCertificateId(certificateId);
    })
  );

  return publicKeys;
}

async function getPublicKeyFromCertificateId(certificateId: string): Promise<string> {
  const command = new DescribeCertificateCommand({ certificateId });
  const response = await iotClient.send(command);

  if (!response.certificateDescription?.certificatePem) {
    throw new Error("Certificate PEM not found");
  }

  return crypto.createPublicKey(response.certificateDescription.certificatePem)
    .export({ type: 'spki', format: 'pem' }) as string;
}

function verifySignatureWithPublicKey(payload: string, signature: string, publicKey: string): boolean {
  const verify = crypto.createVerify('SHA256');
  verify.update(payload);
  return verify.verify(publicKey, signature, 'base64url');
}


function isTimestampValid(timestamp: number): boolean {
  // TODO(jlfwong): Figuring out the right tolerance for this.  Should ideally
  // not be overly sensitive to clock skew
  const MAX_AGE_HOURS = 1
  const now = Math.floor(Date.now() / 1000);
  const maxAgeSeconds = MAX_AGE_HOURS * 3600;
  return (now - timestamp) <= maxAgeSeconds;
}

export async function verifySignature(payload: string, signature: string): Promise<void> {
  // TODO(jlfwong): Respect the nonce to prevent replay attacks

  const payloadObj = JSON.parse(payload);
  const { thingName, timestamp } = payloadObj;

  if (!thingName) {
    throw new Error("Missing thingName in payload");
  }

  if (!timestamp || typeof timestamp !== 'number') {
    throw new Error("Invalid or missing timestamp in payload");
  }

  if (!isTimestampValid(timestamp)) {
    throw new Error("Timestamp is too old");
  }

  const publicKeys = await getValidPublicKeys(thingName);

  for (const publicKey of publicKeys) {
    if (verifySignatureWithPublicKey(payload, signature, publicKey)) {
      return; // Signature is valid
    }
  }

  throw new Error("Invalid signature");
}