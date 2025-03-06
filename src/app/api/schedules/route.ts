import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Prisma, ScheduleStatus } from "@prisma/client";
import { getProfileIdFromUserId } from "@/lib/auth-utils";

// Get all schedules with optional filtering
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
    const routeId = searchParams.get("routeId");
    const busId = searchParams.get("busId");
    const status = searchParams.get("status");
    const primaryDriverId = searchParams.get("primaryDriverId");
    const secondaryDriverId = searchParams.get("secondaryDriverId");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const routeScheduleId = searchParams.get("routeScheduleId");

    // Build the query
    const whereClause: Prisma.ScheduleWhereInput = {};

    if (routeId) {
      // Check if we should filter by routeId directly or through routeSchedule
      whereClause.OR = [{ routeId }, { routeSchedule: { routeId } }];
    }

    if (busId) whereClause.busId = busId;
    if (status) whereClause.status = status as ScheduleStatus;
    if (primaryDriverId) whereClause.primaryDriverId = primaryDriverId;
    if (secondaryDriverId) whereClause.secondaryDriverId = secondaryDriverId;
    if (routeScheduleId) whereClause.routeScheduleId = routeScheduleId;

    if (fromDate) {
      whereClause.departureDate = {
        ...(whereClause.departureDate as Prisma.DateTimeFilter),
        gte: new Date(fromDate),
      };
    }

    if (toDate) {
      whereClause.departureDate = {
        ...(whereClause.departureDate as Prisma.DateTimeFilter),
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
        departureDate: "desc",
      },
    });

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Error al obtener los viajes programados" },
      { status: 500 }
    );
  }
}

// Create a new schedule
export async function POST(req: Request) {
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

    const data = await req.json();

    // Validate required fields
    if (
      !data.routeScheduleId ||
      !data.busId ||
      !data.primaryDriverId ||
      !data.departureDate
    ) {
      return NextResponse.json(
        { error: "Faltan campos requeridos para crear el viaje" },
        { status: 400 }
      );
    }

    // Create schedule
    const schedule = await prisma.schedule.create({
      data: {
        routeScheduleId: data.routeScheduleId,
        routeId:
          data.routeId ||
          (
            await prisma.routeSchedule.findUnique({
              where: { id: data.routeScheduleId },
              select: { routeId: true },
            })
          )?.routeId ||
          "",
        busId: data.busId,
        primaryDriverId: data.primaryDriverId,
        secondaryDriverId: data.secondaryDriverId,
        departureDate: new Date(data.departureDate),
        estimatedArrivalTime: new Date(data.estimatedArrivalTime),
        price: data.price,
        status: "scheduled",
      },
      include: {
        bus: true,
        primaryDriver: true,
        secondaryDriver: true,
        routeSchedule: {
          include: {
            route: true,
          },
        },
      },
    });

    // Get the profile ID associated with the authenticated user
    const profileId = await getProfileIdFromUserId(session.user.id);

    if (!profileId) {
      return NextResponse.json(
        { error: "Perfil de usuario no encontrado" },
        { status: 404 }
      );
    }

    // Create a log entry for this new schedule
    await prisma.busLog.create({
      data: {
        scheduleId: schedule.id,
        type: "SCHEDULE_CREATED",
        notes: "Nuevo viaje creado",
        profileId: profileId,
      },
    });

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      { error: "Error al crear el viaje programado" },
      { status: 500 }
    );
  }
}
