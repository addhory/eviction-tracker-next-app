"use client";

import { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Key, Mail, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAdminResetUserPassword } from "@/hooks/queries/use-admin";

const passwordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
    role: string;
  };
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  user,
}: ChangePasswordModalProps) {
  const [showResetOption, setShowResetOption] = useState(false);
  const resetPasswordMutation = useAdminResetUserPassword();

  const handlePasswordReset = async () => {
    try {
      const result = await resetPasswordMutation.mutateAsync(user.id);

      if (result.success) {
        toast.success(
          `Password reset email sent to ${result.user_email}. The user will receive instructions to reset their password.`
        );
        onClose();
      } else {
        toast.error(result.message || "Failed to send password reset email");
      }
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error(error.message || "Failed to initiate password reset");
    }
  };

  const handleClose = () => {
    setShowResetOption(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>Manage Login Credentials</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Name:</span>
                <span className="font-medium">{user.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Username:</span>
                <span className="font-medium">@{user.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Role:</span>
                <Badge variant="secondary">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Password Reset Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Manage User Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  For security reasons, admin users cannot directly set
                  passwords. Instead, initiate a password reset that will send
                  instructions to the user&apos;s email.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="p-4 border rounded-lg bg-blue-50">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Password Reset Process
                  </h4>
                  <p className="text-sm text-blue-700 mb-3">
                    This will send a password reset email to{" "}
                    <strong>{user.email}</strong>. The user will receive secure
                    instructions to create a new password.
                  </p>
                  <ul className="text-xs text-blue-600 space-y-1">
                    <li>• User receives email with reset link</li>
                    <li>• Link expires in 24 hours for security</li>
                    <li>• User creates new password securely</li>
                    <li>• All existing sessions are invalidated</li>
                  </ul>
                </div>

                <Button
                  onClick={handlePasswordReset}
                  disabled={resetPasswordMutation.isPending}
                  className="w-full"
                >
                  {resetPasswordMutation.isPending
                    ? "Sending Reset Email..."
                    : "Send Password Reset Email"}
                </Button>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={resetPasswordMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
