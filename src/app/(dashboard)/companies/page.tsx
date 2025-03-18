"use client";

import { ConditionalUI } from "@/components/auth/ConditionalUI";
import CompaniesClient from "./companies-client";

export default function CompaniesPage() {
  return (
    <ConditionalUI
      allowedRoles={["superadmin"]}
      showAccessDenied={true}
      message="Solo los administradores del sistema pueden gestionar empresas."
    >
      <CompaniesClient />
    </ConditionalUI>
  );
}
