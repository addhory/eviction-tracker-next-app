// =============================================================================
// CHECKOUT HOOKS (React Query + Context7 Best Practices)
// =============================================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  checkoutService,
  CheckoutParams,
  CheckoutSummary,
} from "@/services/checkout-service";
import { CartItem, CheckoutResult } from "@/types";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";

// =============================================================================
// QUERY KEYS (DRY)
// =============================================================================

export const checkoutKeys = {
  all: ["checkout"] as const,
  cart: (landlordId: string) =>
    [...checkoutKeys.all, "cart", landlordId] as const,
  summary: (caseIds: string[]) =>
    [...checkoutKeys.all, "summary", caseIds] as const,
  history: (landlordId: string) =>
    [...checkoutKeys.all, "history", landlordId] as const,
};

// =============================================================================
// CART HOOKS
// =============================================================================

/**
 * Hook to get cart items for the current landlord
 */
export function useCartItems() {
  const { user } = useAuth();

  return useQuery({
    queryKey: checkoutKeys.cart(user?.id || ""),
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const result = await checkoutService.getCartItems(user.id);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to remove item from cart
 */
export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (caseId: string) => {
      const result = await checkoutService.removeFromCart(caseId);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    onSuccess: () => {
      // Invalidate cart data
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: checkoutKeys.cart(user.id),
        });
      }

      // Invalidate legal cases data
      queryClient.invalidateQueries({
        queryKey: ["legal-cases"],
      });

      toast.success("Item removed from cart");
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove item: ${error.message}`);
    },
  });
}

// =============================================================================
// CHECKOUT HOOKS
// =============================================================================

/**
 * Hook to get checkout summary
 */
export function useCheckoutSummary(caseIds: string[]) {
  return useQuery({
    queryKey: checkoutKeys.summary(caseIds),
    queryFn: async () => {
      if (caseIds.length === 0) {
        return {
          items: [],
          subtotal: 0,
          tax: 0,
          total: 0,
          processingFee: 0,
        } as CheckoutSummary;
      }

      const result = await checkoutService.calculateCheckoutSummary(caseIds);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    enabled: caseIds.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to process checkout
 */
export function useProcessCheckout() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: CheckoutParams) => {
      const result = await checkoutService.processCheckout(params);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    onSuccess: (data: CheckoutResult | null) => {
      // Invalidate cart data
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: checkoutKeys.cart(user.id),
        });

        // Invalidate checkout history
        queryClient.invalidateQueries({
          queryKey: checkoutKeys.history(user.id),
        });
      }

      // Invalidate legal cases data
      queryClient.invalidateQueries({
        queryKey: ["legal-cases"],
      });

      // Invalidate contractor available jobs (they should see new jobs)
      queryClient.invalidateQueries({
        queryKey: ["contractor-jobs", "available"],
      });

      toast.success(
        `Checkout successful! Transaction ID: ${data?.transactionId}`
      );
    },
    onError: (error: Error) => {
      toast.error(`Checkout failed: ${error.message}`);
    },
  });
}

/**
 * Hook to get checkout history
 */
export function useCheckoutHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: checkoutKeys.history(user?.id || ""),
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const result = await checkoutService.getCheckoutHistory(user.id);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook to calculate cart totals
 */
export function useCartTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const processingFee = Math.round(subtotal * 0.03);
  const tax = Math.round(subtotal * 0.0825);
  const total = subtotal + processingFee + tax;

  return {
    subtotal,
    processingFee,
    tax,
    total,
    itemCount: items.length,
  };
}

/**
 * Hook to check if cart is ready for checkout
 */
export function useCartValidation(items: CartItem[]) {
  const isValid = items.length > 0;
  const errors: string[] = [];

  if (items.length === 0) {
    errors.push("Cart is empty");
  }

  // Additional validations can be added here
  items.forEach((item, index) => {
    if (!item.courtCaseNumber || item.courtCaseNumber === "TBD") {
      errors.push(`Item ${index + 1}: Court case number is required`);
    }
    if (item.price <= 0) {
      errors.push(`Item ${index + 1}: Invalid price`);
    }
  });

  return {
    isValid: isValid && errors.length === 0,
    errors,
    canCheckout: isValid && errors.length === 0,
  };
}
