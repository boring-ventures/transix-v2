import type { Metadata } from "next";
import DriversClient from "./drivers-client";

export const metadata: Metadata = {
  title: "Conductores | Transix",
  description: "Gestionar conductores del sistema",
};

export default function DriversPage() {
  return <DriversClient />;
} 