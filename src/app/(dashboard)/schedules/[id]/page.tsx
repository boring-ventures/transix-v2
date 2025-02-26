import type { Metadata } from "next";
import ScheduleDetailClient from "./schedule-detail-client";

export const metadata: Metadata = {
  title: "Detalle de Viaje",
  description: "Ver detalles del viaje programado",
};

export default async function ScheduleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="container mx-auto py-6">
      <ScheduleDetailClient id={id} />
    </div>
  );
} 