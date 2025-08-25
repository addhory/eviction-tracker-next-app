"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  Home,
  Briefcase,
  Info,
  LogOut,
  User,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import { ContractorInfoCenter } from "@/components/contractor-info-center";

interface ContractorLayoutProps {
  children: React.ReactNode;
}

export default function ContractorLayout({ children }: ContractorLayoutProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user || profile?.role !== "contractor") {
    router.push("/login");
    return null;
  }

  const navigation: Array<{
    name: string;
    href: string;
    icon: any;
    current: boolean;
    isModal?: boolean;
  }> = [
    {
      name: "Job Board",
      href: "/contractor/dashboard",
      icon: Home,
      current: true,
    },
    {
      name: "My Jobs",
      href: "/contractor/my-jobs",
      icon: Briefcase,
      current: false,
    },
    {
      name: "Info Center",
      href: "#",
      icon: Info,
      current: false,
      isModal: true,
    },
  ];

  const userInitials =
    profile?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "C";

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-green-600 px-4 py-3 text-white">
          <div className="flex items-center space-x-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-green-700"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-full flex-col">
                  <div className="flex items-center space-x-3 bg-green-600 px-6 py-4 text-white">
                    <div className="text-xl font-bold">EvictionTracker</div>
                    <Badge
                      variant="secondary"
                      className="bg-green-700 text-green-100"
                    >
                      Contractor
                    </Badge>
                  </div>
                  <nav className="flex-1 space-y-1 px-3 py-4">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      if (item.isModal) {
                        return (
                          <ContractorInfoCenter key={item.name}>
                            <div className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer">
                              <Icon className="h-5 w-5" />
                              <span>{item.name}</span>
                            </div>
                          </ContractorInfoCenter>
                        );
                      }
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </nav>
                  <div className="border-t p-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt={profile?.name || ""} />
                        <AvatarFallback className="bg-green-100 text-green-700">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {profile?.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {profile?.email}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() =>
                          setTheme(theme === "light" ? "dark" : "light")
                        }
                      >
                        {mounted && theme === "light" ? (
                          <Moon className="mr-2 h-4 w-4" />
                        ) : (
                          <Sun className="mr-2 h-4 w-4" />
                        )}
                        {mounted && theme === "light"
                          ? "Dark Mode"
                          : "Light Mode"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleSignOut}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <div className="text-lg font-semibold">EvictionTracker</div>
            <Badge variant="secondary" className="bg-green-700 text-green-100">
              Contractor
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-green-700"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {mounted && theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
            <div className="text-sm">
              Welcome, {profile?.name?.split(" ")[0]}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-green-700"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-green-600 text-white">
            <div className="text-xl font-bold">EvictionTracker</div>
            <Badge
              variant="secondary"
              className="ml-2 bg-green-700 text-green-100"
            >
              Contractor
            </Badge>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto">
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                if (item.isModal) {
                  return (
                    <ContractorInfoCenter key={item.name}>
                      <div className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer">
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </div>
                    </ContractorInfoCenter>
                  );
                }
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          {/* User profile section */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div>
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" alt={profile?.name || ""} />
                  <AvatarFallback className="bg-green-100 text-green-700">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {profile?.email}
                </p>
              </div>
              <div className="flex-shrink-0 flex space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                >
                  {mounted && theme === "light" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
