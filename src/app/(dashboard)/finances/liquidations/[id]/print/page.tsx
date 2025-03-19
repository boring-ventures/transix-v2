"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import LiquidationPrint from "../../../components/liquidation-print";
import { ConditionalUI } from "@/components/auth/ConditionalUI";

export default function LiquidationPrintPage() {
  const params = useParams();
  const liquidationId = params.id as string;

  useEffect(() => {
    // Auto-print when component is mounted
    const timer = setTimeout(() => {
      window.print();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ConditionalUI
      allowedRoles={["superadmin", "company_admin", "branch_admin"]}
    >
      <div className="container mx-auto py-6">
        <LiquidationPrint
          liquidationId={liquidationId}
          onPrint={() => window.print()}
        />
      </div>
    </ConditionalUI>
  );
}
