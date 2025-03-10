// Define shared types for the ticket sales form components
import type { Location as ApiLocation } from "@/hooks/use-locations";
import type { Route as ApiRoute } from "@/hooks/use-routes";
import type { Schedule as ApiSchedule } from "@/hooks/use-schedules";
import type { BusSeat as ApiBusSeat } from "@/hooks/use-bus-seats";
import type { Customer as ApiCustomer } from "@/hooks/use-customers";

// Form steps
export type Step = "route" | "schedule" | "seats" | "review" | "confirmation";

// Form data structure
export interface FormData {
  originId: string;
  destinationId: string;
  scheduleId: string;
  selectedSeats: string[];
  passengers: Passenger[];
  customerId?: string; // Main customer ID for the purchase
  customer?: ApiCustomer; // Main customer data
}

export interface Passenger {
  fullName: string;
  documentId: string;
  seatNumber: string;
  busSeatId?: string; // Added for API integration
  customerId?: string; // Link to customer record
  customer?: ApiCustomer; // Customer data
  phone?: string; // Additional contact info
  email?: string; // Additional contact info
}

// Location type (using API type)
export type Location = ApiLocation;

// Route type (using API type)
export type Route = ApiRoute;

// Schedule type (using API type)
export type Schedule = ApiSchedule;

// Seat type (using API type)
export type Seat = ApiBusSeat & {
  isSelected?: boolean;
  isAvailable?: boolean;
};

// Customer type (using API type)
export type Customer = ApiCustomer;

// Define our own Ticket type instead of importing it
export interface Ticket {
  id: string;
  scheduleId: string;
  busSeatId: string;
  customerId?: string;
  status: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

// Step indicator props
export interface StepIndicatorProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  active: boolean;
  completed: boolean;
  onClick: () => void;
}

// Props for step components
export interface StepComponentProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  formatDate: (date: Date | string) => string;
  formatTime: (date: Date | string) => string;
  calculateTotalPrice: () => number;
}

// Search params for schedules
export interface ScheduleSearchParams {
  originId: string;
  destinationId: string;
  departureDate: string;
  returnDate?: string;
  passengers?: number;
}
