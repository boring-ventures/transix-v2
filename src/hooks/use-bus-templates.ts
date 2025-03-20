import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import type { Company } from "@/hooks/use-companies";
import { useCompanyFilter } from "./use-company-filter";

export type BusTemplate = {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  totalCapacity: number;
  seatTemplateMatrix: SeatTemplateMatrix;
  type: string;
  seatsLayout: string;
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
  seatTemplateMatrix: SeatTemplateMatrix;
  type: string;
  seatsLayout: string;
  isActive?: boolean;
};

/**
 * Represents the dimensions of a floor in a bus seat matrix
 */
export interface SeatMatrixDimensions {
  rows: number;
  seatsPerRow: number;
}

/**
 * Represents a single seat position in the bus
 */
export interface SeatPosition {
  id: string; // Unique identifier for the seat (e.g., "1A", "21B")
  name: string; // Display name for the seat
  row: number; // Zero-based row index
  column: number; // Zero-based column index
  tierId: string; // ID of the seat tier (e.g., "economy", "business")
  isEmpty: boolean; // Whether this position is empty (not a seat)
  status: string; // Initial status of the seat ("available", "maintenance")
  floor?: "first" | "second"; // Which floor the seat belongs to
}

/**
 * Represents a floor in the bus seat matrix
 */
export interface SeatMatrixFloor {
  dimensions: SeatMatrixDimensions; // Dimensions of this floor
  seats: SeatPosition[]; // Array of seats on this floor
}

/**
 * Represents the complete seat matrix for a bus
 */
export interface SeatTemplateMatrix {
  firstFloor: SeatMatrixFloor; // First floor configuration
  secondFloor?: SeatMatrixFloor; // Optional second floor configuration
}

/**
 * Enum for seat layout types
 */
export enum SeatLayoutType {
  SINGLE_FLOOR = "single_floor",
  DOUBLE_FLOOR = "double_floor",
}

/**
 * Enum for bus types
 */
export enum BusType {
  STANDARD = "standard",
  LUXURY = "luxury",
  MINIBUS = "minibus",
  DOUBLE_DECKER = "double_decker",
}

/**
 * Represents the seat matrix used in the bus management components
 */
export interface SeatMatrix {
  firstFloor: {
    dimensions: { rows: number; seatsPerRow: number };
    seats: SeatPosition[];
  };
  secondFloor?: {
    dimensions: { rows: number; seatsPerRow: number };
    seats: SeatPosition[];
  };
}

export function useBusTemplates(isActive?: boolean) {
  const queryClient = useQueryClient();
  const { companyId: userCompanyId, isCompanyRestricted } = useCompanyFilter();

  const {
    data: templates = [],
    isLoading: isLoadingTemplates,
    error: templatesError,
    refetch: refetchTemplates,
  } = useQuery({
    queryKey: ["busTemplates", { isActive, userCompanyId }],
    queryFn: async () => {
      let url = "/api/bus-templates";
      const params = new URLSearchParams();

      if (isActive !== undefined) {
        params.append("isActive", String(isActive));
      }

      // If user is company_admin, branch_admin or seller, automatically filter by their company
      if (userCompanyId) {
        params.append("companyId", userCompanyId);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url);
      return response.data.templates || [];
    },
  });

  // Fetch a single bus template by ID
  const fetchTemplate = useCallback(async (id: string) => {
    const response = await axios.get(`/api/bus-templates/${id}`);
    return response.data.template;
  }, []);

  // Create a new bus template
  const createTemplate = useMutation({
    mutationFn: async (data: BusTemplateFormData) => {
      // If user is restricted to a company, enforce their company ID
      const finalData = isCompanyRestricted
        ? { ...data, companyId: userCompanyId }
        : data;

      const response = await axios.post("/api/bus-templates", finalData);
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
      console.error("Error creating bus template:", error);
      toast({
        title: "Error",
        description: "Error al crear la plantilla de bus",
        variant: "destructive",
      });
    },
  });

  // Update an existing bus template
  const updateTemplate = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<BusTemplateFormData>;
    }) => {
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
      console.error("Error updating bus template:", error);
      toast({
        title: "Error",
        description: "Error al actualizar la plantilla de bus",
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
      console.error("Error deleting bus template:", error);
      toast({
        title: "Error",
        description: "Error al eliminar la plantilla de bus",
        variant: "destructive",
      });
    },
  });

  // Search bus templates
  const searchTemplates = useCallback(
    async (query: string, options?: { companyId?: string; limit?: number }) => {
      const params = new URLSearchParams();
      params.append("q", query);

      if (options?.companyId) params.append("companyId", options.companyId);
      if (options?.limit) params.append("limit", options.limit.toString());

      const response = await axios.get(
        `/api/bus-templates/search?${params.toString()}`
      );
      return response.data.templates;
    },
    []
  );

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
    userCompanyId,
    isCompanyRestricted,
  };
}
