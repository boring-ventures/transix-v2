import type { Metadata } from "next";
import RoutesClient from "./routes-client";

export const metadata: Metadata = {
  title: "Rutas | Transix",
  description: "Gestionar rutas del sistema",
};

export default function RoutesPage() {
  return <RoutesClient />;
} 