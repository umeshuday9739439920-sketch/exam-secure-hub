import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Database, Users, Lock } from "lucide-react";

export default function AdminSettings() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          System configuration and security settings
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>
              Security features and authentication settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Row Level Security (RLS)</p>
                <p className="text-sm text-muted-foreground">
                  Database-level access control enabled
                </p>
              </div>
              <Badge>Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-confirm Email</p>
                <p className="text-sm text-muted-foreground">
                  Users can sign in without email confirmation
                </p>
              </div>
              <Badge>Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Tab Switch Detection</p>
                <p className="text-sm text-muted-foreground">
                  Anti-cheating measure tracks tab switching
                </p>
              </div>
              <Badge>Active</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Database</CardTitle>
            </div>
            <CardDescription>Database configuration and policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Exam Attempts Storage</p>
                <p className="text-sm text-muted-foreground">
                  All student attempts are recorded
                </p>
              </div>
              <Badge variant="outline">Configured</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Answer Validation</p>
                <p className="text-sm text-muted-foreground">
                  Server-side answer checking with input validation
                </p>
              </div>
              <Badge variant="outline">Secured</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>User Management</CardTitle>
            </div>
            <CardDescription>Role-based access control</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Admin Role</p>
                <p className="text-sm text-muted-foreground">
                  Full access to system management
                </p>
              </div>
              <Badge>Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Student Role</p>
                <p className="text-sm text-muted-foreground">
                  Limited to exam taking and result viewing
                </p>
              </div>
              <Badge>Active</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <CardTitle>Privacy & Compliance</CardTitle>
            </div>
            <CardDescription>Data protection measures</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Student PII Protection</p>
                <p className="text-sm text-muted-foreground">
                  Email addresses hidden in results view
                </p>
              </div>
              <Badge variant="outline">Protected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Secure Answer Storage</p>
                <p className="text-sm text-muted-foreground">
                  Correct answers never exposed to clients
                </p>
              </div>
              <Badge variant="outline">Secured</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
