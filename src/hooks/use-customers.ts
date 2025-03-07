import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

export type Customer = {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  documentId?: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomerFormData = {
  fullName: string;
  phone?: string;
  email?: string;
  documentId?: string;
};

export function useCustomers(initialQuery?: {
  documentId?: string;
  email?: string;
  phone?: string;
  fullName?: string;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCustomers = useCallback(
    async (query?: {
      documentId?: string;
      email?: string;
      phone?: string;
      fullName?: string;
    }) => {
      setIsLoading(true);
      setError(null);

      try {
        // Build query string
        const params = new URLSearchParams();
        if (query?.documentId) params.append("documentId", query.documentId);
        if (query?.email) params.append("email", query.email);
        if (query?.phone) params.append("phone", query.phone);
        if (query?.fullName) params.append("fullName", query.fullName);

        const response = await fetch(`/api/customers?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Failed to fetch customers");
        }

        const data = await response.json();
        setCustomers(data.customers);
        return data.customers;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        toast({
          title: "Error",
          description: "Failed to fetch customers",
          variant: "destructive",
        });
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const createCustomer = useCallback(
    async (customerData: CustomerFormData) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/customers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(customerData),
        });

        const data = await response.json();

        if (!response.ok) {
          // If customer already exists, return it
          if (response.status === 409 && data.customer) {
            toast({
              title: "Customer already exists",
              description: "Using existing customer record",
            });
            return data.customer;
          }

          throw new Error(data.error || "Failed to create customer");
        }

        toast({
          title: "Success",
          description: "Customer created successfully",
        });

        // Refresh the customer list
        fetchCustomers();

        return data.customer;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        toast({
          title: "Error",
          description: "Failed to create customer",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchCustomers, toast]
  );

  const findCustomerByDocument = useCallback(
    async (documentId: string) => {
      if (!documentId) return null;

      try {
        const foundCustomers = await fetchCustomers({ documentId });
        return foundCustomers.length > 0 ? foundCustomers[0] : null;
      } catch (err) {
        console.error("Error finding customer by document:", err);
        return null;
      }
    },
    [fetchCustomers]
  );

  // Initial fetch
  useEffect(() => {
    if (initialQuery) {
      fetchCustomers(initialQuery);
    }
  }, [fetchCustomers, initialQuery]);

  return {
    customers,
    isLoading,
    error,
    fetchCustomers,
    createCustomer,
    findCustomerByDocument,
  };
}
