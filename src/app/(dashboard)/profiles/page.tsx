"use client";

import { ConditionalUI } from "@/components/auth/ConditionalUI";
import ProfilesClient from "./profiles-client";

export default function ProfilesPage() {
  return (
    <ConditionalUI
      allowedRoles={["superadmin", "company_admin"]}
      showAccessDenied={true}
      message="Solo los administradores pueden gestionar usuarios."
      redirectUrl="/dashboard"
      redirectText="Volver al Panel Principal"
    >
      <ProfilesClient />
    </ConditionalUI>
  );
}
