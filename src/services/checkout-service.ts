// =============================================================================
// CHECKOUT SERVICE (DRY + Context7 Best Practices)
// =============================================================================

import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database.types";
import {
  TypedSupabaseClient,
  ServiceResponse,
  CASE_STATUS,
  PAYMENT_STATUS,
  CONTRACTOR_STATUS,
} from "@/lib/supabase/types";
import {
  createSuccessResponse,
  createErrorResponse,
  handleServiceError,
} from "@/lib/supabase/query-utils";
import { LegalCase, CartItem, CheckoutResult } from "@/types";

// =============================================================================
// TYPES
// =============================================================================

export interface CheckoutParams {
  caseIds: string[];
  paymentMethod?: "simulated" | "stripe"; // Future-proof for Stripe integration
  notes?: string;
}

export interface CheckoutSummary {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  processingFee: number;
}

// =============================================================================
// BASE SERVICE CLASS (DRY)
// =============================================================================

abstract class BaseService {
  protected supabase: TypedSupabaseClient;

  constructor() {
    this.supabase = createClient();
  }

  protected async getCurrentUser() {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    return user;
  }

  protected async requireAuth() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Authentication required");
    return user;
  }

  protected transformError(error: unknown, context?: string): Error {
    return handleServiceError(error, context);
  }
}

// =============================================================================
// CHECKOUT SERVICE
// =============================================================================

export class CheckoutService extends BaseService {
  // =============================================================================
  // CART MANAGEMENT METHODS
  // =============================================================================

  /**
   * Get cart items (legal cases in NOTICE_DRAFT status)
   */
  async getCartItems(landlordId: string): Promise<ServiceResponse<CartItem[]>> {
    try {
      await this.requireAuth();

      const { data, error } = await this.supabase
        .from("legal_cases")
        .select(
          `
          *,
          property:properties(*),
          tenant:tenants(*),
          landlord:profiles!legal_cases_landlord_id_fkey(*)
        `
        )
        .eq("landlord_id", landlordId)
        .eq("status", CASE_STATUS.NOTICE_DRAFT)
        .eq("payment_status", PAYMENT_STATUS.UNPAID)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const cartItems: CartItem[] = data.map(this.transformToCartItem);

      return createSuccessResponse(cartItems);
    } catch (error) {
      return createErrorResponse(this.transformError(error, "getCartItems"));
    }
  }

  /**
   * Remove item from cart (delete legal case in NOTICE_DRAFT status)
   */
  async removeFromCart(caseId: string): Promise<ServiceResponse<boolean>> {
    try {
      const user = await this.requireAuth();

      // Verify the case is in draft status and belongs to the user
      const { data: caseData, error: fetchError } = await this.supabase
        .from("legal_cases")
        .select("id, status, landlord_id")
        .eq("id", caseId)
        .eq("landlord_id", user.id)
        .eq("status", CASE_STATUS.NOTICE_DRAFT)
        .single();

      if (fetchError || !caseData) {
        throw new Error("Case not found or cannot be removed");
      }

      const { error } = await this.supabase
        .from("legal_cases")
        .delete()
        .eq("id", caseId)
        .eq("landlord_id", user.id)
        .eq("status", CASE_STATUS.NOTICE_DRAFT);

      if (error) throw error;

      return createSuccessResponse(true);
    } catch (error) {
      return createErrorResponse(this.transformError(error, "removeFromCart"));
    }
  }

  // =============================================================================
  // CHECKOUT PROCESSING METHODS
  // =============================================================================

  /**
   * Calculate checkout summary with pricing breakdown
   */
  async calculateCheckoutSummary(
    caseIds: string[]
  ): Promise<ServiceResponse<CheckoutSummary>> {
    try {
      const user = await this.requireAuth();

      const { data, error } = await this.supabase
        .from("legal_cases")
        .select(
          `
          *,
          property:properties(*),
          tenant:tenants(*),
          landlord:profiles!legal_cases_landlord_id_fkey(*)
        `
        )
        .in("id", caseIds)
        .eq("landlord_id", user.id)
        .eq("status", CASE_STATUS.NOTICE_DRAFT);

      if (error) throw error;

      const items: CartItem[] = data.map(this.transformToCartItem);
      const subtotal = items.reduce((sum, item) => sum + item.price, 0);

      // Calculate fees (example: 3% processing fee, 8.25% tax)
      const processingFee = Math.round(subtotal * 0.03);
      const tax = Math.round(subtotal * 0.0825);
      const total = subtotal + processingFee + tax;

      const summary: CheckoutSummary = {
        items,
        subtotal,
        tax,
        total,
        processingFee,
      };

      return createSuccessResponse(summary);
    } catch (error) {
      return createErrorResponse(
        this.transformError(error, "calculateCheckoutSummary")
      );
    }
  }

