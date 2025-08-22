"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { useLegalCases, useDeleteLegalCase } from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash,
  Eye,
  Filter,
  DollarSign,
} from "lucide-react";
import { LegalCase, CaseStatus, PaymentStatus } from "@/types";
import dayjs from "dayjs";

export default function LegalCasesPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  // Use TanStack Query hooks
  const { data: legalCases = [], isLoading } = useLegalCases(user?.id);
  const deleteLegalCaseMutation = useDeleteLegalCase();

  // Filter cases based on search and filter criteria
  const filteredCases = useMemo(() => {
    let filtered = legalCases.filter((legalCase: LegalCase) => {
      const matchesSearch =
        legalCase.property?.address
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        legalCase.tenant?.tenant_names.some((name: string) =>
          name.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        (legalCase.court_case_number &&
          legalCase.court_case_number
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" || legalCase.status === statusFilter;

      const matchesPayment =
        paymentFilter === "all" || legalCase.payment_status === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });

    // Sort by creation date (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return filtered;
  }, [legalCases, searchTerm, statusFilter, paymentFilter]);

  const handleDeleteCase = async (caseId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this legal case? This action cannot be undone."
      )
    ) {
      return;
    }

    deleteLegalCaseMutation.mutate(caseId);
  };

  const getStatusColor = (status: CaseStatus) => {
    switch (status) {
      case "NOTICE_DRAFT":
        return "bg-gray-100 text-gray-800";
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETE":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "PARTIAL":
        return "bg-yellow-100 text-yellow-800";
      case "UNPAID":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Legal Cases</h1>
          <p className="text-muted-foreground">
            Manage your eviction and legal cases
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/cases/new">
            <Plus className="mr-2 h-4 w-4" />
            New Case
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cases Overview</CardTitle>
          <CardDescription>
            Track and manage all your legal cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by property, tenant, or case number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="NOTICE_DRAFT">Notice Draft</SelectItem>
                    <SelectItem value="SUBMITTED">Submitted</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETE">Complete</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-40">
                    <DollarSign className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="PARTIAL">Partial</SelectItem>
                    <SelectItem value="UNPAID">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {filteredCases.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || statusFilter !== "all" || paymentFilter !== "all"
                  ? "No cases found"
                  : "No legal cases yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || paymentFilter !== "all"
                  ? "Try adjusting your search criteria"
                  : "Create your first legal case to get started"}
              </p>
              {!searchTerm &&
                statusFilter === "all" &&
                paymentFilter === "all" && (
                  <Button asChild>
                    <Link href="/dashboard/cases/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Legal Case
                    </Link>
                  </Button>
                )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case Info</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Amount Owed</TableHead>
                    <TableHead>Date Filed</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.map((legalCase) => (
                    <TableRow key={legalCase.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {legalCase.case_type === "FTPR"
                              ? "Failure to Pay Rent"
                              : legalCase.case_type}
                          </div>
                          {legalCase.court_case_number && (
                            <div className="text-sm text-muted-foreground">
                              Case #{legalCase.court_case_number}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {legalCase.property?.address}
                          </div>
                          {legalCase.property?.unit && (
                            <div className="text-sm text-muted-foreground">
                              Unit {legalCase.property.unit}
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground">
                            {legalCase.property?.county} County
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {legalCase.tenant?.tenant_names.join(", ")}
                          </div>
                          {legalCase.tenant?.email && (
                            <div className="text-sm text-muted-foreground">
                              {legalCase.tenant.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getStatusColor(legalCase.status)}
                        >
                          {legalCase.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getPaymentStatusColor(
                            legalCase.payment_status
                          )}
                        >
                          {legalCase.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            {formatCurrency(legalCase.current_rent_owed)}
                          </div>
                          <div className="text-muted-foreground">
                            Fee: {formatCurrency(legalCase.price)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {dayjs(legalCase.date_initiated).format(
                            "MMM D, YYYY"
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/cases/${legalCase.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/cases/${legalCase.id}/edit`}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteCase(legalCase.id)}
                              className="text-red-600"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
