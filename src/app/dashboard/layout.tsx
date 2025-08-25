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
import { Bell, ShoppingCart, User, LogOut, Moon } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect if not authenticated or not a landlord
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

  if (profile.role !== "landlord") {
    router.push("/login");
    return null;
  }

  const handleLogout = () => {
    signOut();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      current: pathname === "/dashboard",
    },
    {
      name: "Tenants",
      href: "/dashboard/tenants",
      current: pathname === "/dashboard/tenants",
    },
    {
      name: "Eviction Letters",
      href: "/dashboard/cases",
      current: pathname === "/dashboard/cases",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <header className="bg-green-600 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link href="/dashboard" className="text-white text-xl font-bold">
                EvictionTracker
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    item.current
                      ? "bg-green-700 text-white"
                      : "text-green-100 hover:bg-green-700 hover:text-white"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Right side items */}
            <div className="flex items-center space-x-4">
              {/* Cart */}
              <Link href="/dashboard/cart">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-green-700 relative"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                    1
                  </Badge>
                  <span className="ml-2 hidden sm:inline">Cart</span>
                </Button>
              </Link>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-green-700"
              >
                <Moon className="h-5 w-5" />
              </Button>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-green-700"
              >
                <Bell className="h-5 w-5" />
              </Button>

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 text-white hover:bg-green-700"
                  >
                    <Avatar className="h-8 w-8 bg-green-800">
                      <AvatarFallback className="bg-green-800 text-white text-sm">
                        {getInitials(profile.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium">
                        Welcome, {profile.name.split(" ")[0]}
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-medium">{profile.name}</p>
                    <p className="text-xs text-gray-500">{profile.email}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {profile.role}
                    </Badge>
                  </div>
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-green-700">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  item.current
                    ? "bg-green-700 text-white"
                    : "text-green-100 hover:bg-green-700 hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
