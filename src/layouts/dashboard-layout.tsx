"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  User,
  Home,
  CreditCard,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavigationItem } from "@/types";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: ["admin", "landlord", "contractor"],
  },
  {
    title: "Properties",
    href: "/dashboard/properties",
    icon: Building2,
    roles: ["admin", "landlord"],
  },
  {
    title: "Tenants",
    href: "/dashboard/tenants",
    icon: Users,
    roles: ["admin", "landlord"],
  },
  {
    title: "Legal Cases",
    href: "/dashboard/cases",
    icon: FileText,
    roles: ["admin", "landlord", "contractor"],
  },
  {
    title: "Documents",
    href: "/dashboard/documents",
    icon: FileText,
    roles: ["admin", "landlord", "contractor"],
  },
  {
    title: "Payments",
    href: "/dashboard/payments",
    icon: CreditCard,
    roles: ["admin", "landlord"],
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    roles: ["admin", "landlord"],
  },
  {
    title: "Admin Panel",
    href: "/admin",
    icon: Shield,
    roles: ["admin"],
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const filteredNavigation = navigation.filter(
    (item) =>
      !item.roles || (profile?.role && item.roles.includes(profile.role))
  );

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Building2 className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold">Eviction Tracker</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {filteredNavigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon && <item.icon className="mr-3 h-5 w-5" />}
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile?.name || "User"}
            </p>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {profile?.role || "user"}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
          <div className="flex items-center space-x-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
          </div>

          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.name || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
