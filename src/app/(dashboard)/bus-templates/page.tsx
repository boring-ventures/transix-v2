import type { Metadata } from "next";
import BusTemplatesClient from "./bus-templates-client";

export const metadata: Metadata = {
  title: "Plantillas de Bus | Transix",
  description: "Gestionar plantillas de buses para la flota",
};

export default function BusTemplatesPage() {
  return <BusTemplatesClient />;
} 