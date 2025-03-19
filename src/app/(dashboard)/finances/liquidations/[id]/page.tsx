"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ConditionalUI } from "@/components/auth/ConditionalUI";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowLeft, Check, Edit, FileWarning, Printer, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LiquidationPrint from "../../components/liquidation-print";

interface LiquidationData {
  id: string;
  settledAt?: string;
  departureTime?: string;
  status: string;
  routeName?: string;
  ownerName?: string;
  plateNumber?: string;
  busType?: string;
  totalIncome?: number;
  totalExpenses?: number;
  netAmount?: number;
  totalPassengers?: number;
  tripSettlementId?: string;
  details?: string;
  expenses?: {
    id: string;
    category: string;
    description?: string;
    amount: number;
  }[];
}

const getLiquidationStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80";
    case "completed":
      return "bg-green-100 text-green-800 hover:bg-green-100/80";
    case "cancelled":
      return "bg-red-100 text-red-800 hover:bg-red-100/80";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100/80";
  }
};

export default function LiquidationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const liquidationId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liquidationData, setLiquidationData] =
    useState<LiquidationData | null>(null);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (liquidationId) {
      console.log("Fetching settlement with ID:", liquidationId);
      // Reset states
      setIsLoading(true);
      setErrorMessage(null);
      setLiquidationData(null);

      // Fetch settlement data from API
      fetch(`/api/finances/trip-settlements/${liquidationId}`)
        .then((response) => {
          console.log("API Response status:", response.status);
          if (!response.ok) {
            throw new Error(
              `Failed to fetch trip settlement: ${response.status}`
            );
          }
          return response.json();
        })
        .then((data) => {
          console.log("Trip settlement data:", data);
          if (data.error) {
            throw new Error(data.error);
          }
          setLiquidationData(data);
        })
        .catch((error) => {
          console.error("Error fetching trip settlement:", error);
          setErrorMessage(error.message || "Error fetching liquidation data");
          setLiquidationData(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [liquidationId]);

  // Handle status update
  const updateStatus = async (newStatus: string) => {
    console.log(
      `Attempting to update liquidation ${liquidationId} status to ${newStatus}`
    );
    try {
      const response = await fetch(
        `/api/finances/trip-settlements/${liquidationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      console.log(`API response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Error response:`, errorData);
        throw new Error(
          `Failed to update status to ${newStatus}: ${response.statusText}`
        );
      }

      const updatedData = await response.json();
      console.log(`Successfully updated status to ${newStatus}`, updatedData);
      setLiquidationData(updatedData);
      return true;
    } catch (error) {
      console.error(`Error updating status to ${newStatus}:`, error);
      return false;
    }
  };

  const handleApprove = async () => {
    if (confirm("¿Estás seguro de aprobar este arreglo de viaje?")) {
      console.log("User confirmed approval");
      const success = await updateStatus("COMPLETED");
      if (success) {
        alert("Arreglo de viaje aprobado exitosamente");
      } else {
        alert(
          "Error al aprobar el arreglo de viaje. Por favor, intenta de nuevo."
        );
      }
    } else {
      console.log("Approval cancelled by user");
    }
  };

  const handleReject = async () => {
    const reason = prompt("Ingresa el motivo del rechazo:");
    if (reason) {
      console.log(`User confirmed rejection with reason: ${reason}`);
      const success = await updateStatus("CANCELLED");
      if (success) {
        alert("Arreglo de viaje rechazado exitosamente");
      } else {
        alert(
          "Error al rechazar el arreglo de viaje. Por favor, intenta de nuevo."
        );
      }
    } else {
      console.log("Rejection cancelled by user");
    }
  };

  return (
    <ConditionalUI
      allowedRoles={["superadmin", "company_admin", "branch_admin"]}
    >
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Detalles de Liquidación
            </h1>
            <p className="text-muted-foreground">
              Información detallada de la liquidación
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : !liquidationData ? (
          <Card className="text-center p-6">
            <CardContent className="pt-6 flex flex-col items-center justify-center">
              <FileWarning className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Liquidación no encontrada</h3>
              <p className="text-muted-foreground mt-2">
                {errorMessage ||
                  "La liquidación solicitada no existe o ha sido eliminada."}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Button onClick={() => router.push("/finances/liquidations")}>
                  Ver Todas las Liquidaciones
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Intentar de nuevo
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <Card className="w-full md:w-2/3">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle>Arreglo de Viaje #{liquidationId}</CardTitle>
                    <CardDescription>
                      {liquidationData.settledAt &&
                        `Arreglado el ${format(
                          new Date(liquidationData.settledAt),
                          "dd/MM/yyyy HH:mm"
                        )}`}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={getLiquidationStatusColor(
                      liquidationData.status.toLowerCase()
                    )}
                  >
                    {liquidationData.status === "PENDING" && "Pendiente"}
                    {liquidationData.status === "COMPLETED" && "Completado"}
                    {liquidationData.status === "CANCELLED" && "Cancelado"}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-6">
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="details">Detalles</TabsTrigger>
                      <TabsTrigger value="print">Imprimir</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details" className="space-y-4 mt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Ruta
                          </h3>
                          <p>{liquidationData.routeName || "N/A"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Fecha/Hora
                          </h3>
                          <p>
                            {liquidationData.departureTime
                              ? format(
                                  new Date(liquidationData.departureTime),
                                  "dd/MM/yyyy HH:mm"
                                )
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Propietario
                          </h3>
                          <p>{liquidationData.ownerName || "N/A"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Placa
                          </h3>
                          <p>
                            {liquidationData.plateNumber || "N/A"}
                            {liquidationData.busType &&
                              `(${liquidationData.busType})`}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="font-medium mb-2">Ingresos</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Total de ingresos
                            </p>
                            <p className="font-medium">
                              Bs {(liquidationData.totalIncome || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="font-medium mb-2">Gastos</h3>
                        <div className="space-y-2">
                          {liquidationData.expenses &&
                            liquidationData.expenses.map((expense) => (
                              <div
                                key={expense.id}
                                className="grid grid-cols-2 gap-2"
                              >
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    {expense.category}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {expense.description}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">
                                    Bs {Number(expense.amount).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                            <div>
                              <p className="text-sm font-medium">
                                Total de gastos
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                Bs{" "}
                                {(liquidationData.totalExpenses || 0).toFixed(
                                  2
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="font-medium mb-2">Balance final</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Total de ingresos
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Total de gastos
                            </p>
                            <p className="font-medium">Monto neto</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-600">
                              + Bs{" "}
                              {(liquidationData.totalIncome || 0).toFixed(2)}
                            </p>
                            <p className="font-medium text-red-600">
                              - Bs{" "}
                              {(liquidationData.totalExpenses || 0).toFixed(2)}
                            </p>
                            <p className="font-medium">
                              Bs {(liquidationData.netAmount || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {liquidationData.details && (
                        <>
                          <Separator />
                          <div>
                            <h3 className="font-medium mb-2">
                              Notas adicionales
                            </h3>
                            <p className="text-sm">{liquidationData.details}</p>
                          </div>
                        </>
                      )}
                    </TabsContent>
                    <TabsContent value="print" className="mt-6">
                      <div className="flex flex-col gap-4">
                        <p>Vista previa de impresión</p>
                        <div className="border p-4 rounded-md">
                          <LiquidationPrint data={liquidationData} />
                        </div>
                        <Button onClick={() => window.print()}>
                          <Printer className="mr-2 h-4 w-4" />
                          Imprimir
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  {liquidationData.status === "PENDING" && (
                    <>
                      <Button variant="destructive" onClick={handleReject}>
                        <X className="mr-2 h-4 w-4" />
                        Rechazar
                      </Button>
                      <Button variant="outline" asChild>
                        <a
                          href={`/finances/liquidations/${liquidationId}/edit`}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </a>
                      </Button>
                      <Button variant="default" onClick={handleApprove}>
                        <Check className="mr-2 h-4 w-4" />
                        Aprobar
                      </Button>
                    </>
                  )}

                  {liquidationData.status === "COMPLETED" && (
                    <>
                      <Button variant="outline" asChild>
                        <a
                          href={`/finances/liquidations/${liquidationId}/edit`}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </a>
                      </Button>
                    </>
                  )}

                  {(liquidationData.status === "CANCELLED" ||
                    liquidationData.status === "COMPLETED") && (
                    <Button variant="outline" asChild>
                      <a
                        href={`/finances/liquidations/${liquidationId}/print`}
                        target="_blank"
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir
                      </a>
                    </Button>
                  )}
                </CardFooter>
              </Card>

              <Card className="w-full md:w-1/3">
                <CardHeader>
                  <CardTitle>Información del Viaje</CardTitle>
                  <CardDescription>Detalles del viaje asociado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Ruta
                    </h3>
                    <p className="font-medium">{liquidationData.routeName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Fecha de Salida
                    </h3>
                    <p>
                      {liquidationData.departureTime
                        ? format(
                            new Date(liquidationData.departureTime),
                            "dd/MM/yyyy HH:mm"
                          )
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Vehículo
                    </h3>
                    <p>
                      {liquidationData.plateNumber} ({liquidationData.busType})
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Propietario
                    </h3>
                    <p>{liquidationData.ownerName}</p>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">
                      Pasajeros:
                    </span>
                    <span className="font-medium">
                      {liquidationData.totalPassengers}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">
                      Ingresos:
                    </span>
                    <span className="font-medium">
                      Bs {(liquidationData.totalIncome || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">
                      Gastos:
                    </span>
                    <span className="font-medium">
                      Bs {(liquidationData.totalExpenses || 0).toFixed(2)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Liquidación Total:</span>
                    <span className="font-bold">
                      Bs {(liquidationData.netAmount || 0).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 items-stretch">
                  <Button variant="outline" asChild>
                    <a href={`/schedules/${liquidationData.tripSettlementId}`}>
                      Ver Detalles del Viaje
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a
                      href={`/finances/liquidations/${liquidationId}/print`}
                      target="_blank"
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimir Liquidación
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </>
        )}
      </div>
    </ConditionalUI>
  );
}
