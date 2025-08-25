"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useTenants } from "@/hooks/queries/use-tenants";
import { useAuth } from "@/components/providers/auth-provider";

// Validation schema based on the database schema
const evictionRequestSchema = z.object({
  tenant_id: z.string().min(1, "Please select a tenant"),
  no_right_of_redemption: z.boolean(),
  current_rent_owed: z
    .string()
    .min(1, "Amount due is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount due must be a positive number",
    }),
  district_court_case_number: z
    .string()
    .min(1, "District court case number is required"),
  warrant_order_date: z.string(),
  initial_eviction_date: z.string(),
  signature_name: z.string().min(1, "Please enter your full name as signature"),
});

type EvictionRequestFormData = z.infer<typeof evictionRequestSchema>;

interface EvictionLetterRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EvictionRequestFormData & { price: number }) => void;
  isSubmitting?: boolean;
}

export function EvictionLetterRequestModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: EvictionLetterRequestModalProps) {
  const { user } = useAuth();
  const { data: tenants, isLoading: isLoadingTenants } = useTenants(user?.id);

  const form = useForm<EvictionRequestFormData>({
    resolver: zodResolver(evictionRequestSchema),
    defaultValues: {
      tenant_id: "",
      no_right_of_redemption: false,
      current_rent_owed: "",
      district_court_case_number: "",
      signature_name: "",
    },
  });

  // Fixed price based on county (as requested in requirements)
  const price = 80.0;

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const handleSubmit = (data: EvictionRequestFormData) => {
    onSubmit({
      ...data,
      price,
    });
    onClose();
  };

  const selectedTenant = tenants?.find(
    (tenant) => tenant.id === form.watch("tenant_id")
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>New Eviction Letter Request</DialogTitle>
              <DialogDescription>
                Complete the form below to submit a new eviction letter request.
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Tenant Selection */}
            <FormField
              control={form.control}
              name="tenant_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Tenant <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tenant" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingTenants ? (
                        <SelectItem value="loading" disabled>
                          Loading tenants...
                        </SelectItem>
                      ) : tenants && tenants.length > 0 ? (
                        tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.tenant_names.join(", ")} -{" "}
                            {tenant.property?.address}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-tenants" disabled>
                          No tenants found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* No Right of Redemption */}
            <FormField
              control={form.control}
              name="no_right_of_redemption"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-sm font-medium">
                    Was this case entered as a &quot;No Right of
                    Redemption&quot;? <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormDescription className="text-sm text-gray-600">
                    This is a judgment where the tenant is not given the option
                    to &quot;pay and stay&quot;.
                  </FormDescription>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) =>
                        field.onChange(value === "true")
                      }
                      value={field.value ? "true" : "false"}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="false" id="can-pay" />
                        <Label htmlFor="can-pay" className="text-sm">
                          No (Tenant can pay to stay)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="true" id="cannot-pay" />
                        <Label htmlFor="cannot-pay" className="text-sm">
                          Yes (Tenant cannot pay to stay)
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount Due to Redeem */}
            <FormField
              control={form.control}
              name="current_rent_owed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Amount Due to Redeem the Property ($){" "}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                      min="0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* District Court Case Number */}
            <FormField
              control={form.control}
              name="district_court_case_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    District Court Case Number (Full Case Number){" "}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full case number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Warrant Was Ordered */}
            <FormField
              control={form.control}
              name="warrant_order_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium">
                    Date Warrant Was Ordered by Court{" "}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormDescription className="text-sm text-gray-600">
                    This can be found at{" "}
                    <a
                      href="https://casesearch.courts.state.md.us"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      casesearch.courts.state.md.us
                    </a>
                  </FormDescription>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>dd/mm/yyyy</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        onSelect={(date) => {
                          const utc = date?.toUTCString();
                          field.onChange(utc);
                        }}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Initial Scheduled Date of Eviction */}
            <FormField
              control={form.control}
              name="initial_eviction_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium">
                    Initial Scheduled Date of Eviction{" "}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>dd/mm/yyyy</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        onSelect={(date) => {
                          const utc = date?.toUTCString();
                          field.onChange(utc);
                        }}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Oath Section */}
            <div className="space-y-3">
              <FormLabel className="text-sm font-medium">Oath:</FormLabel>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm italic text-gray-700">
                  &quot;I do solemnly swear or affirm under the penalty of
                  perjury that the matters and facts set forth above are true to
                  the best of my knowledge, information, and belief.&quot;
                </p>
              </div>
            </div>

            {/* Signature */}
            <FormField
              control={form.control}
              name="signature_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Type Your Full Name as Signature{" "}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Your Full Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price Display - Fixed and Disabled */}
            <div className="space-y-2">
              <FormLabel className="text-sm font-medium">Price ($)</FormLabel>
              <Input
                value={`$${price.toFixed(2)}`}
                disabled
                className="bg-gray-100 text-gray-600"
              />
              <FormDescription className="text-sm text-gray-600">
                Fixed pricing based on county: $80.00
              </FormDescription>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={!selectedTenant || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  `Add to Cart ($${price.toFixed(2)})`
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
