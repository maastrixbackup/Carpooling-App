export type Vehicle = {
  id: number;
  vehicle_type?: string;
  brand: string;
  model: string;
  manufacture_year?: string;
  registration_number: string;
  rc_number?: string;
  rc_document_url?: string | null;
  color?: string;
  seats: number;
  available_seats?: number;
  fuel_type?: string;
  status?: string;
  verification_status?: "pending" | "approved" | "rejected";
  is_active?: boolean;
};

export type VehicleStatusMeta = {
  label: string;
  actionText: string;
  bg: string;
  color: string;
};
