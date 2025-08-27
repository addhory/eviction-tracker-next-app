"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Clock,
  FileText,
  Users,
  ArrowRight,
  Download,
  Mail,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { useCheckoutHistory } from "@/hooks/queries";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams?.get("txn");
  const [showConfetti, setShowConfetti] = useState(true);

  const { data: checkoutHistory, isLoading } = useCheckoutHistory();

  useEffect(() => {
    // Hide confetti effect after 3 seconds
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!transactionId) {
    router.push("/dashboard/cart");
    return null;
  }

  const formatCurrency = (amountInCents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amountInCents / 100);
  };

  // Get recent processed cases (first 3 from history)
  const recentCases = checkoutHistory?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {/* Simple confetti effect using CSS animations */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-green-400 rounded-full animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random()}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Checkout Successful!
            </h1>
            <p className="text-lg text-gray-600">
              Your eviction requests have been processed and submitted.
            </p>
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 rounded-lg">
              <span className="text-sm font-medium text-green-800">
                Transaction ID: {transactionId}
              </span>
            </div>
          </div>

          {/* What Happens Next */}
          <Card className="bg-white shadow-lg mb-8">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="text-xl font-semibold flex items-center">
                <Clock className="h-6 w-6 mr-2" />
                What Happens Next?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">
                      1
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Cases Made Available
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Your legal cases are now visible to qualified contractors
                      for claiming.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-yellow-600">
                      2
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Contractor Assignment
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Licensed contractors will claim and begin work on posting
                      eviction notices.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-green-600">
                      3
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Progress Updates
                    </h3>
                    <p className="text-gray-600 text-sm">
                      You&apos;ll receive notifications as contractors complete
                      each posting task.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-purple-600">
                      4
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Completion & Documentation
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Receive photos and certificates of posting completion for
                      court proceedings.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processed Cases Summary */}
          {recentCases.length > 0 && (
            <Card className="bg-white shadow-lg mb-8">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center">
                  <FileText className="h-6 w-6 mr-2" />
                  Your Processed Cases
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {recentCases.map((legalCase: any) => (
                    <div
                      key={legalCase.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">
                            Case:{" "}
                            {legalCase.district_court_case_number ||
                              legalCase.court_case_number ||
                              "TBD"}
                          </h4>
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {legalCase.status}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            {legalCase.payment_status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {legalCase.property?.address},{" "}
                          {legalCase.property?.city} • Tenant:{" "}
                          {Array.isArray(legalCase.tenant?.tenant_names)
                            ? legalCase.tenant.tenant_names.join(", ")
                            : legalCase.tenant?.tenant_names}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(legalCase.price)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {legalCase.case_type}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/dashboard/cases">
                <CardContent className="p-6 text-center">
                  <FileText className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">
                    View All Cases
                  </h3>
                  <p className="text-sm text-gray-600">
                    Monitor progress and status updates
                  </p>
                  <ArrowRight className="h-4 w-4 text-blue-600 mx-auto mt-2" />
                </CardContent>
              </Link>
            </Card>

            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/dashboard">
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Dashboard
                  </h3>
                  <p className="text-sm text-gray-600">
                    Overview of all your activities
                  </p>
                  <ArrowRight className="h-4 w-4 text-green-600 mx-auto mt-2" />
                </CardContent>
              </Link>
            </Card>

            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Download className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Download Receipt
                </h3>
                <p className="text-sm text-gray-600">
                  Get a copy of your transaction
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    // Simulate receipt download
                    const receipt = `Receipt-${transactionId}.pdf`;
                    alert(`Downloading ${receipt}...`);
                  }}
                >
                  Download
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Support Information */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Need Help?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Phone Support</p>
                    <p className="text-sm text-blue-700">(555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Email Support</p>
                    <p className="text-sm text-blue-700">
                      support@evictiontracker.com
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-blue-700 mt-4">
                Our team is available Monday-Friday, 9 AM - 5 PM EST to assist
                with any questions about your eviction proceedings.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
