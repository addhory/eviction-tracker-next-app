"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Bell,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  FileText,
  Calendar,
  Settings,
} from "lucide-react";

interface NotificationSettings {
  case_created: boolean;
  case_status_updated: boolean;
  payment_reminders: boolean;
  court_date_reminders: boolean;
  document_ready: boolean;
  payment_reminder_frequency: "immediate" | "daily" | "weekly";
  court_reminder_days: 1 | 3 | 7 | 14;
  email_format: "html" | "text";
}

export function EmailNotificationSettings() {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    case_created: true,
    case_status_updated: true,
    payment_reminders: true,
    court_date_reminders: true,
    document_ready: true,
    payment_reminder_frequency: "daily",
    court_reminder_days: 3,
    email_format: "html",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // In a real implementation, this would load settings from the database
  useEffect(() => {
    // Placeholder for loading user's notification settings
    // const loadSettings = async () => {
    //   // Load from Supabase user preferences table
    // };
    // loadSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would save to database
      // await saveUserNotificationSettings(profile?.id, settings);

      console.log("Notification settings saved:", settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save notification settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const notificationTypes = [
    {
      key: "case_created",
      title: "New Case Created",
      description: "Receive notifications when a new legal case is created",
      icon: FileText,
    },
    {
      key: "case_status_updated",
      title: "Case Status Updates",
      description:
        "Get notified when case status changes (draft, submitted, etc.)",
      icon: Bell,
    },
    {
      key: "payment_reminders",
      title: "Payment Reminders",
      description: "Reminders for unpaid processing fees and court costs",
      icon: DollarSign,
    },
    {
      key: "court_date_reminders",
      title: "Court Date Reminders",
      description: "Advance notice of upcoming trial and hearing dates",
      icon: Calendar,
    },
    {
      key: "document_ready",
      title: "Document Generation",
      description: "Notifications when legal documents are ready for download",
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notification Settings
          </CardTitle>
          <CardDescription>
            Manage your email notification preferences for case updates and
            reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Address Display */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div>
              <div className="font-medium">Email Address</div>
              <div className="text-sm text-muted-foreground">
                {profile?.email}
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          </div>

          <Separator />

          {/* Notification Types */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notification Types</h3>
            <div className="space-y-4">
              {notificationTypes.map((type) => (
                <div
                  key={type.key}
                  className="flex items-start justify-between space-x-4"
                >
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <type.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{type.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {type.description}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={
                      settings[
                        type.key as keyof NotificationSettings
                      ] as boolean
                    }
                    onCheckedChange={(checked) =>
                      updateSetting(
                        type.key as keyof NotificationSettings,
                        checked
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Advanced Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Advanced Settings</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="payment-frequency">
                  Payment Reminder Frequency
                </Label>
                <Select
                  value={settings.payment_reminder_frequency}
                  onValueChange={(value) =>
                    updateSetting("payment_reminder_frequency", value)
                  }
                  disabled={!settings.payment_reminders}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How often to send payment reminders for unpaid cases
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="court-reminder-days">Court Date Reminder</Label>
                <Select
                  value={settings.court_reminder_days.toString()}
                  onValueChange={(value) =>
                    updateSetting("court_reminder_days", parseInt(value))
                  }
                  disabled={!settings.court_date_reminders}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day before</SelectItem>
                    <SelectItem value="3">3 days before</SelectItem>
                    <SelectItem value="7">1 week before</SelectItem>
                    <SelectItem value="14">2 weeks before</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  When to send reminders before court dates
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-format">Email Format</Label>
                <Select
                  value={settings.email_format}
                  onValueChange={(value) =>
                    updateSetting("email_format", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="html">HTML (Rich formatting)</SelectItem>
                    <SelectItem value="text">Plain Text</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose your preferred email format
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Test Email */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Test Notifications</h3>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-medium">Send Test Email</div>
                <div className="text-sm text-muted-foreground">
                  Send a test notification to verify your email settings
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Send Test
              </Button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-4">
            {saved && (
              <Alert className="flex-1 mr-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Notification settings have been saved successfully.
                </AlertDescription>
              </Alert>
            )}
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <Settings className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Settings className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>

          {/* Information */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Email notifications help you stay updated on your legal cases. You
              can modify these settings at any time. Critical notifications
              (like court dates) will always be sent regardless of your
              preferences.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
