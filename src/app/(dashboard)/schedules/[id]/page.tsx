import { Metadata } from "next";
import ScheduleDetailClient from "./schedule-detail-client";

interface ScheduleDetailPageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: "Detalle de Viaje",
  description: "Información detallada del viaje programado",
};

export default async function ScheduleDetailPage({ params }: ScheduleDetailPageProps) {
  return <ScheduleDetailClient id={params.id} />;
} 