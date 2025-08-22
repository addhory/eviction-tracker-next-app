"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { LegalCaseService } from "@/services/legal-case-service";
import { PropertyService } from "@/services/property-service";
import { TenantService } from "@/services/tenant-service";
import { useAuth } from "@/components/providers/auth-provider";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Calculator, AlertTriangle } from "lucide-react";
import { getCountyPrice } from "@/config/app";

const legalCaseSchema = z.object({
  property_id: z.string().min(1, "Please select a property"),
  tenant_id: z.string().min(1, "Please select a tenant"),
  case_type: z.enum(["FTPR", "HOLDOVER", "OTHER"], {
    required_error: "Please select a case type",
  }),
  date_initiated: z.string().min(1, "Date is required"),
  rent_owed_at_filing: z.number().min(0, "Amount must be positive"),
  current_rent_owed: z.number().min(0, "Amount must be positive"),
  price: z.number().min(0, "Price must be positive"),
  no_right_of_redemption: z.boolean().default(false),
  late_fees_charged: z.number().min(0, "Amount must be positive").optional(),
  court_case_number: z.string().optional(),
  trial_date: z.string().optional(),
  court_hearing_date: z.string().optional(),
  court_outcome_notes: z.string().optional(),
});

type LegalCaseFormData = z.infer<typeof legalCaseSchema>;

interface LegalCaseFormProps {
  initialData?: Partial<LegalCaseFormData>;
  caseId?: string;
  onSuccess?: () => void;
}

