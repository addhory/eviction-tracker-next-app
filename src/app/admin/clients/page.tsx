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
  Users,
  Search,
  Plus,
  MoreVertical,
  Eye,
  Settings,
  Key,
  Trash2,
  Filter,
} from "lucide-react";
import { useUsers } from "@/hooks/queries/use-admin";
import { AddLandlordModal } from "@/components/forms/add-landlord-modal";
import { DeleteUserModal } from "@/components/forms/delete-user-modal";
import { ManagePricingModal } from "@/components/forms/manage-pricing-modal";
import { ChangePasswordModal } from "@/components/forms/change-password-modal";

export default function ClientManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [page, setPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const limit = 10;

  // Filter to show only landlords by default, but allow admin to see all
  const filters = {
    role: selectedRole || "landlord",
    search: searchTerm,
    page,
    limit,
  };

  const { data, isLoading, error } = useUsers(filters);
  const users = data?.users || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / limit);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset to first page when searching
  };

  const handleRoleFilter = (role: string) => {
    setSelectedRole(role);
    setPage(1); // Reset to first page when filtering
  };

  const handleViewCases = (user: any) => {
    // Navigate to cases view for this user
    window.open(`/admin/cases?landlord=${user.id}`, "_blank");
  };

  const handleManagePricing = (user: any) => {
    setSelectedUser(user);
    setPricingModalOpen(true);
  };

  const handleChangePassword = (user: any) => {
    setSelectedUser(user);
    setPasswordModalOpen(true);
  };

  const handleDelete = (user: any) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Client Management
            </h1>
            <p className="text-gray-600">
              Manage landlord accounts and pricing
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
              Client Management
            </h1>
            <p className="text-gray-600">
              Manage landlord accounts and pricing
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-red-600">Error loading clients data</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Client Management
            </h1>
            <p className="text-gray-600">
              Manage landlord accounts and pricing
            </p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Client
          </Button>
        </div>

        {/* Client Management Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <span>Manage Client Accounts</span>
              </CardTitle>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                {totalCount} Total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or username..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    {selectedRole
                      ? selectedRole.charAt(0).toUpperCase() +
                        selectedRole.slice(1)
                      : "All Roles"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleRoleFilter("")}>
                    All Roles
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleRoleFilter("landlord")}
                  >
                    Landlords
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleRoleFilter("contractor")}
                  >
                    Contractors
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRoleFilter("admin")}>
                    Admins
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CLIENT</TableHead>
                    <TableHead>CONTACT INFO</TableHead>
                    <TableHead>CASES</TableHead>
                    <TableHead>PROPERTIES</TableHead>
                    <TableHead>ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-gray-500"
                      >
                        No clients found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{user.username}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm text-gray-900">
                              {user.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              Member since{" "}
                              {new Date(user.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-900">
                              -
                            </div>
                            <div className="text-xs text-gray-500">Cases</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-900">
                              -
                            </div>
                            <div className="text-xs text-gray-500">
                              Properties
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewCases(user)}
                              className="text-green-600 hover:text-green-700"
                            >
                              View Cases
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleManagePricing(user)}
                                >
                                  <Settings className="mr-2 h-4 w-4" />
                                  Manage Pricing
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleChangePassword(user)}
                                >
                                  <Key className="mr-2 h-4 w-4" />
                                  Manage Login
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(user)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

      {/* Modals */}
      <AddLandlordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {selectedUser && (
        <>
          <DeleteUserModal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
          />

          <ManagePricingModal
            isOpen={pricingModalOpen}
            onClose={() => {
              setPricingModalOpen(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
          />

          <ChangePasswordModal
            isOpen={passwordModalOpen}
            onClose={() => {
              setPasswordModalOpen(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
          />
        </>
      )}
    </>
  );
}
