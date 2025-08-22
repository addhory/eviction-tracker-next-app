"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { useProperties, useDeleteProperty } from "@/hooks/queries";
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
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash,
  Eye,
} from "lucide-react";
import { Property } from "@/types";

export default function PropertiesPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Use TanStack Query hooks
  const { data: properties = [], isLoading } = useProperties(user?.id);
  const deletePropertyMutation = useDeleteProperty();

  const filteredProperties = useMemo(() => {
    return properties.filter(
      (property: Property) =>
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.county.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (property.unit &&
          property.unit.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [properties, searchTerm]);

  const handleDeleteProperty = async (propertyId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this property? This action cannot be undone."
      )
    ) {
      return;
    }

    deletePropertyMutation.mutate(propertyId);
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
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">
            Manage your rental properties across Maryland
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/properties/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Your Properties</CardTitle>
              <CardDescription>
                {properties.length} properties across Maryland
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? "No properties found" : "No properties yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Add your first rental property to get started"}
              </p>
              {!searchTerm && (
                <Button asChild>
                  <Link href="/dashboard/properties/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Property
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>County</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {property.address}
                            {property.unit && ` - Unit ${property.unit}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {property.city}, {property.state}{" "}
                            {property.zip_code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {property.property_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{property.county}</TableCell>
                      <TableCell>
                        {property.property_type === "RESIDENTIAL" && (
                          <div className="text-sm text-muted-foreground">
                            {property.bedrooms && `${property.bedrooms} bed`}
                            {property.bedrooms && property.bathrooms && " • "}
                            {property.bathrooms && `${property.bathrooms} bath`}
                            {property.square_feet &&
                              ` • ${property.square_feet} sq ft`}
                          </div>
                        )}
                        {property.year_built && (
                          <div className="text-sm text-muted-foreground">
                            Built {property.year_built}
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
                              <Link
                                href={`/dashboard/properties/${property.id}`}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/properties/${property.id}/edit`}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteProperty(property.id)}
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
