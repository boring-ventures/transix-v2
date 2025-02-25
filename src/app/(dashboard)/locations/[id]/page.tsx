import type { Metadata } from "next";
import LocationDetailClient from "./location-detail-client";

export const metadata: Metadata = {
  title: "Detalle de Ubicación | Transix",
  description: "Ver y gestionar detalles de la ubicación",
};

interface LocationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LocationDetailPage({ params }: LocationDetailPageProps) {
  const { id } = await params;
  return <LocationDetailClient id={id} />;
} 