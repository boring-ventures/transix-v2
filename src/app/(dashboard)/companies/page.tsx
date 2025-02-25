import type { Metadata } from "next";
import CompaniesClient from "./companies-client";

export const metadata: Metadata = {
  title: "Empresas | Transix",
  description: "Gestionar empresas de transporte",
};

export default function CompaniesPage() {
  return <CompaniesClient />;
} 