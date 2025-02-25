import type { Metadata } from "next";
import ProfileDetailClient from "./profile-detail-client";

export const metadata: Metadata = {
  title: "Detalle de Usuario | Transix",
  description: "Ver y gestionar detalles del usuario",
};

interface ProfileDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfileDetailPage({ params }: ProfileDetailPageProps) {
  const { id } = await params;
  return <ProfileDetailClient id={id} />;
} 