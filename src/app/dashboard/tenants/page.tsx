"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { useTenants, useDeleteTenant } from "@/hooks/queries";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash,
  Eye,
} from "lucide-react";
import { Tenant } from "@/types";
import dayjs from "dayjs";

export default function TenantsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Use TanStack Query hooks
  const { data: tenants = [], isLoading } = useTenants(user?.id);
  const deleteTenantMutation = useDeleteTenant();

  // Filter tenants based on search term using useMemo
  const filteredTenants = useMemo(() => {
    return tenants.filter(
      (tenant: Tenant) =>
        tenant.tenant_names.some((name: string) =>
          name.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        (tenant.email &&
          tenant.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tenant.property?.address &&
          tenant.property.address
            .toLowerCase()
            .includes(searchTerm.toLowerCase()))
    );
  }, [tenants, searchTerm]);

  const handleDeleteTenant = async (tenantId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this tenant? This action cannot be undone."
      )
    ) {
      return;
    }

    deleteTenantMutation.mutate(tenantId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground">
            Manage tenant information across your properties
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/tenants/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Tenant
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Your Tenants</CardTitle>
              <CardDescription>
                {tenants.length} tenants across your properties
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tenants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTenants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? "No tenants found" : "No tenants yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Add your first tenant to get started"}
              </p>
              {!searchTerm && (
                <Button asChild>
                  <Link href="/dashboard/tenants/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Tenant
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant(s)</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Lease</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {tenant.tenant_names.join(", ")}
                          </div>
                          {tenant.is_subsidized && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {tenant.subsidy_type || "Subsidized"}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {tenant.property?.address}
                            {tenant.property?.unit &&
                              ` - Unit ${tenant.property.unit}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {tenant.property?.city}, {tenant.property?.county}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {tenant.email && (
                            <div className="text-muted-foreground">
                              {tenant.email}
                            </div>
                          )}
                          {tenant.phone && (
                            <div className="text-muted-foreground">
                              {tenant.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {tenant.lease_start_date && (
                            <div>
                              Start:{" "}
                              {dayjs(tenant.lease_start_date).format(
                                "MMM D, YYYY"
                              )}
                            </div>
                          )}
                          {tenant.lease_end_date && (
                            <div>
                              End:{" "}
                              {dayjs(tenant.lease_end_date).format(
                                "MMM D, YYYY"
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {tenant.rent_amount && (
                          <div className="font-medium">
                            ${tenant.rent_amount.toLocaleString()}/mo
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/tenants/${tenant.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/tenants/${tenant.id}/edit`}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteTenant(tenant.id)}
                              className="text-destructive"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
