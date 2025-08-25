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
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Download,
} from "lucide-react";
import {
  useContractors,
  useCreateContractor,
  useUpdateContractor,
  useDeleteContractor,
} from "@/hooks/queries/use-contractors";
import { ContractorForm } from "@/components/forms/contractor-form";
import { DeleteContractorModal } from "@/components/forms/delete-contractor-modal";
import { Contractor, ContractorFormData, ContractorUpdateData } from "@/types";
import { toast } from "sonner";

export default function AdminContractorsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedContractor, setSelectedContractor] =
    useState<Contractor | null>(null);

  const limit = 10;

  const filters = {
    page,
    limit,
    search: searchTerm || undefined,
  };

  const { data, isLoading, error } = useContractors(filters);
  const contractors = data?.contractors || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Mutations
  const createMutation = useCreateContractor();
  const updateMutation = useUpdateContractor();
  const deleteMutation = useDeleteContractor();

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleCreateContractor = async (contractorData: ContractorFormData) => {
    try {
      await createMutation.mutateAsync(contractorData);
      setShowCreateForm(false);
      toast.success("Contractor created successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create contractor"
      );
    }
  };

  const handleEditContractor = async (contractorData: ContractorFormData) => {
    if (!selectedContractor) return;

    try {
      const updateData: ContractorUpdateData = {
        name: contractorData.name,
        username: contractorData.username,
        email: contractorData.email,
        phone: contractorData.phone,
      };

      await updateMutation.mutateAsync({
        id: selectedContractor.id,
        data: updateData,
      });

      setShowEditForm(false);
      setSelectedContractor(null);
      toast.success("Contractor updated successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update contractor"
      );
    }
  };

  const handleDeleteContractor = async () => {
    if (!selectedContractor) return;

    try {
      await deleteMutation.mutateAsync(selectedContractor.id);
      setShowDeleteModal(false);
      setSelectedContractor(null);
      toast.success("Contractor deleted successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete contractor"
      );
    }
  };

  const openEditForm = (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setShowEditForm(true);
  };

  const openDeleteModal = (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setShowDeleteModal(true);
  };

  // Mock data for contractor completions (TODO: Replace with real data)
  const getContractorCompletions = (_contractorId: string) => {
    return Math.floor(Math.random() * 10) + 1;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Contractor Management
            </h1>
            <p className="text-gray-600">
              Manage contractor accounts and view performance analytics
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
              Contractor Management
            </h1>
            <p className="text-gray-600">
              Manage contractor accounts and view performance analytics
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-red-600">Error loading contractors data</p>
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
            Contractor Management
          </h1>
          <p className="text-gray-600">
            Manage contractor accounts and view performance analytics
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Contractor
        </Button>
      </div>

      {/* Contractor Management Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Manage Contractor Accounts</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {totalCount} Total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Controls */}
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
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CONTRACTOR</TableHead>
                  <TableHead>CONTACT INFO</TableHead>
                  <TableHead>TOTAL COMPLETIONS</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contractors.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-gray-500"
                    >
                      No contractors found
                    </TableCell>
                  </TableRow>
                ) : (
                  contractors.map((contractor) => (
                    <TableRow key={contractor.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            {contractor.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{contractor.username}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm text-gray-900">
                            {contractor.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            Member since{" "}
                            {new Date(
                              contractor.created_at
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {getContractorCompletions(contractor.id)}
                          </div>
                          <div className="text-xs text-gray-500">Completed</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openEditForm(contractor)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => openDeleteModal(contractor)}
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

      {/* Monthly Performance Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Monthly Performance Analytics</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">August 2025</h3>
              <span className="text-sm text-gray-600">
                Total:{" "}
                {contractors.reduce(
                  (sum, _) => sum + getContractorCompletions(_.id),
                  0
                )}{" "}
                completions
              </span>
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CONTRACTOR</TableHead>
                  <TableHead>COMPLETIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contractors.map((contractor) => (
                  <TableRow key={contractor.id}>
                    <TableCell>
                      <div className="font-medium">{contractor.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center font-semibold">
                        {getContractorCompletions(contractor.id)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Contractor Form */}
      <ContractorForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSubmit={handleCreateContractor}
        mode="create"
        isLoading={createMutation.isPending}
      />

      {/* Edit Contractor Form */}
      <ContractorForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        onSubmit={handleEditContractor}
        contractor={selectedContractor}
        mode="edit"
        isLoading={updateMutation.isPending}
      />

      {/* Delete Contractor Modal */}
      <DeleteContractorModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDeleteContractor}
        contractor={selectedContractor}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
