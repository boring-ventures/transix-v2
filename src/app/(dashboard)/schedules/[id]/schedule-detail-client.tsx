"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Bus,
  User,
  Tag,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash,
  Eye,
  RefreshCw,
  ListChecks,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useSchedule } from "@/hooks/use-schedule";
import type { ScheduleStatus } from "@/types/schedule";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";
import { useSchedules } from "@/hooks/use-schedules";
import type { Schedule as ScheduleType, Ticket } from "@/hooks/use-schedules";

// Add custom interface that extends the imported type with additional fields needed
interface Schedule extends ScheduleType {
  scheduleSeats?: any[];
  tickets?: Ticket[];
}

interface ScheduleDetailClientProps {
  id: string;
}

export default function ScheduleDetailClient({
  id,
}: ScheduleDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [loadingPassengerList, setLoadingPassengerList] = useState(false);
  const [passengerList, setPassengerList] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const { schedule, isLoading, error, mutate } = useSchedule(id, {
    include:
      "bus,primaryDriver,secondaryDriver,route.origin,route.destination,tickets.busSeat.tier,tickets.customer,parcels.sender,parcels.receiver",
  });

  const {
    fetchPassengerList,
    generatePassengerList,
    isGeneratingPassengerList,
  } = useSchedules();

  const handleBack = () => {
    router.push("/schedules");
  };

  const handleEdit = () => {
    router.push(`/schedules/${id}/edit`);
  };

  const updateStatus = async (status: ScheduleStatus) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/schedules/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar el estado");
      }

      await mutate();
      toast({
        title: "Estado actualizado",
        description: `El viaje ha sido marcado como ${getStatusLabel(status)}`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al actualizar el estado",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const cancelSchedule = async () => {
    try {
      setIsCancelling(true);
      const response = await fetch(`/api/schedules/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al cancelar el viaje");
      }

      toast({
        title: "Viaje cancelado",
        description: "El viaje ha sido cancelado exitosamente",
      });

      // Redirect back to schedules list after cancellation
      router.push("/schedules");
    } catch (error) {
      console.error("Error cancelling schedule:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al cancelar el viaje",
        variant: "destructive",
      });
      setIsCancelling(false);
    }
  };

  const getStatusLabel = (status: ScheduleStatus) => {
    const statusMap = {
      scheduled: "Programado",
      in_progress: "En Progreso",
      completed: "Completado",
      cancelled: "Cancelado",
      delayed: "Retrasado",
    };
    return statusMap[status] || "Desconocido";
  };

  const getStatusBadge = (status: ScheduleStatus) => {
    const statusConfig = {
      scheduled: { label: "Programado", variant: "outline" as const },
      in_progress: { label: "En Progreso", variant: "default" as const },
      completed: { label: "Completado", variant: "secondary" as const },
      cancelled: { label: "Cancelado", variant: "destructive" as const },
      delayed: { label: "Retrasado", variant: "default" as const },
    };

    const config = statusConfig[status] || statusConfig.scheduled;

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), "dd MMMM yyyy", { locale: es });
  };

  const formatTime = (date: string | Date) => {
    return format(new Date(date), "HH:mm", { locale: es });
  };

  // Load passenger list
  const handleLoadPassengerList = async () => {
    try {
      setLoadingPassengerList(true);
      const data = await fetchPassengerList(id);
      setPassengerList(data);
    } catch (error) {
      console.error("Error loading passenger list:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la lista de pasajeros",
        variant: "destructive",
      });
    } finally {
      setLoadingPassengerList(false);
    }
  };

  // Generate passenger list
  const handleGeneratePassengerList = async () => {
    try {
      await generatePassengerList.mutateAsync(id);
      handleLoadPassengerList();
    } catch (error) {
      console.error("Error generating passenger list:", error);
    }
  };

  // View ticket details
  const handleViewTicketDetails = (ticket: any) => {
    setSelectedTicket(ticket);
  };

  // Print trip details and passenger list
  const handlePrint = async () => {
    if (!schedule) return;

    setIsPrinting(true);

    try {
      // Ensure passenger list is loaded
      if (passengerList.length === 0) {
        const data = await fetchPassengerList(id);
        setPassengerList(data);
      }

      // Get schedule and bus details
      console.log("Schedule and bus data:", {
        scheduleId: schedule.id,
        bus: schedule.bus,
        busId: schedule.bus?.id,
        plateNumber: schedule.bus?.plateNumber,
        seatMatrix: schedule.bus?.seatMatrix,
        tickets: schedule.tickets?.length,
      });

      // Create a new window for printing
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast({
          title: "Error",
          description:
            "Por favor, permita las ventanas emergentes para imprimir.",
          variant: "destructive",
        });
        return;
      }

      // Get current date/time for header
      const currentDateTime = new Date().toLocaleString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      // Get route information
      const routeName =
        schedule.routeSchedule?.route?.name || "Ruta no disponible";
      const origin = "No disponible";
      const destination = "No disponible";

      // Format dates
      const departureDate = formatDate(schedule.departureDate);
      const departureTime = formatTime(schedule.departureDate);
      const arrivalTime = formatTime(schedule.estimatedArrivalTime);

      // Get the bus plate number
      const busPlateNumber = schedule.bus?.plateNumber || "No asignado";

      // Format route display with fallback values
      const routeDisplay =
        origin &&
        destination &&
        origin !== "No disponible" &&
        destination !== "No disponible"
          ? `${origin} <> ${destination}`
          : routeName || "Ruta no disponible";

      // Format conductor names and details
      const conductorPrincipal =
        schedule.primaryDriver?.fullName || "No asignado";
      const conductorSecundario =
        schedule.secondaryDriver?.fullName || "No asignado";

      // Driver license details
      const licenciaPrincipal = schedule.primaryDriver?.licenseNumber || "N/A";
      const categoriaPrincipal =
        schedule.primaryDriver?.licenseCategory || "N/A";
      const licenciaSecundaria =
        schedule.secondaryDriver?.licenseNumber || "N/A";
      const categoriaSecundaria =
        schedule.secondaryDriver?.licenseCategory || "N/A";

      // Get total passenger count
      const totalPasajeros = Array.isArray(schedule.tickets)
        ? schedule.tickets.length
        : 0;

      // Generate the HTML content
      const content = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Detalles de Viaje - ${departureDate}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 20px;
              color: hsl(0 0% 0%);
              background-color: hsl(0 0% 100%);
            }
            .print-header {
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              color: #666;
              margin-bottom: 10px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 1px solid #ddd;
              position: relative;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              margin: 0;
              color: hsl(0 100% 45%);
            }
            .document-title {
              font-size: 22px;
              margin: 10px 0 5px 0;
              color: #000;
            }
            .route-info {
              font-size: 16px;
              margin: 10px 0;
            }
            .trip-info {
              margin-bottom: 20px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
              margin-bottom: 20px;
            }
            .info-item {
              padding: 8px;
              border-bottom: 1px solid #eee;
              display: flex;
            }
            .info-label {
              font-weight: bold;
              margin-right: 5px;
              color: hsl(0 0% 45%);
              width: 160px;
            }
            .info-value {
              flex: 1;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 12px;
            }
            th, td {
              padding: 8px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            th {
              background-color: hsl(0 0% 96%);
              font-weight: bold;
            }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              margin: 20px 0 10px 0;
              padding-bottom: 5px;
              border-bottom: 1px solid #ddd;
              color: hsl(0 100% 45%);
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: hsl(0 0% 45%);
              border-top: 1px solid #eee;
              padding-top: 10px;
            }
            .stats-container {
              display: flex;
              justify-content: center;
              margin-bottom: 20px;
              flex-wrap: wrap;
            }
            .stat-box {
              background-color: hsl(0 0% 96%);
              border: 1px solid hsl(0 0% 90%);
              border-radius: 6px;
              padding: 15px;
              width: 250px;
              box-sizing: border-box;
              text-align: center;
              margin-bottom: 10px;
            }
            .stat-value {
              font-size: 20px;
              font-weight: bold;
              color: hsl(0 100% 45%);
              margin: 0;
            }
            .stat-label {
              font-size: 12px;
              color: hsl(0 0% 45%);
              margin: 5px 0 0 0;
            }
            .badge {
              display: inline-block;
              padding: 3px 6px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
            }
            .badge-default {
              background-color: hsl(0 100% 45%);
              color: white;
            }
            .badge-outline {
              background-color: transparent;
              border: 1px solid hsl(0 0% 90%);
              color: hsl(0 0% 0%);
            }
            .badge-destructive {
              background-color: hsl(0 84% 60%);
              color: white;
            }
            .badge-secondary {
              background-color: hsl(0 0% 15%);
              color: white;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              button {
                display: none;
              }
              @page {
                size: A4;
                margin: 1cm;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <div>${currentDateTime}</div>
            <div>Detalles de Viaje - ${routeDisplay}</div>
          </div>
          
          <div class="header">
            <p class="company-name">FLOTA IMPERIAL POTOSI</p>
            <h1 class="document-title">DETALLES DEL VIAJE</h1>
            <p class="route-info">${routeDisplay} - ${departureDate}</p>
          </div>
          
          <div class="stats-container">
            <div class="stat-box">
              <p class="stat-value">
                <span class="badge ${
                  schedule.status === "scheduled"
                    ? "badge-outline"
                    : schedule.status === "in_progress"
                      ? "badge-default"
                      : schedule.status === "completed"
                        ? "badge-secondary"
                        : schedule.status === "cancelled"
                          ? "badge-destructive"
                          : "badge-default"
                }">
                  ${getStatusLabel(schedule.status)}
                </span>
              </p>
              <p class="stat-label">Estado del Viaje</p>
            </div>
          </div>
          
          <div class="section-title">Información General</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Ruta:</span>
              <span class="info-value">${routeName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Fecha:</span>
              <span class="info-value">${departureDate}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Hora de Salida:</span>
              <span class="info-value">${departureTime}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Llegada Estimada:</span>
              <span class="info-value">${arrivalTime}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Bus:</span>
              <span class="info-value">${busPlateNumber}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Total de Pasajeros:</span>
              <span class="info-value">${totalPasajeros}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Conductor Principal:</span>
              <span class="info-value">${conductorPrincipal}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Licencia:</span>
              <span class="info-value">${licenciaPrincipal} (${categoriaPrincipal})</span>
            </div>
            <div class="info-item">
              <span class="info-label">Conductor Secundario:</span>
              <span class="info-value">${conductorSecundario}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Licencia:</span>
              <span class="info-value">${licenciaSecundaria} (${categoriaSecundaria})</span>
            </div>
            <div class="info-item">
              <span class="info-label">Origen:</span>
              <span class="info-value">${origin}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Destino:</span>
              <span class="info-value">${destination}</span>
            </div>
          </div>
          
          <div class="section-title">Lista de Pasajeros</div>
          <table>
            <thead>
              <tr>
                <th>Nro</th>
                <th>Asiento</th>
                <th>Nombre</th>
                <th>Documento</th>
              </tr>
            </thead>
            <tbody>
              ${
                schedule.tickets && schedule.tickets.length > 0
                  ? schedule.tickets
                      .map(
                        (ticket: any, index: number) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${ticket.busSeat?.seatNumber || "N/A"}</td>
                    <td>${ticket.customer?.fullName || "No asignado"}</td>
                    <td>${ticket.customer?.documentId || "NO PORTA"}</td>
                  </tr>
                `
                      )
                      .join("")
                  : `<tr><td colspan="4" style="text-align: center;">No hay pasajeros registrados para este viaje</td></tr>`
              }
            </tbody>
          </table>
          
          <div class="footer">
            <p>Documento generado el ${new Date().toLocaleString("es-ES")} | FLOTA IMPERIAL POTOSI</p>
            <p>Este documento es de carácter informativo y puede estar sujeto a cambios.</p>
          </div>
          
          <script>
            // Auto print and close the window after printing is done
            window.onload = function() {
              setTimeout(() => {
                window.print();
                // Don't close automatically to allow user to see the print preview
              }, 500);
            };
          </script>
        </body>
        </html>
      `;

      // Write to the new window
      printWindow.document.write(content);
      printWindow.document.close();
    } catch (error) {
      console.error("Error printing trip details:", error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error al imprimir los detalles del viaje",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  // Load passenger list on mount
  useEffect(() => {
    if (id) {
      handleLoadPassengerList();

      // Debug log when schedule data loads
      if (schedule) {
        console.log("Schedule data loaded:", {
          routeSchedule: schedule.routeSchedule,
          route: schedule.routeSchedule?.route,
          originId: schedule.routeSchedule?.route?.originId,
          destinationId: schedule.routeSchedule?.route?.destinationId,
          bus: schedule.bus,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, schedule]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error al cargar el viaje</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error
              ? error.message
              : "No se pudo encontrar la información del viaje"}
          </p>
          <Button onClick={handleBack}>Volver a la lista</Button>
        </div>
      </div>
    );
  }

  const routeName = schedule.routeSchedule?.route?.name || "Ruta no disponible";
  const ticketCount = schedule._count?.tickets || 0;
  const parcelCount = schedule._count?.parcels || 0;

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={handleBack} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold flex-1">
          Detalle de Viaje: {routeName}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} disabled={isPrinting}>
            <Printer className="h-4 w-4 mr-2" />
            {isPrinting ? "Imprimiendo..." : "Imprimir Detalles"}
          </Button>
          {schedule.status !== "cancelled" &&
            schedule.status !== "completed" && (
              <>
                <Button variant="outline" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash className="h-4 w-4 mr-2" />
                      Cancelar Viaje
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción cancelará el viaje programado y no se puede
                        deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={cancelSchedule}
                        disabled={isCancelling}
                      >
                        {isCancelling ? "Cancelando..." : "Confirmar"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Información de Ruta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Ruta:</span>
                <span className="ml-2">{routeName}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Fecha:</span>
                <span className="ml-2">
                  {formatDate(schedule.departureDate)}
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Hora de salida:</span>
                <span className="ml-2">
                  {formatTime(schedule.departureDate)}
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Llegada estimada:</span>
                <span className="ml-2">
                  {formatTime(schedule.estimatedArrivalTime)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Vehículo y Conductores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center">
                <Bus className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Bus:</span>
                <span className="ml-2">
                  {schedule.bus?.plateNumber || "No asignado"}
                </span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Conductor principal:</span>
                <span className="ml-2">
                  {schedule.primaryDriver?.fullName || "No asignado"}
                </span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Conductor secundario:</span>
                <span className="ml-2">
                  {schedule.secondaryDriver?.fullName || "No asignado"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Estado y Detalles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="font-medium mr-2">Estado:</span>
                {getStatusBadge(schedule.status)}
              </div>
              <div className="flex items-center">
                <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Precio:</span>
                <span className="ml-2">${schedule.price.toFixed(2)}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium">Boletos vendidos:</span>
                <span className="ml-2">{ticketCount}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium">Encomiendas:</span>
                <span className="ml-2">{parcelCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {schedule.status !== "cancelled" && schedule.status !== "completed" && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Actualizar Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {schedule.status !== "in_progress" && (
                <Button
                  onClick={() => updateStatus("in_progress")}
                  disabled={isUpdating}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Iniciar Viaje
                </Button>
              )}
              {(schedule.status as ScheduleStatus) !== "completed" && (
                <Button
                  onClick={() => updateStatus("completed")}
                  disabled={isUpdating}
                  variant="outline"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completar Viaje
                </Button>
              )}
              {schedule.status !== "delayed" && (
                <Button
                  onClick={() => updateStatus("delayed")}
                  disabled={isUpdating}
                  variant="outline"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Marcar como Retrasado
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="tickets" className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tickets">Boletos ({ticketCount})</TabsTrigger>
          <TabsTrigger value="passengers">Pasajeros a bordo</TabsTrigger>
          <TabsTrigger value="parcels">Encomiendas ({parcelCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle>Boletos Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              {schedule.tickets && schedule.tickets.length > 0 ? (
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asiento</TableHead>
                        <TableHead>Nivel</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedule.tickets.map((ticket: any) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">
                            {ticket.busSeat?.seatNumber || "N/A"}
                          </TableCell>
                          <TableCell>
                            {ticket.busSeat?.tier?.name || "Estándar"}
                          </TableCell>
                          <TableCell>
                            {ticket.customer?.fullName || "No asignado"}
                            {ticket.customer?.documentId && (
                              <div className="text-xs text-muted-foreground">
                                ID: {ticket.customer.documentId}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            $
                            {typeof ticket.price === "number"
                              ? ticket.price.toFixed(2)
                              : ticket.price}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                ticket.status === "active"
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {ticket.status === "active"
                                ? "Activo"
                                : "Cancelado"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleViewTicketDetails(ticket)
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ver detalles</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Ticket Details Sheet */}
                  {selectedTicket && (
                    <Sheet
                      open={!!selectedTicket}
                      onOpenChange={() => setSelectedTicket(null)}
                    >
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Detalles del boleto</SheetTitle>
                          <SheetDescription>
                            Información detallada del boleto seleccionado
                          </SheetDescription>
                        </SheetHeader>
                        <div className="py-4 space-y-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Asiento</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedTicket.busSeat?.seatNumber || "N/A"} (
                              {selectedTicket.busSeat?.tier?.name || "Estándar"}
                              )
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Cliente</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedTicket.customer?.fullName ||
                                "No asignado"}
                            </p>
                          </div>
                          {selectedTicket.customer?.documentId && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Documento</p>
                              <p className="text-sm text-muted-foreground">
                                {selectedTicket.customer.documentId}
                              </p>
                            </div>
                          )}
                          {selectedTicket.customer?.phone && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Teléfono</p>
                              <p className="text-sm text-muted-foreground">
                                {selectedTicket.customer.phone}
                              </p>
                            </div>
                          )}
                          {selectedTicket.customer?.email && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Email</p>
                              <p className="text-sm text-muted-foreground">
                                {selectedTicket.customer.email}
                              </p>
                            </div>
                          )}
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Precio</p>
                            <p className="text-sm text-muted-foreground">
                              $
                              {typeof selectedTicket.price === "number"
                                ? selectedTicket.price.toFixed(2)
                                : selectedTicket.price}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Estado</p>
                            <Badge
                              variant={
                                selectedTicket.status === "active"
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {selectedTicket.status === "active"
                                ? "Activo"
                                : "Cancelado"}
                            </Badge>
                          </div>
                          {selectedTicket.purchasedAt && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">
                                Fecha de compra
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(selectedTicket.purchasedAt)} -{" "}
                                {formatTime(selectedTicket.purchasedAt)}
                              </p>
                            </div>
                          )}
                          {selectedTicket.notes && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Notas</p>
                              <p className="text-sm text-muted-foreground">
                                {selectedTicket.notes}
                              </p>
                            </div>
                          )}
                        </div>
                        <SheetFooter>
                          <SheetClose asChild>
                            <Button variant="outline">Cerrar</Button>
                          </SheetClose>
                        </SheetFooter>
                      </SheetContent>
                    </Sheet>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No hay boletos vendidos para este viaje
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="passengers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pasajeros a bordo</CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadPassengerList}
                  disabled={loadingPassengerList}
                >
                  {loadingPassengerList ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Cargando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Actualizar
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={handleGeneratePassengerList}
                  disabled={isGeneratingPassengerList}
                >
                  {isGeneratingPassengerList ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <ListChecks className="mr-2 h-4 w-4" />
                      Generar lista
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {passengerList.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asiento</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {passengerList.map((passenger) => (
                      <TableRow key={passenger.id}>
                        <TableCell className="font-medium">
                          {passenger.seatNumber}
                        </TableCell>
                        <TableCell>{passenger.fullName}</TableCell>
                        <TableCell>{passenger.documentId || "N/A"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              passenger.status === "confirmed"
                                ? "default"
                                : passenger.status === "cancelled"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {passenger.status === "confirmed"
                              ? "Confirmado"
                              : passenger.status === "cancelled"
                                ? "Cancelado"
                                : "No se presentó"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No hay datos de pasajeros disponibles para este viaje.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Haga clic en &quot;Generar lista&quot; para crear una lista
                    de pasajeros basada en los boletos vendidos.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parcels">
          <Card>
            <CardHeader>
              <CardTitle>Encomiendas</CardTitle>
            </CardHeader>
            <CardContent>
              {schedule.parcels && schedule.parcels.length > 0 ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tracking</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Remitente</TableHead>
                        <TableHead>Destinatario</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedule.parcels.map((parcel: any) => (
                        <TableRow key={parcel.id}>
                          <TableCell className="font-medium">
                            {parcel.trackingNumber}
                          </TableCell>
                          <TableCell>{parcel.description || "N/A"}</TableCell>
                          <TableCell>
                            {parcel.sender?.fullName || "N/A"}
                          </TableCell>
                          <TableCell>
                            {parcel.receiver?.fullName || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                parcel.status === "delivered"
                                  ? "secondary"
                                  : parcel.status === "in_transit"
                                    ? "default"
                                    : "outline"
                              }
                            >
                              {parcel.status === "pending"
                                ? "Pendiente"
                                : parcel.status === "in_transit"
                                  ? "En tránsito"
                                  : parcel.status === "delivered"
                                    ? "Entregado"
                                    : parcel.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No hay encomiendas para este viaje
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
