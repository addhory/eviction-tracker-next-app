"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  Building,
  FileText,
  ExternalLink,
  Briefcase,
} from "lucide-react";
import { useAvailableJobs, useMyJobs, useClaimJob } from "@/hooks/queries";
import { ContractorJob } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";

export default function ContractorDashboard() {
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<ContractorJob | null>(null);
  const [showClaimDialog, setShowClaimDialog] = useState(false);

  // Fetch available jobs
  const {
    data: availableJobsData,
    isLoading: loadingAvailable,
    refetch: refetchAvailable,
  } = useAvailableJobs({ page: 1, limit: 20, search });

  // Fetch my claimed jobs
  const {
    data: myJobsData,
    isLoading: loadingMy,
    refetch: refetchMy,
  } = useMyJobs({ page: 1, limit: 5, search: "CLAIMED" });

  // Claim job mutation
  const claimJobMutation = useClaimJob();

  const availableJobs = availableJobsData?.items || [];
  const myJobs = myJobsData?.items || [];

  const handleClaimJob = async (job: ContractorJob) => {
    if (!profile?.id) return;

    try {
      const result = await claimJobMutation.mutateAsync(job.case_id);

      if (result) {
        toast.success("Job claimed successfully!");
        setShowClaimDialog(false);
        setSelectedJob(null);
        refetchAvailable();
        refetchMy();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to claim job"
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900">
                  Contractor Job Board
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Welcome, {profile?.name}. Claim jobs to post eviction notices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* My Claimed Jobs Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            My Claimed Jobs ({myJobs.length})
          </h2>

          {loadingMy ? (
            <div className="grid grid-cols-1 gap-4">
              {[...Array(2)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : myJobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No claimed jobs
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start by claiming available jobs below.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {myJobs.map((job: any) => (
                <Card key={job.id} className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {job.district_court_case_number || job.case_number}
                      </CardTitle>
                      <Badge
                        variant={
                          job.contractor_status === "CLAIMED"
                            ? "default"
                            : "secondary"
                        }
                        className="bg-green-100 text-green-700"
                      >
                        {job.contractor_status}
                      </Badge>
                    </div>
                    <CardDescription>
                      Due: {formatDate(job.due_date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="mr-2 h-4 w-4" />
                        {job.property_address}, {job.property_city}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="mr-2 h-4 w-4" />
                        For Client: {job.client_name}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Building className="mr-2 h-4 w-4" />
                        {job.property_county} County
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() =>
                        window.open(
                          `/contractor/my-jobs/${job.case_id}`,
                          "_blank"
                        )
                      }
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Available Jobs Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Available Jobs for Posting ({availableJobs.length})
            </h2>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by county, address, case number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
          </div>

          {loadingAvailable ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : availableJobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {search ? "No jobs found" : "No available jobs"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {search
                    ? "Try adjusting your search criteria."
                    : "Check back later for new posting opportunities."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableJobs.map((job: any) => (
                <Card
                  key={job.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Case:{" "}
                        {job.district_court_case_number ||
                          job.case_number ||
                          "TBD"}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {job.property_county} County
                      </Badge>
                    </div>
                    <CardDescription>
                      Due Date: {formatDate(job.due_date)}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium">
                            {job.property_address}
                          </div>
                          <div className="text-gray-500">
                            {job.property_city}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div className="text-sm">
                          <span className="font-medium">Client:</span>{" "}
                          {job.client_name}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <div className="text-sm">
                          <span className="font-medium">Tenant(s):</span>{" "}
                          {job.tenant_names.join(", ")}
                        </div>
                      </div>

                      {job.posting_instructions && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <div className="text-xs font-medium text-amber-800 mb-1">
                            Special Instructions:
                          </div>
                          <div className="text-xs text-amber-700">
                            {job.posting_instructions}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => {
                        setSelectedJob(job);
                        setShowClaimDialog(true);
                      }}
                      disabled={claimJobMutation.isPending}
                    >
                      {claimJobMutation.isPending ? "Claiming..." : "Claim Job"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Claim Job Confirmation Dialog */}
      <AlertDialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Claim Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to claim this eviction posting job?
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedJob && (
            <div className="my-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Case:</strong>{" "}
                  {selectedJob.district_court_case_number ||
                    selectedJob.case_number}
                </div>
                <div>
                  <strong>Property:</strong> {selectedJob.property_address},{" "}
                  {selectedJob.property_city}
                </div>
                <div>
                  <strong>County:</strong> {selectedJob.property_county}
                </div>
                <div>
                  <strong>Due Date:</strong> {formatDate(selectedJob.due_date)}
                </div>
                <div>
                  <strong>Client:</strong> {selectedJob.client_name}
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedJob && handleClaimJob(selectedJob)}
              disabled={claimJobMutation.isPending}
            >
              {claimJobMutation.isPending ? "Claiming..." : "Claim Job"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
