import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get sales metrics by route
    const routeSales = await prisma.route.findMany({
      select: {
        id: true,
        name: true,
        origin: {
          select: {
            name: true,
          },
        },
        destination: {
          select: {
            name: true,
          },
        },
        Trip: {
          select: {
            tickets: {
              select: {
                price: true,
              },
            },
          },
        },
      },
    });

    // Process the data to get totals and route information
    const processedRouteSales = routeSales.map((route) => {
      // Calculate total sales for this route
      const totalSales = route.Trip.reduce((sum, trip) => {
        return (
          sum +
          trip.tickets.reduce((tripSum, ticket) => {
            return tripSum + (Number(ticket.price) || 0);
          }, 0)
        );
      }, 0);

      // Calculate total tickets sold for this route
      const totalTickets = route.Trip.reduce((sum, trip) => {
        return sum + trip.tickets.length;
      }, 0);

      return {
        id: route.id,
        name: route.name,
        originName: route.origin.name,
        destinationName: route.destination.name,
        routeDisplay: `${route.origin.name} → ${route.destination.name}`,
        totalSales,
        totalTickets,
        averageTicketPrice: totalTickets > 0 ? totalSales / totalTickets : 0,
      };
    });

    // Sort by total sales (highest first)
    processedRouteSales.sort((a, b) => b.totalSales - a.totalSales);

    return NextResponse.json(processedRouteSales);
  } catch (error) {
    console.error(
      "Route Sales API error:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Failed to fetch route sales data" },
      { status: 500 }
    );
  }
}
