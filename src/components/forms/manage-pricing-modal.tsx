"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const pricingSchema = z.object({
  ftprPrice: z.string().optional(),
  holdoverPrice: z.string().optional(),
  otherPrice: z.string().optional(),
  rushFee: z.string().optional(),
  amendmentFee: z.string().optional(),
});

type PricingFormData = z.infer<typeof pricingSchema>;

interface ManagePricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
    price_overrides?: any;
  };
}

const defaultPricing = {
  ftprPrice: "75.00",
  holdoverPrice: "125.00",
  otherPrice: "100.00",
  rushFee: "25.00",
  amendmentFee: "15.00",
};

export function ManagePricingModal({
  isOpen,
  onClose,
  user,
}: ManagePricingModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPricing, setCurrentPricing] = useState<any>(null);
  const queryClient = useQueryClient();

  const form = useForm<PricingFormData>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      ftprPrice: "",
      holdoverPrice: "",
      otherPrice: "",
      rushFee: "",
      amendmentFee: "",
    },
  });

  // Load current pricing when modal opens
  useEffect(() => {
    if (isOpen && user) {
      const pricing = user.price_overrides || {};
      setCurrentPricing(pricing);

      form.reset({
        ftprPrice: pricing.ftprPrice || "",
        holdoverPrice: pricing.holdoverPrice || "",
        otherPrice: pricing.otherPrice || "",
        rushFee: pricing.rushFee || "",
        amendmentFee: pricing.amendmentFee || "",
      });
    }
  }, [isOpen, user, form]);

  const onSubmit = async (data: PricingFormData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      // Convert string values to numbers and filter out empty values
      const priceOverrides: any = {};

      if (data.ftprPrice) priceOverrides.ftprPrice = parseFloat(data.ftprPrice);
      if (data.holdoverPrice)
        priceOverrides.holdoverPrice = parseFloat(data.holdoverPrice);
      if (data.otherPrice)
        priceOverrides.otherPrice = parseFloat(data.otherPrice);
      if (data.rushFee) priceOverrides.rushFee = parseFloat(data.rushFee);
      if (data.amendmentFee)
        priceOverrides.amendmentFee = parseFloat(data.amendmentFee);

      const { error } = await supabase
        .from("profiles")
        .update({
          price_overrides: priceOverrides,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      toast.success("Pricing updated successfully!");

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });

      onClose();
    } catch (error: any) {
      console.error("Error updating pricing:", error);
      toast.error(error.message || "Failed to update pricing");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    form.reset({
      ftprPrice: "",
      holdoverPrice: "",
      otherPrice: "",
      rushFee: "",
      amendmentFee: "",
    });
  };

  const getEffectivePrice = (override: string, defaultValue: string) => {
    return override || defaultValue;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Pricing for {user.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Pricing Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>FTPR Cases:</span>
                  <span className="font-medium">
                    $
                    {getEffectivePrice(
                      currentPricing?.ftprPrice,
                      defaultPricing.ftprPrice
                    )}
                    {currentPricing?.ftprPrice && (
                      <Badge variant="secondary" className="ml-2">
                        Custom
                      </Badge>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Holdover Cases:</span>
                  <span className="font-medium">
                    $
                    {getEffectivePrice(
                      currentPricing?.holdoverPrice,
                      defaultPricing.holdoverPrice
                    )}
                    {currentPricing?.holdoverPrice && (
                      <Badge variant="secondary" className="ml-2">
                        Custom
                      </Badge>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Other Cases:</span>
                  <span className="font-medium">
                    $
                    {getEffectivePrice(
                      currentPricing?.otherPrice,
                      defaultPricing.otherPrice
                    )}
                    {currentPricing?.otherPrice && (
                      <Badge variant="secondary" className="ml-2">
                        Custom
                      </Badge>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Rush Fee:</span>
                  <span className="font-medium">
                    $
                    {getEffectivePrice(
                      currentPricing?.rushFee,
                      defaultPricing.rushFee
                    )}
                    {currentPricing?.rushFee && (
                      <Badge variant="secondary" className="ml-2">
                        Custom
                      </Badge>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Amendment Fee:</span>
                  <span className="font-medium">
                    $
                    {getEffectivePrice(
                      currentPricing?.amendmentFee,
                      defaultPricing.amendmentFee
                    )}
                    {currentPricing?.amendmentFee && (
                      <Badge variant="secondary" className="ml-2">
                        Custom
                      </Badge>
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Override Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Set Custom Pricing</CardTitle>
              <p className="text-sm text-gray-600">
                Leave fields empty to use default pricing. Enter custom amounts
                to override.
              </p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* FTPR Price */}
                    <FormField
                      control={form.control}
                      name="ftprPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            FTPR Cases
                            <span className="text-sm text-gray-500 ml-2">
                              (Default: ${defaultPricing.ftprPrice})
                            </span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                $
                              </span>
                              <Input
                                placeholder={defaultPricing.ftprPrice}
                                className="pl-8"
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Holdover Price */}
                    <FormField
                      control={form.control}
                      name="holdoverPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Holdover Cases
                            <span className="text-sm text-gray-500 ml-2">
                              (Default: ${defaultPricing.holdoverPrice})
                            </span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                $
                              </span>
                              <Input
                                placeholder={defaultPricing.holdoverPrice}
                                className="pl-8"
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Other Price */}
                    <FormField
                      control={form.control}
                      name="otherPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Other Cases
                            <span className="text-sm text-gray-500 ml-2">
                              (Default: ${defaultPricing.otherPrice})
                            </span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                $
                              </span>
                              <Input
                                placeholder={defaultPricing.otherPrice}
                                className="pl-8"
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Rush Fee */}
                    <FormField
                      control={form.control}
                      name="rushFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Rush Fee
                            <span className="text-sm text-gray-500 ml-2">
                              (Default: ${defaultPricing.rushFee})
                            </span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                $
                              </span>
                              <Input
                                placeholder={defaultPricing.rushFee}
                                className="pl-8"
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Amendment Fee */}
                    <FormField
                      control={form.control}
                      name="amendmentFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Amendment Fee
                            <span className="text-sm text-gray-500 ml-2">
                              (Default: ${defaultPricing.amendmentFee})
                            </span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                $
                              </span>
                              <Input
                                placeholder={defaultPricing.amendmentFee}
                                className="pl-8"
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-between pt-4">
                    <div className="space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleReset}
                        disabled={isLoading}
                      >
                        Reset to Defaults
                      </Button>
                    </div>
                    <div className="space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save Pricing"}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
