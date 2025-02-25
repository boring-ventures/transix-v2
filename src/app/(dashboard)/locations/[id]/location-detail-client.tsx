"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocations, type Location, type LocationStats } from "@/hooks/use-locations";
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
import { EditLocationDialog } from "../components/edit-location-dialog";
import { DeleteLocationDialog } from "../components/delete-location-dialog";
import { AlertCircle, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface LocationDetailClientProps {
  id: string;
}

export default function LocationDetailClient({ id }: LocationDetailClientProps) {
  const router = useRouter();
  const { fetchLocation, fetchLocationStats, deactivateLocation, isDeactivating } = useLocations();
  const [location, setLocation] = useState<Location | null>(null);
  const [stats, setStats] = useState<LocationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const locationData = await fetchLocation(id);
        setLocation(locationData);
        
        const statsData = await fetchLocationStats(id);
        setStats(statsData);
      } catch (err) {
        console.error("Error loading location data:", err);
        setError("No se pudo cargar la información de la ubicación");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, fetchLocation, fetchLocationStats]);

  const handleDeactivate = async () => {
    if (!location) return;
    
    try {
      await deactivateLocation.mutateAsync(id);
      setLocation((prev) => (prev ? { ...prev, active: false } : null));
    } catch (err) {
      console.error("Error deactivating location:", err);
    }
  };

  const handleBack = () => {
    router.push("/locations");
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

  if (error || !location) {
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
            {error || "No se pudo encontrar la ubicación solicitada"}
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
          <h1 className="text-2xl font-bold">{location.name}</h1>
          <Badge
            variant={location.active ? "default" : "destructive"}
            className="ml-2"
          >
            {location.active ? "Activo" : "Inactivo"}
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

          {location.active && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeactivate}
              disabled={
                isDeactivating || !!(stats && stats.activeRoutesCount > 0)
              }
            >
              Desactivar
            </Button>
          )}

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={!!(stats && stats.totalRoutesCount > 0)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Location details */}
      <div className="grid gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>Detalles de la ubicación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Nombre
                </p>
                <p className="text-lg font-medium">{location.name}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Estado
                </p>
                <Badge variant={location.active ? "default" : "destructive"}>
                  {location.active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estadísticas</CardTitle>
            <CardDescription>Uso de la ubicación en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total de Rutas
                </p>
                <p className="text-2xl font-bold">
                  {stats?.totalRoutesCount || 0}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Rutas como Origen
                </p>
                <p className="text-2xl font-bold">
                  {stats?.originRoutesCount || 0}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Rutas como Destino
                </p>
                <p className="text-2xl font-bold">
                  {stats?.destinationRoutesCount || 0}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Horarios
                </p>
                <p className="text-2xl font-bold">
                  {stats?.schedulesCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for related content */}
      <Tabs defaultValue="routes" className="mt-6">
        <TabsList>
          <TabsTrigger value="routes">Rutas</TabsTrigger>
          <TabsTrigger value="schedules">Horarios</TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Rutas Relacionadas</CardTitle>
              <CardDescription>
                Rutas que utilizan esta ubicación como origen o destino
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.totalRoutesCount === 0 ? (
                <p className="text-muted-foreground">
                  No hay rutas asociadas a esta ubicación
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Implementación de lista de rutas pendiente
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Horarios Programados</CardTitle>
              <CardDescription>
                Horarios de salida y llegada en esta ubicación
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.schedulesCount === 0 ? (
                <p className="text-muted-foreground">
                  No hay horarios programados para esta ubicación
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Implementación de lista de horarios pendiente
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditLocationDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        location={location}
      />

      <DeleteLocationDialog
        locationId={showDeleteDialog ? id : null}
        onClose={() => setShowDeleteDialog(false)}
      />
    </div>
  );
} 