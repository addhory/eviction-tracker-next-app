"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";

import { useAuth } from "@/components/providers/auth-provider";
import {
  useCreateTenant,
  useUpdateTenant,
  useProperties,
} from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2, Plus, X } from "lucide-react";

const tenantSchema = z.object({
  property_id: z.string().min(1, "Please select a property"),
  tenant_names: z
    .array(z.string().min(1, "Name cannot be empty"))
    .min(1, "At least one tenant name is required"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().optional(),
  lease_start_date: z.string().optional(),
  lease_end_date: z.string().optional(),
  rent_amount: z.number().min(0, "Rent amount must be positive").optional(),
  is_subsidized: z.boolean().default(false),
  subsidy_type: z.string().optional(),
});

type TenantFormData = z.infer<typeof tenantSchema>;

interface TenantFormProps {
  initialData?: Partial<TenantFormData>;
  tenantId?: string;
  onSuccess?: () => void;
}

export function TenantForm({
  initialData,
  tenantId,
  onSuccess,
}: TenantFormProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Use TanStack Query hooks
  const { data: properties = [] } = useProperties(user?.id);
  const createTenantMutation = useCreateTenant();
  const updateTenantMutation = useUpdateTenant();

  const form = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      property_id: "",
      tenant_names: [""],
      email: "",
      phone: "",
      lease_start_date: "",
      lease_end_date: "",
      rent_amount: undefined,
      is_subsidized: false,
      subsidy_type: "",
      ...initialData,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tenant_names",
  });

  const onSubmit = async (data: TenantFormData) => {
    if (!user) return;

    // Filter out empty tenant names
    const filteredData = {
      ...data,
      tenant_names: data.tenant_names.filter((name) => name.trim() !== ""),
      email: data.email || undefined,
      phone: data.phone || undefined,
      lease_start_date: data.lease_start_date || undefined,
      lease_end_date: data.lease_end_date || undefined,
      subsidy_type: data.is_subsidized ? data.subsidy_type : undefined,
    };

    if (tenantId) {
      // Update existing tenant
      updateTenantMutation.mutate(
        { tenantId, updates: filteredData },
        {
          onSuccess: () => {
            if (onSuccess) {
              onSuccess();
            } else {
              router.push("/dashboard/tenants");
            }
          },
        }
      );
    } else {
      // Create new tenant
      createTenantMutation.mutate(
        { landlordId: user.id, tenantData: filteredData },
        {
          onSuccess: () => {
            if (onSuccess) {
              onSuccess();
            } else {
              router.push("/dashboard/tenants");
            }
          },
        }
      );
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{tenantId ? "Edit Tenant" : "Add New Tenant"}</CardTitle>
        <CardDescription>
          {tenantId
            ? "Update tenant information"
            : "Add a new tenant to one of your properties"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {(createTenantMutation.isError || updateTenantMutation.isError) && (
            <Alert variant="destructive">
              <AlertDescription>
                {createTenantMutation.error?.message ||
                  updateTenantMutation.error?.message ||
                  "An error occurred"}
              </AlertDescription>
            </Alert>
          )}

          {/* Property Selection */}
          <div className="space-y-2">
            <Label htmlFor="property_id">Property *</Label>
            <Select
              value={form.watch("property_id")}
              onValueChange={(value) => form.setValue("property_id", value)}
              disabled={
                createTenantMutation.isPending || updateTenantMutation.isPending
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.address}
                    {property.unit && ` - Unit ${property.unit}`}
                    {` (${property.city}, ${property.county})`}
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

          {/* Tenant Names */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Tenant Names *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append("")}
                disabled={
                  createTenantMutation.isPending ||
                  updateTenantMutation.isPending
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Tenant
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  placeholder={`Tenant ${index + 1} name`}
                  {...form.register(`tenant_names.${index}`)}
                  disabled={
                    createTenantMutation.isPending ||
                    updateTenantMutation.isPending
                  }
                />
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={
                      createTenantMutation.isPending ||
                      updateTenantMutation.isPending
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {form.formState.errors.tenant_names && (
              <p className="text-sm text-red-600">
                {form.formState.errors.tenant_names.message ||
                  form.formState.errors.tenant_names[0]?.message}
              </p>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tenant@email.com"
                  {...form.register("email")}
                  disabled={
                    createTenantMutation.isPending ||
                    updateTenantMutation.isPending
                  }
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="(555) 123-4567"
                  {...form.register("phone")}
                  disabled={
                    createTenantMutation.isPending ||
                    updateTenantMutation.isPending
                  }
                />
              </div>
            </div>
          </div>

          {/* Lease Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Lease Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lease_start_date">Lease Start Date</Label>
                <Input
                  id="lease_start_date"
                  type="date"
                  {...form.register("lease_start_date")}
                  disabled={
                    createTenantMutation.isPending ||
                    updateTenantMutation.isPending
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lease_end_date">Lease End Date</Label>
                <Input
                  id="lease_end_date"
                  type="date"
                  {...form.register("lease_end_date")}
                  disabled={
                    createTenantMutation.isPending ||
                    updateTenantMutation.isPending
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rent_amount">Monthly Rent ($)</Label>
                <Input
                  id="rent_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="1500.00"
                  {...form.register("rent_amount", { valueAsNumber: true })}
                  disabled={
                    createTenantMutation.isPending ||
                    updateTenantMutation.isPending
                  }
                />
                {form.formState.errors.rent_amount && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.rent_amount.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Subsidy Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_subsidized"
                checked={form.watch("is_subsidized")}
                onCheckedChange={(checked) =>
                  form.setValue("is_subsidized", checked as boolean)
                }
                disabled={
                  createTenantMutation.isPending ||
                  updateTenantMutation.isPending
                }
              />
              <Label htmlFor="is_subsidized">
                This tenant receives rental assistance/subsidy
              </Label>
            </div>

            {form.watch("is_subsidized") && (
              <div className="space-y-2">
                <Label htmlFor="subsidy_type">Subsidy Type</Label>
                <Select
                  value={form.watch("subsidy_type") || ""}
                  onValueChange={(value) =>
                    form.setValue("subsidy_type", value)
                  }
                  disabled={
                    createTenantMutation.isPending ||
                    updateTenantMutation.isPending
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subsidy type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Section 8">Section 8</SelectItem>
                    <SelectItem value="LIHTC">
                      LIHTC (Low-Income Housing Tax Credit)
                    </SelectItem>
                    <SelectItem value="USDA Rural Development">
                      USDA Rural Development
                    </SelectItem>
                    <SelectItem value="HUD">HUD Assistance</SelectItem>
                    <SelectItem value="Local Housing Authority">
                      Local Housing Authority
                    </SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={
                createTenantMutation.isPending || updateTenantMutation.isPending
              }
              className="flex-1"
            >
              {(createTenantMutation.isPending ||
                updateTenantMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {tenantId ? "Update Tenant" : "Add Tenant"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={
                createTenantMutation.isPending || updateTenantMutation.isPending
              }
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
