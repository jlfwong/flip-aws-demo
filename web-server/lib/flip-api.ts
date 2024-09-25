import safeEnv from "./safe-env";

interface EnrollmentFormField {
  name: string;
  label: string;
  type: string;
}

export interface FlipProgram {
  id: string;
  name: string;
  description: string;
  eligible_device_types: string[];
  can_auto_enroll: boolean;
  minimum_commitment_months: number;
  participation_months: number[];
  earnings_for_site_upfront: number;
  earnings_for_site_yearly: number;
  created_at: string;
  updated_at: string;
  enrollment_form: EnrollmentFormField[];
  terms_and_conditions_version: string;
  terms_and_conditions_text: string;
}

interface ProgramSpecificAttribute {
  name: string;
  value: string;
}

export interface FlipEnrollment {
  id: string;
  device_ids: string[];
  site_id: string;
  program_id: string;
  enroll_method: string;
  status: string;
  status_reason: string;
  enrolled_at: string;
  unenrolled_at: string;
  program_specific_attributes: ProgramSpecificAttribute[];
  has_agreed_to_terms_and_conditions: boolean;
  terms_and_conditions_version: string;
}

interface CommissionResponse {
  programs: FlipProgram[];
  enrollment: FlipEnrollment;
}

export interface Site {
  first_name: string;
  last_name: string;
  email: string;
  state_code: string;
  city: string;
  zip_code: string;
  street_address: string;
  street_address2?: string;
  service_account_id: string;
}

interface DeviceAttributes {
  battery_capacity_wh: number;
  battery_power_input_w: number;
  battery_power_output_w: number;
}

interface DeviceConfiguration {
  reserve_percentage: number;
}

interface Device {
  id: string;
  manufacturer_name: string;
  product_name: string;
  serial_number: string;
  type: "BATTERY";
  attributes: DeviceAttributes;
  configuration: DeviceConfiguration;
  install_date: string;
}

interface TelemetryDeviceStatus {
  device_id: string;
  last_is_online: boolean;
  last_mode: string;
  battery_last_power_charge_w: number;
  battery_last_power_discharge_w: number;
  battery_total_energy_charge_wh: number;
  battery_total_energy_discharge_wh: number;
  battery_last_stored_energy_wh: number;
  battery_last_capacity_energy_wh: number;
  battery_last_backup_reserve_percentage: number;
  last_is_grid_online: boolean;
  home_total_energy_wh: number;
  home_last_power_w: number;
  solar_total_energy_wh: number;
  solar_last_power_w: number;
}

export interface FlipTelemetryPayload {
  start_time: string;
  duration_s: number;
  telemetry: TelemetryDeviceStatus[];
}

type TelemetryResponse = {
  status: "FAILED" | "OK";
  message: string;
}[];

export interface SiteToken {
  expires_at: Date;
  site_access_token: string;
}

export interface CommissionPayload {
  site: Site;
  devices: Device[];
  can_auto_enroll: boolean;
}

export interface CreateEnrollmentPayload {
  device_ids: string[];
  program_id: string;
  enroll_method: "AUTO_ENROLL" | "USER_ACTION";
  has_agreed_to_terms_and_conditions: boolean;
  terms_and_conditions_version?: string;
  program_specific_attributes?: { name: string; value: string }[];
}

class FlipApiRequester {
  constructor(private baseUrl: string, private authToken: string) {}

  private async makeRequest(
    endpoint: string,
    method: string,
    body?: any
  ): Promise<Response> {
    const headers = new Headers({
      "Content-Type": body != null ? "application/json" : "text/plain",
      Authorization: `Bearer ${this.authToken}`,
    });

    const url = `${this.baseUrl}${endpoint}`;

    console.log(`Fetching ${url}`);
    console.log(`Authorization: ${headers.get("Authorization")}`);

    return await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async POST(endpoint: string, body: any): Promise<Response> {
    return this.makeRequest(endpoint, "POST", body);
  }

  async PATCH(endpoint: string, body: any): Promise<Response> {
    return this.makeRequest(endpoint, "PATCH", body);
  }

  async GET(endpoint: string): Promise<Response> {
    return this.makeRequest(endpoint, "GET");
  }

  async DELETE(endpoint: string): Promise<Response> {
    return this.makeRequest(endpoint, "DELETE");
  }
}

export class FlipAdminApiClient {
  private req: FlipApiRequester;
  constructor(private baseUrl: string, clientToken: string) {
    this.req = new FlipApiRequester(baseUrl, clientToken);
  }

