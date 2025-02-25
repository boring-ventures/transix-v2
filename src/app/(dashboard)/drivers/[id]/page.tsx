import type { Metadata } from "next";
import DriverDetailClient from "./driver-detail-client";

export const metadata: Metadata = {
  title: "Detalle de Conductor | Transix",
  description: "Ver y gestionar detalles del conductor",
};

interface DriverDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DriverDetailPage({ params }: DriverDetailPageProps) {
  const { id } = await params;
  return <DriverDetailClient id={id} />;
} 