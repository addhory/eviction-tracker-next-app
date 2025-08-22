"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { AdminService } from "@/services/admin-service";
import { DocumentService } from "@/services/document-service";
import { LegalCaseService } from "@/services/legal-case-service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  FileText,
  Download,
  Calendar,
  ArrowLeft,
  Shield,
  DollarSign,
  Users,
  Building2,
  TrendingUp,
  AlertTriangle,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { LegalCase, Profile } from "@/types";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function AdminReportsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [generating, setGenerating] = useState(false);

  // Filter states
  const [dateRange, setDateRange] = useState({
    start: dayjs().subtract(1, "year").format("YYYY-MM-DD"),
    end: dayjs().format("YYYY-MM-DD"),
  });
  const [selectedCounty, setSelectedCounty] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    // Check if user is admin
    if (profile && profile.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    const loadData = async () => {
      if (!user) return;

      try {
        const legalCaseService = new LegalCaseService();
        const adminService = new AdminService();

        // Load all cases for reporting
        const { data: casesData, error: casesError } =
          await legalCaseService.getLegalCases();
        if (casesError) throw casesError;

        // Load all users
        const { data: usersData, error: usersError } =
          await adminService.getUsers(1, 1000);
        if (usersError) throw usersError;

        setCases(casesData || []);
        setUsers(usersData?.users || []);
      } catch (error) {
        setError("Failed to load report data");
        console.error("Reports page error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, profile, router]);

  const filteredCases = cases.filter((c) => {
    const caseDate = dayjs(c.date_initiated);
    const startDate = dayjs(dateRange.start);
    const endDate = dayjs(dateRange.end);

    // Date filter
    if (!caseDate.isBetween(startDate, endDate, "day", "[]")) {
      return false;
    }

    // County filter
    if (selectedCounty !== "all" && c.property?.county !== selectedCounty) {
      return false;
    }

    // Status filter
    if (selectedStatus !== "all" && c.status !== selectedStatus) {
      return false;
    }

    return true;
  });

  const generateSystemReport = async () => {
    setGenerating(true);
    try {
      const landlord = users.find((u) => u.role === "admin") || users[0];
      if (!landlord) {
        alert("No user data available for report generation");
        return;
      }

      const doc = DocumentService.generatePaymentReport(
        filteredCases,
        landlord,
        { start: dateRange.start, end: dateRange.end }
      );

      const filename = `system-report-${dayjs().format("YYYY-MM-DD")}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error("Failed to generate report:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // Calculate statistics
  const stats = {
    totalCases: filteredCases.length,
    totalRevenue: filteredCases
      .filter((c) => c.payment_status === "PAID")
      .reduce((sum, c) => sum + c.price, 0),
    pendingRevenue: filteredCases
      .filter((c) => c.payment_status === "UNPAID")
      .reduce((sum, c) => sum + c.price, 0),
    averageCaseValue:
      filteredCases.length > 0
        ? filteredCases.reduce((sum, c) => sum + c.price, 0) /
          filteredCases.length
        : 0,
  };

  // Chart data preparations
  const statusData = filteredCases.reduce((acc, c) => {
    const status = c.status.replace("_", " ");
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusChartData = Object.entries(statusData).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  const countyData = filteredCases.reduce((acc, c) => {
    const county = c.property?.county || "Unknown";
    acc[county] = (acc[county] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const countyChartData = Object.entries(countyData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([county, count]) => ({
      name: county,
      cases: count,
    }));

  // Monthly trend data
  const monthlyData = [];
  const startDate = dayjs(dateRange.start);
  const endDate = dayjs(dateRange.end);
  let currentDate = startDate.startOf("month");

  while (
    currentDate.isBefore(endDate) ||
    currentDate.isSame(endDate, "month")
  ) {
    const monthCases = filteredCases.filter((c) =>
      dayjs(c.date_initiated).isSame(currentDate, "month")
    );

    const revenue = monthCases
      .filter((c) => c.payment_status === "PAID")
      .reduce((sum, c) => sum + c.price, 0);

    monthlyData.push({
      month: currentDate.format("MMM YY"),
      cases: monthCases.length,
      revenue: revenue / 100, // Convert to dollars for display
    });

    currentDate = currentDate.add(1, "month");
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const counties = Array.from(
    new Set(cases.map((c) => c.property?.county).filter(Boolean))
  );
  const statuses = Array.from(new Set(cases.map((c) => c.status)));

  if (profile?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This page is only accessible to administrators.
            </p>
            <Button asChild className="w-full mt-4">
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">System Reports</h1>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">System Reports</h1>
            <p className="text-muted-foreground">
              Analytics and reporting for the entire system
            </p>
          </div>
        </div>
        <Button onClick={generateSystemReport} disabled={generating}>
          {generating ? (
            <>Generating...</>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </>
          )}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
          <CardDescription>
            Customize the data range and criteria for your reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>County</Label>
              <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Counties</SelectItem>
                  {counties.map((county) => (
                    <SelectItem key={county} value={county!}>
                      {county}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setDateRange({
                    start: dayjs().subtract(1, "year").format("YYYY-MM-DD"),
                    end: dayjs().format("YYYY-MM-DD"),
                  });
                  setSelectedCounty("all");
                  setSelectedStatus("all");
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCases}</div>
            <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              From completed payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.pendingRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Case Value
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.averageCaseValue)}
            </div>
            <p className="text-xs text-muted-foreground">Per case average</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Cases and revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar
                  yAxisId="left"
                  dataKey="cases"
                  fill="#8884d8"
                  name="Cases"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Revenue ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Case Status Distribution</CardTitle>
            <CardDescription>Current status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Counties */}
        <Card>
          <CardHeader>
            <CardTitle>Cases by County</CardTitle>
            <CardDescription>Top counties by case volume</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={countyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cases" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Report Summary</CardTitle>
            <CardDescription>
              Key insights from the current filter selection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Date Range
                </div>
                <div className="text-sm">
                  {dayjs(dateRange.start).format("MMM D, YYYY")} -{" "}
                  {dayjs(dateRange.end).format("MMM D, YYYY")}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Filters Applied
                </div>
                <div className="flex gap-1 flex-wrap">
                  {selectedCounty !== "all" && (
                    <Badge variant="secondary">{selectedCounty}</Badge>
                  )}
                  {selectedStatus !== "all" && (
                    <Badge variant="secondary">
                      {selectedStatus.replace("_", " ")}
                    </Badge>
                  )}
                  {selectedCounty === "all" && selectedStatus === "all" && (
                    <Badge variant="outline">No filters</Badge>
                  )}
                </div>
              </div>
            </div>

            {filteredCases.length > 0 && (
              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground mb-2">
                  Quick Stats
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    Completion Rate:{" "}
                    {(
                      (filteredCases.filter((c) => c.status === "COMPLETE")
                        .length /
                        filteredCases.length) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                  <div>
                    Payment Rate:{" "}
                    {(
                      (filteredCases.filter((c) => c.payment_status === "PAID")
                        .length /
                        filteredCases.length) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
