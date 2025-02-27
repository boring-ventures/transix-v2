import { z } from "zod";

// Base schemas for form validation
export const routeSelectionSchema = z.object({
  originId: z.string().min(1, "Origin is required"),
  destinationId: z.string().min(1, "Destination is required"), 
  departureDate: z.date({
    required_error: "Departure date is required"
  })
});

export const scheduleSelectionSchema = z.object({
  scheduleId: z.string().min(1, "Schedule is required")
});

export const seatSchema = z.object({
  id: z.string(),
  seatNumber: z.string(),
  tierId: z.string().optional(),
  price: z.number()
});

export const seatSelectionSchema = z.object({
  selectedSeats: z.array(seatSchema).min(1, "At least one seat is required")
});

export const passengerSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  documentId: z.string().min(1, "Document ID is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal(""))
});

export const passengerDetailsSchema = z.object({
  passengers: z.array(passengerSchema)
});

export const paymentSummarySchema = z.object({
  paymentMethod: z.enum(["cash", "card", "transfer"]),
  paymentReference: z.string().optional(),
  notes: z.string().optional()
});

// Combined schema for the entire form
export const ticketFormSchema = routeSelectionSchema
  .merge(scheduleSelectionSchema)
  .merge(seatSelectionSchema)
  .merge(passengerDetailsSchema)
  .merge(paymentSummarySchema);

// Types derived from schemas
export type TicketFormData = z.infer<typeof ticketFormSchema>;
export type Seat = z.infer<typeof seatSchema>;
export type Passenger = z.infer<typeof passengerSchema>;

// Additional types
export interface Schedule {
  id: string;
  departureDate: string;
  estimatedArrivalTime: string;
  price: number;
  bus?: {
    id: string;
    plateNumber: string;
    companyId: string;
  };
}

export interface Location {
  id: string;
  name: string;
  active: boolean;
}

export interface SeatTier {
  id: string;
  name: string;
  basePrice: number;
} 