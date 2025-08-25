"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

import { X, Plus, Loader2 } from "lucide-react";
import { MARYLAND_COUNTIES } from "@/types";
import { useAuth } from "@/components/providers/auth-provider";
import {
  useCreateProperty,
  useUpdateProperty,
} from "@/hooks/queries/use-properties";
import { useCreateTenant, useUpdateTenant } from "@/hooks/queries/use-tenants";
import { useQueryClient } from "@tanstack/react-query";
import { tenantPropertyKeys } from "@/hooks/queries/use-tenant-properties";

// Combined form schema for both property and tenant
const addTenantPropertySchema = z
  .object({
    // Property fields
    address: z.string().min(1, "Property address is required"),
    unit: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().default("MD"),
    zip_code: z
      .string()
      .regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code format")
      .min(1, "ZIP code is required"),
    county: z.string().min(1, "County is required"),
    property_type: z.enum(["RESIDENTIAL", "COMMERCIAL"]),
    bedrooms: z.number().min(0).optional(),
    bathrooms: z.number().min(0).optional(),
    square_feet: z.number().min(0).optional(),
    year_built: z.number().min(1800).max(new Date().getFullYear()).optional(),

    // Tenant fields (using objects for useFieldArray)
    tenant_names: z
      .array(z.object({ name: z.string() }))
      .transform((names) => names.filter((item) => item.name.trim() !== "")),
    email: z.email("Invalid email format").optional().or(z.literal("")),
    phone: z.string().optional(),
    lease_start_date: z.string().optional(),
    lease_end_date: z.string().optional(),
    rent_amount: z.number().min(0, "Rent amount must be positive").optional(),
    is_subsidized: z.boolean().default(false),
    subsidy_type: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.is_subsidized && !data.subsidy_type) {
      ctx.addIssue({
        code: "custom",
        message: "Subsidy type is required when rental is subsidized",
        path: ["subsidy_type"],
      });
    }
    if (
      data.lease_start_date &&
      data.lease_end_date &&
      new Date(data.lease_start_date) > new Date(data.lease_end_date)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Lease start date must be before lease end date",
        path: ["lease_start_date"],
      });
    }
    // end date must be after start date
    if (
      data.lease_end_date &&
      data.lease_start_date &&
      new Date(data.lease_end_date) < new Date(data.lease_start_date)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Lease end date must be after lease start date",
        path: ["lease_end_date"],
      });
    }
  });

type AddTenantPropertyFormData = z.infer<typeof addTenantPropertySchema>;

interface AddTenantPropertyModalProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  initialData?: Partial<AddTenantPropertyFormData>;
  isEdit?: boolean;
  propertyId?: string;
  tenantId?: string;
}

