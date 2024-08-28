import { verifySignature } from '../../../lib/verify-signature';

interface PayloadData {
  thingName: string;
  nonce: string;
  timestamp: number;
  version: number;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { payload?: string; signature?: string };
}) {
  const { payload, signature } = searchParams;

  if (!payload || !signature) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>Missing payload or signature</p>
      </div>
    );
  }

  let payloadData: PayloadData;
  try {
    payloadData = JSON.parse(decodeURIComponent(payload));
  } catch (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>Invalid payload format</p>
      </div>
    );
  }

  const { thingName, nonce, timestamp, version } = payloadData;
  const decodedTimestamp = new Date(timestamp * 1000);

  let verificationStatus: string;
  try {
    await verifySignature(payload, signature);
    verificationStatus = 'success';
  } catch (err) {
    verificationStatus = `${err}`;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Device Registration Information</h1>
      <div className="space-y-2">
        <p><strong>Thing Name:</strong> {thingName}</p>
        <p><strong>Timestamp:</strong> {decodedTimestamp.toLocaleString()}</p>
        <p><strong>Nonce:</strong> {nonce}</p>
        <p><strong>Version:</strong> {version}</p>
        <p><strong>Signature:</strong> {signature}</p>
        <p><strong>Verification Status:</strong> {verificationStatus}</p>
      </div>
      <div className="mt-4">
        <h2 className="text-xl font-bold mb-2">Raw Payload:</h2>
        <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(payloadData, null, 2)}</pre>
      </div>
    </div>
  );
}