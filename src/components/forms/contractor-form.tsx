"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ContractorFormData, Contractor } from "@/types";
import { useEffect } from "react";

interface ContractorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ContractorFormData) => void;
  contractor?: Contractor | null;
  isLoading?: boolean;
  mode: "create" | "edit";
}

export function ContractorForm({
  open,
  onOpenChange,
  onSubmit,
  contractor,
  isLoading = false,
  mode,
}: ContractorFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ContractorFormData>({
    mode: "onChange",
    defaultValues: {
      name: "",
      username: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  // Reset form when dialog opens/closes or contractor changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && contractor) {
        reset({
          name: contractor.name || "",
          username: contractor.username || "",
          email: contractor.email || "",
          phone: contractor.phone || "",
          password: "", // Don't pre-fill password for editing
        });
      } else {
        reset({
          name: "",
          username: "",
          email: "",
          phone: "",
          password: "",
        });
      }
    }
  }, [open, mode, contractor, reset]);

  const onFormSubmit = (data: ContractorFormData) => {
    onSubmit(data);
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Contractor" : "Edit Contractor"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new contractor account. All fields marked with * are required."
              : "Update contractor information. Leave password field empty to keep current password."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter contractor name"
                {...register("name", {
                  required: "Name is required",
                  minLength: {
                    value: 2,
                    message: "Name must be at least 2 characters",
                  },
                })}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">
                Username <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                placeholder="Choose a username"
                {...register("username", {
                  required: "Username is required",
                  minLength: {
                    value: 3,
                    message: "Username must be at least 3 characters",
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message:
                      "Username can only contain letters, numbers, and underscores",
                  },
                })}
              />
              {errors.username && (
                <p className="text-sm text-red-500">
                  {errors.username.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Please enter a valid email address",
                },
              })}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone <span className="text-sm text-gray-500">(Optional)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter phone number"
              {...register("phone", {
                pattern: {
                  value: /^[\+]?[1-9][\d]{0,15}$/,
                  message: "Please enter a valid phone number",
                },
              })}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          {mode === "create" && (
            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                {...register("password", {
                  required: mode === "create" ? "Password is required" : false,
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                })}
              />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>
          )}

          {mode === "edit" && (
            <div className="space-y-2">
              <Label htmlFor="password">
                New Password{" "}
                <span className="text-sm text-gray-500">(Optional)</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Leave empty to keep current password"
                {...register("password", {
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                })}
              />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === "create" ? "Creating..." : "Updating..."}
                </div>
              ) : mode === "create" ? (
                "Create Contractor"
              ) : (
                "Update Contractor"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
