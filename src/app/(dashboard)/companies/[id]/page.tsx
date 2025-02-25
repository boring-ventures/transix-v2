import type { Metadata } from "next";
import CompanyDetailClient from "./company-detail-client";


export const metadata: Metadata = {
  title: "Company Details | Transix",
  description: "View company details",
};

export default function CompanyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <CompanyDetailClient id={params.id} />;
} 