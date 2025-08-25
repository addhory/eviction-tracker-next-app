"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  MapPin,
  Users,
  Edit,
  Trash2,
  Home,
  Building,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { AddTenantPropertyModal } from "@/components/forms/add-tenant-property-modal";
import {
  useTenantProperties,
  type TenantProperty,
} from "@/hooks/queries/use-tenant-properties";
import { useAuth } from "@/components/providers/auth-provider";
import { useDeleteTenant } from "@/hooks/queries/use-tenants";

export default function TenantsPage() {
  const { user } = useAuth();
  const {
    data: tenantProperties = [],
    isLoading,
    isError,
    refetch,
  } = useTenantProperties(user?.id);

  const deleteTenantMutation = useDeleteTenant();

  const handleDelete = async (item: TenantProperty) => {
    if (!item.tenant_id) {
      toast.error(
        "Cannot delete property-only entry. Delete the property instead."
      );
      return;
    }

    try {
      await deleteTenantMutation.mutateAsync(item.tenant_id);
      toast.success("Tenant deleted successfully!");
    } catch (error) {
      console.error("Failed to delete tenant:", error);
      toast.error("Failed to delete tenant");
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Data refreshed!");
  };

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white rounded-lg shadow-sm p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            My Tenants & Properties
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your rental properties and tenant information
          </p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <AddTenantPropertyModal />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
            <p className="text-gray-600">Loading tenants and properties...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load tenants and properties.{" "}
            <button
              onClick={handleRefresh}
              className="underline hover:no-underline"
            >
              Try again
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Tenant/Property Cards */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenantProperties.map((item) => (
            <Card
              key={item.id}
              className="bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-green-700 mb-1">
                      {item.tenantName}
                    </CardTitle>
                    <Badge
                      variant={
                        item.propertyType === "Residential"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {item.propertyType}
                    </Badge>
                  </div>
                  <div className="text-gray-400">
                    {item.propertyType === "Residential" ? (
                      <Home className="h-5 w-5" />
                    ) : (
                      <Building className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Property Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 uppercase tracking-wide">
                    Associated Property
                  </h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>{item.propertyAddress}</div>
                    <div>
                      {item.city}, {item.state} {item.zipCode}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <MapPin className="h-3 w-3 mr-1" />
                      County: {item.county}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Users className="h-3 w-3 mr-1" />
                      Type: {item.propertyType}
                    </div>
                  </div>
                </div>

                {/* Eviction Posting Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 uppercase tracking-wide">
                    Eviction Posting Info
                  </h4>
                  <p className="text-sm text-gray-600 italic">
                    {item.evictionPostingInfo}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <AddTenantPropertyModal
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    }
                    isEdit={true}
                    propertyId={item.property_id}
                    tenantId={item.tenant_id}
                    initialData={{
                      address: item.propertyAddress,
                      unit: item.unit,
                      city: item.city,
                      state: item.state,
                      zip_code: item.zipCode,
                      county: item.county,
                      property_type: item.propertyType.toUpperCase() as
                        | "RESIDENTIAL"
                        | "COMMERCIAL",
                      tenant_names:
                        item.tenantName !== "No Tenant Assigned"
                          ? [{ name: item.tenantName }]
                          : [{ name: "" }],
                      email: item.email,
                      phone: item.phone,
                      lease_start_date: item.lease_start_date,
                      lease_end_date: item.lease_end_date,
                      rent_amount: item.rent_amount,
                      is_subsidized: item.is_subsidized || false,
                      subsidy_type: item.subsidy_type,
                      bedrooms: item.bedrooms,
                      bathrooms: item.bathrooms,
                      square_feet: item.square_feet,
                      year_built: item.year_built,
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item)}
                    disabled={deleteTenantMutation.isPending || !item.tenant_id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleteTenantMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-1" />
                    )}
                    {item.tenant_id ? "Delete Tenant" : "Property Only"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State (hidden when there are items) */}
      {!isLoading && !isError && tenantProperties.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Tenants or Properties Yet
          </h3>
          <p className="text-gray-500 mb-6">
            Get started by adding your first tenant and property.
          </p>
          <AddTenantPropertyModal
            trigger={
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Tenant & Property
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}
