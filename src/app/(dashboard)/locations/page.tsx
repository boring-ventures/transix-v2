import type { Metadata } from "next";
import LocationsClient from "./locations-client";

export const metadata: Metadata = {
  title: "Ubicaciones | Transix",
  description: "Gestionar ubicaciones del sistema",
};

export default function LocationsPage() {
  return <LocationsClient />;
} 