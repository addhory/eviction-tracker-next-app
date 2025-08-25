"use client";

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
import { Contractor } from "@/types";

interface DeleteContractorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  contractor: Contractor | null;
  isLoading?: boolean;
}

export function DeleteContractorModal({
  open,
  onOpenChange,
  onConfirm,
  contractor,
  isLoading = false,
}: DeleteContractorModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Contractor</AlertDialogTitle>
          <div className="space-y-2">
            <p>
              Are you sure you want to delete the contractor{" "}
              <span className="font-semibold">{contractor?.name}</span>?
            </p>
            <p className="text-sm text-amber-600">
              <strong>Warning:</strong> This action cannot be undone. This will
              permanently:
            </p>
            <ul className="text-sm text-amber-600 list-disc list-inside space-y-1">
              <li>Delete the contractor&apos;s account and profile</li>
              <li>Remove them from all assigned cases</li>
              <li>Cancel any pending job assignments</li>
            </ul>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </div>
            ) : (
              "Delete Contractor"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
