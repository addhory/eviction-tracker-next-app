"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Mail, Shield, ArrowRight, Home } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";

export default function DashboardPage() {
  const { profile } = useAuth();

  // Dummy data - will be replaced with real data later
  const stats = {
    totalTenants: 5,
    activeRequests: 4,
    totalProperties: 3,
    completedCases: 12,
  };

  const quickActions = [
    {
      icon: Users,
      title: "Manage Tenants",
      description: "Add, edit, or view tenant information",
      href: "/dashboard/tenants",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: FileText,
      title: "Submit New Request",
      description: "Start a new eviction case",
      href: "/dashboard/cases/new",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: Mail,
      title: "Email the Office",
      description: "Contact support or ask questions",
      href: "mailto:support@evictiontracker.com",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome, {profile?.name?.split(" ")[0] || "Landlord"}!
        </h1>
        <p className="text-gray-600">
          Here&apos;s an overview of your eviction management dashboard
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Tenants
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalTenants}
            </div>
            <Link
              href="/dashboard/tenants"
              className="text-xs text-green-600 hover:text-green-700 flex items-center mt-1"
            >
              View Details
              <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Requests
            </CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.activeRequests}
            </div>
            <Link
              href="/dashboard/cases"
              className="text-xs text-green-600 hover:text-green-700 flex items-center mt-1"
            >
              View Details
              <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Properties
            </CardTitle>
            <Home className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalProperties}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Across Maryland counties
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed Cases
            </CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.completedCases}
            </div>
            <p className="text-xs text-gray-500 mt-1">This year</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                href={action.href}
                className="group block p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-lg ${action.bgColor} group-hover:scale-110 transition-transform`}
                  >
                    <Icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-green-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Preview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h2>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-900">
                New eviction case submitted for John Doe
              </span>
            </div>
            <Badge variant="secondary">2 hours ago</Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-900">
                Payment received for case #D-02-CV-24-222222
              </span>
            </div>
            <Badge variant="secondary">1 day ago</Badge>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-900">
                Document generated for Peter Jones case
              </span>
            </div>
            <Badge variant="secondary">3 days ago</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
