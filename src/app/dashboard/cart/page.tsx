"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  CreditCard,
  FileText,
  User,
  MapPin,
  DollarSign,
} from "lucide-react";
import Link from "next/link";

interface CartItem {
  id: string;
  requestType: string;
  referenceId: string;
  courtCaseNumber: string;
  tenantName: string;
  propertyAddress: string;
  price: number;
}

export default function CartPage() {
  // Dummy data based on the image - will be replaced with real data later
  const cartItems: CartItem[] = [
    {
      id: "1",
      requestType: "Eviction Letter Request",
      referenceId: "case_1",
      courtCaseNumber: "D-01-CV-24-111111",
      tenantName: "John Doe",
      propertyAddress: "123 Oak St",
      price: 80.0,
    },
  ];

  const total = cartItems.reduce((sum, item) => sum + item.price, 0);

  const handleRemoveItem = (itemId: string) => {
    console.log("Remove item:", itemId);
  };

  const handleProceedToCheckout = () => {
    console.log("Proceed to checkout");
    // Will implement Stripe checkout later
  };

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
        <p className="text-gray-600 mt-1">
          Review your eviction requests before payment
        </p>
      </div>

      {cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className="bg-white shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {item.requestType}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Request Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <FileText className="h-4 w-4 mr-1" />
                        Reference
                      </div>
                      <p className="font-medium text-gray-900">
                        Ref: {item.referenceId}
                      </p>
                      <p className="text-sm text-gray-600">
                        Court Case #: {item.courtCaseNumber}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Price
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        ${item.price.toFixed(2)}
                      </p>
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
                {/* Request Details Table */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900">
                      Request Details
                    </span>
                    <span className="font-medium text-gray-900">Tenant(s)</span>
                    <span className="font-medium text-gray-900">Property</span>
                    <span className="font-medium text-gray-900">Price</span>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <div className="text-sm space-y-2">
                      {cartItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-start py-2"
                        >
                          <div className="flex-1 pr-2">
                            <p className="font-medium text-gray-900">
                              {item.requestType}
                            </p>
                            <p className="text-xs text-gray-500">
                              Ref: {item.referenceId}
                            </p>
                            <p className="text-xs text-gray-500">
                              Court Case #: {item.courtCaseNumber}
                            </p>
                          </div>
                          <div className="flex-1 px-2">
                            <p className="text-gray-900">{item.tenantName}</p>
                          </div>
                          <div className="flex-1 px-2">
                            <p className="text-gray-900">
                              {item.propertyAddress}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              ${item.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">
                      Total:
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Button
                  onClick={handleProceedToCheckout}
                  className="w-full bg-green-600 hover:bg-green-700 py-3"
                  size="lg"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Proceed to Checkout (Simulated)
                </Button>

                {/* Security Notice */}
                <div className="text-xs text-gray-500 text-center pt-2">
                  🔒 Your payment information is secured with 256-bit SSL
                  encryption
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        // Empty Cart State
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Your cart is empty
          </h3>
          <p className="text-gray-500 mb-6">
            Add some eviction requests to get started.
          </p>
          <Link href="/dashboard/cases">
            <Button className="bg-green-600 hover:bg-green-700">
              Browse Eviction Cases
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
