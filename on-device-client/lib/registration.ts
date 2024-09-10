import * as crypto from 'crypto';

export function signPayload(payload: string, privateKey: string): string {
  const sign = crypto.createSign('SHA256');
  sign.update(payload);
  return sign.sign(privateKey, 'base64url');
}

export function generateRegistrationUrl(
  baseUrl: string,
  thingName: string,
  privateKey: string
): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Math.floor(+new Date() / 1000)
  const version = 1

  const payload = JSON.stringify({
    thingName,
    nonce,
    timestamp,
    version
  })
  const signature = signPayload(payload, privateKey);
  return `${baseUrl}?payload=${encodeURIComponent(payload)}&signature=${encodeURIComponent(signature)} `;
}