import { useCallback } from "react";
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
  address?: string;
  city?: string;
  active: boolean;
};

export type CompanyStats = {
  branchesCount: number;
  profilesCount: number;
  busesCount: number;
  driversCount: number;
};

export type CompanyFormData = {
  name: string;
  active: boolean;
};

export function useCompanies(fetchInactive = false) {
  const queryClient = useQueryClient();

  // Fetch all companies (active by default)
  const {
    data: companies = [],
    isLoading: isLoadingCompanies,
    error: companiesError,
    refetch: refetchCompanies,
  } = useQuery({
    queryKey: ["companies", { fetchInactive }],
    queryFn: async () => {
      const response = await axios.get(
        `/api/companies${fetchInactive ? "?includeInactive=true" : ""}`
      );
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
      const response = await axios.post("/api/companies", data);
      return response.data.company;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast({
        title: "Éxito",
        description: "Empresa creada exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al crear la empresa",
        variant: "destructive",
      });
    },
  });

  // Update an existing company
  const updateCompany = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CompanyFormData }) => {
      const response = await axios.patch(`/api/companies/${id}`, data);
      return response.data.company;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast({
        title: "Éxito",
        description: "Empresa actualizada exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al actualizar la empresa",
        variant: "destructive",
      });
    },
  });

  // Soft delete a company (set active to false)
  const deleteCompany = useMutation({
    mutationFn: async (id: string) => {
      // Instead of DELETE, we'll use PATCH to update the active status
      const response = await axios.patch(`/api/companies/${id}/deactivate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast({
        title: "Éxito",
        description: "Empresa desactivada exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Error al desactivar la empresa";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Search companies
  const searchCompanies = useCallback(async (query: string) => {
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
    isCreating: createCompany.isPending,
    isUpdating: updateCompany.isPending,
    isDeleting: deleteCompany.isPending,
  };
}
