import type { Metadata } from "next";
import CompaniesClient from "./companies-client";

export const metadata: Metadata = {
  title: "Companies | Transix",
  description: "Manage transportation companies",
};

export default function CompaniesPage() {
  return <CompaniesClient />;
} 