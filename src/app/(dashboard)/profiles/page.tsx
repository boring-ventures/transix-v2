import type { Metadata } from "next";
import ProfilesClient from "./profiles-client";

export const metadata: Metadata = {
  title: "Usuarios | Transix",
  description: "Gestionar usuarios del sistema",
};

export default function ProfilesPage() {
  return <ProfilesClient />;
} 