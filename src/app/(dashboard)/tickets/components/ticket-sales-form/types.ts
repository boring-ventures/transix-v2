// Define shared types for the ticket sales form components
import type { Location as ApiLocation } from "@/hooks/use-locations";
import type { Route as ApiRoute } from "@/hooks/use-routes";
import type { Schedule as ApiSchedule } from "@/hooks/use-schedules";
import type { BusSeat as ApiBusSeat } from "@/hooks/use-bus-seats";

// Form steps
export type Step = "route" | "schedule" | "seats" | "review";

// Form data structure
export interface FormData {
  originId: string;
  destinationId: string;
  scheduleId: string;
  selectedSeats: string[];
  passengers: Passenger[];
}

export interface Passenger {
  fullName: string;
  documentId: string;
  seatNumber: string;
  busSeatId?: string; // Added for API integration
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
