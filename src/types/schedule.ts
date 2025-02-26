import type {
  Bus,
  Driver,
  Schedule as PrismaSchedule,
  BusLog,
} from "@prisma/client";

export type ScheduleStatus =
  | "scheduled"
  | "in_progress"
  | "delayed"
  | "completed"
  | "cancelled";

export interface Schedule extends Omit<PrismaSchedule, "status"> {
  status: ScheduleStatus;
  bus?: Bus;
  primaryDriver?: Driver;
  secondaryDriver?: Driver;
  routeSchedule?: {
    id: string;
    routeId: string;
    departureTime: string;
    estimatedArrivalTime: string;
    operatingDays: string;
    route?: {
      id: string;
      name: string;
      originId: string;
      destinationId: string;
      estimatedDuration: number;
    };
  };
  tickets?: Array<{
    id: string;
    status: string;
    price: number;
  }>;
  parcels?: Array<{
    id: string;
    status: string;
    price: number;
  }>;
  busLogs?: BusLog[];
  _count?: {
    tickets: number;
    parcels: number;
    busLogs: number;
    occupancyLogs: number;
  };
}

export interface ScheduleStatusUpdate {
  status: ScheduleStatus;
}
