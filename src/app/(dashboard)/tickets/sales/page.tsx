"use client";

import { ConditionalUI } from "@/components/auth/ConditionalUI";
import TicketSalesForm from "../components/ticket-sales-form";

export default function TicketSalesPage() {
  return (
    <ConditionalUI
      allowedRoles={["superadmin", "company_admin", "branch_admin", "seller"]}
    >
      <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Venta de Tickets
          </h1>
          <p className="text-muted-foreground">
            Complete el formulario para vender tickets
          </p>
        </div>
      </div>
      <TicketSalesForm />
    </div>
    </ConditionalUI>
  );
}
