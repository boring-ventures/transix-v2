"use client";

import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

interface AccessDeniedProps {
  message?: string;
  redirectUrl?: string;
  redirectText?: string;
}

export function AccessDenied({
  message = "No tienes permiso para acceder a esta página.",
  redirectUrl = "/dashboard",
  redirectText = "Volver al Panel Principal",
}: AccessDeniedProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="flex flex-col items-center max-w-md text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
        <p className="text-muted-foreground mb-6">{message}</p>
        <Button onClick={() => router.push(redirectUrl)}>{redirectText}</Button>
      </div>
    </div>
  );
}
