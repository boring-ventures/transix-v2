import type { Metadata } from "next";
import RouteDetailClient from "./route-detail-client";

export const metadata: Metadata = {
  title: "Detalle de Ruta | Transix",
  description: "Ver y gestionar detalles de la ruta",
};

interface RouteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RouteDetailPage({ params }: RouteDetailPageProps) {
  const { id } = await params;
  return <RouteDetailClient id={id} />;
} 