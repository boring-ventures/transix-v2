"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface TicketSalesTableProps {
  dateRange?: DateRange;
}

export default function TicketSalesTable({ dateRange }: TicketSalesTableProps) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      try {
        let url = "/api/tickets?";

        if (dateRange?.from && dateRange?.to) {
          const startDate = format(dateRange.from, "yyyy-MM-dd");
          const endDate = format(dateRange.to, "yyyy-MM-dd");
          url += `startDate=${startDate}&endDate=${endDate}&`;
        }

        url += `page=${page}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch tickets");
        }

        const data = await response.json();
        setTickets(data.tickets || []);
        setTotalPages(Math.ceil((data.total || 0) / data.perPage) || 1);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, [dateRange, page]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Activo</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">
          No hay tickets para el período seleccionado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Ruta</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Asiento</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead>Vendido por</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-medium">
                  {ticket.id.slice(0, 8)}
                </TableCell>
                <TableCell>
                  {ticket.schedule?.routeSchedule?.route
                    ? `${ticket.schedule.routeSchedule.route.origin.name} → ${ticket.schedule.routeSchedule.route.destination.name}`
                    : "Ruta no disponible"}
                </TableCell>
                <TableCell>
                  {ticket.customer
                    ? ticket.customer.fullName
                    : "Cliente no registrado"}
                </TableCell>
                <TableCell>{ticket.busSeat?.seatNumber}</TableCell>
                <TableCell className="text-right">
                  ${Number(ticket.price).toFixed(2)}
                </TableCell>
                <TableCell>
                  {ticket.profile ? ticket.profile.fullName : "No especificado"}
                </TableCell>
                <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                <TableCell>
                  {format(new Date(ticket.purchasedAt), "dd MMM yyyy HH:mm")}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Link
                          href={`/dashboard/tickets/${ticket.id}`}
                          className="w-full"
                        >
                          Ver detalle
                        </Link>
                      </DropdownMenuItem>
                      {ticket.status === "active" && (
                        <>
                          <DropdownMenuItem>
                            <Link
                              href={`/dashboard/tickets/${ticket.id}/cancel`}
                              className="w-full"
                            >
                              Cancelar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link
                              href={`/dashboard/tickets/${ticket.id}/reassign`}
                              className="w-full"
                            >
                              Reasignar
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
            />
          </PaginationItem>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNumber =
              page <= 3
                ? i + 1
                : page >= totalPages - 2
                  ? totalPages - 4 + i
                  : page - 2 + i;

            if (pageNumber <= 0 || pageNumber > totalPages) return null;

            return (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  isActive={page === pageNumber}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          <PaginationItem>
            <PaginationNext
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
