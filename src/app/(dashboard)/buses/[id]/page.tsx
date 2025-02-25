"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBuses, type Bus } from "@/hooks/use-buses";
import { useBusSeats } from "@/hooks/use-bus-seats";
import { useSeatTiers } from "@/hooks/use-seat-tiers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bus as BusIcon, Calendar, Settings } from "lucide-react";
import { SeatMatrixViewer } from "../components/seat-matrix-viewer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function BusDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [bus, setBus] = useState<Bus | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Get bus details
  const { fetchBus } = useBuses();
  const { seats } = useBusSeats(id as string);
  const { seatTiers } = useSeatTiers(bus?.companyId);
  
  useEffect(() => {
    const getBusDetails = async () => {
      try {
        const busData = await fetchBus(id as string);
        setBus(busData);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching bus details:", err);
        setError("Error fetching bus details");
        setIsLoading(false);
      }
    };
    
    if (id) {
      getBusDetails();
    }
  }, [id, fetchBus]);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Button 
          variant="outline" 
          disabled
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  if (error || !bus) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <BusIcon className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Bus no encontrado</h2>
        <p className="text-muted-foreground mb-6">
          El bus que estás buscando no existe o ha sido eliminado.
        </p>
        <Button onClick={() => router.push("/buses")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Buses
        </Button>
      </div>
    );
  }
  
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
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{bus.plateNumber}</h1>
          <p className="text-muted-foreground">
            {bus.company?.name || "Sin empresa asignada"} • 
            {bus.template?.name || "Sin plantilla asignada"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => router.push(`/buses/${id}/edit`)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Editar Bus
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="details">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="seats">Asientos</TabsTrigger>
          <TabsTrigger value="schedules">Horarios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estado</CardTitle>
                <BusIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Badge variant={bus.isActive ? "default" : "destructive"}>
                    {bus.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                  <Badge variant="outline">
                    {bus.maintenanceStatus === "active" && "Operativo"}
                    {bus.maintenanceStatus === "in_maintenance" && "En Mantenimiento"}
                    {bus.maintenanceStatus === "retired" && "Retirado"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Plantilla</CardTitle>
                <BusIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-medium">
                  {bus.template?.name || "Sin plantilla"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {bus.template?.type === "standard" && "Estándar"}
                  {bus.template?.type === "luxury" && "Lujo"}
                  {bus.template?.type === "double_decker" && "Dos Pisos"}
                  {bus.template?.type === "minibus" && "Minibús"}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Viajes Programados</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bus._count?.schedules || 0}</div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Información del Bus</CardTitle>
              <CardDescription>
                Detalles completos del vehículo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Placa</h3>
                  <p className="text-lg">{bus.plateNumber}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Empresa</h3>
                  <p className="text-lg">{bus.company?.name || "Sin empresa asignada"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Capacidad</h3>
                  <p className="text-lg">{bus._count?.busSeats || 0} asientos</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Fecha de Registro</h3>
                  <p className="text-lg">{format(new Date(bus.createdAt), "d 'de' MMMM, yyyy", { locale: es })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="seats">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Asientos</CardTitle>
              <CardDescription>
                Visualización de la distribución de asientos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SeatMatrixViewer 
                matrix={bus.seatMatrix} 
                seatTiers={seatTiers || []} 
                seats={seats}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle>Viajes Programados</CardTitle>
              <CardDescription>
                Horarios asignados a este bus
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bus._count?.schedules ? (
                <p>Este bus tiene {bus._count.schedules} viajes programados.</p>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay viajes programados para este bus</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 