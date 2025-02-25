"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCompanies, type Company, type CompanyStats } from "@/hooks/use-companies";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building, Users, Bus, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface CompanyDetailClientProps {
  id: string;
}

export default function CompanyDetailClient({ id }: CompanyDetailClientProps) {
  const router = useRouter();
  const { fetchCompany, fetchCompanyStats } = useCompanies();
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        setIsLoading(true);
        const companyData = await fetchCompany(id);
        const statsData = await fetchCompanyStats(id);
        setCompany(companyData);
        setStats(statsData);
      } catch (error) {
        console.error("Error loading company data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCompanyData();
  }, [id, fetchCompany, fetchCompanyStats]);

  return (
    <div className="container mx-auto py-6">
      <Button 
        variant="outline" 
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : company ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
              <div className="flex items-center mt-2">
                <Badge variant={company.active ? "success" : "destructive"}>
                  {company.active ? "Active" : "Inactive"}
                </Badge>
                <span className="text-muted-foreground ml-4">
                  Created on {format(new Date(company.createdAt), "MMMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="branches">Branches</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="buses">Buses</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Branches</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.branchesCount || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.profilesCount || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Buses</CardTitle>
                    <Bus className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.busesCount || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Drivers</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.driversCount || 0}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="branches">
              <Card>
                <CardHeader>
                  <CardTitle>Branches</CardTitle>
                  <CardDescription>
                    Manage company branches and locations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {company.branches && company.branches.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {company.branches.map((branch) => (
                        <Card key={branch.id}>
                          <CardHeader>
                            <CardTitle>{branch.name}</CardTitle>
                            <Badge variant={branch.active ? "outline" : "secondary"}>
                              {branch.active ? "Active" : "Inactive"}
                            </Badge>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm">
                              {branch.address || "No address provided"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {branch.city || "No city provided"}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Building className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No branches found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <Building className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Company Not Found</h2>
          <p className="text-muted-foreground">
            The company you're looking for doesn't exist or has been removed.
          </p>
        </div>
      )}
    </div>
  );
} 