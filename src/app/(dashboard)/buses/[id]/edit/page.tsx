"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBuses, type Bus } from "@/hooks/use-buses";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bus as BusIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EditBusForm } from "../../components/edit-bus-form";
import { DeleteBusDialog } from "../../components/delete-bus-dialog";

export default function EditBusPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [bus, setBus] = useState<Bus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Get bus details
  const { fetchBus } = useBuses();
  
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
          <h1 className="text-3xl font-bold tracking-tight">Editar Bus</h1>
          <p className="text-muted-foreground">
            {bus.plateNumber} • {bus.company?.name || "Sin empresa asignada"}
          </p>
        </div>
        <Button 
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
        >
          Eliminar Bus
        </Button>
      </div>
      
      <EditBusForm bus={bus} />
      
      <DeleteBusDialog
        busId={showDeleteDialog ? bus.id : null}
        onClose={() => setShowDeleteDialog(false)}
      />
    </div>
  );
} 