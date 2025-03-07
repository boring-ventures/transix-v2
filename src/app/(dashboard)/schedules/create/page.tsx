import { Metadata } from "next";
import { CreateSchedulePage } from "../components/create-schedule-page";

export const metadata: Metadata = {
  title: "Crear Viaje | Transix",
  description: "Crear un nuevo viaje programado",
};

export default function Page() {
  return <CreateSchedulePage />;
}
