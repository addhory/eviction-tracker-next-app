"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  FileText,
  FileCheck,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { CaseStatus } from "@/types";

interface CaseStatusWorkflowProps {
  currentStatus: CaseStatus;
  onStatusChange: (newStatus: CaseStatus, notes?: string) => Promise<void>;
  disabled?: boolean;
}

interface WorkflowStep {
  status: CaseStatus;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  actions?: string[];
}

const workflowSteps: WorkflowStep[] = [
  {
    status: "NOTICE_DRAFT",
    title: "Notice Draft",
    description: "Case created, preparing notice documents",
    icon: FileText,
    color: "bg-gray-100 text-gray-800",
    actions: ["Submit to court", "Cancel case"],
  },
  {
    status: "SUBMITTED",
    title: "Submitted",
    description: "Case submitted to court, awaiting processing",
    icon: FileCheck,
    color: "bg-blue-100 text-blue-800",
    actions: ["Mark in progress", "Cancel case"],
  },
  {
    status: "IN_PROGRESS",
    title: "In Progress",
    description: "Court proceedings in progress",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800",
    actions: ["Mark complete", "Cancel case"],
  },
  {
    status: "COMPLETE",
    title: "Complete",
    description: "Case resolved and closed",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800",
    actions: [],
  },
  {
    status: "CANCELLED",
    title: "Cancelled",
    description: "Case cancelled or dismissed",
    icon: XCircle,
    color: "bg-red-100 text-red-800",
    actions: [],
  },
];

export function CaseStatusWorkflow({
  currentStatus,
  onStatusChange,
  disabled = false,
}: CaseStatusWorkflowProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus | null>(null);
  const [notes, setNotes] = useState("");

  const currentStepIndex = workflowSteps.findIndex(
    (step) => step.status === currentStatus
  );
  const currentStep = workflowSteps[currentStepIndex];

  const getNextPossibleStatuses = (): CaseStatus[] => {
    switch (currentStatus) {
      case "NOTICE_DRAFT":
        return ["SUBMITTED", "CANCELLED"];
      case "SUBMITTED":
        return ["IN_PROGRESS", "CANCELLED"];
      case "IN_PROGRESS":
        return ["COMPLETE", "CANCELLED"];
      case "COMPLETE":
        return [];
      case "CANCELLED":
        return [];
      default:
        return [];
    }
  };

  const handleStatusUpdate = async (newStatus: CaseStatus) => {
    setIsUpdating(true);
    try {
      await onStatusChange(newStatus, notes);
      setSelectedStatus(null);
      setNotes("");
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusUpdateMessage = (newStatus: CaseStatus): string => {
    switch (newStatus) {
      case "SUBMITTED":
        return "Submit this case to the court system. This will change the status to 'Submitted' and the case will be queued for court processing.";
      case "IN_PROGRESS":
        return "Mark this case as in progress. Use this when court proceedings have begun.";
      case "COMPLETE":
        return "Mark this case as complete. This should be used when the case has been fully resolved.";
      case "CANCELLED":
        return "Cancel this case. This action should be used if the case is being withdrawn or dismissed.";
      default:
        return "Update the case status.";
    }
  };

  const nextStatuses = getNextPossibleStatuses();

  return (
    <div className="space-y-6">
      {/* Current Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Case Workflow Status
          </CardTitle>
          <CardDescription>
            Track the progress of this legal case through the court system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${currentStep?.color}`}>
                {currentStep?.icon && <currentStep.icon className="h-4 w-4" />}
              </div>
              <div>
                <p className="font-medium">{currentStep?.title}</p>
                <p className="text-sm text-muted-foreground">
                  {currentStep?.description}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className={currentStep?.color}>
              {currentStatus.replace("_", " ")}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {workflowSteps.slice(0, 4).map((step, index) => {
              const isCompleted = currentStepIndex > index;
              const isCurrent = currentStepIndex === index;
              const isUpcoming = currentStepIndex < index;

              return (
                <div key={step.status} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`p-3 rounded-full border-2 ${
                        isCompleted
                          ? "bg-green-100 border-green-600 text-green-600"
                          : isCurrent
                          ? "bg-blue-100 border-blue-600 text-blue-600"
                          : "bg-gray-100 border-gray-300 text-gray-400"
                      }`}
                    >
                      <step.icon className="h-4 w-4" />
                    </div>
                    <p
                      className={`text-xs mt-2 text-center max-w-20 ${
                        isCurrent ? "font-medium" : ""
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                  {index < 3 && (
                    <ArrowRight
                      className={`h-4 w-4 mx-4 ${
                        isCompleted ? "text-green-600" : "text-gray-300"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Status Actions */}
      {nextStatuses.length > 0 && !disabled && (
        <Card>
          <CardHeader>
            <CardTitle>Available Actions</CardTitle>
            <CardDescription>
              Choose the next step for this case
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nextStatuses.map((status) => {
                const step = workflowSteps.find((s) => s.status === status);
                if (!step) return null;

                return (
                  <Dialog key={status}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start h-auto p-4"
                        onClick={() => setSelectedStatus(status)}
                      >
                        <div className="flex items-center gap-3">
                          <step.icon className="h-4 w-4" />
                          <div className="text-left">
                            <p className="font-medium">Move to {step.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <step.icon className="h-5 w-5" />
                          Confirm Status Change
                        </DialogTitle>
                        <DialogDescription>
                          {getStatusUpdateMessage(status)}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <span className="font-medium">Status Change</span>
                          </div>
                          <p className="text-sm">
                            {currentStep?.title} → {step.title}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes">Notes (optional)</Label>
                          <Textarea
                            id="notes"
                            placeholder="Add any notes about this status change..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                          />
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedStatus(null);
                              setNotes("");
                            }}
                            disabled={isUpdating}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleStatusUpdate(status)}
                            disabled={isUpdating}
                          >
                            {isUpdating ? "Updating..." : "Confirm"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {currentStatus === "COMPLETE" && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="font-medium text-green-600">Case Complete</p>
              <p className="text-sm text-muted-foreground">
                This case has been resolved and closed.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStatus === "CANCELLED" && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="font-medium text-red-600">Case Cancelled</p>
              <p className="text-sm text-muted-foreground">
                This case has been cancelled or dismissed.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
