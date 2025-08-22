import { Database } from "./database.types";

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

// User Roles
export type UserRole = "admin" | "landlord" | "contractor";

// Profile Types
export interface Profile extends Tables<"profiles"> {
  role: UserRole;
}

// Property Types
export interface Property extends Tables<"properties"> {
  landlord: Profile;
}

// Tenant Types
export interface Tenant extends Tables<"tenants"> {
  property: Property;
  landlord: Profile;
}

// Legal Case Types
export type CaseType = "FTPR" | "HOLDOVER" | "OTHER";
export type CaseStatus =
  | "NOTICE_DRAFT"
  | "SUBMITTED"
  | "IN_PROGRESS"
  | "COMPLETE"
  | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PAID" | "PARTIAL";

export interface LegalCase extends Tables<"legal_cases"> {
  property: Property;
  tenant: Tenant;
  landlord: Profile;
  case_type: CaseType;
  status: CaseStatus;
  payment_status: PaymentStatus;
}

// Form Types
export interface PropertyFormData {
  address: string;
  unit?: string;
  city: string;
  state: string;
  zip_code: string;
  county: string;
  property_type: "RESIDENTIAL" | "COMMERCIAL";
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  year_built?: number;
}

export interface TenantFormData {
  property_id: string;
  tenant_names: string[];
  email?: string;
  phone?: string;
  lease_start_date?: string;
  lease_end_date?: string;
  rent_amount?: number;
  is_subsidized?: boolean;
  subsidy_type?: string;
}

export interface LegalCaseFormData {
  property_id: string;
  tenant_id: string;
  case_type: CaseType;
  date_initiated: string;
  rent_owed_at_filing: number;
  current_rent_owed: number;
  price: number;
  no_right_of_redemption?: boolean;
  late_fees_charged?: number;
}

// Maryland Counties
export const MARYLAND_COUNTIES = [
  "Allegany",
  "Anne Arundel",
  "Baltimore",
  "Baltimore City",
  "Calvert",
  "Caroline",
  "Carroll",
  "Cecil",
  "Charles",
  "Dorchester",
  "Frederick",
  "Garrett",
  "Harford",
  "Howard",
  "Kent",
  "Montgomery",
  "Prince George's",
  "Queen Anne's",
  "Somerset",
  "St. Mary's",
  "Talbot",
  "Washington",
  "Wicomico",
  "Worcester",
] as const;

export type MarylandCounty = (typeof MARYLAND_COUNTIES)[number];

// Navigation Types
export interface NavigationItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavigationItem[];
  roles?: UserRole[];
}

// Dashboard Stats
export interface DashboardStats {
  totalProperties: number;
  totalTenants: number;
  activeCases: number;
  completedCases: number;
  unpaidCases: number;
  totalRevenue: number;
}
