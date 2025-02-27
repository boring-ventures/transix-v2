import type { 
  Ticket as PrismaTicket, 
  TicketStatus as PrismaTicketStatus 
} from "@prisma/client";

export type TicketStatus = PrismaTicketStatus;

export interface Ticket extends PrismaTicket {
  status: TicketStatus;
}

export interface TicketWithRelations extends Ticket {
  schedule: {
    id: string;
    departureDate: Date;
    estimatedArrivalTime: Date;
    status: string;
    routeSchedule: {
      route: {
        id: string;
        name: string;
        origin: {
          id: string;
          name: string;
        };
        destination: {
          id: string;
          name: string;
        };
      };
    };
    bus?: {
      id: string;
      plateNumber: string;
    } | null;
  };
  customer?: {
    id: string;
    fullName: string;
    documentId?: string;
    phone?: string;
    email?: string;
  } | null;
  busSeat: {
    id: string;
    seatNumber: string;
    tier: {
      id: string;
      name: string;
      basePrice: number;
    };
  };
  profile?: {
    id: string;
    fullName: string;
    email?: string;
  } | null;
  paymentLines?: Array<{
    id: string;
    amount: number;
    payment: {
      id: string;
      method: string;
      reference: string;
      amount: number;
      status: string;
    };
  }>;
  cancellations?: Array<{
    id: string;
    reason: string;
    cancelledAt: Date;
  }>;
  reassignments?: Array<{
    id: string;
    reason: string;
    reassignedAt: Date;
    oldSchedule: {
      id: string;
      departureDate: Date;
    };
    newSchedule: {
      id: string;
      departureDate: Date;
    };
  }>;
}

export interface TicketStats {
  totalSeats: number;
  occupiedSeats: number;
  availableSeats: number;
  occupancyRate: number;
}

export interface TicketFormData {
  scheduleId: string;
  customerId?: string;
  busSeatId: string;
  price: number;
  purchasedBy?: string;
  notes?: string;
}

export interface BulkTicketFormData {
  scheduleId: string;
  busSeatIds: string[];
  customerId?: string;
  price: number;
  purchasedBy?: string;
  notes?: string;
} 