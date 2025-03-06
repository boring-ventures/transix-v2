import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { ScheduleStatus } from "@prisma/client";

export async function GET(req: Request) {
  try {
    // Get the Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const originId = searchParams.get("originId");
    const destinationId = searchParams.get("destinationId");
    const status = searchParams.get("status") as ScheduleStatus | null;
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    // Validate required parameters
    if (!originId || !destinationId) {
      return NextResponse.json(
        { error: "Se requieren los parámetros originId y destinationId" },
        { status: 400 }
      );
    }

    // Find routes that match the origin and destination
    const routes = await prisma.route.findMany({
      where: {
        originId,
        destinationId,
        active: true,
      },
      select: {
        id: true,
      },
    });

    if (routes.length === 0) {
      return NextResponse.json({ schedules: [] });
    }

    const routeIds = routes.map((route) => route.id);

    // Build the query for schedules
    const whereClause: {
      OR: Array<
        | { routeId: { in: string[] } }
        | { routeSchedule: { routeId: { in: string[] } } }
      >;
      status?: ScheduleStatus;
      departureDate?: {
        gte?: Date;
        lte?: Date;
      };
    } = {
      OR: [
        { routeId: { in: routeIds } },
        { routeSchedule: { routeId: { in: routeIds } } },
      ],
    };

    // Add additional filters
    if (status) {
      whereClause.status = status;
    }

    if (fromDate) {
      whereClause.departureDate = {
        ...(whereClause.departureDate || {}),
        gte: new Date(fromDate),
      };
    }

    if (toDate) {
      whereClause.departureDate = {
        ...(whereClause.departureDate || {}),
        lte: new Date(toDate),
      };
    }

    // Fetch schedules
    const schedules = await prisma.schedule.findMany({
      where: whereClause,
      include: {
        bus: true,
        primaryDriver: true,
        secondaryDriver: true,
        routeSchedule: {
          include: {
            route: true,
          },
        },
        _count: {
          select: {
            tickets: true,
            parcels: true,
          },
        },
      },
      orderBy: {
        departureDate: "asc",
      },
    });

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Error searching schedules:", error);
    return NextResponse.json(
      { error: "Error al buscar los viajes programados" },
      { status: 500 }
    );
  }
}