export function LegalCaseForm({
  initialData,
  caseId,
  onSuccess,
}: LegalCaseFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<any[]>([]);
  const router = useRouter();
  const { user } = useAuth();
  const { addLegalCase, updateLegalCase } = useAppStore();

  const form = useForm<LegalCaseFormData>({
    resolver: zodResolver(legalCaseSchema),
    defaultValues: {
      property_id: "",
      tenant_id: "",
      case_type: "FTPR",
      date_initiated: new Date().toISOString().split("T")[0],
      rent_owed_at_filing: 0,
      current_rent_owed: 0,
      price: 0,
      no_right_of_redemption: false,
      late_fees_charged: 0,
      court_case_number: "",
      trial_date: "",
      court_hearing_date: "",
      court_outcome_notes: "",
      ...initialData,
    },
  });

  const selectedPropertyId = form.watch("property_id");
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [propertyService, tenantService] = [
          new PropertyService(),
          new TenantService(),
        ];

        const [propertiesResult, tenantsResult] = await Promise.all([
          propertyService.getProperties(user.id),
          tenantService.getTenants(user.id),
        ]);

        if (!propertiesResult.error && propertiesResult.data) {
          setProperties(propertiesResult.data);
        }

        if (!tenantsResult.error && tenantsResult.data) {
          setTenants(tenantsResult.data);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadData();
  }, [user]);

  // Filter tenants by selected property
  useEffect(() => {
    if (selectedPropertyId) {
      const propertyTenants = tenants.filter(
        (tenant) => tenant.property_id === selectedPropertyId
      );
      setFilteredTenants(propertyTenants);

      // Auto-calculate price based on county
      if (selectedProperty?.county) {
        const countyPrice = getCountyPrice(selectedProperty.county);
        form.setValue("price", countyPrice / 100); // Convert from cents to dollars
      }
    } else {
      setFilteredTenants([]);
    }
  }, [selectedPropertyId, tenants, selectedProperty, form]);

  const onSubmit = async (data: LegalCaseFormData) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const legalCaseService = new LegalCaseService();

      // Convert price to cents for storage
      const processedData = {
        ...data,
        price: Math.round(data.price * 100),
        rent_owed_at_filing: Math.round(data.rent_owed_at_filing * 100),
        current_rent_owed: Math.round(data.current_rent_owed * 100),
        late_fees_charged: data.late_fees_charged
          ? Math.round(data.late_fees_charged * 100)
          : undefined,
      };

      if (caseId) {
        // Update existing case
        const { data: updatedCase, error } =
          await legalCaseService.updateLegalCase(caseId, processedData);

        if (error) {
          setError(error.message || "Failed to update legal case");
          return;
        }

        if (updatedCase) {
          updateLegalCase(caseId, updatedCase);
        }
      } else {
        // Create new case
        const { data: newCase, error } = await legalCaseService.createLegalCase(
          user.id,
          processedData
        );

        if (error) {
          setError(error.message || "Failed to create legal case");
          return;
        }

        if (newCase) {
          addLegalCase(newCase);
        }
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/cases");
      }
    } catch (err) {
      console.error("Legal case form error:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {caseId ? "Edit Legal Case" : "Create New Legal Case"}
        </CardTitle>
        <CardDescription>
          {caseId
            ? "Update the legal case information"
            : "Start a new eviction case proceeding"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Case Overview */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Case Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="case_type">Case Type *</Label>
                <Select
                  value={form.watch("case_type")}
                  onValueChange={(value) =>
                    form.setValue(
                      "case_type",
                      value as "FTPR" | "HOLDOVER" | "OTHER"
                    )
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select case type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FTPR">
                      Failure to Pay Rent (FTPR)
                    </SelectItem>
                    <SelectItem value="HOLDOVER">Holdover</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.case_type && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.case_type.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_initiated">Date Initiated *</Label>
                <Input
                  id="date_initiated"
                  type="date"
                  {...form.register("date_initiated")}
                  disabled={isLoading}
                />
                {form.formState.errors.date_initiated && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.date_initiated.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Processing Fee *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-8"
                    {...form.register("price", { valueAsNumber: true })}
                    disabled={isLoading}
                  />
                  <Calculator className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {selectedProperty?.county && (
                  <p className="text-xs text-muted-foreground">
                    Suggested fee for {selectedProperty.county} County: $
                    {(getCountyPrice(selectedProperty.county) / 100).toFixed(2)}
                  </p>
                )}
                {form.formState.errors.price && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.price.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Property and Tenant Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Property & Tenant</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="property_id">Property *</Label>
                <Select
                  value={form.watch("property_id")}
                  onValueChange={(value) => {
                    form.setValue("property_id", value);
                    form.setValue("tenant_id", ""); // Reset tenant selection
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.address}
                        {property.unit && ` - Unit ${property.unit}`}
                        <span className="text-muted-foreground ml-2">
                          ({property.county} County)
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.property_id && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.property_id.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant_id">Tenant *</Label>
                <Select
                  value={form.watch("tenant_id")}
                  onValueChange={(value) => form.setValue("tenant_id", value)}
                  disabled={isLoading || !selectedPropertyId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.tenant_names.join(", ")}
                        {tenant.email && (
                          <span className="text-muted-foreground ml-2">
                            ({tenant.email})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.tenant_id && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.tenant_id.message}
                  </p>
                )}
                {!selectedPropertyId && (
                  <p className="text-xs text-muted-foreground">
                    Select a property first to see available tenants
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Financial Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rent_owed_at_filing">
                  Rent Owed at Filing *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <Input
                    id="rent_owed_at_filing"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-8"
                    {...form.register("rent_owed_at_filing", {
                      valueAsNumber: true,
                    })}
                    disabled={isLoading}
                  />
                </div>
                {form.formState.errors.rent_owed_at_filing && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.rent_owed_at_filing.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_rent_owed">Current Rent Owed *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <Input
                    id="current_rent_owed"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-8"
                    {...form.register("current_rent_owed", {
                      valueAsNumber: true,
                    })}
                    disabled={isLoading}
                  />
                </div>
                {form.formState.errors.current_rent_owed && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.current_rent_owed.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="late_fees_charged">Late Fees Charged</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <Input
                    id="late_fees_charged"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-8"
                    {...form.register("late_fees_charged", {
                      valueAsNumber: true,
                    })}
                    disabled={isLoading}
                  />
                </div>
                {form.formState.errors.late_fees_charged && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.late_fees_charged.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="no_right_of_redemption"
                checked={form.watch("no_right_of_redemption")}
                onCheckedChange={(checked) =>
                  form.setValue("no_right_of_redemption", checked as boolean)
                }
                disabled={isLoading}
              />
              <Label htmlFor="no_right_of_redemption" className="text-sm">
                No Right of Redemption (tenant cannot cure by paying rent owed)
              </Label>
            </div>
          </div>

          {/* Court Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Court Information (Optional)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="court_case_number">Court Case Number</Label>
                <Input
                  id="court_case_number"
                  placeholder="e.g., CV-2024-001234"
                  {...form.register("court_case_number")}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trial_date">Trial Date</Label>
                <Input
                  id="trial_date"
                  type="date"
                  {...form.register("trial_date")}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="court_hearing_date">Court Hearing Date</Label>
                <Input
                  id="court_hearing_date"
                  type="date"
                  {...form.register("court_hearing_date")}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="court_outcome_notes">Court Outcome Notes</Label>
              <Textarea
                id="court_outcome_notes"
                placeholder="Enter any notes about court proceedings or outcomes..."
                rows={3}
                {...form.register("court_outcome_notes")}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {caseId ? "Update Legal Case" : "Create Legal Case"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
              className="flex-1 sm:flex-initial"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
