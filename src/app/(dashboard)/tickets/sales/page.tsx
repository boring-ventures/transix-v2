"use client";

import { ConditionalUI } from "@/components/auth/ConditionalUI";

export default function TicketSalesPage() {
  return (
    <ConditionalUI
      allowedRoles={["superadmin", "company_admin", "branch_admin", "seller"]}
    >
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Venta de Tickets</h1>

        <div className="grid gap-6">
          <div className="border rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Sistema de Venta</h2>
            <p>Interfaz para la venta de tickets de viaje.</p>
          </div>
        </div>
      </div>
    </ConditionalUI>
  );
}
