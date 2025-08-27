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

// Contractor Job Types
export type ContractorJobStatus =
  | "UNASSIGNED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED";

export type DocumentType =
  | "eviction_notice"
  | "photo_of_posted_notice"
  | "receipt"
  | "certificate_of_mailing";

export interface LegalCase extends Tables<"legal_cases"> {
  property: Property;
  tenant: Tenant;
  landlord: Profile;
  contractor?: Profile;
  case_type: CaseType;
  status: CaseStatus;
  payment_status: PaymentStatus;
  contractor_status: ContractorJobStatus;
}

// Contractor Job Interface
export interface ContractorJob {
  id: string;
  case_id: string;
  case_number?: string;
  district_court_case_number?: string;
  due_date: string;
  client_name: string;
  property_address: string;
  property_city: string;
  property_county: string;
  tenant_names: string[];
  posting_instructions?: string;
  contractor_status: ContractorJobStatus;
  assigned_at?: string;
  landlord_contact: {
    name: string;
    email: string;
    phone?: string;
  };
}

// Job Document Interface
export interface JobDocument {
  id: string;
  legal_case_id: string;
  contractor_id: string;
  document_type: DocumentType;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  uploaded_at: string;
}

// Document Upload Form Data
export interface DocumentUploadData {
  document_type: DocumentType;
  file: File;
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

// Law Firm Types
export type LawFirm = Tables<"law_firms">;

export interface LawFirmFormData {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  contact_person?: string;
  notes?: string;
}

// Contractor Types
export interface Contractor extends Tables<"profiles"> {
  role: "contractor";
  total_completions?: number;
}

export interface ContractorFormData {
  name: string;
  username: string;
  email: string;
  phone?: string;
  password: string;
}

export interface ContractorUpdateData {
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
}

// Cart and Checkout Types
export interface CartItem {
  id: string;
  referenceId: string;
  requestType: string;
  courtCaseNumber: string;
  tenantName: string;
  propertyAddress: string;
  price: number;
  caseType: CaseType;
  dateInitiated: string;
  status: CaseStatus;
  paymentStatus: PaymentStatus;
}

export interface CheckoutResult {
  success: boolean;
  transactionId: string;
  totalAmount: number;
  caseIds: string[];
  processedAt: string;
  paymentMethod: "simulated" | "stripe";
  error?: string;
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
