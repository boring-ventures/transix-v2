import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import type { Company } from "@/hooks/use-companies";

export type BusTemplate = {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  totalCapacity: number;
  seatTemplateMatrix: SeatTemplateMatrix; // This should be properly typed based on your matrix structure
  type: string;
  seatsLayout: SeatMatrixFloor; // This should be properly typed based on your layout structure
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  company?: Company;
  _count?: {
    buses: number;
  };
};

export type BusTemplateFormData = {
  name: string;
  description?: string;
  companyId: string;
  totalCapacity: number;
  seatTemplateMatrix: SeatTemplateMatrix; // This should match your matrix structure
  type: string;
  seatsLayout: SeatMatrixFloor; // This should match your layout structure
  isActive?: boolean;
};

export interface SeatMatrixDimensions {
  rows: number;
  seatsPerRow: number;
}

export interface SeatPosition {
  id: string;
  name: string;
  row: number;
  column: number;
  tierId: string;
  isEmpty: boolean;
  status: string;
}

export interface SeatMatrixFloor {
  dimensions: SeatMatrixDimensions;
  seats: SeatPosition[];
}

export interface SeatMatrix {
  firstFloor: SeatMatrixFloor;
  secondFloor?: SeatMatrixFloor;
}

export interface SeatTemplateMatrix {
  firstFloor: SeatMatrixFloor;
  secondFloor?: SeatMatrixFloor;
}

export function useBusTemplates(companyId?: string, fetchInactive = false) {
  const queryClient = useQueryClient();

  // Fetch all bus templates (optionally filtered by company)
  const {
    data: templates = [],
    isLoading: isLoadingTemplates,
    error: templatesError,
    refetch: refetchTemplates,
  } = useQuery({
    queryKey: ["busTemplates", { companyId, fetchInactive }],
    queryFn: async () => {
      let url = "/api/bus-templates";
      const params = new URLSearchParams();
      
      if (companyId) params.append("companyId", companyId);
      if (!fetchInactive) params.append("isActive", "true");
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      return response.data.templates;
    },
    enabled: !!companyId || companyId === undefined, // Only fetch if companyId is provided or explicitly undefined
  });

  // Fetch a single bus template by ID
  const fetchTemplate = useCallback(async (id: string) => {
    const response = await axios.get(`/api/bus-templates/${id}`);
    return response.data.template;
  }, []);

  // Create a new bus template
  const createTemplate = useMutation({
    mutationFn: async (data: BusTemplateFormData) => {
      const response = await axios.post("/api/bus-templates", data);
      return response.data.template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["busTemplates"] });
      toast({
        title: "Éxito",
        description: "Plantilla de bus creada exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al crear la plantilla de bus";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update an existing bus template
  const updateTemplate = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BusTemplateFormData> }) => {
      const response = await axios.patch(`/api/bus-templates/${id}`, data);
      return response.data.template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["busTemplates"] });
      toast({
        title: "Éxito",
        description: "Plantilla de bus actualizada exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al actualizar la plantilla de bus";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Delete a bus template
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/bus-templates/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["busTemplates"] });
      toast({
        title: "Éxito",
        description: "Plantilla de bus eliminada exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al eliminar la plantilla de bus";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Search bus templates
  const searchTemplates = useCallback(async (query: string, options?: { companyId?: string; limit?: number }) => {
    const params = new URLSearchParams();
    params.append("q", query);
    
    if (options?.companyId) params.append("companyId", options.companyId);
    if (options?.limit) params.append("limit", options.limit.toString());
    
    const response = await axios.get(`/api/bus-templates/search?${params.toString()}`);
    return response.data.templates;
  }, []);

  return {
    templates,
    isLoadingTemplates,
    templatesError,
    refetchTemplates,
    fetchTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    searchTemplates,
    isCreating: createTemplate.isPending,
    isUpdating: updateTemplate.isPending,
    isDeleting: deleteTemplate.isPending,
  };
} 