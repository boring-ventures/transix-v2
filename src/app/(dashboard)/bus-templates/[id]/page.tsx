"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBusTemplates, type BusTemplate } from "@/hooks/use-bus-templates";
import { useSeatTiers } from "@/hooks/use-seat-tiers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bus, Calendar } from "lucide-react";
import { SeatMatrixViewer } from "../components/seat-matrix-viewer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function BusTemplatePage() {
  const { id } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [template, setTemplate] = useState<BusTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Get all templates and find the one with matching ID
  const { templates, isLoadingTemplates } = useBusTemplates();
  const { seatTiers } = useSeatTiers(template?.companyId);
  
  useEffect(() => {
    if (!isLoadingTemplates && templates) {
      const foundTemplate = templates.find((t: BusTemplate) => t.id === id);
      if (foundTemplate) {
        setTemplate(foundTemplate);
      } else {
        setError("Template not found");
      }
      setIsLoading(false);
    }
  }, [id, templates, isLoadingTemplates]);
  
  if (isLoading || isLoadingTemplates) {
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
  
  if (error || !template) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Bus className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Plantilla no encontrada</h2>
        <p className="text-muted-foreground mb-6">
          La plantilla que estás buscando no existe o ha sido eliminada.
        </p>
        <Button onClick={() => router.push("/bus-templates")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Plantillas
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

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{template.name}</h1>
          <div className="flex items-center mt-2">
            <Badge variant={template.isActive ? "default" : "destructive"}>
              {template.isActive ? "Activo" : "Inactivo"}
            </Badge>
            <span className="text-muted-foreground ml-4">
              Creado el {format(new Date(template.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="mb-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="seats">Configuración de Asientos</TabsTrigger>
          <TabsTrigger value="buses">Buses Asignados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Empresa</CardTitle>
                <Bus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-medium">{template.company?.name}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tipo</CardTitle>
                <Bus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-medium">
                  {template.type === "standard" && "Estándar"}
                  {template.type === "luxury" && "Lujo"}
                  {template.type === "double_decker" && "Dos Pisos"}
                  {template.type === "minibus" && "Minibús"}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Capacidad</CardTitle>
                <Bus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{template.totalCapacity}</div>
                <p className="text-xs text-muted-foreground">asientos</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Buses Asignados</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{template._count?.buses || 0}</div>
              </CardContent>
            </Card>
          </div>
          
          {template.description && (
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{template.description}</p>
              </CardContent>
            </Card>
          )}
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
                matrix={template.seatTemplateMatrix} 
                seatTiers={seatTiers || []} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="buses">
          <Card>
            <CardHeader>
              <CardTitle>Buses Asignados</CardTitle>
              <CardDescription>
                Buses que utilizan esta plantilla
              </CardDescription>
            </CardHeader>
            <CardContent>
              {template._count?.buses ? (
                <p>Esta plantilla está asignada a {template._count.buses} buses.</p>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Bus className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay buses asignados a esta plantilla</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 