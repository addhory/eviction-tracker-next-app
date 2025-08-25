"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  Search,
  Edit,
  Trash2,
  Download,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { useLawFirms } from "@/hooks/queries/use-law-firms";
import { LawFirmForm } from "@/components/forms/law-firm-form";
import { DeleteLawFirmModal } from "@/components/forms/delete-law-firm-modal";
import { useDebounce } from "@/hooks/use-mobile";

export default function AdminLawFirmsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const limit = 10;

  const filters = {
    search: debouncedSearch,
    page,
    limit,
  };

  const { data, isLoading, error } = useLawFirms(filters);

  const lawFirms = data?.lawFirms || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / limit);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  // Mock referral data - in real implementation this would come from analytics
  const mockReferralData = [
    {
      lawFirmName: "Smith & Jones Law",
      referralCode: "SJLAW5",
      paidReferrals: 4,
      referralFeeOwed: 20.0,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Law Firm Referral Analytics
            </h1>
            <p className="text-gray-600">
              Manage law firm partnerships and track referral performance
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
              Law Firm Referral Analytics
            </h1>
            <p className="text-gray-600">
              Manage law firm partnerships and track referral performance
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-red-600">Error loading law firms data</p>
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
            Law Firm Referral Analytics
          </h1>
          <p className="text-gray-600">
            Manage law firm partnerships and track referral performance
          </p>
        </div>
      </div>

      {/* Monthly Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>August 2025</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Spreadsheet
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>LAW FIRM</TableHead>
                  <TableHead>PAID REFERRALS</TableHead>
                  <TableHead>REFERRAL FEE OWED</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockReferralData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-8 text-gray-500"
                    >
                      No referral data for this month
                    </TableCell>
                  </TableRow>
                ) : (
                  mockReferralData.map((referral, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="font-medium">
                          {referral.lawFirmName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center font-semibold">
                          {referral.paidReferrals}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center font-semibold">
                          ${referral.referralFeeOwed.toFixed(2)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Law Firms Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Manage Law Firms & Referrals</CardTitle>
            <LawFirmForm />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by firm name, city, or contact person..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>LAW FIRM NAME</TableHead>
                  <TableHead>REFERRAL CODE</TableHead>
                  <TableHead>ALL-TIME REFERRALS</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lawFirms.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-gray-500"
                    >
                      {searchTerm
                        ? "No law firms found matching your search"
                        : "No law firms registered"}
                    </TableCell>
                  </TableRow>
                ) : (
                  lawFirms.map((firm) => (
                    <TableRow key={firm.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">
                            {firm.name}
                          </div>
                          {firm.contact_person && (
                            <div className="text-sm text-gray-600">
                              Contact: {firm.contact_person}
                            </div>
                          )}
                          <div className="flex items-center space-x-3 text-sm text-gray-500">
                            {firm.city && firm.state && (
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {firm.city}, {firm.state}
                              </div>
                            )}
                            {firm.phone && (
                              <div className="flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {firm.phone}
                              </div>
                            )}
                            {firm.email && (
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {firm.email}
                              </div>
                            )}
                            {firm.website && (
                              <div className="flex items-center">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                <a
                                  href={firm.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  Website
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded inline-block">
                          {/* TODO: Implement actual referral code generation and storage */}
                          {firm.name.toUpperCase().replace(/[^A-Z]/g, "").substring(0, 5)}
                          {Math.floor(Math.random() * 999) + 1}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {/* TODO: Implement actual referral counting */}
                            {Math.floor(Math.random() * 10)}
                          </div>
                          <div className="text-xs text-gray-500">referrals</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <LawFirmForm
                            mode="edit"
                            initialData={firm}
                            trigger={
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DeleteLawFirmModal
                            lawFirm={firm}
                            trigger={
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                          />
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
