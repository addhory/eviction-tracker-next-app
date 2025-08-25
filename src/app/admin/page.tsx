"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileText,
  Mail,
  Shield,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useAdminStats } from "@/hooks/queries/use-admin";

export default function AdminDashboardPage() {
  const { data: stats, isLoading, error } = useAdminStats();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error loading dashboard data</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome, Admin User. Overview of the platform:
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              TOTAL CLIENTS
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalLandlords || 0}
            </div>
            <div className="flex items-center justify-between mt-2">
              <Link
                href="/admin/clients"
                className="text-sm text-green-600 hover:text-green-700 flex items-center"
              >
                Manage →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              TOTAL SUBMISSIONS
            </CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCases || 0}</div>
            <div className="flex items-center justify-between mt-2">
              <Link
                href="/admin/cases"
                className="text-sm text-green-600 hover:text-green-700 flex items-center"
              >
                Manage →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              OPEN REQUESTS
            </CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeCases || 0}</div>
            <div className="flex items-center justify-between mt-2">
              <Link
                href="/admin/cases?status=active"
                className="text-sm text-green-600 hover:text-green-700 flex items-center"
              >
                Manage →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              TOTAL REVENUE
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats?.totalRevenue || 0).toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-2">
              <Link
                href="/admin/reports"
                className="text-sm text-green-600 hover:text-green-700 flex items-center"
              >
                View Reports →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Quick Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/admin/clients"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <span className="font-medium text-gray-900">
                  Manage Clients
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>

            <Link
              href="/admin/cases"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                <span className="font-medium text-gray-900">
                  View All Submissions
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-gray-700">All systems operational.</span>
            </div>
            {stats?.recentActivity && stats.recentActivity.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Recent Activity:
                </p>
                <div className="space-y-2">
                  {stats.recentActivity.slice(0, 3).map((activity, index) => (
                    <div
                      key={index}
                      className="text-sm text-gray-600 border-l-2 border-green-200 pl-3"
                    >
                      {activity.description}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
