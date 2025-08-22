"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { AdminService, UserManagementData } from "@/services/admin-service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  Search,
  Filter,
  Edit,
  Trash2,
  ArrowLeft,
  Shield,
  Building2,
  FileText,
  MoreHorizontal,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { Profile } from "@/types";

export default function AdminUsersPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserManagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [updating, setUpdating] = useState(false);

  const limit = 20;

  useEffect(() => {
    // Check if user is admin
    if (profile && profile.role !== "admin") {
      router.push("/dashboard");
      return;
    }
  }, [profile, router]);

  useEffect(() => {
    const loadUsers = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const adminService = new AdminService();
        const { data, error } = await adminService.getUsers(
          page,
          limit,
          roleFilter,
          search
        );

        if (error) {
          setError("Failed to load users");
          console.error("Failed to load users:", error);
        } else if (data) {
          setUsers(data);
        }
      } catch (error) {
        setError("An unexpected error occurred");
        console.error("Users page error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [user, page, roleFilter, search]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page when searching
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setPage(1); // Reset to first page when filtering
  };

  const handleUpdateRole = async (
    userId: string,
    newRole: "admin" | "landlord" | "contractor"
  ) => {
    setUpdating(true);
    try {
      const adminService = new AdminService();
      const { data, error } = await adminService.updateUserRole(
        userId,
        newRole
      );

      if (error) {
        alert("Failed to update user role");
        console.error("Failed to update role:", error);
      } else if (data) {
        // Update the user in our local state
        setUsers((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            users: prev.users.map((u) =>
              u.id === userId ? { ...u, role: newRole } : u
            ),
          };
        });
        setSelectedUser(null);
      }
    } catch (error) {
      alert("An unexpected error occurred");
      console.error("Failed to update role:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setUpdating(true);
    try {
      const adminService = new AdminService();
      const { error } = await adminService.deleteUser(userId);

      if (error) {
        alert("Failed to delete user");
        console.error("Failed to delete user:", error);
      } else {
        // Remove user from local state
        setUsers((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            users: prev.users.filter((u) => u.id !== userId),
            totalCount: prev.totalCount - 1,
          };
        });
      }
    } catch (error) {
      alert("An unexpected error occurred");
      console.error("Failed to delete user:", error);
    } finally {
      setUpdating(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "landlord":
        return "bg-blue-100 text-blue-800";
      case "contractor":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (profile?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This page is only accessible to administrators.
            </p>
            <Button asChild className="w-full mt-4">
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">User Management</h1>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalPages = users ? Math.ceil(users.totalCount / limit) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
              Manage system users and their permissions
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users
            {users && (
              <Badge variant="secondary">{users.totalCount} total</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, or username..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="landlord">Landlord</SelectItem>
                <SelectItem value="contractor">Contractor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : users && users.users.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Properties</TableHead>
                    <TableHead>Cases</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {getInitials(user.name || user.username || "U")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {user.name || user.username}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getRoleBadgeColor(user.role)}
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {user.total_properties || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {user.total_cases || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.last_activity
                            ? dayjs(user.last_activity).format("MMM D, YYYY")
                            : "Never"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit User Role</DialogTitle>
                                <DialogDescription>
                                  Change the role for{" "}
                                  {user.name || user.username}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Current Role</Label>
                                  <Badge
                                    className={getRoleBadgeColor(user.role)}
                                  >
                                    {user.role}
                                  </Badge>
                                </div>
                                <div className="space-y-2">
                                  <Label>New Role</Label>
                                  <Select
                                    onValueChange={(value) =>
                                      handleUpdateRole(
                                        user.id!,
                                        value as
                                          | "admin"
                                          | "landlord"
                                          | "contractor"
                                      )
                                    }
                                    disabled={updating}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select new role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">
                                        Admin
                                      </SelectItem>
                                      <SelectItem value="landlord">
                                        Landlord
                                      </SelectItem>
                                      <SelectItem value="contractor">
                                        Contractor
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <p>
                                    <strong>Admin:</strong> Full system access
                                    and user management
                                  </p>
                                  <p>
                                    <strong>Landlord:</strong> Property and case
                                    management
                                  </p>
                                  <p>
                                    <strong>Contractor:</strong> Limited case
                                    access
                                  </p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete{" "}
                                  {user.name || user.username}? This action
                                  cannot be undone and will also delete all
                                  associated properties, tenants, and cases.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.id!)}
                                  className="bg-red-600 hover:bg-red-700"
                                  disabled={updating}
                                >
                                  {updating ? "Deleting..." : "Delete User"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} to{" "}
                    {Math.min(page * limit, users.totalCount)} of{" "}
                    {users.totalCount} users
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const pageNum =
                          Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
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
            </>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No users found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {search || roleFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "No users have been registered yet."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
