import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getProfileIdFromUserId } from "@/lib/auth-utils";

// Update the status of a schedule
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const { status } = await req.json();

    // Validate status
    const validStatuses = [
      "scheduled",
      "in_progress",
      "completed",
      "cancelled",
      "delayed",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
    }

    // Update schedule status
    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        status,
        // Add timestamps based on status
        ...(status === "in_progress"
          ? { actualDepartureTime: new Date() }
          : {}),
        ...(status === "completed" ? { actualArrivalTime: new Date() } : {}),
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

    // Create a log entry for this status change
    await prisma.busLog.create({
      data: {
        scheduleId: id,
        type: "SCHEDULE_STATUS_CHANGED",
        notes: `Estado cambiado a: ${status}`,
        profileId: profileId,
      },
    });

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("Error updating schedule status:", error);
    return NextResponse.json(
      { error: "Error al actualizar el estado del viaje" },
      { status: 500 }
    );
  }
}
