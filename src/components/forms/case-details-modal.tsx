"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  User,
  MapPin,
  DollarSign,
  Calendar,
  Scale,
  X,
} from "lucide-react";
import { format } from "date-fns";

interface CaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: {
    id: string;
    caseNumber: string;
    tenantName: string;
    propertyAddress: string;
    amountDueAtSubmission: number;
    currentAmountDue: number;
    price: number;
    initiatedDate: string;
    status: string;
    paymentStatus: string;
    noRightOfRedemption?: boolean;
    districtCourtCaseNumber?: string;
    warrantOrderDate?: string;
    initialEvictionDate?: string;
    signatureName?: string;
  } | null;
}

export function CaseDetailsModal({
  isOpen,
  onClose,
  caseData,
}: CaseDetailsModalProps) {
  if (!caseData) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NOTICE_DRAFT":
        return "bg-yellow-100 text-yellow-800";
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-800";
      case "COMPLETE":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "UNPAID":
        return "bg-red-100 text-red-800";
      case "PARTIAL":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "NOTICE_DRAFT":
        return "NOTICE DRAFT";
      case "SUBMITTED":
        return "SUBMITTED";
      case "IN_PROGRESS":
        return "IN PROGRESS";
      case "COMPLETE":
        return "COMPLETE";
      case "CANCELLED":
        return "CANCELLED";
      default:
        return status;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  Case Details
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600">
                  View complete information for this eviction case
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Case Header */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-green-700">
                    {caseData.caseNumber}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Case Number: {caseData.caseNumber}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={getStatusColor(caseData.status)}>
                    CASE: {getStatusText(caseData.status)}
                  </Badge>
                  <Badge
                    className={getPaymentStatusColor(caseData.paymentStatus)}
                  >
                    PAYMENT: {caseData.paymentStatus}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Basic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">
                    Tenant
                  </label>
                  <p className="text-sm text-gray-900">{caseData.tenantName}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">
                    Property Address
                  </label>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {caseData.propertyAddress}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">
                    Case Initiated
                  </label>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {caseData.initiatedDate}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">
                    Service Price
                  </label>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />$
                    {caseData.price.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Financial Information */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financial Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">
                    Amount Due (at submission)
                  </label>
                  <p className="text-sm font-semibold text-gray-900">
                    ${caseData.amountDueAtSubmission.toFixed(2)}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">
                    Current Amount Due
                  </label>
                  <p className="text-sm font-semibold text-gray-900">
                    ${caseData.currentAmountDue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Legal Information */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Legal Information
              </h4>
              <div className="space-y-4">
                {caseData.districtCourtCaseNumber && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">
                      District Court Case Number
                    </label>
                    <p className="text-sm text-gray-900">
                      {caseData.districtCourtCaseNumber}
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">
                    Right of Redemption
                  </label>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        caseData.noRightOfRedemption ? "destructive" : "default"
                      }
                    >
                      {caseData.noRightOfRedemption
                        ? "No Right of Redemption"
                        : "Tenant Can Pay to Stay"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {caseData.noRightOfRedemption
                      ? "Tenant cannot pay and stay - must vacate"
                      : "Tenant has option to pay outstanding amount and remain"}
                  </p>
                </div>

                {caseData.warrantOrderDate && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">
                      Date Warrant Ordered
                    </label>
                    <p className="text-sm text-gray-900 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(
                        new Date(caseData.warrantOrderDate),
                        "MMMM d, yyyy"
                      )}
                    </p>
                  </div>
                )}

                {caseData.initialEvictionDate && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">
                      Initial Scheduled Eviction Date
                    </label>
                    <p className="text-sm text-gray-900 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(
                        new Date(caseData.initialEvictionDate),
                        "MMMM d, yyyy"
                      )}
                    </p>
                  </div>
                )}

                {caseData.signatureName && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">
                      Signature/Authorized By
                    </label>
                    <p className="text-sm text-gray-900">
                      {caseData.signatureName}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Case Timeline/Status */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Case Status & Timeline
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Current Status
                    </p>
                    <p className="text-xs text-gray-500">
                      {caseData.status === "NOTICE_DRAFT" &&
                        "Draft created, ready for payment"}
                      {caseData.status === "SUBMITTED" &&
                        "Submitted and being processed"}
                      {caseData.status === "IN_PROGRESS" &&
                        "Case is currently in progress"}
                      {caseData.status === "COMPLETE" &&
                        "Case has been completed"}
                      {caseData.status === "CANCELLED" && "Case was cancelled"}
                    </p>
                  </div>
                  <Badge className={getStatusColor(caseData.status)}>
                    {getStatusText(caseData.status)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Payment Status
                    </p>
                    <p className="text-xs text-gray-500">
                      {caseData.paymentStatus === "PAID" &&
                        "Payment has been received"}
                      {caseData.paymentStatus === "UNPAID" &&
                        "Payment is pending"}
                      {caseData.paymentStatus === "PARTIAL" &&
                        "Partial payment received"}
                    </p>
                  </div>
                  <Badge
                    className={getPaymentStatusColor(caseData.paymentStatus)}
                  >
                    {caseData.paymentStatus}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
