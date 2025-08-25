"use client";

import React from "react";
import { useDeleteLawFirm } from "@/hooks/queries/use-law-firms";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Trash2 } from "lucide-react";
import { LawFirm } from "@/services/law-firm-service";

interface DeleteLawFirmModalProps {
  lawFirm: LawFirm;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function DeleteLawFirmModal({
  lawFirm,
  onSuccess,
  trigger,
}: DeleteLawFirmModalProps) {
  const [open, setOpen] = React.useState(false);
  const deleteMutation = useDeleteLawFirm();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(lawFirm.id);
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the mutation
      console.error("Delete law firm error:", error);
    }
  };

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className="text-red-600 hover:text-red-700"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger || defaultTrigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Law Firm</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete <strong>{lawFirm.name}</strong>?
            </p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. This will permanently remove the law
              firm from your system and may affect any associated referral
              tracking.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {deleteMutation.error && (
          <Alert variant="destructive">
            <AlertDescription>
              {deleteMutation.error.message || "Failed to delete law firm"}
            </AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {deleteMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Delete Law Firm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
