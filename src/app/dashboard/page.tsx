/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProperties, useTenants, useLegalCases } from "@/hooks/queries";
import {
  Building2,
  Users,
  FileText,
  DollarSign,
  AlertCircle,
  Plus,
  Eye,
} from "lucide-react";
import { DashboardStats } from "@/types";
import dayjs from "dayjs";

export default function DashboardPage() {
  const { user, profile } = useAuth();

  // Use TanStack Query hooks
  const { data: properties = [], isLoading: propertiesLoading } = useProperties(
    profile?.role === "admin" || profile?.role === "landlord"
      ? user?.id
      : undefined
  );
  const { data: tenants = [], isLoading: tenantsLoading } = useTenants(
    profile?.role === "admin" || profile?.role === "landlord"
      ? user?.id
      : undefined
  );
  const { data: cases = [], isLoading: casesLoading } = useLegalCases(user?.id);

  // Calculate stats using useMemo for performance
  const stats = useMemo(() => {
    if (!cases) return null;

    const activeCases = cases.filter((c: any) =>
      ["SUBMITTED", "IN_PROGRESS"].includes(c.status)
    );
    const completedCases = cases.filter((c: any) => c.status === "COMPLETE");
    const unpaidCases = cases.filter((c: any) => c.payment_status === "UNPAID");
    const totalRevenue = cases
      .filter((c: any) => c.payment_status === "PAID")
      .reduce((sum: number, c: any) => sum + (c.price || 0), 0);

    return {
      totalProperties: properties.length,
      totalTenants: tenants.length,
      activeCases: activeCases.length,
      completedCases: completedCases.length,
      unpaidCases: unpaidCases.length,
      totalRevenue,
    };
  }, [properties, tenants, cases]);

  const recentCases = useMemo(() => {
    return cases.slice(0, 5);
  }, [cases]);

  const loading = propertiesLoading || tenantsLoading || casesLoading;

  const getStatusColor = (status: string) => {
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

  const getPaymentStatusColor = (status: string) => {
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {profile?.name || "User"}!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your eviction cases today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {(profile?.role === "admin" || profile?.role === "landlord") && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Properties
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.totalProperties || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Properties under management
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Tenants
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.totalTenants || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active tenant relationships
                </p>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeCases || 0}</div>
            <p className="text-xs text-muted-foreground">Cases in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Cases</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.unpaidCases || 0}</div>
            <p className="text-xs text-muted-foreground">Requiring payment</p>
          </CardContent>
        </Card>

        {(profile?.role === "admin" || profile?.role === "landlord") && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(stats?.totalRevenue || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                From completed cases
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get started quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(profile?.role === "admin" || profile?.role === "landlord") && (
              <>
                <Button asChild className="h-auto p-4 flex-col items-start">
                  <Link href="/dashboard/properties/new">
                    <Plus className="h-6 w-6 mb-2" />
                    <span className="font-medium">Add Property</span>
                    <span className="text-sm text-muted-foreground">
                      Register a new rental property
                    </span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-auto p-4 flex-col items-start"
                >
                  <Link href="/dashboard/tenants/new">
                    <Users className="h-6 w-6 mb-2" />
                    <span className="font-medium">Add Tenant</span>
                    <span className="text-sm text-muted-foreground">
                      Register new tenant information
                    </span>
                  </Link>
                </Button>
              </>
            )}

            <Button
              asChild
              variant="outline"
              className="h-auto p-4 flex-col items-start"
            >
              <Link href="/dashboard/cases/new">
                <FileText className="h-6 w-6 mb-2" />
                <span className="font-medium">Start Eviction Case</span>
                <span className="text-sm text-muted-foreground">
                  Begin a new FTPR case
                </span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Cases */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Cases</CardTitle>
            <CardDescription>Your most recent eviction cases</CardDescription>
          </div>
          <Button asChild variant="ghost">
            <Link href="/dashboard/cases">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentCases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No cases yet</p>
              <p className="text-sm">
                Start your first eviction case to see it here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentCases.map((case_: any) => (
                <div
                  key={case_.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">
                        {case_.property?.address}
                        {case_.property?.unit &&
                          ` - Unit ${case_.property.unit}`}
                      </p>
                      <Badge
                        variant="secondary"
                        className={getStatusColor(case_.status)}
                      >
                        {case_.status.replace("_", " ")}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={getPaymentStatusColor(case_.payment_status)}
                      >
                        {case_.payment_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Tenant: {case_.tenant?.tenant_names?.join(", ")} • Filed:{" "}
                      {dayjs(case_.date_initiated).format("MMM D, YYYY")} •
                      Amount: ${case_.price.toLocaleString()}
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/cases/${case_.id}`}>View</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
