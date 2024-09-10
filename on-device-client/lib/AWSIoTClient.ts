import { mqtt, iot } from "aws-iot-device-sdk-v2";
import * as fs from "fs";
import * as path from "path";

export class AWSIoTClient {
  private connection: mqtt.MqttClientConnection | null = null;
  public deviceInfo: { iotEndpoint: string; thingName: string };

  constructor(private artifactsPath: string) {
    this.loadDeviceInfo();
  }

  private loadDeviceInfo() {
    try {
      const deviceInfoPath = path.join(this.artifactsPath, "device-info.json");
      this.deviceInfo = JSON.parse(fs.readFileSync(deviceInfoPath, "utf-8"));

      if (
        !this.deviceInfo.iotEndpoint ||
        typeof this.deviceInfo.iotEndpoint !== "string"
      ) {
        throw new Error("Invalid or missing iotEndpoint in device-info.json");
      }
    } catch (error) {
      console.error("Error loading device info:", error);
      throw error;
    }
  }

  public privateKeyPath(): string {
    return path.join(this.artifactsPath, "private-key.pem")
  }

  async connect(): Promise<void> {
    try {
      const config =
        iot.AwsIotMqttConnectionConfigBuilder.new_mtls_builder_from_path(
          path.join(this.artifactsPath, "certificate.pem"),
          this.privateKeyPath()
        );

      config.with_certificate_authority_from_path(
        undefined,
        path.join(this.artifactsPath, "AmazonRootCA1.pem")
      );
      config.with_clean_session(false);
      config.with_client_id(this.deviceInfo.thingName);
      config.with_endpoint(this.deviceInfo.iotEndpoint);

      const client = new mqtt.MqttClient();
      this.connection = client.new_connection(config.build());

      await this.connection.connect();
      console.log("Connected to AWS IoT Core");
    } catch (error) {
      console.error("Error connecting to AWS IoT Core:", error);
      throw error;
    }
  }

  async publish(topic: string, message: string): Promise<void> {
    if (!this.connection) {
      throw new Error("Not connected to AWS IoT Core");
    }
    try {
      await this.connection.publish(topic, message, mqtt.QoS.AtLeastOnce);
      console.log(`Published to ${topic}: ${message}`);
    } catch (error) {
      console.error(`Error publishing to ${topic}:`, error);
      throw error;
    }
  }

  async subscribe(
    topic: string,
    callback: (topic: string, message: string) => void
  ): Promise<void> {
    if (!this.connection) {
      throw new Error("Not connected to AWS IoT Core");
    }
    try {
      await this.connection.subscribe(
        topic,
        mqtt.QoS.AtLeastOnce,
        (topic, payload) => {
          const message = payload.toString();
          console.log(`Received on ${topic}: ${message}`);
          callback(topic, message);
        }
      );
      console.log(`Subscribed to ${topic}`);
    } catch (error) {
      console.error(`Error subscribing to ${topic}:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.disconnect();
        console.log("Disconnected from AWS IoT Core");
      } catch (error) {
        console.error("Error disconnecting from AWS IoT Core:", error);
        // Don't throw here, as we're already disconnecting
      }
    }
    this.connection = null;
  }
}
