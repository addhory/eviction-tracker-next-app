"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { LegalCaseService } from "@/services/legal-case-service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Edit,
  FileText,
  DollarSign,
  Calendar,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  FileCheck,
} from "lucide-react";
import { LegalCase, CaseStatus, PaymentStatus } from "@/types";
import { CaseStatusWorkflow } from "@/components/case-status-workflow";
import { DocumentGenerator } from "@/components/document-generator";
import dayjs from "dayjs";

export default function LegalCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [legalCase, setLegalCase] = useState<LegalCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const caseId = params.id as string;

  useEffect(() => {
    if (!user || !caseId) return;

    const loadLegalCase = async () => {
      try {
        const legalCaseService = new LegalCaseService();
        const { data, error } = await legalCaseService.getLegalCase(caseId);

        if (error) {
          setError("Failed to load legal case");
          console.error("Failed to load legal case:", error);
        } else if (data) {
          setLegalCase(data);
        }
      } catch (error) {
        setError("An unexpected error occurred");
        console.error("Failed to load legal case:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLegalCase();
  }, [user, caseId]);

  const handleStatusUpdate = async (newStatus: CaseStatus) => {
    if (!legalCase) return;

    setUpdating(true);
    try {
      const legalCaseService = new LegalCaseService();
      const { data, error } = await legalCaseService.updateLegalCase(caseId, {
        status: newStatus,
      });

      if (error) {
        alert("Failed to update case status");
        console.error("Failed to update status:", error);
      } else if (data) {
        setLegalCase(data);
      }
    } catch (error) {
      alert("An unexpected error occurred");
      console.error("Failed to update status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentStatusUpdate = async (newPaymentStatus: PaymentStatus) => {
    if (!legalCase) return;

    setUpdating(true);
    try {
      const legalCaseService = new LegalCaseService();
      const { data, error } = await legalCaseService.updateLegalCase(caseId, {
        payment_status: newPaymentStatus,
      });

      if (error) {
        alert("Failed to update payment status");
        console.error("Failed to update payment status:", error);
      } else if (data) {
        setLegalCase(data);
      }
    } catch (error) {
      alert("An unexpected error occurred");
      console.error("Failed to update payment status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const getStatusColor = (status: CaseStatus) => {
    switch (status) {
      case "NOTICE_DRAFT":
        return "bg-gray-100 text-gray-800";
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETE":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "PARTIAL":
        return "bg-yellow-100 text-yellow-800";
      case "UNPAID":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: CaseStatus) => {
    switch (status) {
      case "NOTICE_DRAFT":
        return <FileText className="h-4 w-4" />;
      case "SUBMITTED":
        return <FileCheck className="h-4 w-4" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4" />;
      case "COMPLETE":
        return <CheckCircle className="h-4 w-4" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !legalCase) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error || "Legal case not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Legal Case Details</h1>
            <p className="text-muted-foreground">
              {legalCase.case_type === "FTPR"
                ? "Failure to Pay Rent"
                : legalCase.case_type}{" "}
              case
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/cases/${caseId}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Case
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Case Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Case Type
                  </label>
                  <p className="font-medium">
                    {legalCase.case_type === "FTPR"
                      ? "Failure to Pay Rent"
                      : legalCase.case_type}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Date Initiated
                  </label>
                  <p className="font-medium">
                    {dayjs(legalCase.date_initiated).format("MMMM D, YYYY")}
                  </p>
                </div>
                {legalCase.court_case_number && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Court Case Number
                    </label>
                    <p className="font-medium">{legalCase.court_case_number}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Processing Fee
                  </label>
                  <p className="font-medium">
                    {formatCurrency(legalCase.price)}
                  </p>
                </div>
              </div>

              {legalCase.no_right_of_redemption && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This case has no right of redemption - tenant cannot cure by
                    paying rent owed.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Property & Tenant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Property & Tenant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4" />
                    Property Details
                  </h4>
                  <div className="space-y-2">
                    <p className="font-medium">{legalCase.property?.address}</p>
                    {legalCase.property?.unit && (
                      <p className="text-sm text-muted-foreground">
                        Unit {legalCase.property.unit}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {legalCase.property?.city}, {legalCase.property?.state}{" "}
                      {legalCase.property?.zip_code}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {legalCase.property?.county} County
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4" />
                    Tenant Details
                  </h4>
                  <div className="space-y-2">
                    <p className="font-medium">
                      {legalCase.tenant?.tenant_names.join(", ")}
                    </p>
                    {legalCase.tenant?.email && (
                      <p className="text-sm text-muted-foreground">
                        {legalCase.tenant.email}
                      </p>
                    )}
                    {legalCase.tenant?.phone && (
                      <p className="text-sm text-muted-foreground">
                        {legalCase.tenant.phone}
                      </p>
                    )}
                    {legalCase.tenant?.rent_amount && (
                      <p className="text-sm text-muted-foreground">
                        Monthly Rent:{" "}
                        {formatCurrency(legalCase.tenant.rent_amount)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Rent Owed at Filing
                  </label>
                  <p className="text-lg font-semibold">
                    {formatCurrency(legalCase.rent_owed_at_filing)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Current Rent Owed
                  </label>
                  <p className="text-lg font-semibold text-red-600">
                    {formatCurrency(legalCase.current_rent_owed)}
                  </p>
                </div>
                {legalCase.late_fees_charged &&
                  legalCase.late_fees_charged > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Late Fees Charged
                      </label>
                      <p className="text-lg font-semibold">
                        {formatCurrency(legalCase.late_fees_charged)}
                      </p>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>

          {/* Court Information */}
          {(legalCase.trial_date ||
            legalCase.court_hearing_date ||
            legalCase.court_outcome_notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Court Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {legalCase.trial_date && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Trial Date
                      </label>
                      <p className="font-medium">
                        {dayjs(legalCase.trial_date).format("MMMM D, YYYY")}
                      </p>
                    </div>
                  )}
                  {legalCase.court_hearing_date && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Court Hearing Date
                      </label>
                      <p className="font-medium">
                        {dayjs(legalCase.court_hearing_date).format(
                          "MMMM D, YYYY"
                        )}
                      </p>
                    </div>
                  )}
                </div>
                {legalCase.court_outcome_notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Court Outcome Notes
                    </label>
                    <p className="mt-1 p-3 bg-muted rounded-md">
                      {legalCase.court_outcome_notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Document Generation */}
          <div className="document-generator">
            <DocumentGenerator
              legalCase={legalCase}
              property={legalCase.property!}
              tenant={legalCase.tenant!}
              landlord={legalCase.landlord!}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Workflow */}
          <CaseStatusWorkflow
            currentStatus={legalCase.status}
            onStatusChange={handleStatusUpdate}
            disabled={updating}
          />

          {/* Payment Status */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Current Payment Status
                </label>
                <div className="mt-2">
                  <Badge
                    variant="secondary"
                    className={getPaymentStatusColor(legalCase.payment_status)}
                  >
                    {legalCase.payment_status}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Update Payment Status
                </label>
                <Select
                  value={legalCase.payment_status}
                  onValueChange={handlePaymentStatusUpdate}
                  disabled={updating}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNPAID">Unpaid</SelectItem>
                    <SelectItem value="PARTIAL">Partial</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Processing Fee</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(legalCase.price)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Case Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Case Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Case Created</p>
                    <p className="text-sm text-muted-foreground">
                      {dayjs(legalCase.created_at).format(
                        "MMMM D, YYYY h:mm A"
                      )}
                    </p>
                  </div>
                </div>
                {legalCase.updated_at !== legalCase.created_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Last Updated</p>
                      <p className="text-sm text-muted-foreground">
                        {dayjs(legalCase.updated_at).format(
                          "MMMM D, YYYY h:mm A"
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full">
                <Link href={`/dashboard/cases/${caseId}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Case Details
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Scroll to document generator section
                  const element = document.querySelector(".document-generator");
                  element?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Generate Documents
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
