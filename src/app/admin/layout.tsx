"use client";

import { ReactNode } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  User,
  LogOut,
  Moon,
  BarChart3,
  Users,
  Briefcase,
  FileText,
  Building2,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect if not authenticated or not an admin
  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (profile.role !== "admin") {
    router.push("/login");
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  // Navigation items for admin
  const navItems = [
    {
      href: "/admin",
      label: "Admin Dashboard",
      icon: BarChart3,
      isActive: pathname === "/admin",
    },
    {
      href: "/admin/clients",
      label: "Clients",
      icon: Users,
      isActive: pathname === "/admin/clients",
    },
    {
      href: "/admin/contractors",
      label: "Contractors",
      icon: Briefcase,
      isActive: pathname === "/admin/contractors",
    },
    {
      href: "/admin/cases",
      label: "All Cases",
      icon: FileText,
      isActive: pathname === "/admin/cases",
    },
    {
      href: "/admin/law-firms",
      label: "Law Firms",
      icon: Building2,
      isActive: pathname === "/admin/law-firms",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-green-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-xl font-bold">
                EvictionTracker
              </Link>
              <Badge
                variant="secondary"
                className="bg-green-700 text-green-100"
              >
                Admin
              </Badge>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex space-x-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      item.isActive
                        ? "bg-green-700 text-white"
                        : "text-green-100 hover:bg-green-500 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-green-500"
              >
                <Bell className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-green-500"
              >
                <Moon className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full text-white hover:bg-green-500"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-green-700 text-green-100">
                        {profile?.name?.charAt(0)?.toUpperCase() || "A"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">Welcome, Admin User</p>
                      <p className="text-xs text-muted-foreground">
                        {profile?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <div className="md:hidden bg-green-600 border-t border-green-500">
        <nav className="px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.isActive
                    ? "bg-green-700 text-white"
                    : "text-green-100 hover:bg-green-500 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
