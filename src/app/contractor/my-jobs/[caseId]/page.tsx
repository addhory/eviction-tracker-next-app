"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  Building,
  FileText,
  Upload,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
} from "lucide-react";
import {
  useJobDetails,
  useJobDocuments,
  useUpdateJobStatus,
  useUnclaimJob,
} from "@/hooks/queries";
import {
  DocumentUploadForm,
  DocumentList,
} from "@/components/forms/document-upload-form";
import { ContractorJobStatus } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";

export default function ContractorJobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const caseId = params?.caseId as string;

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showUnclaimDialog, setShowUnclaimDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  // Fetch job details
  const { data: jobData, isLoading, refetch } = useJobDetails(caseId);
  const job = jobData;

  // Fetch documents
  const { data: documentsData } = useJobDocuments(caseId, true);
  const documents = documentsData || [];

  // Mutations
  const updateStatusMutation = useUpdateJobStatus();
  const unclaimJobMutation = useUnclaimJob();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              Job not found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              The job you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have access to it.
            </p>
            <Button
              onClick={() => router.push("/contractor/dashboard")}
              className="mt-4"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: ContractorJobStatus) => {
    switch (status) {
      case "ASSIGNED":
        return "bg-blue-100 text-blue-700";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-700";
      case "COMPLETED":
        return "bg-purple-100 text-purple-700";
      case "UNASSIGNED":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const requiredDocuments = [
    "eviction_notice",
    "photo_of_posted_notice",
    "receipt",
    "certificate_of_mailing",
  ];

  const uploadedDocTypes = documents.map((doc) => doc.document_type);
  const allDocumentsUploaded = requiredDocuments.every((docType) =>
    uploadedDocTypes.includes(docType as any)
  );

  const handleUpdateStatus = async (newStatus: ContractorJobStatus) => {
    if (!profile?.id) return;

    try {
      const result = await updateStatusMutation.mutateAsync({
        caseId: job.case_id,
        notes: "",
        status: newStatus,
      });

      if (result) {
        toast.success(`Job status updated to ${newStatus}`);
        refetch();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status"
      );
    }
  };

  const handleUnclaimJob = async () => {
    if (!profile?.id) return;

    try {
      const result = await unclaimJobMutation.mutateAsync(caseId);

      if (result) {
        toast.success("Job unclaimed successfully");
        router.push("/contractor/dashboard");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to unclaim job"
      );
    }
  };

  const handleCompleteJob = async () => {
    if (!allDocumentsUploaded) {
      toast.error(
        "Please upload all required documents before completing the job"
      );
      return;
    }

    await handleUpdateStatus("COMPLETED");
    setShowCompleteDialog(false);
  };

  const canUpdateToInProgress = job.contractor_status === "UNASSIGNED";
  const canComplete =
    job.contractor_status === "ASSIGNED" && allDocumentsUploaded;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/contractor/dashboard")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  Job Details:{" "}
                  {job.district_court_case_number || job.case_number || "TBD"}
                </h1>
                <div className="mt-1 flex items-center space-x-4">
                  <Badge className={getStatusColor(job.contractor_status)}>
                    {job.contractor_status}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Due: {formatDate(job.due_date)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="details" className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Job Details</TabsTrigger>
              <TabsTrigger value="documents">
                Documents ({documents.length}/4)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              {/* Job Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Property Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building className="mr-2 h-5 w-5" />
                      Property Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                      <div>
                        <div className="font-medium">
                          {job.property_address}
                        </div>
                        <div className="text-sm text-gray-500">
                          {job.property_city}, {job.property_county} County
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        Tenant(s):
                      </div>
                      <div className="text-sm text-gray-900">
                        {job.tenant_names.join(", ")}
                      </div>
                    </div>

                    {job.posting_instructions && (
                      <>
                        <Separator />
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="text-sm font-medium text-amber-800 mb-2">
                            Special Posting Instructions:
                          </div>
                          <div className="text-sm text-amber-700">
                            {job.posting_instructions}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Client Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="mr-2 h-5 w-5" />
                      Client Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        Client Name:
                      </div>
                      <div className="font-medium">{job.client_name}</div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div className="text-sm">
                        <a
                          href={`mailto:${job.landlord_contact.email}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {job.landlord_contact.email}
                        </a>
                      </div>
                    </div>

                    {job.landlord_contact.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <div className="text-sm">
                          <a
                            href={`tel:${job.landlord_contact.phone}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {job.landlord_contact.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        Case Details:
                      </div>
                      <div className="text-sm space-y-1">
                        <div>
                          Case Number:{" "}
                          {job.district_court_case_number ||
                            job.case_number ||
                            "TBD"}
                        </div>
                        <div>Due Date: {formatDate(job.due_date)}</div>
                        {job.assigned_at && (
                          <div>Claimed: {formatDateTime(job.assigned_at)}</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Actions</CardTitle>
                  <CardDescription>
                    Update your job status or manage your assignment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {canUpdateToInProgress && (
                      <Button
                        onClick={() => handleUpdateStatus("IN_PROGRESS")}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Start Working
                      </Button>
                    )}

                    {canComplete && (
                      <Button
                        onClick={() => setShowCompleteDialog(true)}
                        disabled={updateStatusMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Complete Job
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={() => setShowUploadDialog(true)}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Documents
                    </Button>

                    {job.contractor_status !== "COMPLETED" && (
                      <Button
                        variant="destructive"
                        onClick={() => setShowUnclaimDialog(true)}
                        disabled={unclaimJobMutation.isPending}
                      >
                        Release Job
                      </Button>
                    )}
                  </div>

                  {!allDocumentsUploaded && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-yellow-800">
                            Documents Required
                          </div>
                          <div className="text-sm text-yellow-700">
                            You must upload all 4 required documents before you
                            can complete this job.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Uploaded Documents</CardTitle>
                      <CardDescription>
                        Upload all required documents to complete the job
                      </CardDescription>
                    </div>
                    <Button onClick={() => setShowUploadDialog(true)}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Document
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <DocumentList
                    caseId={caseId}
                    contractorId={profile?.id || ""}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Document Upload Dialog */}
      <DocumentUploadForm
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        caseId={caseId}
        contractorId={profile?.id || ""}
        onSuccess={() => refetch()}
      />

      {/* Unclaim Job Dialog */}
      <AlertDialog open={showUnclaimDialog} onOpenChange={setShowUnclaimDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Release Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to release this job? It will become
              available for other contractors to claim.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnclaimJob}
              className="bg-red-600 hover:bg-red-700"
            >
              Release Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Job Dialog */}
      <AlertDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this job as completed? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCompleteJob}
              className="bg-green-600 hover:bg-green-700"
            >
              Complete Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
