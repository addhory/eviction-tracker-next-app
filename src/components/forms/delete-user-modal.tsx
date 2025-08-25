"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useDeleteUser } from "@/hooks/queries/use-admin";

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
    role?: string;
  };
}

export function DeleteUserModal({
  isOpen,
  onClose,
  user,
}: DeleteUserModalProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const deleteUserMutation = useDeleteUser();

  const expectedText = `DELETE ${user.username}`;
  const isConfirmationValid = confirmationText === expectedText;

  const handleDelete = async () => {
    if (!isConfirmationValid) {
      toast.error("Please type the confirmation text exactly as shown");
      return;
    }

    try {
      // Pass both userId and userRole for additional security validation
      await deleteUserMutation.mutateAsync({
        userId: user.id,
        userRole: user.role,
      });
      toast.success(`User ${user.name} has been deleted successfully`);
      onClose();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    }
  };

  const handleClose = () => {
    setConfirmationText("");
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600">
            Delete User Account
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Are you sure you want to delete the account for{" "}
                <span className="font-semibold">{user.name}</span> (@
                {user.username})?
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm font-medium mb-2">
                  ⚠️ This action cannot be undone
                </p>
                <ul className="text-red-700 text-sm space-y-1">
                  <li>• All user data will be permanently deleted</li>
                  <li>• All properties and tenants will be removed</li>
                  <li>• All legal cases will be deleted</li>
                  <li>• Any ongoing processes will be terminated</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmation" className="text-sm font-medium">
                  Type{" "}
                  <code className="bg-gray-100 px-1 rounded text-red-600">
                    {expectedText}
                  </code>{" "}
                  to confirm:
                </Label>
                <Input
                  id="confirmation"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={expectedText}
                  className="font-mono"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!isConfirmationValid || deleteUserMutation.isPending}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {deleteUserMutation.isPending ? "Deleting..." : "Delete Account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
