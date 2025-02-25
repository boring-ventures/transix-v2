import type { Metadata } from "next";
import BusTemplateDetailClient from "./bus-template-detail-client";

export const metadata: Metadata = {
  title: "Detalle de Plantilla | Transix",
  description: "Ver y gestionar detalles de la plantilla de bus",
};

interface BusTemplateDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BusTemplateDetailPage({ params }: BusTemplateDetailPageProps) {
  const { id } = await params;
  return <BusTemplateDetailClient id={id} />;
} 