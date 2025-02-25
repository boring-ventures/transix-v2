import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import type { Role } from "@prisma/client";
import type { Company } from "@/hooks/use-companies";

export type Profile = {
  id: string;
  userId: string;
  username?: string;
  fullName: string;
  email?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  birthDate?: Date | null;
  role: Role;
  active: boolean;
  companyId?: string | null;
  branchId?: string | null;
  createdAt: string;
  updatedAt: string;
  company?: Company | null;
  branch?: Branch | null;
};

export type Branch = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  active: boolean;
};

export type ProfileFormData = {
  fullName?: string;
  username?: string;
  email?: string;
  bio?: string | null;
  birthDate?: Date | null;
  role?: Role;
  active?: boolean;
  companyId?: string | null;
  branchId?: string | null;
  avatarUrl?: string | null;
};

export function useProfiles(companyId?: string, fetchInactive = false) {
  const queryClient = useQueryClient();

  // Fetch all profiles (optionally filtered by company)
  const {
    data: profiles = [],
    isLoading: isLoadingProfiles,
    error: profilesError,
    refetch: refetchProfiles,
  } = useQuery({
    queryKey: ["profiles", { companyId, fetchInactive }],
    queryFn: async () => {
      let url = "/api/profile";
      const params = new URLSearchParams();
      
      if (companyId) params.append("companyId", companyId);
      if (!fetchInactive) params.append("active", "true");
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      return response.data.profiles;
    },
    enabled: !!companyId || companyId === undefined, // Only fetch if companyId is provided or explicitly undefined
  });

  // Fetch a single profile by ID
  const fetchProfile = useCallback(async (id: string) => {
    const response = await axios.get(`/api/profile/${id}`);
    return response.data.profile;
  }, []);

  // Create a new profile
  const createProfile = useMutation({
    mutationFn: async (data: ProfileFormData & { userId: string }) => {
      const response = await axios.post("/api/profile", data);
      return response.data.profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast({
        title: "Success",
        description: "Profile created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create profile",
        variant: "destructive",
      });
    },
  });

  // Update an existing profile
  const updateProfile = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProfileFormData }) => {
      const response = await axios.patch(`/api/profile/${id}`, data);
      return response.data.profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Assign a company to a profile
  const assignCompany = useMutation({
    mutationFn: async ({ 
      id, 
      companyId, 
      branchId, 
      role 
    }: { 
      id: string; 
      companyId: string; 
      branchId?: string; 
      role?: Role 
    }) => {
      const response = await axios.post(`/api/profile/${id}/assign-company`, {
        companyId,
        branchId,
        role,
      });
      return response.data.profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast({
        title: "Success",
        description: "Company assigned successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign company",
        variant: "destructive",
      });
    },
  });

  // Delete a profile
  const deleteProfile = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/profile/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast({
        title: "Success",
        description: "Profile deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete profile",
        variant: "destructive",
      });
    },
  });

  // Search profiles
  const searchProfiles = useCallback(async (query: string, options?: { companyId?: string; role?: Role; limit?: number }) => {
    const params = new URLSearchParams();
    params.append("q", query);
    
    if (options?.companyId) params.append("companyId", options.companyId);
    if (options?.role) params.append("role", options.role);
    if (options?.limit) params.append("limit", options.limit.toString());
    
    const response = await axios.get(`/api/profile/search?${params.toString()}`);
    return response.data.profiles;
  }, []);

  return {
    profiles,
    isLoadingProfiles,
    profilesError,
    refetchProfiles,
    fetchProfile,
    createProfile,
    updateProfile,
    assignCompany,
    deleteProfile,
    searchProfiles,
    isCreating: createProfile.isPending,
    isUpdating: updateProfile.isPending,
    isDeleting: deleteProfile.isPending,
    isAssigningCompany: assignCompany.isPending,
  };
} 