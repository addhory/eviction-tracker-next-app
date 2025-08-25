"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Search,
  Filter,
  Calendar,
  DollarSign,
  MoreVertical,
  Eye,
  Download,
  Edit,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// Extended query for admin to see all cases
const adminCasesService = {
  async getAllCases(filters?: {
    status?: string;
    landlord?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const supabase = createClient();
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const offset = (page - 1) * limit;

    let query = supabase.from("legal_cases").select(
      `
        *,
        property:properties(*),
        contractor:profiles!legal_cases_contractor_id_fkey(id, name, email, username),
        tenant:tenants(*),
        landlord:profiles!legal_cases_landlord_id_fkey(id, name, email, username)
      `,
      { count: "exact" }
    );

    // Apply filters
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.landlord) {
      query = query.eq("landlord_id", filters.landlord);
    }

    if (filters?.search) {
      query = query.or(
        `court_case_number.ilike.%${filters.search}%,property.address.ilike.%${filters.search}%`
      );
    }

    // Apply pagination and ordering
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      cases: data || [],
      totalCount: count || 0,
    };
  },
};

const statusColors = {
  NOTICE_DRAFT: "bg-yellow-100 text-yellow-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETE: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

const caseTypeLabels = {
  FTPR: "Failure to Pay Rent",
  HOLDOVER: "Holdover",
  OTHER: "Other",
};

export default function AdminCasesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedLandlord, setSelectedLandlord] = useState<string>("");
  const [page, setPage] = useState(1);

  const limit = 10;

  const filters = {
    status: selectedStatus,
    landlord: selectedLandlord,
    search: searchTerm,
    page,
    limit,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "cases", filters],
    queryFn: () => adminCasesService.getAllCases(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const cases = data?.cases || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / limit);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    setPage(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              All Client Submissions
            </h1>
            <p className="text-gray-600">
              View and manage all eviction cases across the platform
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              All Client Submissions
            </h1>
            <p className="text-gray-600">
              View and manage all eviction cases across the platform
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-red-600">Error loading cases data</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            All Client Submissions
          </h1>
          <p className="text-gray-600">
            View and manage all eviction cases across the platform
          </p>
        </div>
      </div>

      {/* Bulk Download Section */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Download Final Eviction Date Notices</CardTitle>
          <p className="text-sm text-gray-600">
            Select a date range to download notices for all paid cases initiated
            within that period. Each notice will be on a new page in a single
            PDF.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <Input type="date" placeholder="Start Date" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <Input type="date" placeholder="End Date" />
            </div>
            <Button className="whitespace-nowrap">Download for Range</Button>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Submissions</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {totalCount} Total Cases
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by case number, property address..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  {selectedStatus
                    ? selectedStatus.replace("_", " ")
                    : "All Statuses"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleStatusFilter("")}>
                  All Statuses
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusFilter("NOTICE_DRAFT")}
                >
                  Notice Draft
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusFilter("SUBMITTED")}
                >
                  Submitted
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusFilter("IN_PROGRESS")}
                >
                  In Progress
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusFilter("COMPLETE")}
                >
                  Complete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CASE NO.</TableHead>
                  <TableHead>CLIENT</TableHead>
                  <TableHead>PROPERTY</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>CONTRACTOR</TableHead>
                  <TableHead>INITIATED</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-gray-500"
                    >
                      No cases found
                    </TableCell>
                  </TableRow>
                ) : (
                  cases.map((case_) => (
                    <TableRow key={case_.id}>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {case_.court_case_number ||
                            `D-${case_.case_type}-${new Date(case_.created_at)
                              .getFullYear()
                              .toString()
                              .slice(-2)}-${case_.id.slice(-6)}`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {case_.landlord?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{case_.landlord?.username}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {case_.property?.address}
                          </div>
                          <div className="text-sm text-gray-500">
                            {case_.property?.city}, {case_.property?.state}{" "}
                            {case_.property?.zip_code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            statusColors[
                              case_.status as keyof typeof statusColors
                            ]
                          }
                        >
                          {case_.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-500 italic">
                          {case_.contractor?.name || "Unassigned"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(case_.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(page - 1) * limit + 1} to{" "}
                {Math.min(page * limit, totalCount)} of {totalCount} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
