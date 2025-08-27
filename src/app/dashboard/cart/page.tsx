"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Trash2,
  CreditCard,
  FileText,
  User,
  MapPin,
  DollarSign,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  useCartItems,
  useRemoveFromCart,
  useCartTotals,
  useCartValidation,
  useProcessCheckout,
} from "@/hooks/queries";
import { CheckoutParams } from "@/services/checkout-service";
import { CartItem } from "@/types";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);

  // Fetch cart data
  const { data: cartItems = [], isLoading, error, refetch } = useCartItems();
  const removeFromCartMutation = useRemoveFromCart();
  const processCheckoutMutation = useProcessCheckout();

  // Calculate totals
  const { subtotal, processingFee, tax, total, itemCount } = useCartTotals(
    cartItems || []
  );
  const { isValid, errors, canCheckout } = useCartValidation(cartItems || []);

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeFromCartMutation.mutateAsync(itemId);
      setItemToRemove(null);
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleProceedToCheckout = async () => {
    if (!canCheckout || !user?.id) {
      toast.error("Cannot proceed to checkout");
      return;
    }

    const checkoutParams: CheckoutParams = {
      caseIds: (cartItems || [])?.map((item) => item.id),
      paymentMethod: "simulated",
      notes: "Simulated checkout for legal case processing",
    };

    try {
      const result = await processCheckoutMutation.mutateAsync(checkoutParams);

      if (result?.success) {
        // Redirect to success page
        router.push(`/dashboard/checkout/success?txn=${result?.transactionId}`);
      }
    } catch (error) {
      // Error is handled by the mutation hook
    } finally {
      setShowCheckoutDialog(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (error) {
    return (
      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
          <p className="text-red-600 mt-1">
            Error loading cart: {error.message}
          </p>
          <Button onClick={() => refetch()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
            <p className="text-gray-600 mt-1">
              Review your eviction requests before processing ({itemCount}{" "}
              items)
            </p>
          </div>
          {(cartItems?.length || 0) > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(total)}
              </p>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        // Loading State
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="bg-white shadow-sm">
                <CardHeader>
                  <Skeleton className="h-6 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (cartItems?.length || 0) > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {(cartItems || [])?.map((item) => (
              <Card key={item.id} className="bg-white shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {item.requestType}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {item.caseType}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setItemToRemove(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={removeFromCartMutation.isPending}
                    >
                      {removeFromCartMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Request Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <FileText className="h-4 w-4 mr-1" />
                        Case Details
                      </div>
                      <p className="font-medium text-gray-900">
                        Ref: {item.referenceId.slice(0, 8)}...
                      </p>
                      <p className="text-sm text-gray-600">
                        Court Case #: {item.courtCaseNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        Initiated:{" "}
                        {new Date(item.dateInitiated).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Price
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(item.price)}
                      </p>
                      <Badge
                        variant={
                          item.status === "NOTICE_DRAFT"
                            ? "secondary"
                            : "default"
                        }
                        className="text-xs"
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Tenant and Property Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-500">
                        <User className="h-4 w-4 mr-1" />
                        Tenant(s)
                      </div>
                      <p className="font-medium text-gray-900">
                        {item.tenantName}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        Property
                      </div>
                      <p className="font-medium text-gray-900">
                        {item.propertyAddress}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-sm sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Order Summary
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Pricing Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Subtotal ({itemCount} items):
                    </span>
                    <span className="font-medium">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Processing Fee (3%):</span>
                    <span className="font-medium">
                      {formatCurrency(processingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (8.25%):</span>
                    <span className="font-medium">{formatCurrency(tax)}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">
                      Total:
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                {/* Validation Errors */}
                {!isValid && errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-red-800">
                      Cannot proceed:
                    </p>
                    <ul className="text-xs text-red-700 mt-1 list-disc list-inside">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Checkout Button */}
                <Button
                  onClick={() => setShowCheckoutDialog(true)}
                  className="w-full bg-green-600 hover:bg-green-700 py-3"
                  size="lg"
                  disabled={!canCheckout || processCheckoutMutation.isPending}
                >
                  {processCheckoutMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Proceed to Checkout
                    </>
                  )}
                </Button>

                {/* Security Notice */}
                <div className="text-xs text-gray-500 text-center pt-2">
                  🔒 Simulated payment processing for demonstration
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        // Empty Cart State
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <ShoppingCart className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Your cart is empty
          </h3>
          <p className="text-gray-500 mb-6">
            Create legal cases to add eviction requests to your cart.
          </p>
          <Link href="/dashboard/cases">
            <Button className="bg-green-600 hover:bg-green-700">
              <FileText className="h-4 w-4 mr-2" />
              Create Legal Cases
            </Button>
          </Link>
        </div>
      )}

      {/* Remove Item Confirmation Dialog */}
      <AlertDialog
        open={!!itemToRemove}
        onOpenChange={() => setItemToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this item from your cart? This
              will permanently delete the legal case.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToRemove && handleRemoveItem(itemToRemove)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Checkout Confirmation Dialog */}
      <AlertDialog
        open={showCheckoutDialog}
        onOpenChange={setShowCheckoutDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Checkout</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to process {itemCount} eviction request
              {itemCount > 1 ? "s" : ""} for a total of {formatCurrency(total)}.
              This will submit the cases for contractor assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Processing Fee:</span>
                <span>{formatCurrency(processingFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProceedToCheckout}
              className="bg-green-600 hover:bg-green-700"
              disabled={processCheckoutMutation.isPending}
            >
              {processCheckoutMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm & Process"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
