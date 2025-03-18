import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

interface BulkTicketData {
  scheduleId: string;
  busSeatId: string;
  customerId?: string;
  price: number;
  notes?: string;
  passengerName?: string;
  passengerDocument?: string;
  contactPhone?: string;
  contactEmail?: string;
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
          let errorMessage = "Failed to create tickets";
          try {
            const errorData = await response.json();
            console.error("Bulk tickets error:", errorData);
            errorMessage = errorData.error || errorMessage;
          } catch (jsonError) {
            console.error("Error parsing error response:", jsonError);
            errorMessage = `Request failed with status: ${response.status}`;
          }
          throw new Error(errorMessage);
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