export function AddTenantPropertyModal({
  trigger,
  onSuccess,
  initialData,
  isEdit = false,
  propertyId,
  tenantId,
}: AddTenantPropertyModalProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // TanStack Query mutations
  const createPropertyMutation = useCreateProperty();
  const updatePropertyMutation = useUpdateProperty();
  const createTenantMutation = useCreateTenant();
  const updateTenantMutation = useUpdateTenant();

  const form = useForm({
    resolver: zodResolver(addTenantPropertySchema),
    defaultValues: {
      address: "",
      unit: "",
      city: "",
      state: "MD",
      zip_code: "",
      county: "",
      property_type: "RESIDENTIAL" as const,
      bedrooms: 0,
      bathrooms: 0,
      square_feet: 0,
      year_built: 0,
      tenant_names: [{ name: "" }],
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

  console.log(form.formState.errors, "error");

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (data: z.infer<typeof addTenantPropertySchema>) => {
    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    try {
      // Prepare property data
      const propertyData = {
        address: data.address,
        unit: data.unit || undefined,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        county: data.county,
        property_type: data.property_type,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        square_feet: data.square_feet,
        year_built: data.year_built,
      };

      let propertyResult;

      // Create or update property
      if (isEdit && propertyId) {
        // Update existing property
        propertyResult = await updatePropertyMutation.mutateAsync({
          propertyId,
          updates: propertyData,
        });
      } else {
        // Create new property
        propertyResult = await createPropertyMutation.mutateAsync({
          landlordId: user.id,
          propertyData,
        });
      }

      const createdPropertyId = propertyResult.id || propertyId;

      // Only create/update tenant if tenant names are provided
      if (data.tenant_names && data.tenant_names.length > 0) {
        // Transform object array to string array for database
        const tenantNamesArray = data.tenant_names.map((item) => item.name);

        const tenantData = {
          property_id: createdPropertyId,
          tenant_names: tenantNamesArray,
          email: data.email || undefined,
          phone: data.phone || undefined,
          lease_start_date: data.lease_start_date || undefined,
          lease_end_date: data.lease_end_date || undefined,
          rent_amount: data.rent_amount,
          is_subsidized: data.is_subsidized,
          subsidy_type: data.is_subsidized ? data.subsidy_type : undefined,
        };

        if (isEdit && tenantId) {
          // Update existing tenant
          await updateTenantMutation.mutateAsync({
            tenantId,
            updates: tenantData,
          });
        } else {
          // Create new tenant
          await createTenantMutation.mutateAsync({
            landlordId: user.id,
            tenantData,
          });
        }
      }

      // Invalidate tenant-property queries to refresh the list
      if (user) {
        queryClient.invalidateQueries({
          queryKey: tenantPropertyKeys.list(user.id),
        });
      }

      // Success notification and close modal
      toast.success(
        isEdit
          ? "Tenant & Property updated successfully!"
          : "Tenant & Property created successfully!"
      );
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save tenant and property:", error);
      toast.error(
        isEdit
          ? "Failed to update tenant and property"
          : "Failed to create tenant and property"
      );
    }
  };

  const addTenantName = () => {
    append({ name: "" });
  };

  const removeTenantName = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Check if any mutation is loading
  const isLoading =
    createPropertyMutation.isPending ||
    updatePropertyMutation.isPending ||
    createTenantMutation.isPending ||
    updateTenantMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Tenant & Property
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEdit ? "Edit Tenant & Property" : "Add New Tenant & Property"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Property Type Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Property Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="property_type" className="text-sm font-medium">
                  Property Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.watch("property_type")}
                  onValueChange={(value: "RESIDENTIAL" | "COMMERCIAL") =>
                    form.setValue("property_type", value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                    <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.property_type && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.property_type.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tenant Details Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Tenant Details{" "}
                <span className="text-sm font-normal text-gray-500">
                  (Optional - fill Tenant 1 Name to add/edit tenant)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dynamic Tenant Names */}
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <div className="flex-1">
                      <Label
                        htmlFor={`tenant_name_${index}`}
                        className="text-sm font-medium"
                      >
                        Tenant {index + 1} (First & Last Name)
                        {index === 0 && (
                          <span className="text-gray-500 ml-1">(Optional)</span>
                        )}
                        {index > 0 && (
                          <span className="text-gray-500 ml-1">(Optional)</span>
                        )}
                      </Label>
                      <Input
                        {...form.register(`tenant_names.${index}.name`)}
                        placeholder="Enter tenant name"
                        className="mt-1"
                      />
                      {form.formState.errors.tenant_names?.[index]?.name && (
                        <p className="text-red-500 text-sm mt-1">
                          {
                            form.formState.errors.tenant_names[index]?.name
                              ?.message
                          }
                        </p>
                      )}
                    </div>
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTenantName(index)}
                        className="text-red-500 hover:text-red-700 mt-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                {fields.length < 4 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTenantName}
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Tenant
                  </Button>
                )}
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email{" "}
                    <span className="text-gray-500 text-sm">(Optional)</span>
                  </Label>
                  <Input
                    {...form.register("email")}
                    type="email"
                    placeholder="Enter email address"
                    className="mt-1"
                  />
                  {form.formState.errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone{" "}
                    <span className="text-gray-500 text-sm">(Optional)</span>
                  </Label>
                  <Input
                    {...form.register("phone")}
                    type="tel"
                    placeholder="Enter phone number"
                    className="mt-1"
                  />
                  {form.formState.errors.phone && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Location & Description Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Property Location & Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Address */}
              <div>
                <Label htmlFor="address" className="text-sm font-medium">
                  Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...form.register("address")}
                  placeholder="Enter property address"
                  className="mt-1"
                />
                {form.formState.errors.address && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.address.message}
                  </p>
                )}
              </div>

              {/* Unit/Apt/Suite */}
              <div>
                <Label htmlFor="unit" className="text-sm font-medium">
                  Unit / Apt / Suite{" "}
                  <span className="text-gray-500 text-sm">(Optional)</span>
                </Label>
                <Input
                  {...form.register("unit")}
                  placeholder="Enter unit number (optional)"
                  className="mt-1"
                />
              </div>

              {/* City, State, ZIP */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city" className="text-sm font-medium">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...form.register("city")}
                    placeholder="Enter city"
                    className="mt-1"
                  />
                  {form.formState.errors.city && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.city.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="state" className="text-sm font-medium">
                    State <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...form.register("state")}
                    value="MD"
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                </div>

                <div>
                  <Label htmlFor="zip_code" className="text-sm font-medium">
                    ZIP Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...form.register("zip_code")}
                    placeholder="12345"
                    className="mt-1"
                  />
                  {form.formState.errors.zip_code && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.zip_code.message}
                    </p>
                  )}
                </div>
              </div>

              {/* County */}
              <div>
                <Label htmlFor="county" className="text-sm font-medium">
                  County <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.watch("county")}
                  onValueChange={(value) => form.setValue("county", value)}
                >
                  <SelectTrigger className="mt-1">
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
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.county.message}
                  </p>
                )}
              </div>

              {/* Optional Property Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {form.watch("property_type") === "RESIDENTIAL" && (
                  <>
                    <div>
                      <Label htmlFor="bedrooms" className="text-sm font-medium">
                        Bedrooms{" "}
                        <span className="text-gray-500 text-sm">
                          (Optional)
                        </span>
                      </Label>
                      <Input
                        {...form.register("bedrooms", {
                          valueAsNumber: true,
                        })}
                        type="number"
                        min="0"
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="bathrooms"
                        className="text-sm font-medium"
                      >
                        Bathrooms{" "}
                        <span className="text-gray-500 text-sm">
                          (Optional)
                        </span>
                      </Label>
                      <Input
                        {...form.register("bathrooms", {
                          valueAsNumber: true,
                        })}
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="square_feet" className="text-sm font-medium">
                    Square Feet{" "}
                    <span className="text-gray-500 text-sm">(Optional)</span>
                  </Label>
                  <Input
                    {...form.register("square_feet", {
                      valueAsNumber: true,
                    })}
                    type="number"
                    min="0"
                    placeholder="0"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="year_built" className="text-sm font-medium">
                    Year Built{" "}
                    <span className="text-gray-500 text-sm">(Optional)</span>
                  </Label>
                  <Input
                    {...form.register("year_built", {
                      valueAsNumber: true,
                    })}
                    type="number"
                    min="1800"
                    max={new Date().getFullYear()}
                    placeholder="2000"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lease Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Lease Information{" "}
                <span className="text-sm font-normal text-gray-500">
                  (Optional)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="lease_start_date"
                    className="text-sm font-medium"
                  >
                    Lease Start Date{" "}
                    <span className="text-gray-500 text-sm">(Optional)</span>
                  </Label>
                  <Input
                    {...form.register("lease_start_date")}
                    type="date"
                    className="mt-1"
                  />
                  {form.formState.errors.lease_start_date && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.lease_start_date.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="lease_end_date"
                    className="text-sm font-medium"
                  >
                    Lease End Date{" "}
                    <span className="text-gray-500 text-sm">(Optional)</span>
                  </Label>
                  <Input
                    {...form.register("lease_end_date")}
                    type="date"
                    className="mt-1"
                  />
                  {form.formState.errors.lease_end_date && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.lease_end_date.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="rent_amount" className="text-sm font-medium">
                  Monthly Rent{" "}
                  <span className="text-gray-500 text-sm">(Optional)</span>
                </Label>
                <Input
                  {...form.register("rent_amount", {
                    valueAsNumber: true,
                  })}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>

              {/* Subsidy Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_subsidized"
                    checked={form.watch("is_subsidized")}
                    onCheckedChange={(checked) => {
                      form.setValue("is_subsidized", !!checked);
                      if (!checked) {
                        form.setValue("subsidy_type", "");
                      }
                    }}
                  />
                  <Label
                    htmlFor="is_subsidized"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Is this a subsidized rental?{" "}
                    <span className="text-gray-500 text-sm">(Optional)</span>
                  </Label>
                </div>

                {form.watch("is_subsidized") && (
                  <div>
                    <Label
                      htmlFor="subsidy_type"
                      className="text-sm font-medium"
                    >
                      Subsidy Type <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...form.register("subsidy_type")}
                      placeholder="e.g., Section 8, Housing Choice Voucher"
                      className="mt-1"
                    />
                    {form.formState.errors.subsidy_type && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.subsidy_type.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : isEdit ? (
                "Update Tenant & Property"
              ) : (
                "Create Tenant & Property"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
