import type { Bus } from "./bus";
import type { Driver } from "./driver";
import type { Route, RouteSchedule } from "./route";
import type { BusLog } from "./log";
import type { Ticket } from "./ticket";
import type { Parcel } from "./parcel";

export type ScheduleStatus = "scheduled" | "in_progress" | "delayed" | "completed" | "cancelled";

export interface Schedule {
  id: string;
  routeScheduleId: string;
  routeSchedule?: RouteSchedule & { route?: Route };
  busId: string;
  bus?: Bus;
  primaryDriverId: string;
  primaryDriver?: Driver;
  secondaryDriverId?: string;
  secondaryDriver?: Driver;
  departureDate: Date | string;
  estimatedArrivalTime: Date | string;
  actualDepartureTime?: Date | string;
  actualArrivalTime?: Date | string;
  status: ScheduleStatus;
  price: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  tickets?: Ticket[];
  parcels?: Parcel[];
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