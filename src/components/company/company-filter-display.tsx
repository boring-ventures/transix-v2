"use client";

import { useEffect, useState } from "react";
import { useCompanyFilter } from "@/hooks/use-company-filter";
import { useCompanies, type Company } from "@/hooks/use-companies";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BuildingIcon } from "lucide-react";

interface CompanyFilterDisplayProps {
  onCompanyChange?: (companyId: string) => void;
}

export function CompanyFilterDisplay({
  onCompanyChange,
}: CompanyFilterDisplayProps) {
  const { companyId, isCompanyRestricted } = useCompanyFilter();
  const { companies } = useCompanies();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
  );

  useEffect(() => {
    // If user is restricted to a company, use that company ID
    if (isCompanyRestricted && companyId) {
      setSelectedCompanyId(companyId);
    }
  }, [isCompanyRestricted, companyId]);

  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value === "all" ? null : value);
    if (onCompanyChange) {
      onCompanyChange(value === "all" ? "" : value);
    }
  };

  const selectedCompany = companies.find(
    (company: Company) => company.id === (selectedCompanyId || companyId)
  );

  if (isCompanyRestricted && selectedCompany) {
    // Display current company for restricted users
    return (
      <Card className="mb-4">
        <CardContent className="pt-4 flex items-center">
          <BuildingIcon className="h-5 w-5 mr-2 text-muted-foreground" />
          <div>
            <CardDescription>Empresa actual:</CardDescription>
            <Badge variant="outline" className="mt-1">
              {selectedCompany.name}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Display company selector for superadmin
  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-2">
          <BuildingIcon className="h-5 w-5 text-muted-foreground" />
          <CardDescription>Filtrar por empresa:</CardDescription>
        </div>
        <Select
          value={selectedCompanyId || "all"}
          onValueChange={handleCompanyChange}
        >
          <SelectTrigger className="w-full md:w-[300px]">
            <SelectValue placeholder="Todas las empresas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las empresas</SelectItem>
            {companies.map((company: Company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
