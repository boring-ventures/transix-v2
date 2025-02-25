"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoutes, type Route, type RouteStats } from "@/hooks/use-routes";
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
import { EditRouteDialog } from "../../components/edit-route-dialog";
import { DeleteRouteDialog } from "../../components/delete-route-dialog";
import { RouteSchedules } from "../../components/route-schedules";
import { AlertCircle, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { RouteScheduleList } from "../../components/route-schedule-list";

interface RouteDetailClientProps {
  id: string;
}

export default function RouteDetailClient({ id }: RouteDetailClientProps) {
  const router = useRouter();
  const { fetchRoute, fetchRouteStats, deactivateRoute, isDeactivating } = useRoutes();
  const [route, setRoute] = useState<Route | null>(null);
  const [stats, setStats] = useState<RouteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const routeData = await fetchRoute(id);
        setRoute(routeData);
        
        const statsData = await fetchRouteStats(id);
        setStats(statsData);
      } catch (err) {
        console.error("Error loading route data:", err);
        setError("No se pudo cargar la información de la ruta");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, fetchRoute, fetchRouteStats]);

  const handleDeactivate = async () => {
    if (!route) return;
    
    try {
      await deactivateRoute.mutateAsync(id);
      setRoute((prev) => (prev ? { ...prev, active: false } : null));
    } catch (err) {
      console.error("Error deactivating route:", err);
    }
  };

  const handleBack = () => {
    router.push("/routes/list");
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

  if (error || !route) {
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
            {error || "No se pudo encontrar la ruta solicitada"}
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
          <h1 className="text-2xl font-bold">{route.name}</h1>
          <Badge
            variant={route.active ? "default" : "destructive"}
            className="ml-2"
          >
            {route.active ? "Activo" : "Inactivo"}
          </Badge>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditDialog(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>

          {route.active && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeactivate}
              disabled={
                isDeactivating ||
                !!(
                  stats &&
                  (stats.activeAssignmentsCount > 0 ||
                    stats.activeRouteSchedulesCount > 0)
                )
              }
            >
              Desactivar
            </Button>
          )}

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={
              !!(
                stats &&
                (stats.assignmentsCount > 0 || stats.routeSchedulesCount > 0)
              )
            }
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Route details */}
      <div className="grid gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>Detalles de la ruta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Nombre
                </p>
                <p className="text-lg font-medium">{route.name}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Origen
                </p>
                <p className="text-lg font-medium">
                  {route.origin?.name || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Destino
                </p>
                <p className="text-lg font-medium">
                  {route.destination?.name || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Duración Estimada
                </p>
                <p className="text-lg font-medium">
                  {route.estimatedDuration} minutos
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Carril de Salida
                </p>
                <p className="text-lg font-medium">
                  {route.departureLane || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Estado
                </p>
                <Badge variant={route.active ? "default" : "destructive"}>
                  {route.active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estadísticas</CardTitle>
            <CardDescription>Uso de la ruta en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Asignaciones
                </p>
                <p className="text-2xl font-bold">
                  {stats?.assignmentsCount || 0}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Horarios
                </p>
                <p className="text-2xl font-bold">
                  {stats?.routeSchedulesCount || 0}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Viajes Programados
                </p>
                <p className="text-2xl font-bold">
                  {stats?.schedulesCount || 0}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Viajes Completados
                </p>
                <p className="text-2xl font-bold">
                  {stats?.completedSchedulesCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for related content */}
      <Tabs defaultValue="schedules" className="mt-6">
        <TabsList>
          <TabsTrigger value="schedules">Horarios</TabsTrigger>
          <TabsTrigger value="trips">Viajes</TabsTrigger>
          <TabsTrigger value="assignments">Asignaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Horarios Programados</CardTitle>
              <CardDescription>
                Horarios regulares para esta ruta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RouteScheduleList routeId={id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trips" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Viajes Programados</CardTitle>
              <CardDescription>
                Viajes programados para esta ruta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RouteSchedules routeId={id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Asignaciones de Buses</CardTitle>
              <CardDescription>Buses asignados a esta ruta</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.assignmentsCount === 0 ? (
                <p className="text-muted-foreground">
                  No hay buses asignados a esta ruta
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Implementación de lista de asignaciones pendiente
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditRouteDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        route={route}
      />

      <DeleteRouteDialog
        routeId={showDeleteDialog ? id : null}
        onClose={() => setShowDeleteDialog(false)}
      />
    </div>
  );
} 