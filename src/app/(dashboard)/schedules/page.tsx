import type { Metadata } from "next";
import SchedulesClient from "./schedules-client";

export const metadata: Metadata = {
  title: "Viajes Programados",
  description: "Gestión de viajes programados",
};

export default function SchedulesPage() {
  return <SchedulesClient />;
} 