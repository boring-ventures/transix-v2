import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { Schedule } from "@/types/schedule";

interface UseScheduleOptions {
  include?: string;
}

interface UseScheduleReturn {
  schedule: Schedule | null;
  isLoading: boolean;
  error: unknown;
  mutate: () => Promise<void>;
}

export function useSchedule(id: string, options: UseScheduleOptions = {}): UseScheduleReturn {
  const { include = "" } = options;
  const queryClient = useQueryClient();
  
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["schedule", id, include],
    queryFn: async () => {
      const includeQuery = include ? `?include=${include}` : "";
      const response = await axios.get(`/api/schedules/${id}${includeQuery}`);
      return response.data.schedule;
    },
  });

  const mutate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["schedule", id] });
  };

  return {
    schedule: data || null,
    isLoading,
    error,
    mutate,
  };
} 