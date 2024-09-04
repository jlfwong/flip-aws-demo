interface EnrollmentFormField {
  name: string;
  label: string;
  type: string;
}

interface Program {
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

interface Enrollment {
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
  programs: Program[];
  enrollment: Enrollment;
}

interface Site {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  state_code: string;
  city: string;
  zip_code: string;
  street_address: string;
  street_address2: string;
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

export interface CommissionPayload {
  site: Site;
  devices: Device[];
  can_auto_enroll: boolean;
}

export class FlipClientApiClient {
  constructor(private baseUrl: string, private clientToken: string) {}

  private async makeRequest<T>(
    endpoint: string,
    method: string,
    body?: any
  ): Promise<T> {
    const headers = new Headers({
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.clientToken}`,
    });

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP error! status: ${response.status}. Body: ${body}`);
    }

    return response.json();
  }

  async commission(payload: CommissionPayload): Promise<CommissionResponse> {
    return this.makeRequest<CommissionResponse>(
      "/v1/commission",
      "POST",
      payload
    );
  }
}
