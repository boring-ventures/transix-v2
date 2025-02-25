"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDrivers, type Driver, type DriverStats } from "@/hooks/use-drivers";
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
import { ArrowLeft, User, Building, Calendar, Truck, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { EditDriverDialog } from "../components/edit-driver-dialog";

interface DriverDetailClientProps {
  id: string;
}

export default function DriverDetailClient({ id }: DriverDetailClientProps) {
  const router = useRouter();
  const { fetchDriver, fetchDriverStats } = useDrivers();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    const loadDriverData = async () => {
      try {
        setIsLoading(true);
        const driverData = await fetchDriver(id);
        setDriver(driverData);
        
        const statsData = await fetchDriverStats(id);
        setStats(statsData);
      } catch (error) {
        console.error("Error cargando datos del conductor:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDriverData();
  }, [id, fetchDriver, fetchDriverStats]);

  return (
    <div className="container mx-auto py-6">
      <Button 
        variant="outline" 
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
            <Skeleton className="h-[200px] rounded-xl" />
            <Skeleton className="h-[200px] rounded-xl" />
            <Skeleton className="h-[200px] rounded-xl" />
          </div>
        </div>
      ) : driver ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{driver.fullName}</h1>
              <p className="text-muted-foreground">
                {driver.documentId}
              </p>
            </div>
            <div>
              <Button onClick={() => setShowEditDialog(true)}>
                Editar Conductor
              </Button>
            </div>
          </div>

          <Tabs defaultValue="info" className="space-y-4">
            <TabsList>
              <TabsTrigger value="info">Información</TabsTrigger>
              <TabsTrigger value="company">Empresa</TabsTrigger>
              <TabsTrigger value="stats">Estadísticas</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Perfil
                    </CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div>
                      <p className="text-sm font-medium">Nombre Completo</p>
                      <p className="text-sm text-muted-foreground mb-4">{driver.fullName}</p>
                      
                      <p className="text-sm font-medium">Documento de Identidad</p>
                      <p className="text-sm text-muted-foreground mb-4">{driver.documentId}</p>
                      
                      <p className="text-sm font-medium">Estado</p>
                      <Badge variant={driver.active ? "default" : "destructive"} className="mt-1">
                        {driver.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Licencia
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium">Número de Licencia</p>
                    <p className="text-sm text-muted-foreground mb-4">{driver.licenseNumber}</p>
                    
                    <p className="text-sm font-medium">Categoría</p>
                    <Badge variant="outline" className="mt-1">
                      {driver.licenseCategory}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Fechas
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium">Creado el</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(driver.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                    
                    <p className="text-sm font-medium mt-4">Actualizado el</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(driver.updatedAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="company">
              <Card>
                <CardHeader>
                  <CardTitle>Información de Empresa</CardTitle>
                  <CardDescription>
                    Empresa asignada al conductor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {driver.company ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Empresa</h3>
                        <div className="flex items-center mt-2">
                          <Building className="h-5 w-5 mr-2 text-muted-foreground" />
                          <span>{driver.company.name}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Building className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Conductor sin empresa asignada</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setShowEditDialog(true)}
                      >
                        Asignar Empresa
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Viajes Totales
                    </CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalTrips || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.primaryDriverTrips || 0} como conductor principal
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stats?.secondaryDriverTrips || 0} como conductor secundario
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Estado de Viajes
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Programados</p>
                        <p className="text-2xl font-bold">{stats?.scheduledTrips || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">En Progreso</p>
                        <p className="text-2xl font-bold">{stats?.inProgressTrips || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Completados</p>
                        <p className="text-2xl font-bold">{stats?.completedTrips || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2 lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Próximos Viajes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats?.upcomingSchedules && stats.upcomingSchedules.length > 0 ? (
                      <div className="space-y-4">
                        {stats.upcomingSchedules.map((schedule) => (
                          <div key={schedule.id} className="border-b pb-2 last:border-0">
                            <div className="flex justify-between">
                              <p className="text-sm font-medium">
                                {schedule.routeSchedule?.route?.origin?.name} → {schedule.routeSchedule?.route?.destination?.name}
                              </p>
                              <Badge variant="outline">
                                {format(new Date(schedule.departureDate), "dd/MM/yyyy HH:mm")}
                              </Badge>
                            </div>
                            {schedule.bus && (
                              <p className="text-xs text-muted-foreground">
                                Bus: {schedule.bus.plateNumber}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay viajes programados
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <EditDriverDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            driver={driver}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <User className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Conductor No Encontrado</h2>
          <p className="text-muted-foreground">
            El conductor que está buscando no existe o ha sido eliminado.
          </p>
        </div>
      )}
    </div>
  );
} 