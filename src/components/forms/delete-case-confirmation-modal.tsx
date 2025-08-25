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
import { Trash2 } from "lucide-react";

interface DeleteCaseConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  caseNumber: string;
  tenantName: string;
  isDeleting?: boolean;
}

export function DeleteCaseConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  caseNumber,
  tenantName,
  isDeleting = false,
}: DeleteCaseConfirmationModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-full">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold text-gray-900">
                Delete Draft Case
              </AlertDialogTitle>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Are you absolutely sure you want to delete this draft eviction case?
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <p className="text-sm">
                <strong>Case Number:</strong> {caseNumber}
              </p>
              <p className="text-sm mt-1">
                <strong>Tenant:</strong> {tenantName}
              </p>
            </div>
            <p className="mt-3 text-red-600 font-medium">
              This action cannot be undone. The draft case and all associated
              data will be permanently removed.
            </p>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Draft
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
