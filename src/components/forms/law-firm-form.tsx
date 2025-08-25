"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  useCreateLawFirm,
  useUpdateLawFirm,
  useGenerateReferralCode,
} from "@/hooks/queries/use-law-firms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { LawFirm } from "@/services/law-firm-service";

const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

const lawFirmSchema = z.object({
  name: z.string().min(2, "Law firm name must be at least 2 characters"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{5}(-\d{4})?$/.test(val),
      "Invalid ZIP code format"
    ),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\(\d{3}\) \d{3}-\d{4}$/.test(val),
      "Phone number must be in format (xxx) xxx-xxxx"
    ),
  email: z
    .string()
    .optional()
    .refine(
      (val) => !val || z.string().email().safeParse(val).success,
      "Invalid email format"
    ),
  website: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^https?:\/\/.+\..+/.test(val),
      "Website must be a valid URL starting with http:// or https://"
    ),
  contact_person: z.string().optional(),
  notes: z.string().optional(),
});

type LawFirmSchemaType = z.infer<typeof lawFirmSchema>;

interface LawFirmFormProps {
  initialData?: LawFirm;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  mode?: "create" | "edit";
}

export function LawFirmForm({
  initialData,
  onSuccess,
  trigger,
  mode = "create",
}: LawFirmFormProps) {
  const [open, setOpen] = React.useState(false);
  const [generatedReferralCode, setGeneratedReferralCode] = React.useState("");

  const form = useForm<LawFirmSchemaType>({
    resolver: zodResolver(lawFirmSchema),
    defaultValues: {
      name: initialData?.name || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      zip_code: initialData?.zip_code || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      website: initialData?.website || "",
      contact_person: initialData?.contact_person || "",
      notes: initialData?.notes || "",
    },
  });

  const createMutation = useCreateLawFirm();
  const updateMutation = useUpdateLawFirm();
  const generateReferralMutation = useGenerateReferralCode();

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  const handleGenerateReferralCode = async () => {
    const lawFirmName = form.getValues("name");
    if (!lawFirmName) {
      form.setError("name", { message: "Please enter law firm name first" });
      return;
    }

    try {
      const code = await generateReferralMutation.mutateAsync(lawFirmName);
      setGeneratedReferralCode(code);
    } catch (error) {
      console.error("Failed to generate referral code:", error);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");

    // Format as (xxx) xxx-xxxx
    if (digits.length >= 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(
        6,
        10
      )}`;
    } else if (digits.length >= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length >= 3) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }
    return digits;
  };

  const onSubmit = async (data: LawFirmSchemaType) => {
    try {
      if (mode === "edit" && initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          updates: data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }

      setOpen(false);
      form.reset();
      setGeneratedReferralCode("");
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the mutation
      console.error("Form submission error:", error);
    }
  };

  const defaultTrigger = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Add Law Firm
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Law Firm" : "Add New Law Firm"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the law firm information below."
              : "Add a new law firm partner to track referrals and manage relationships."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {error.message || "An error occurred"}
                </AlertDescription>
              </Alert>
            )}

            {/* Law Firm Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Law Firm Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter law firm name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Contact Person</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter contact person name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="contact@lawfirm.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(555) 123-4567"
                          value={field.value || ""}
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            field.onChange(formatted);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.lawfirm.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Address Information</h3>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123 Main Street, Suite 100"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Baltimore" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {US_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zip_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="21201" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Additional Information</h3>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional notes about this law firm..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Referral Code Generator (for new law firms) */}
            {mode === "create" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Referral Code</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateReferralCode}
                    disabled={generateReferralMutation.isPending}
                  >
                    {generateReferralMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Generate Code
                  </Button>
                </div>

                {generatedReferralCode && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <Label className="text-sm font-medium text-green-800">
                      Generated Referral Code:
                    </Label>
                    <div className="font-mono text-lg font-bold text-green-900 mt-1">
                      {generatedReferralCode}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {mode === "edit" ? "Update Law Firm" : "Create Law Firm"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
