import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { ScheduleStatus } from "@prisma/client";

// Get a specific schedule by ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const { searchParams } = new URL(req.url);
    const include = searchParams.get("include")?.split(",") || [];

    // Build include object based on query params
    const includeObj = {
      bus: include.includes("bus"),
      primaryDriver: include.includes("primaryDriver"),
      secondaryDriver: include.includes("secondaryDriver"),
      routeSchedule: include.includes("route")
        ? {
            include: {
              route: true,
            },
          }
        : true,
      tickets: include.includes("tickets"),
      parcels: include.includes("parcels"),
      _count: {
        select: {
          tickets: true,
          parcels: true,
        },
      },
    };

    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: includeObj,
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Viaje no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { error: "Error al obtener el viaje" },
      { status: 500 }
    );
  }
}

// Update a schedule
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const data = await req.json();

    // Check if schedule exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: "Viaje no encontrado" },
        { status: 404 }
      );
    }

    // Update schedule
    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        routeScheduleId: data.routeScheduleId,
        busId: data.busId,
        primaryDriverId: data.primaryDriverId,
        secondaryDriverId: data.secondaryDriverId,
        departureDate: data.departureDate
          ? new Date(data.departureDate)
          : undefined,
        estimatedArrivalTime: data.estimatedArrivalTime
          ? new Date(data.estimatedArrivalTime)
          : undefined,
        price: data.price,
        status: data.status as ScheduleStatus | undefined,
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

    // Create a log entry for this update
    await prisma.busLog.create({
      data: {
        scheduleId: id,
        type: "SCHEDULE_UPDATED",
        notes: "Información del viaje actualizada",
        profileId: session.user.id,
      },
    });

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      { error: "Error al actualizar el viaje" },
      { status: 500 }
    );
  }
}

// Delete a schedule (soft delete by setting status to cancelled)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Check if schedule exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: "Viaje no encontrado" },
        { status: 404 }
      );
    }

    // Don't allow cancelling completed schedules
    if (existingSchedule.status === "completed") {
      return NextResponse.json(
        { error: "No se puede cancelar un viaje ya completado" },
        { status: 400 }
      );
    }

    // Update schedule status to cancelled
    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        status: "cancelled",
      },
    });

    // Create a log entry for this cancellation
    await prisma.busLog.create({
      data: {
        scheduleId: id,
        type: "SCHEDULE_CANCELLED",
        notes: "El viaje ha sido cancelado",
        profileId: session.user.id,
      },
    });

    return NextResponse.json({
      message: "Viaje cancelado exitosamente",
      schedule,
    });
  } catch (error) {
    console.error("Error cancelling schedule:", error);
    return NextResponse.json(
      { error: "Error al cancelar el viaje" },
      { status: 500 }
    );
  }
}
