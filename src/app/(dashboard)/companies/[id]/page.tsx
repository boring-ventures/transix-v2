import type { Metadata } from "next";
import CompanyDetailClient from "./company-detail-client";

export const metadata: Metadata = {
  title: "Detalles de Empresa | Transix",
  description: "Ver detalles de la empresa",
};

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CompanyDetailClient id={id} />;
} 