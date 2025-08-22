"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Users, FileText, Shield } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && profile) {
      // Redirect authenticated users to their appropriate dashboard
      if (profile.role === "admin") {
        router.push("/admin");
      } else if (profile.role === "contractor") {
        router.push("/contractor");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user && profile) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">
                Eviction Tracker
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Maryland Eviction
            <span className="text-blue-600"> Management</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your legal eviction process from property management to
            document generation and case tracking. Built specifically for
            Maryland&apos;s rental market.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/signup">Start Free Trial</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6"
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Property Management</CardTitle>
              <CardDescription>
                Track properties across all 24 Maryland counties with detailed
                tenant information
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <FileText className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Legal Case Management</CardTitle>
              <CardDescription>
                Handle &quot;Failure to Pay Rent&quot; (FTPR) eviction cases
                with complete workflow management
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Document Generation</CardTitle>
              <CardDescription>
                Create Maryland-compliant legal documents and forms
                automatically
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Multi-Role System</CardTitle>
              <CardDescription>
                Support for landlords, administrators, and contractors with
                role-based access
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Building2 className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <CardTitle>Payment Processing</CardTitle>
              <CardDescription>
                Integrated Stripe payments with county-specific pricing
                structures
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <FileText className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <CardTitle>Admin Dashboard</CardTitle>
              <CardDescription>
                Comprehensive oversight and reporting tools for complete case
                management
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to streamline your eviction process?
          </h2>
          <p className="text-gray-600 mb-6">
            Join hundreds of Maryland landlords who trust Eviction Tracker for
            their legal case management.
          </p>
          <Button asChild size="lg" className="text-lg px-8 py-6">
            <Link href="/signup">Get Started Today</Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Building2 className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">
                Eviction Tracker
              </span>
            </div>
            <p className="text-gray-600 text-sm">
              © 2024 Eviction Tracker. Built for Maryland landlords and property
              managers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
