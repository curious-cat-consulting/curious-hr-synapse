"use client";

import { Users, Settings, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";

import { AuthGuard } from "@components/auth/AuthGuard";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { useToast } from "@components/ui/use-toast";
import { createClient } from "@lib/supabase/client";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mileageRate, setMileageRate] = useState("0.655"); // Default IRS rate
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error !== null) throw error;
      setProfiles(data);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast({
        title: "Error",
        description: "Failed to fetch employee profiles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteEmployee = async () => {
    // TODO: Implement employee invitation
    toast({
      title: "Coming Soon",
      description: "Employee invitation feature will be available soon",
    });
  };

  const handleUpdateMileageRate = async () => {
    // TODO: Implement mileage rate update
    toast({
      title: "Coming Soon",
      description: "Mileage rate configuration will be available soon",
    });
  };

  const handleUpdateOrgName = async () => {
    // TODO: Implement organization name update
    toast({
      title: "Coming Soon",
      description: "Organization settings will be available soon",
    });
  };

  return (
    <AuthGuard>
      <div className="container mx-auto py-8">
        <h1 className="mb-8 text-3xl font-bold">Admin Dashboard</h1>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Employee Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employee Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button onClick={handleInviteEmployee} className="w-full">
                  Invite New Employee
                </Button>
              </div>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center">Loading employees...</div>
                ) : (
                  profiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium">{profile.full_name}</p>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                      </div>
                      <div className="flex gap-2">
                        {profile.roles.map((role) => (
                          <span
                            key={role}
                            className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <div className="space-y-6">
            {/* Mileage Rate */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Mileage Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mileageRate">Current Rate (per mile)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="mileageRate"
                        type="number"
                        step="0.001"
                        value={mileageRate}
                        onChange={(e) => setMileageRate(e.target.value)}
                      />
                      <Button onClick={handleUpdateMileageRate}>Update</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Organization Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Organization Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="orgName"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="Enter organization name"
                      />
                      <Button onClick={handleUpdateOrgName}>Update</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