  /**
   * Process checkout (simulated payment)
   */
  async processCheckout(
    params: CheckoutParams
  ): Promise<ServiceResponse<CheckoutResult>> {
    try {
      const user = await this.requireAuth();

      // Validate cases belong to user and are in correct status
      const { data: cases, error: fetchError } = await this.supabase
        .from("legal_cases")
        .select("id, status, payment_status, landlord_id, price")
        .in("id", params.caseIds)
        .eq("landlord_id", user.id)
        .eq("status", CASE_STATUS.NOTICE_DRAFT)
        .eq("payment_status", PAYMENT_STATUS.UNPAID);

      if (fetchError) throw fetchError;

      if (cases.length !== params.caseIds.length) {
        throw new Error("Some cases are not available for checkout");
      }

      // Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update cases to SUBMITTED status with PAID payment status
      const { error: updateError } = await this.supabase
        .from("legal_cases")
        .update({
          status: CASE_STATUS.SUBMITTED,
          payment_status: PAYMENT_STATUS.PAID,
          contractor_status: CONTRACTOR_STATUS.UNASSIGNED,
          updated_at: new Date().toISOString(),
        })
        .in("id", params.caseIds)
        .eq("landlord_id", user.id);

      if (updateError) throw updateError;

      // Calculate total amount
      const totalAmount = cases.reduce((sum, case_) => sum + case_.price, 0);

      const result: CheckoutResult = {
        success: true,
        transactionId: `txn_${Date.now()}_${user.id.slice(0, 8)}`,
        totalAmount,
        caseIds: params.caseIds,
        processedAt: new Date().toISOString(),
        paymentMethod: params.paymentMethod || "simulated",
      };

      return createSuccessResponse(result);
    } catch (error) {
      return createErrorResponse(this.transformError(error, "processCheckout"));
    }
  }

  /**
   * Get checkout history for a landlord
   */
  async getCheckoutHistory(
    landlordId: string
  ): Promise<ServiceResponse<LegalCase[]>> {
    try {
      await this.requireAuth();

      const { data, error } = await this.supabase
        .from("legal_cases")
        .select(
          `
          *,
          property:properties(*),
          tenant:tenants(*),
          landlord:profiles!legal_cases_landlord_id_fkey(*)
        `
        )
        .eq("landlord_id", landlordId)
        .eq("payment_status", PAYMENT_STATUS.PAID)
        .in("status", [
          CASE_STATUS.SUBMITTED,
          CASE_STATUS.IN_PROGRESS,
          CASE_STATUS.COMPLETE,
        ])
        .order("updated_at", { ascending: false });

      if (error) throw error;

      return createSuccessResponse(data as LegalCase[]);
    } catch (error) {
      return createErrorResponse(
        this.transformError(error, "getCheckoutHistory")
      );
    }
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  /**
   * Transform legal case to cart item (DRY)
   */
  private transformToCartItem = (legalCase: any): CartItem => {
    const property = legalCase.property;
    const tenant = legalCase.tenant;

    return {
      id: legalCase.id,
      referenceId: legalCase.id,
      requestType: "Eviction Letter Request",
      courtCaseNumber:
        legalCase.district_court_case_number ||
        legalCase.court_case_number ||
        "TBD",
      tenantName: Array.isArray(tenant?.tenant_names)
        ? tenant.tenant_names.join(", ")
        : tenant?.tenant_names || "Unknown Tenant",
      propertyAddress: property
        ? `${property.address}${
            property.unit ? `, Unit ${property.unit}` : ""
          }, ${property.city}, ${property.state}`
        : "Unknown Property",
      price: Math.round(legalCase.price / 100), // Convert from cents to dollars
      caseType: legalCase.case_type,
      dateInitiated: legalCase.date_initiated,
      status: legalCase.status,
      paymentStatus: legalCase.payment_status,
    };
  };

  /**
   * Format currency for display
   */
  static formatCurrency(amountInCents: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amountInCents / 100);
  }

  /**
   * Format currency from dollars
   */
  static formatCurrencyFromDollars(amountInDollars: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amountInDollars);
  }
}

// =============================================================================
// SINGLETON EXPORT (DRY)
// =============================================================================

export const checkoutService = new CheckoutService();
