"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EmailNotificationSettings } from "@/components/email-notification-settings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Mail,
  Bell,
  Shield,
  Building2,
  Phone,
  MapPin,
  Settings as SettingsIcon,
} from "lucide-react";

export default function SettingsPage() {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: profile?.name || "",
    username: profile?.username || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    business_name: profile?.business_name || "",
    address: profile?.address || "",
    city: profile?.city || "",
    state: profile?.state || "MD",
    zip_code: profile?.zip_code || "",
  });

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would update the profile in Supabase
      console.log("Saving profile data:", profileData);
      // await updateProfile(profile?.id, profileData);
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileField = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Account Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => updateProfileField("name", e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profileData.username}
                    onChange={(e) =>
                      updateProfileField("username", e.target.value)
                    }
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          updateProfileField("email", e.target.value)
                        }
                        className="pl-10"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) =>
                          updateProfileField("phone", e.target.value)
                        }
                        className="pl-10"
                        placeholder="(xxx) xxx-xxxx"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Business Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Business Information</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="business_name">
                      Business Name (Optional)
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="business_name"
                        value={profileData.business_name}
                        onChange={(e) =>
                          updateProfileField("business_name", e.target.value)
                        }
                        className="pl-10"
                        placeholder="Enter your business name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Business Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        id="address"
                        value={profileData.address}
                        onChange={(e) =>
                          updateProfileField("address", e.target.value)
                        }
                        className="pl-10"
                        placeholder="Enter your business address"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={profileData.city}
                        onChange={(e) =>
                          updateProfileField("city", e.target.value)
                        }
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Select
                        value={profileData.state}
                        onValueChange={(value) =>
                          updateProfileField("state", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MD">Maryland</SelectItem>
                          <SelectItem value="VA">Virginia</SelectItem>
                          <SelectItem value="DC">Washington DC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip_code">ZIP Code</Label>
                      <Input
                        id="zip_code"
                        value={profileData.zip_code}
                        onChange={(e) =>
                          updateProfileField("zip_code", e.target.value)
                        }
                        placeholder="12345"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Account Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Account Status</h3>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Account Role</div>
                    <div className="text-sm text-muted-foreground">
                      Your current access level in the system
                    </div>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {profile?.role || "user"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Account Created</div>
                    <div className="text-sm text-muted-foreground">
                      When you joined Eviction Tracker
                    </div>
                  </div>
                  <div className="text-sm">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString()
                      : "Unknown"}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={loading}>
                  {loading ? (
                    <>
                      <SettingsIcon className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <EmailNotificationSettings />
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Password</h3>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Change Password</div>
                    <div className="text-sm text-muted-foreground">
                      Update your account password for security
                    </div>
                  </div>
                  <Button variant="outline">Change Password</Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Login Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Current Session</div>
                      <div className="text-sm text-muted-foreground">
                        This device, logged in now
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      Active
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Data & Privacy</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Download Data</div>
                      <div className="text-sm text-muted-foreground">
                        Export all your account data
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Download
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg border-red-200">
                    <div>
                      <div className="font-medium text-red-600">
                        Delete Account
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Permanently delete your account and all data
                      </div>
                    </div>
                    <Button variant="destructive" size="sm">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
