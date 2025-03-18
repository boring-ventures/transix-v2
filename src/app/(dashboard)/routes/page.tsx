"use client";

import { ConditionalUI } from "@/components/auth/ConditionalUI";

export default function RoutesPage() {
  return (
    <ConditionalUI
      allowedRoles={["superadmin", "company_admin"]}
      showAccessDenied={true}
      message="Solo los administradores pueden gestionar rutas."
    >
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Gestión de Rutas</h1>

        <div className="grid gap-6">
          <div className="border rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Lista de Rutas</h2>
            <p>
              Aquí aparecerá el listado de rutas configuradas en el sistema.
            </p>
          </div>
        </div>
      </div>
    </ConditionalUI>
  );
}
