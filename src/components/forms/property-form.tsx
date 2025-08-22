"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useCreateProperty, useUpdateProperty } from "@/hooks/queries";
import { useAuth } from "@/components/providers/auth-provider";
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
import { MARYLAND_COUNTIES } from "@/types";
import { Loader2 } from "lucide-react";

const propertySchema = z.object({
  address: z.string().min(5, "Address must be at least 5 characters"),
  unit: z.string().optional(),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().default("MD"),
  zip_code: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code format"),
  county: z.string().min(1, "Please select a county"),
  property_type: z.enum(["RESIDENTIAL", "COMMERCIAL"], {
    required_error: "Please select a property type",
  }),
  bedrooms: z.number().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  square_feet: z.number().min(0).optional(),
  year_built: z.number().min(1800).max(new Date().getFullYear()).optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface PropertyFormProps {
  initialData?: Partial<PropertyFormData>;
  propertyId?: string;
  onSuccess?: () => void;
}

export function PropertyForm({
  initialData,
  propertyId,
  onSuccess,
}: PropertyFormProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Use TanStack Query mutations
  const createPropertyMutation = useCreateProperty();
  const updatePropertyMutation = useUpdateProperty();

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      address: "",
      unit: "",
      city: "",
      state: "MD",
      zip_code: "",
      county: "",
      property_type: "RESIDENTIAL",
      bedrooms: undefined,
      bathrooms: undefined,
      square_feet: undefined,
      year_built: undefined,
      ...initialData,
    },
  });

  const onSubmit = async (data: PropertyFormData) => {
    if (!user) return;

    if (propertyId) {
      // Update existing property
      updatePropertyMutation.mutate(
        { propertyId, updates: data },
        {
          onSuccess: () => {
            if (onSuccess) {
              onSuccess();
            } else {
              router.push("/dashboard/properties");
            }
          },
        }
      );
    } else {
      // Create new property
      createPropertyMutation.mutate(
        { landlordId: user.id, propertyData: data },
        {
          onSuccess: () => {
            if (onSuccess) {
              onSuccess();
            } else {
              router.push("/dashboard/properties");
            }
          },
        }
      );
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {propertyId ? "Edit Property" : "Add New Property"}
        </CardTitle>
        <CardDescription>
          {propertyId
            ? "Update your property information"
            : "Add a new rental property to your portfolio"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {(createPropertyMutation.isError ||
            updatePropertyMutation.isError) && (
            <Alert variant="destructive">
              <AlertDescription>
                {createPropertyMutation.error?.message ||
                  updatePropertyMutation.error?.message ||
                  "An error occurred"}
              </AlertDescription>
            </Alert>
          )}

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Address Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  placeholder="123 Main Street"
                  {...form.register("address")}
                  disabled={
                    createPropertyMutation.isPending ||
                    updatePropertyMutation.isPending
                  }
                />
                {form.formState.errors.address && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.address.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit/Apt #</Label>
                <Input
                  id="unit"
                  placeholder="1A"
                  {...form.register("unit")}
                  disabled={
                    createPropertyMutation.isPending ||
                    updatePropertyMutation.isPending
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="Baltimore"
                  {...form.register("city")}
                  disabled={
                    createPropertyMutation.isPending ||
                    updatePropertyMutation.isPending
                  }
                />
                {form.formState.errors.city && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.city.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" value="MD" disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip_code">ZIP Code *</Label>
                <Input
                  id="zip_code"
                  placeholder="21201"
                  {...form.register("zip_code")}
                  disabled={
                    createPropertyMutation.isPending ||
                    updatePropertyMutation.isPending
                  }
                />
                {form.formState.errors.zip_code && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.zip_code.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="county">County *</Label>
                <Select
                  value={form.watch("county")}
                  onValueChange={(value) => form.setValue("county", value)}
                  disabled={
                    createPropertyMutation.isPending ||
                    updatePropertyMutation.isPending
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARYLAND_COUNTIES.map((county) => (
                      <SelectItem key={county} value={county}>
                        {county}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.county && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.county.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Property Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="property_type">Property Type *</Label>
                <Select
                  value={form.watch("property_type")}
                  onValueChange={(value) =>
                    form.setValue(
                      "property_type",
                      value as "RESIDENTIAL" | "COMMERCIAL"
                    )
                  }
                  disabled={
                    createPropertyMutation.isPending ||
                    updatePropertyMutation.isPending
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                    <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.property_type && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.property_type.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="year_built">Year Built</Label>
                <Input
                  id="year_built"
                  type="number"
                  placeholder="1990"
                  {...form.register("year_built", { valueAsNumber: true })}
                  disabled={
                    createPropertyMutation.isPending ||
                    updatePropertyMutation.isPending
                  }
                />
                {form.formState.errors.year_built && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.year_built.message}
                  </p>
                )}
              </div>
            </div>

            {form.watch("property_type") === "RESIDENTIAL" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min="0"
                    placeholder="3"
                    {...form.register("bedrooms", { valueAsNumber: true })}
                    disabled={
                      createPropertyMutation.isPending ||
                      updatePropertyMutation.isPending
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="2"
                    {...form.register("bathrooms", { valueAsNumber: true })}
                    disabled={
                      createPropertyMutation.isPending ||
                      updatePropertyMutation.isPending
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="square_feet">Square Feet</Label>
                  <Input
                    id="square_feet"
                    type="number"
                    min="0"
                    placeholder="1200"
                    {...form.register("square_feet", { valueAsNumber: true })}
                    disabled={
                      createPropertyMutation.isPending ||
                      updatePropertyMutation.isPending
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={
                createPropertyMutation.isPending ||
                updatePropertyMutation.isPending
              }
              className="flex-1"
            >
              {(createPropertyMutation.isPending ||
                updatePropertyMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {propertyId ? "Update Property" : "Add Property"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={
                createPropertyMutation.isPending ||
                updatePropertyMutation.isPending
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
