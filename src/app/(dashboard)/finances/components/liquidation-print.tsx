"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LiquidationPrintProps {
  liquidationId?: string;
  data?: any;
  onPrint?: () => void;
}

export default function LiquidationPrint({
  liquidationId,
  data: initialData,
  onPrint,
}: LiquidationPrintProps) {
  const [isLoading, setIsLoading] = useState(!initialData && !!liquidationId);
  const [data, setData] = useState<any>(initialData || null);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      return;
    }

    if (liquidationId) {
      // Fetch data from API
      setIsLoading(true);
      fetch(`/api/finances/trip-settlements/${liquidationId}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch trip settlement");
          }
          return response.json();
        })
        .then((responseData) => {
          setData(responseData);
        })
        .catch((error) => {
          console.error("Error fetching trip settlement:", error);
          setData(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [liquidationId, initialData]);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[800px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-semibold">No se encontró el arreglo</h3>
        <p className="text-muted-foreground">
          El arreglo de viaje solicitado no existe o no está disponible.
        </p>
      </div>
    );
  }

  // Prepare the data for display
  const date = data.settledAt ? new Date(data.settledAt) : new Date();
  const departureTime = data.departureTime
    ? new Date(data.departureTime)
    : null;
  const expenses = data.expenses || [];
  const totalIncome =
    typeof data.totalIncome === "number" ? data.totalIncome : 0;
  const totalExpenses =
    typeof data.totalExpenses === "number" ? data.totalExpenses : 0;
  const netAmount = typeof data.netAmount === "number" ? data.netAmount : 0;

  return (
    <div className="container mx-auto">
      <div className="print:hidden flex justify-end mb-4">
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
      </div>

      <div className="liquidation-print border border-gray-300 mx-auto max-w-[800px] p-4 print:p-0 print:border-none">
        {/* Header */}
        <div className="text-center border-b border-black pb-2 mb-4">
          <h1 className="text-2xl font-bold uppercase tracking-wide">
            FLOTA IMPERIAL
          </h1>
          <h2 className="text-xl font-bold uppercase">POTOSI</h2>
        </div>

        {/* Main Info Grid */}
        <div className="grid grid-cols-2 border border-black">
          <div className="p-2 border-b border-black font-bold text-center">
            ARREGLO DE VIAJE
          </div>
          <div className="p-2 border-b border-black font-bold text-center">
            {format(date, "dd/MM/yyyy")}
          </div>

          <div className="p-2 border-b border-r border-black">
            NOMBRE PROPIETARIO
          </div>
          <div className="p-2 border-b border-black font-bold">
            {data.ownerName || "N/A"}
          </div>

          <div className="p-2 border-b border-r border-black">RUTA</div>
          <div className="p-2 border-b border-black">
            {data.routeName || "N/A"}
          </div>

          <div className="p-2 border-b border-r border-black">HORA</div>
          <div className="p-2 border-b border-black">
            {departureTime ? format(departureTime, "HH:mm") : "N/A"}
          </div>

          <div className="p-2 border-r border-black">PLACA</div>
          <div className="p-2">{data.plateNumber || "N/A"}</div>

          <div className="p-2 border-t border-r border-black">MARCA</div>
          <div className="p-2 border-t">{data.busType || "N/A"}</div>
        </div>

        {/* Income Section */}
        <div className="mt-4">
          <div className="grid grid-cols-2 border border-black">
            <div className="p-2 border-b font-bold text-center col-span-2">
              INGRESOS
            </div>
            <div className="p-2 border-b border-r font-bold">Concepto</div>
            <div className="p-2 border-b text-center font-bold">Monto</div>

            {/* Total Income */}
            <div className="p-2 border-b border-r">Total Ingresos</div>
            <div className="p-2 border-b text-right">
              Bs {totalIncome.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="mt-4">
          <div className="grid grid-cols-2 border border-black">
            <div className="p-2 border-b font-bold text-center col-span-2">
              EGRESOS
            </div>
            <div className="p-2 border-b border-r font-bold">Concepto</div>
            <div className="p-2 border-b text-center font-bold">Monto</div>

            {/* Expense Items */}
            {expenses.map((expense, index) => (
              <React.Fragment key={expense.id || index}>
                <div className="p-2 border-b border-r">
                  {expense.category}
                  {expense.description && (
                    <span className="text-sm ml-1">
                      ({expense.description})
                    </span>
                  )}
                </div>
                <div className="p-2 border-b text-right">
                  Bs {Number(expense.amount).toFixed(2)}
                </div>
              </React.Fragment>
            ))}

            {/* Total Expenses */}
            <div className="p-2 border-b border-r font-bold">Total Egresos</div>
            <div className="p-2 border-b text-right font-bold">
              Bs {totalExpenses.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Balance Section */}
        <div className="mt-4 border border-black">
          <div className="p-2 border-b font-bold text-center">
            BALANCE FINAL
          </div>
          <div className="grid grid-cols-2">
            <div className="p-2 border-b border-r">Total Ingresos</div>
            <div className="p-2 border-b text-right">
              Bs {totalIncome.toFixed(2)}
            </div>

            <div className="p-2 border-b border-r">Total Egresos</div>
            <div className="p-2 border-b text-right">
              Bs {totalExpenses.toFixed(2)}
            </div>

            <div className="p-2 border-r font-bold">MONTO NETO</div>
            <div className="p-2 text-right font-bold">
              Bs {netAmount.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Notes */}
        {data.details && (
          <div className="mt-4 border border-black p-2">
            <div className="font-bold">Notas:</div>
            <div>{data.details}</div>
          </div>
        )}

        {/* Signatures */}
        <div className="mt-8 grid grid-cols-2 gap-16">
          <div className="text-center">
            <div className="border-t border-black pt-2">Cobrador</div>
          </div>
          <div className="text-center">
            <div className="border-t border-black pt-2">Propietario</div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            font-family: Arial, sans-serif;
            font-size: 12pt;
            margin: 0;
            padding: 0;
          }
          .liquidation-print {
            page-break-after: always;
          }
          @page {
            size: letter portrait;
            margin: 0.5cm;
          }
        }
      `}</style>
    </div>
  );
}
