"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSchedules, type Schedule } from "@/hooks/use-schedules";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditScheduleDialog } from "../components/edit-schedule-dialog";
import { 
  AlertCircle, ArrowLeft, Calendar, Clock, Edit, MapPin, User, 
  Bus as BusIcon, Plus, UserX, Package, Activity, ClipboardList, 
  MoreHorizontal 
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";

interface ScheduleDetailClientProps {
  id: string;
}

export default function ScheduleDetailClient({ id }: ScheduleDetailClientProps) {
  const router = useRouter();
  const { fetchSchedule, updateScheduleStatus } = useSchedules();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const scheduleData = await fetchSchedule(id);
        setSchedule(scheduleData);
      } catch (err) {
        console.error("Error loading schedule data:", err);
        setError("No se pudo cargar la información del viaje");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, fetchSchedule]);

  const handleStatusChange = async (newStatus: string) => {
    if (!schedule) return;
    
    try {
      const updatedSchedule = await updateScheduleStatus.mutateAsync({
        id: schedule.id,
        status: newStatus as ScheduleStatus
      });
      
      setSchedule(updatedSchedule);
      
      const statusMessages = {
        in_progress: "Viaje iniciado exitosamente",
        completed: "Viaje completado exitosamente",
        cancelled: "Viaje cancelado exitosamente",
        delayed: "Viaje marcado como retrasado",
        scheduled: "Viaje reprogramado exitosamente"
      };
      
      toast({
        title: "Estado actualizado",
        description: statusMessages[newStatus as keyof typeof statusMessages] || "Estado actualizado exitosamente"
      });
    } catch (err) {
      console.error("Error updating schedule status:", err);
    }
  };

  const handleBack = () => {
    router.push("/schedules");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "PPP", { locale: es });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "HH:mm", { locale: es });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "PPP HH:mm", { locale: es });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="outline">Programado</Badge>;
      case "in_progress":
        return <Badge variant="default">En Progreso</Badge>;
      case "completed":
        return <Badge variant="default">Completado</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      case "delayed":
        return <Badge variant="secondary">Retrasado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>

        <div className="grid gap-6">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="container mx-auto py-6">
        <Button variant="ghost" size="sm" onClick={handleBack} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "No se pudo encontrar el viaje solicitado"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">
            Viaje: {schedule.route?.name || "Ruta no disponible"} - {formatDate(schedule.departureDate)}
          </h1>
          {getStatusBadge(schedule.status)}
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditDialog(true)}
            disabled={["completed", "cancelled"].includes(schedule.status)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>

          {schedule.status === "scheduled" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleStatusChange("in_progress")}
            >
              Iniciar Viaje
            </Button>
          )}

          {schedule.status === "in_progress" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleStatusChange("completed")}
            >
              Completar Viaje
            </Button>
          )}

          {["scheduled", "in_progress"].includes(schedule.status) && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleStatusChange("cancelled")}
            >
              Cancelar Viaje
            </Button>
          )}
        </div>
      </div>

      {/* Schedule details */}
      <div className="grid gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>Detalles del viaje programado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Ruta
                </p>
                <div className="flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p className="text-lg font-medium">
                    {schedule.route?.name || 
                     (schedule.routeId ? `ID: ${schedule.routeId}` : "Ruta no disponible")}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Fecha de Salida
                </p>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p className="text-lg font-medium">{formatDate(schedule.departureDate)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Hora de Salida
                </p>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p className="text-lg font-medium">{formatTime(schedule.departureDate)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Llegada Estimada
                </p>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p className="text-lg font-medium">{formatDateTime(schedule.estimatedArrivalTime)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Bus Asignado
                </p>
                <div className="flex items-center mt-1">
                  <BusIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p className="text-lg font-medium">{schedule.bus?.plateNumber || "-"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Conductor Principal
                </p>
                <div className="flex items-center mt-1">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p className="text-lg font-medium">{schedule.primaryDriver?.fullName || "-"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Conductor Secundario
                </p>
                <div className="flex items-center mt-1">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p className="text-lg font-medium">{schedule.secondaryDriver?.fullName || "-"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Precio Base
                </p>
                <p className="text-lg font-medium">${schedule.price.toFixed(2)}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Estado
                </p>
                {getStatusBadge(schedule.status)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for related content */}
      <Tabs defaultValue="passengers" className="mt-6">
        <TabsList>
          <TabsTrigger value="passengers">Pasajeros</TabsTrigger>
          <TabsTrigger value="parcels">Encomiendas</TabsTrigger>
          <TabsTrigger value="logs">Registro de Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="passengers" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Lista de Pasajeros</CardTitle>
                <CardDescription>
                  Pasajeros registrados para este viaje
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Implement passenger list generation or ticket creation
                  toast({
                    title: "Funcionalidad en desarrollo",
                    description: "La creación de boletos estará disponible próximamente",
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Pasajero
              </Button>
            </CardHeader>
            <CardContent>
              {schedule.tickets && schedule.tickets.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asiento</TableHead>
                        <TableHead>Pasajero</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedule.tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell>{ticket.busSeat?.seatNumber || "-"}</TableCell>
                          <TableCell>{ticket.customer?.fullName || "Sin nombre"}</TableCell>
                          <TableCell>{ticket.customer?.documentId || "-"}</TableCell>
                          <TableCell>${ticket.price.toFixed(2)}</TableCell>
                          <TableCell>
                            {ticket.status === "active" ? (
                              <Badge variant="outline">Activo</Badge>
                            ) : (
                              <Badge variant="destructive">Cancelado</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <UserX className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">No hay pasajeros registrados para este viaje</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Implement passenger list generation or ticket creation
                      toast({
                        title: "Funcionalidad en desarrollo",
                        description: "La creación de boletos estará disponible próximamente",
                      });
                    }}
                  >
                    Agregar Pasajero
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parcels" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Encomiendas</CardTitle>
                <CardDescription>
                  Encomiendas registradas para este viaje
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Implement parcel creation
                  toast({
                    title: "Funcionalidad en desarrollo",
                    description: "El registro de encomiendas estará disponible próximamente",
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Encomienda
              </Button>
            </CardHeader>
            <CardContent>
              {schedule.parcels && schedule.parcels.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tracking</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Remitente</TableHead>
                        <TableHead>Destinatario</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedule.parcels.map((parcel) => (
                        <TableRow key={parcel.id}>
                          <TableCell>{parcel.trackingNumber}</TableCell>
                          <TableCell>{parcel.description || "-"}</TableCell>
                          <TableCell>{parcel.sender?.fullName || "-"}</TableCell>
                          <TableCell>{parcel.receiver?.fullName || "-"}</TableCell>
                          <TableCell>${parcel.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{parcel.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Package className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">No hay encomiendas registradas para este viaje</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Implement parcel creation
                      toast({
                        title: "Funcionalidad en desarrollo",
                        description: "El registro de encomiendas estará disponible próximamente",
                      });
                    }}
                  >
                    Agregar Encomienda
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Registro de Actividad</CardTitle>
              <CardDescription>
                Historial de actividades para este viaje
              </CardDescription>
            </CardHeader>
            <CardContent>
              {schedule.busLogs && schedule.busLogs.length > 0 ? (
                <div className="space-y-4">
                  {schedule.busLogs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-4 border-b pb-4 last:border-0">
                      <div className="bg-muted rounded-full p-2">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{log.action}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(log.createdAt), "PPp", { locale: es })}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{log.notes || "Sin notas adicionales"}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Por: {log.profile?.fullName || "Usuario del sistema"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <ClipboardList className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay registros de actividad para este viaje</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showEditDialog && (
        <EditScheduleDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          schedule={schedule}
          onUpdate={(updatedSchedule) => setSchedule(updatedSchedule)}
        />
      )}
    </div>
  );
} 