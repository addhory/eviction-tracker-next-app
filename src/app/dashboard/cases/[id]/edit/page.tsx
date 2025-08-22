"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { LegalCaseService } from "@/services/legal-case-service";
import { LegalCaseForm } from "@/components/forms/legal-case-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { LegalCase } from "@/types";

export default function EditLegalCasePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [legalCase, setLegalCase] = useState<LegalCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleSuccess = () => {
    router.push(`/dashboard/cases/${caseId}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-96" />
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

  // Convert case data to form format
  const initialData = {
    property_id: legalCase.property_id,
    tenant_id: legalCase.tenant_id,
    case_type: legalCase.case_type,
    date_initiated: legalCase.date_initiated,
    rent_owed_at_filing: legalCase.rent_owed_at_filing / 100, // Convert from cents
    current_rent_owed: legalCase.current_rent_owed / 100, // Convert from cents
    price: legalCase.price / 100, // Convert from cents
    no_right_of_redemption: legalCase.no_right_of_redemption || false,
    late_fees_charged: legalCase.late_fees_charged
      ? legalCase.late_fees_charged / 100
      : undefined, // Convert from cents
    court_case_number: legalCase.court_case_number || "",
    trial_date: legalCase.trial_date || "",
    court_hearing_date: legalCase.court_hearing_date || "",
    court_outcome_notes: legalCase.court_outcome_notes || "",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Legal Case</h1>
          <p className="text-muted-foreground">
            Update the legal case information
          </p>
        </div>
      </div>

      <LegalCaseForm
        initialData={initialData}
        caseId={caseId}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