  async commission(payload: CommissionPayload): Promise<CommissionResponse> {
    const response = await this.req.POST("/v1/commission", payload);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP error! status: ${response.status}. Body: ${body}`);
    }

    return response.json();
  }

  async logBatteryTelemetry(payload: FlipTelemetryPayload): Promise<void> {
    const response = await this.req.POST("/v1/telemetry/BATTERY", payload);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP error! status: ${response.status}. Body: ${body}`);
    }

    const body = (await response.json()) as TelemetryResponse;

    for (const result of body) {
      if (result.status !== "OK") {
        throw new Error(`Failed to log telemetry: ${result.message}`);
      }
    }
  }

  async getSiteToken(siteId: string): Promise<SiteToken | null> {
    const response = await this.req.POST(
      `/v1/auth/site/${encodeURIComponent(siteId)}`,
      null
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const body = await response.text();
      throw new Error(`HTTP error! status: ${response.status}. Body: ${body}`);
    }

    return response.json();
  }

  async getSiteClient(siteId: string): Promise<FlipSiteApiClient | null> {
    const token = await this.getSiteToken(siteId);
    if (!token) return null;
    return new FlipSiteApiClient(this.baseUrl, siteId, token.site_access_token);
  }

  async updateCommandStatus(
    commandId: string,
    status: "OK" | "FAILED"
  ): Promise<void> {
    const response = await this.req.PATCH(`/v1/command/${commandId}`, {
      device_status: status,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP error! status: ${response.status}. Body: ${body}`);
    }

    // This API does return data, but we'll ignore it since we don't care.
  }
}

export class FlipSiteApiClient {
  private req: FlipApiRequester;
  constructor(
    private baseUrl: string,
    private siteId: string,
    siteToken: string
  ) {
    this.req = new FlipApiRequester(baseUrl, siteToken);
  }

  async getDeviceOrNull(deviceId: string): Promise<Device | null> {
    const response = await this.req.GET(
      `/v1/site/${this.siteId}/device/${deviceId}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const body = await response.text();
      throw new Error(`HTTP error! status: ${response.status}. Body: ${body}`);
    }

    return response.json() as Promise<Device>;
  }

  async getSite(): Promise<Site> {
    const response = await this.req.GET(`/v1/site/${this.siteId}`);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP error! status: ${response.status}. Body: ${body}`);
    }

    return response.json() as Promise<Site>;
  }

  async getPrograms(): Promise<FlipProgram[]> {
    // TODO(jlfwong): stop hard-coding this, and force zip code to be specified
    //
    // "On sandbox, use 88800, 88801 or 88802 to return results."
    // https://docs.flip.energy/api-6038147
    const response = await this.req.GET(
      `/v1/site/${this.siteId}/programs?zip_code=88801&device_type=BATTERY`
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP error! status: ${response.status}. Body: ${body}`);
    }

    return response.json() as Promise<FlipProgram[]>;
  }

  static siteIdForThingName(thingName: string): string {
    return `site-for-device::${thingName}`;
  }

  static deviceIdForThingName(thingName: string): string {
    return `device::${thingName}`;
  }

  async createEnrollment(
    payload: CreateEnrollmentPayload
  ): Promise<FlipEnrollment> {
    const response = await this.req.POST(
      `/v1/site/${this.siteId}/enrollments`,
      payload
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP error! status: ${response.status}. Body: ${body}`);
    }

    return response.json() as Promise<FlipEnrollment>;
  }

  async deleteEnrollment(enrollmentId: string): Promise<void> {
    const response = await this.req.DELETE(
      `/v1/site/${this.siteId}/enrollment/${enrollmentId}`
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP error! status: ${response.status}. Body: ${body}`);
    }

    // The API doesn't return any data on successful deletion
  }

  async getEnrollments(): Promise<FlipEnrollment[]> {
    const response = await this.req.GET(`/v1/site/${this.siteId}/enrollments`);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP error! status: ${response.status}. Body: ${body}`);
    }

    return response.json() as Promise<FlipEnrollment[]>;
  }

  async updateSite(siteUpdate: Partial<Site>): Promise<Site> {
    const response = await this.req.PATCH(
      `/v1/site/${this.siteId}`,
      siteUpdate
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP error! status: ${response.status}. Body: ${body}`);
    }

    return response.json() as Promise<Site>;
  }
}

export const flipAdminApiClient = new FlipAdminApiClient(
  safeEnv.FLIP_API_URL,
  safeEnv.FLIP_API_KEY
);
