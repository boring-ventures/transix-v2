"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBusTemplates, type BusTemplate } from "@/hooks/use-bus-templates";
import { useSeatTiers } from "@/hooks/use-seat-tiers";
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
import { ArrowLeft, Bus, Building } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { SeatMatrixViewer } from "../components/seat-matrix-viewer";

interface BusTemplateDetailClientProps {
  id: string;
}

export default function BusTemplateDetailClient({
  id,
}: BusTemplateDetailClientProps) {
  const router = useRouter();
  const { fetchTemplate } = useBusTemplates();
  const [template, setTemplate] = useState<BusTemplate | null>(null);
  const { seatTiers } = useSeatTiers(template?.companyId);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTemplateData = async () => {
      try {
        setIsLoading(true);
        const templateData = await fetchTemplate(id);
        setTemplate(templateData);
      } catch (error) {
        console.error("Error cargando datos de la plantilla:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplateData();
  }, [id, fetchTemplate]);

  return (
    <div className="container mx-auto py-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
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
      ) : template ? (
        <>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {template.name}
              </h1>
              <p className="text-muted-foreground">
                {template.description || "Sin descripción"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={template.isActive ? "default" : "destructive"}>
                {template.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>

          <Tabs defaultValue="details" className="space-y-4">
            <TabsList>
              <TabsTrigger value="details">Detalles</TabsTrigger>
              <TabsTrigger value="seats">Configuración de Asientos</TabsTrigger>
              <TabsTrigger value="company">Empresa</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Información General</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tipo:</span>
                        <span className="font-medium capitalize">
                          {template.type}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Capacidad Total:
                        </span>
                        <span className="font-medium">
                          {template.totalCapacity} asientos
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Creado:</span>
                        <span className="font-medium">
                          {format(new Date(template.createdAt), "d MMM, yyyy")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Actualizado:
                        </span>
                        <span className="font-medium">
                          {format(new Date(template.updatedAt), "d MMM, yyyy")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Estadísticas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Buses Asociados:
                        </span>
                        <span className="font-medium">
                          {template._count?.buses || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="seats">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de Asientos</CardTitle>
                  <CardDescription>
                    Vista previa de la disposición de asientos
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

            <TabsContent value="company">
              <Card>
                <CardHeader>
                  <CardTitle>Información de Empresa</CardTitle>
                  <CardDescription>
                    Empresa a la que pertenece esta plantilla
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {template.company ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Empresa</h3>
                        <div className="flex items-center mt-2">
                          <Building className="h-5 w-5 mr-2 text-muted-foreground" />
                          <span>{template.company.name}</span>
                          <Badge
                            variant={
                              template.company.active ? "outline" : "secondary"
                            }
                            className="ml-2"
                          >
                            {template.company.active ? "Activa" : "Inactiva"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Building className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Plantilla sin empresa asignada
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <Bus className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            Plantilla No Encontrada
          </h2>
          <p className="text-muted-foreground">
            La plantilla que está buscando no existe o ha sido eliminada.
          </p>
        </div>
      )}
    </div>
  );
} 