"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useSignUp } from "@/hooks/queries/use-auth";
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

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const signupSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    fullNameOrCompanyName: z
      .string()
      .min(2, "Full name or company name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
    businessName: z.string().optional(),
    referralCode: z.string().optional(),
    mailingAddress: z
      .string()
      .min(10, "Mailing address must be at least 10 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const signUpMutation = useSignUp();

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      fullNameOrCompanyName: "",
      email: "",
      phoneNumber: "",
      businessName: "",
      referralCode: "",
      mailingAddress: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    signUpMutation.mutate(
      {
        email: data.email,
        password: data.password,
        userData: {
          username: data.username,
          name: data.fullNameOrCompanyName,
          phone: data.phoneNumber,
          business_name: data.businessName || null,
          referral_code: data.referralCode || null,
          address: data.mailingAddress,
          role: "landlord",
        },
      },
      {
        onSuccess: () => {
          toast.success(
            "Account created successfully! Please check your email to verify your account. You will be redirected to the login page shortly."
          );
        },
        onError: () => {
          toast.error("An error occurred during signup. Please try again.");
        },
      }
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Join Eviction Tracker to manage your properties and legal cases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {signUpMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {signUpMutation.error?.message ||
                  "An error occurred during signup"}
              </AlertDescription>
            </Alert>
          )}

          {/* First Row: Username and Full Name/Company Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">
                Username <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                placeholder="Enter your username"
                {...form.register("username")}
                disabled={signUpMutation.isPending}
              />
              {form.formState.errors.username && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullNameOrCompanyName">
                Full Name / Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullNameOrCompanyName"
                placeholder="Enter your full name"
                {...form.register("fullNameOrCompanyName")}
                disabled={signUpMutation.isPending}
              />
              {form.formState.errors.fullNameOrCompanyName && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.fullNameOrCompanyName.message}
                </p>
              )}
            </div>
          </div>

          {/* Second Row: Email and Phone Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...form.register("email")}
                disabled={signUpMutation.isPending}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="Enter your phone number"
                {...form.register("phoneNumber")}
                disabled={signUpMutation.isPending}
              />
              {form.formState.errors.phoneNumber && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.phoneNumber.message}
                </p>
              )}
            </div>
          </div>

          {/* Third Row: Business Name and Referral Code (Optional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">
                Business Name <span className="text-red-400">(Optional)</span>
              </Label>
              <Input
                id="businessName"
                placeholder="Enter your business name (optional)"
                {...form.register("businessName")}
                disabled={signUpMutation.isPending}
              />
              {form.formState.errors.businessName && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.businessName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="referralCode">
                Referral Code <span className="text-red-400">(Optional)</span>
              </Label>
              <Input
                id="referralCode"
                placeholder="Enter referral code (optional)"
                {...form.register("referralCode")}
                disabled={signUpMutation.isPending}
              />
              {form.formState.errors.referralCode && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.referralCode.message}
                </p>
              )}
            </div>
          </div>

          {/* Fourth Row: Mailing Address (Full Width) */}
          <div className="space-y-2">
            <Label htmlFor="mailingAddress">
              Mailing Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="mailingAddress"
              placeholder="Enter your mailing address"
              {...form.register("mailingAddress")}
              disabled={signUpMutation.isPending}
            />
            {form.formState.errors.mailingAddress && (
              <p className="text-sm text-red-600">
                {form.formState.errors.mailingAddress.message}
              </p>
            )}
          </div>

          {/* Fifth Row: Password and Confirm Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...form.register("password")}
                disabled={signUpMutation.isPending}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                {...form.register("confirmPassword")}
                disabled={signUpMutation.isPending}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={signUpMutation.isPending}
          >
            {signUpMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Account
          </Button>

          <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Button
              type="button"
              variant="link"
              onClick={() => router.push("/login")}
              className="p-0"
            >
              Sign in
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
