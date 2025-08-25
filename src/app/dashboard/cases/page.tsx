"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  FileText,
  DollarSign,
  Calendar,
  MapPin,
  User,
} from "lucide-react";
import { useState } from "react";
import { EvictionLetterRequestModal } from "@/components/forms/eviction-letter-request-modal";
import {
  useLegalCases,
  useCreateLegalCase,
  useDeleteLegalCase,
} from "@/hooks/queries/use-legal-cases";
import { useAuth } from "@/components/providers/auth-provider";
import { useTenants } from "@/hooks/queries/use-tenants";
import { format } from "date-fns";
import { toast } from "sonner";
import { DeleteCaseConfirmationModal } from "@/components/forms/delete-case-confirmation-modal";
import { CaseDetailsModal } from "@/components/forms/case-details-modal";

interface EvictionCase {
  id: string;
  caseNumber: string;
  tenantName: string;
  propertyAddress: string;
  amountDueAtSubmission: number;
  currentAmountDue: number;
  price: number;
  initiatedDate: string;
  status:
    | "NOTICE_DRAFT"
    | "SUBMITTED"
    | "IN_PROGRESS"
    | "COMPLETE"
    | "CANCELLED";
  paymentStatus: "UNPAID" | "PAID" | "PARTIAL";
}

export default function EvictionLettersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedCaseForDelete, setSelectedCaseForDelete] =
    useState<EvictionCase | null>(null);
  const [selectedCaseForDetails, setSelectedCaseForDetails] =
    useState<EvictionCase | null>(null);

  const { user } = useAuth();
  const { data: legalCases, isLoading, error } = useLegalCases(user?.id);
  const { data: tenants } = useTenants(user?.id);
  const createLegalCaseMutation = useCreateLegalCase();
  const deleteLegalCaseMutation = useDeleteLegalCase();

  // Transform legal cases data to match the UI interface
  const evictionCases: EvictionCase[] =
    legalCases?.map((legalCase) => ({
      id: legalCase.id,
      caseNumber:
        legalCase.district_court_case_number ||
        `CASE-${legalCase.id.slice(0, 8)}`,
      tenantName:
        legalCase.tenant?.tenant_names?.join(", ") || "Unknown Tenant",
      propertyAddress: legalCase.property?.address || "Unknown Property",
      amountDueAtSubmission: legalCase.rent_owed_at_filing || 0,
      currentAmountDue: legalCase.current_rent_owed || 0,
      price: legalCase.price,
      initiatedDate: legalCase.date_initiated
        ? format(new Date(legalCase.date_initiated), "M/d/yyyy")
        : "Unknown",
      status: legalCase.status,
      paymentStatus: legalCase.payment_status,
    })) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NOTICE_DRAFT":
        return "bg-yellow-100 text-yellow-800";
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-800";
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
      case "UNPAID":
        return "bg-red-100 text-red-800";
      case "PARTIAL":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "NOTICE_DRAFT":
        return "NOTICE DRAFT";
      case "SUBMITTED":
        return "SUBMITTED";
      case "IN_PROGRESS":
        return "IN PROGRESS";
      case "COMPLETE":
        return "COMPLETE";
      case "CANCELLED":
        return "CANCELLED";
      default:
        return status;
    }
  };

  const handleAddToCart = (caseId: string) => {
    console.log("Add to cart:", caseId);
  };

  const handleDeleteDraft = (caseId: string) => {
    const caseToDelete = evictionCases.find((c) => c.id === caseId);
    if (caseToDelete) {
      setSelectedCaseForDelete(caseToDelete);
      setDeleteModalOpen(true);
    }
  };

  const handleViewDetails = (caseId: string) => {
    const legalCase = legalCases?.find((c) => c.id === caseId);
    const caseToView = evictionCases.find((c) => c.id === caseId);

    if (caseToView && legalCase) {
      // Map the EvictionCase to the format expected by CaseDetailsModal with real data
      const detailsData = {
        ...caseToView,
        noRightOfRedemption: legalCase.no_right_of_redemption || false,
        districtCourtCaseNumber:
          legalCase.district_court_case_number || caseToView.caseNumber,
        warrantOrderDate: legalCase.warrant_order_date,
        initialEvictionDate: legalCase.initial_eviction_date,
        signatureName:
          legalCase.generated_documents?.signature_name || undefined,
      };
      setSelectedCaseForDetails(detailsData);
      setDetailsModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCaseForDelete) return;

    try {
      await deleteLegalCaseMutation.mutateAsync(selectedCaseForDelete.id);
      toast.success("Draft case deleted successfully!");
      setDeleteModalOpen(false);
      setSelectedCaseForDelete(null);
    } catch (error) {
      console.error("Error deleting case:", error);
      toast.error("Failed to delete draft case. Please try again.");
    }
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedCaseForDelete(null);
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedCaseForDetails(null);
  };

  const handleGenerateDocument = (caseId: string) => {
    console.log("Generate document:", caseId);
  };

  const handleNewRequest = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleSubmitRequest = async (data: any) => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      // Get the selected tenant to find the property_id
      const selectedTenant = tenants?.find(
        (tenant) => tenant.id === data.tenant_id
      );
      if (!selectedTenant?.property_id) {
        toast.error("Selected tenant must have a property associated");
        return;
      }

      await createLegalCaseMutation.mutateAsync({
        landlordId: user.id,
        data: {
          tenant_id: data.tenant_id,
          property_id: selectedTenant.property_id,
          case_type: "FTPR" as const,
          date_initiated: new Date().toISOString().split("T")[0],
          current_rent_owed: data.current_rent_owed,
          price: data.price,
          no_right_of_redemption: data.no_right_of_redemption,
          district_court_case_number: data.district_court_case_number,
          warrant_order_date: data.warrant_order_date,
          initial_eviction_date: data.initial_eviction_date,
          signature_name: data.signature_name,
        },
      });

      toast.success("Eviction letter request created successfully!");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating legal case:", error);
      toast.error(
        "Failed to create eviction letter request. Please try again."
      );
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white rounded-lg shadow-sm p-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Eviction Letters
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your eviction cases and legal documents
            </p>
          </div>
          <Button
            className="mt-4 sm:mt-0 bg-green-600 hover:bg-green-700"
            onClick={handleNewRequest}
          >
            <Plus className="h-4 w-4 mr-2" />
            Submit New Request
          </Button>
        </div>
        {/* Loading State */}
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading eviction cases...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white rounded-lg shadow-sm p-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Eviction Letters
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your eviction cases and legal documents
            </p>
          </div>
          <Button
            className="mt-4 sm:mt-0 bg-green-600 hover:bg-green-700"
            onClick={handleNewRequest}
          >
            <Plus className="h-4 w-4 mr-2" />
            Submit New Request
          </Button>
        </div>
        {/* Error State */}
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <div className="text-red-600 mb-4">
            <FileText className="h-12 w-12 mx-auto mb-2" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Cases
          </h3>
          <p className="text-gray-500 mb-6">
            {error instanceof Error
              ? error.message
              : "Failed to load eviction cases"}
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white rounded-lg shadow-sm p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eviction Letters</h1>
          <p className="text-gray-600 mt-1">
            Manage your eviction cases and legal documents
          </p>
        </div>
        <Button
          className="mt-4 sm:mt-0 bg-green-600 hover:bg-green-700"
          onClick={handleNewRequest}
        >
          <Plus className="h-4 w-4 mr-2" />
          Submit New Request
        </Button>
      </div>

      {/* Cases List */}
      <div className="space-y-4">
        {evictionCases.map((evictionCase) => (
          <Card
            key={evictionCase.id}
            className="bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
                <div>
                  <CardTitle className="text-xl font-bold text-green-700 mb-2">
                    Case Number: {evictionCase.caseNumber}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getStatusColor(evictionCase.status)}>
                      CASE: {getStatusText(evictionCase.status)}
                    </Badge>
                    <Badge
                      className={getPaymentStatusColor(
                        evictionCase.paymentStatus
                      )}
                    >
                      PAYMENT: {evictionCase.paymentStatus}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {evictionCase.status === "NOTICE_DRAFT" && (
                    <>
                      <Button
                        onClick={() => handleAddToCart(evictionCase.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Go to Cart to Pay
                      </Button>
                      <Button
                        onClick={() => handleDeleteDraft(evictionCase.id)}
                        variant="destructive"
                        size="sm"
                      >
                        Delete Draft
                      </Button>
                      <Button
                        onClick={() => handleViewDetails(evictionCase.id)}
                        variant="outline"
                        size="sm"
                      >
                        View Details
                      </Button>
                    </>
                  )}

                  {evictionCase.status === "SUBMITTED" &&
                    evictionCase.paymentStatus === "PAID" && (
                      <>
                        <Button
                          onClick={() =>
                            handleGenerateDocument(evictionCase.id)
                          }
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Generate Initial Eviction Notice
                        </Button>
                        <Button
                          onClick={() => handleViewDetails(evictionCase.id)}
                          variant="outline"
                          size="sm"
                        >
                          View Details
                        </Button>
                      </>
                    )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Case Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="h-4 w-4 mr-1" />
                    Tenant
                  </div>
                  <p className="font-medium text-gray-900">
                    {evictionCase.tenantName}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-1" />
                    Property
                  </div>
                  <p className="font-medium text-gray-900">
                    {evictionCase.propertyAddress}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-500">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Amount Due (at submission)
                  </div>
                  <p className="font-medium text-gray-900">
                    ${evictionCase.amountDueAtSubmission.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-500">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Current Amount Due
                  </div>
                  <p className="font-medium text-gray-900">
                    ${evictionCase.currentAmountDue.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-500">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Price
                  </div>
                  <p className="font-medium text-gray-900">
                    ${evictionCase.price.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    Initiated
                  </div>
                  <p className="font-medium text-gray-900">
                    {evictionCase.initiatedDate}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {evictionCases.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Eviction Cases Yet
          </h3>
          <p className="text-gray-500 mb-6">
            Start your first eviction case to get things rolling.
          </p>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={handleNewRequest}
          >
            <Plus className="h-4 w-4 mr-2" />
            Submit Your First Request
          </Button>
        </div>
      )}

      {/* Eviction Letter Request Modal */}
      <EvictionLetterRequestModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleSubmitRequest}
        isSubmitting={createLegalCaseMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <DeleteCaseConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        caseNumber={selectedCaseForDelete?.caseNumber || ""}
        tenantName={selectedCaseForDelete?.tenantName || ""}
        isDeleting={deleteLegalCaseMutation.isPending}
      />

      {/* Case Details Modal */}
      <CaseDetailsModal
        isOpen={detailsModalOpen}
        onClose={handleCloseDetailsModal}
        caseData={selectedCaseForDetails}
      />
    </div>
  );
}
