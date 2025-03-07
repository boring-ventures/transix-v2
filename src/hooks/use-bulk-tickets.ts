import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

interface BulkTicketData {
  scheduleId: string;
  busSeatId: string;
  customerId?: string;
  price: number;
  notes?: string;
}

export function useBulkTickets() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const createBulkTickets = useCallback(
    async (tickets: BulkTicketData[], purchasedBy?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("Creating bulk tickets:", { tickets, purchasedBy });

        const response = await fetch("/api/tickets/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tickets, purchasedBy }),
        });

        console.log("Bulk tickets response status:", response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Bulk tickets error:", errorData);
          throw new Error(errorData.error || "Failed to create tickets");
        }

        const data = await response.json();
        console.log("Bulk tickets success:", data);
        toast({
          title: "Tickets creados",
          description: `${data.tickets.length} tickets creados exitosamente`,
        });
        return data.tickets;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        toast({
          title: "Error",
          description: "Ha ocurrido un error al crear los tickets",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  return {
    isLoading,
    error,
    createBulkTickets,
  };
} 