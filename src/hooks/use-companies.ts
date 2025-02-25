import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";

export type Company = {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    profiles: number;
    buses: number;
    drivers: number;
  };
  branches?: Branch[];
};

export type Branch = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  active: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
};

export type CompanyStats = {
  branchesCount: number;
  profilesCount: number;
  busesCount: number;
  driversCount: number;
  templatesCount: number;
  seatTiersCount: number;
  activeBusesCount: number;
  inactiveBusesCount: number;
};

export type CompanyFormData = {
  name: string;
  active?: boolean;
};

export function useCompanies() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch all companies
  const {
    data: companies = [],
    isLoading: isLoadingCompanies,
    error: companiesError,
    refetch: refetchCompanies,
  } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const response = await axios.get("/api/companies");
      return response.data.companies;
    },
  });

  // Fetch a single company by ID
  const fetchCompany = useCallback(async (id: string) => {
    const response = await axios.get(`/api/companies/${id}`);
    return response.data.company;
  }, []);

  // Fetch company statistics
  const fetchCompanyStats = useCallback(async (id: string) => {
    const response = await axios.get(`/api/companies/${id}/stats`);
    return response.data.stats;
  }, []);

  // Create a new company
  const createCompany = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      setIsCreating(true);
      try {
        const response = await axios.post("/api/companies", data);
        return response.data.company;
      } finally {
        setIsCreating(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast({
        title: "Success",
        description: "Company created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating company:", error);
      toast({
        title: "Error",
        description: "Failed to create company",
        variant: "destructive",
      });
    },
  });

  // Update a company
  const updateCompany = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CompanyFormData }) => {
      setIsUpdating(true);
      try {
        const response = await axios.patch(`/api/companies/${id}`, data);
        return response.data.company;
      } finally {
        setIsUpdating(false);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["company", variables.id] });
      toast({
        title: "Success",
        description: "Company updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating company:", error);
      toast({
        title: "Error",
        description: "Failed to update company",
        variant: "destructive",
      });
    },
  });

  // Delete a company
  const deleteCompany = useMutation({
    mutationFn: async (id: string) => {
      setIsDeleting(true);
      try {
        const response = await axios.delete(`/api/companies/${id}`);
        return response.data;
      } finally {
        setIsDeleting(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast({
        title: "Success",
        description: "Company deleted successfully",
      });
    },
    onError: (error: unknown) => {
      console.error("Error deleting company:", error);
      const errorMessage = axios.isAxiosError(error) 
        ? error.response?.data?.details || "Failed to delete company"
        : "Failed to delete company";
        
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Search companies
  const searchCompanies = useCallback(async (query: string) => {
    if (!query) return [];
    const response = await axios.get(`/api/companies/search?q=${query}`);
    return response.data.companies;
  }, []);

  return {
    companies,
    isLoadingCompanies,
    companiesError,
    refetchCompanies,
    fetchCompany,
    fetchCompanyStats,
    createCompany,
    updateCompany,
    deleteCompany,
    searchCompanies,
    isCreating,
    isUpdating,
    isDeleting,
  };
} 