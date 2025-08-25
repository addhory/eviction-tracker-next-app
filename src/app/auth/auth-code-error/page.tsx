"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AuthCodeErrorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center text-red-600 flex items-center justify-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Authentication Error</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              There was an error processing your authentication request. This
              could be due to:
            </AlertDescription>
          </Alert>

          <ul className="text-sm text-gray-600 space-y-1 ml-4">
            <li>• The link has expired</li>
            <li>• The link has already been used</li>
            <li>• The link is invalid or corrupted</li>
          </ul>

          <div className="space-y-2">
            <Button onClick={() => router.push("/login")} className="w-full">
              Back to Login
            </Button>
            <Button
              onClick={() => router.push("/login?forgot=true")}
              variant="outline"
              className="w-full"
            >
              Request New Password Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
