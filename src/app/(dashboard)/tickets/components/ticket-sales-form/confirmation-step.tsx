import { useState } from "react";
import { Printer, Download, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import type { StepComponentProps, Ticket } from "./types";
import { useLocations } from "@/hooks/use-locations";

interface ConfirmationStepProps extends StepComponentProps {
  tickets: Ticket[];
}

export function ConfirmationStep({
  formData,
  tickets,
  formatDate,
  formatTime,
  calculateTotalPrice,
  goToNextStep,
}: ConfirmationStepProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const { locations } = useLocations();

  // Get location names
  type LocationWithId = { id: string; name: string; [key: string]: unknown };
  const originName = locations.find(
    (l: LocationWithId) => l.id === formData.originId
  )?.name;
  const destinationName = locations.find(
    (l: LocationWithId) => l.id === formData.destinationId
  )?.name;

  // Handle print tickets
  const handlePrintTickets = () => {
    setIsPrinting(true);

    // Create a printable version of the tickets
    const printContent = document.createElement("div");
    printContent.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1 style="text-align: center; color: #e11d48;">Boletos de Viaje</h1>
        <div style="text-align: center; margin-bottom: 20px;">
          <p style="font-size: 18px; font-weight: bold;">${originName} - ${destinationName}</p>
          <p>Fecha: ${formatDate(new Date())} • Hora: ${formatTime(new Date())}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2>Detalles de Pasajeros</h2>
          ${formData.passengers
            .map(
              (passenger, index) => `
            <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 5px;">
              <p style="font-weight: bold; margin: 0;">Pasajero ${index + 1}: ${passenger.fullName}</p>
              <p style="margin: 5px 0;">Documento: ${passenger.documentId}</p>
              <p style="margin: 5px 0;">Asiento: ${passenger.seatNumber}</p>
              ${passenger.phone ? `<p style="margin: 5px 0;">Teléfono: ${passenger.phone}</p>` : ""}
              ${passenger.email ? `<p style="margin: 5px 0;">Email: ${passenger.email}</p>` : ""}
            </div>
          `
            )
            .join("")}
        </div>
        
        <div style="border-top: 1px solid #ddd; padding-top: 20px;">
          <p style="font-size: 18px; font-weight: bold; text-align: right;">Total: $${calculateTotalPrice()}</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
          <p>Gracias por su compra. Por favor, presente este boleto al abordar.</p>
          <p>Fecha de emisión: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;

    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Boletos de Viaje</title>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();

      // Print after a short delay to ensure content is loaded
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        setIsPrinting(false);
      }, 500);
    } else {
      setIsPrinting(false);
      alert(
        "Por favor, permita las ventanas emergentes para imprimir los boletos."
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold">¡Venta Completada!</h2>
        <p className="text-muted-foreground mt-2">
          Los boletos han sido emitidos exitosamente
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de la Compra</CardTitle>
          <CardDescription>
            {originName} - {destinationName} • {formatDate(new Date())} •{" "}
            {formatTime(new Date())}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Detalles de Pasajeros</h3>
            <div className="space-y-3">
              {formData.passengers.map((passenger, index) => (
                <div key={index} className="p-3 border rounded-md">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{passenger.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        Doc: {passenger.documentId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        Asiento {passenger.seatNumber}
                      </p>
                      {passenger.customerId && (
                        <p className="text-xs text-muted-foreground">
                          Cliente registrado
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium mb-2">Detalles de Pago</h3>
            <div className="flex justify-between">
              <p>Total</p>
              <p className="font-bold">${calculateTotalPrice()}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrintTickets}
            disabled={isPrinting}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            {isPrinting ? "Imprimiendo..." : "Imprimir Boletos"}
          </Button>
          <Button onClick={goToNextStep} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Nueva Venta
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
