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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    role: z.enum(["landlord", "contractor"], {
      required_error: "Please select a role",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupForm() {
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const signUpMutation = useSignUp();

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "landlord",
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    signUpMutation.mutate(
      {
        email: data.email,
        password: data.password,
        userData: {
          username: data.username,
          name: data.name,
          role: data.role,
        },
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        },
      }
    );
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <Alert>
            <AlertDescription>
              Account created successfully! Please check your email to verify
              your account. You will be redirected to the login page shortly.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Join Eviction Tracker to manage your properties and legal cases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {signUpMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {signUpMutation.error?.message ||
                  "An error occurred during signup"}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              {...form.register("name")}
              disabled={signUpMutation.isPending}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Choose a username"
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
            <Label htmlFor="email">Email</Label>
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
            <Label htmlFor="role">Role</Label>
            <Select
              value={form.watch("role")}
              onValueChange={(value) =>
                form.setValue("role", value as "landlord" | "contractor")
              }
              disabled={signUpMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="landlord">Landlord</SelectItem>
                <SelectItem value="contractor">Contractor</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.role && (
              <p className="text-sm text-red-600">
                {form.formState.errors.role.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
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
            <Label htmlFor="confirmPassword">Confirm Password</Label>
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
