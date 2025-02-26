"use client";

import { useState, } from "react";
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
  Trash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
import type { Schedule, ScheduleStatus } from "@/types/schedule";

interface ScheduleDetailClientProps {
  id: string;
}

export default function ScheduleDetailClient({ id }: ScheduleDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const { schedule, isLoading, error, mutate } = useSchedule(id, {
    include: "bus,primaryDriver,secondaryDriver,route,tickets,parcels"
  });

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
        description: error instanceof Error ? error.message : "Error al actualizar el estado",
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
        description: error instanceof Error ? error.message : "Error al cancelar el viaje",
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
            {error || "No se pudo encontrar la información del viaje"}
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
          {schedule.status !== "cancelled" && schedule.status !== "completed" && (
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
                      Esta acción cancelará el viaje programado y no se puede deshacer.
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
                <span className="ml-2">{formatDate(schedule.departureDate)}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Hora de salida:</span>
                <span className="ml-2">{formatTime(schedule.departureDate)}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Llegada estimada:</span>
                <span className="ml-2">{formatTime(schedule.estimatedArrivalTime)}</span>
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
                <span className="ml-2">{schedule.bus?.plateNumber || "No asignado"}</span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Conductor principal:</span>
                <span className="ml-2">{schedule.primaryDriver?.fullName || "No asignado"}</span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Conductor secundario:</span>
                <span className="ml-2">{schedule.secondaryDriver?.fullName || "No asignado"}</span>
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
              {schedule.status !== "completed" && (
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

      <Tabs defaultValue="tickets">
        <TabsList>
          <TabsTrigger value="tickets">Boletos ({ticketCount})</TabsTrigger>
          <TabsTrigger value="parcels">Encomiendas ({parcelCount})</TabsTrigger>
        </TabsList>
        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle>Boletos Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              {schedule.tickets && schedule.tickets.length > 0 ? (
                <div className="space-y-4">
                  {/* Ticket list would go here */}
                  <p>Lista de boletos vendidos para este viaje</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay boletos vendidos para este viaje</p>
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
                  {/* Parcel list would go here */}
                  <p>Lista de encomiendas para este viaje</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay encomiendas para este viaje</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 