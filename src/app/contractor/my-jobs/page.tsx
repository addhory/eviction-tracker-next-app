"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  MapPin,
  Calendar,
  User,
  Building,
  FileText,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertTriangle,
  Briefcase,
} from "lucide-react";
import { useMyJobs } from "@/hooks/queries";
import { ContractorJob, ContractorJobStatus } from "@/types";
import { useAuth } from "@/components/providers/auth-provider";

export default function MyJobsPage() {
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ContractorJobStatus | "all">(
    "all"
  );

  // Fetch my jobs with filters
  const statusFilter = activeTab === "all" ? undefined : activeTab;
  const {
    data: myJobsData,
    isLoading,
    refetch,
  } = useMyJobs({
    page: 1,
    limit: 50,
    status: statusFilter,
  });

  const myJobs = myJobsData?.items || [];

  // Filter jobs by search
  const filteredJobs = myJobs?.filter((job: any) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      job.property_address.toLowerCase().includes(searchLower) ||
      job.property_city.toLowerCase().includes(searchLower) ||
      job.property_county.toLowerCase().includes(searchLower) ||
      job.client_name.toLowerCase().includes(searchLower) ||
      (job.district_court_case_number &&
        job.district_court_case_number.toLowerCase().includes(searchLower)) ||
      (job.case_number && job.case_number.toLowerCase().includes(searchLower))
    );
  });

  // Group jobs by status
  const jobsByStatus = {
    all: filteredJobs,
    ASSIGNED: filteredJobs.filter(
      (job) => job.contractor_status === "ASSIGNED"
    ),
    IN_PROGRESS: filteredJobs.filter(
      (job) => job.contractor_status === "IN_PROGRESS"
    ),
    COMPLETED: filteredJobs.filter(
      (job) => job.contractor_status === "COMPLETED"
    ),
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: ContractorJobStatus) => {
    switch (status) {
      case "ASSIGNED":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "COMPLETED":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "UNASSIGNED":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: ContractorJobStatus) => {
    switch (status) {
      case "ASSIGNED":
        return <Clock className="h-4 w-4" />;
      case "IN_PROGRESS":
        return <AlertTriangle className="h-4 w-4" />;
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Briefcase className="h-4 w-4" />;
    }
  };

  const renderJobCard = (job: ContractorJob) => (
    <Card key={job.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Case: {job.district_court_case_number || job.case_number || "TBD"}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className={getStatusColor(job.contractor_status)}
            >
              <span className="flex items-center space-x-1">
                {getStatusIcon(job.contractor_status)}
                <span>{job.contractor_status}</span>
              </span>
            </Badge>
            <Badge
              variant="outline"
              className="bg-gray-50 text-gray-700 border-gray-200"
            >
              {job.property_county} County
            </Badge>
          </div>
        </div>
        <CardDescription>
          Due Date: {formatDate(job.due_date)}
          {job.assigned_at && (
            <span className="ml-4">Claimed: {formatDate(job.assigned_at)}</span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium">{job.property_address}</div>
              <div className="text-gray-500">{job.property_city}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-400" />
            <div className="text-sm">
              <span className="font-medium">Client:</span> {job.client_name}
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
        <Link href={`/contractor/my-jobs/${job.case_id}`} className="w-full">
          <Button className="w-full">
            <ExternalLink className="mr-2 h-4 w-4" />
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
                <p className="mt-1 text-sm text-gray-500">
                  View and manage your claimed eviction posting jobs
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <Link href="/contractor/dashboard">
                  <Button variant="outline">View Available Jobs</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Search and Filters */}
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by address, county, case number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Status Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as ContractorJobStatus | "all")
            }
          >
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
              <TabsTrigger value="all" className="text-xs">
                All ({jobsByStatus.all.length})
              </TabsTrigger>
              <TabsTrigger value="ASSIGNED" className="text-xs">
                Assigned ({jobsByStatus.ASSIGNED.length})
              </TabsTrigger>
              <TabsTrigger value="IN_PROGRESS" className="text-xs">
                In Progress ({jobsByStatus.IN_PROGRESS.length})
              </TabsTrigger>
              <TabsTrigger value="COMPLETED" className="text-xs">
                Completed ({jobsByStatus.COMPLETED.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {isLoading ? (
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
              ) : filteredJobs.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {search ? "No jobs found" : "No jobs yet"}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {search
                        ? "Try adjusting your search criteria."
                        : activeTab === "all"
                        ? "You haven't claimed any jobs yet. Check the job board for available opportunities."
                        : `No jobs with status "${activeTab}".`}
                    </p>
                    {!search && activeTab === "all" && (
                      <div className="mt-6">
                        <Link href="/contractor/dashboard">
                          <Button>Browse Available Jobs</Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredJobs.map(renderJobCard)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
