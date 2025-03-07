import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getProfileIdFromUserId } from "@/lib/auth-utils";

// Create a new schedule
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

    // Get query parameters for includes
    const { searchParams } = new URL(req.url);
    const includeParam = searchParams.get("include") || "";
    const includes = includeParam.split(",");

    // Build the include object for Prisma
    const includeObj: any = {};

    if (includes.includes("bus")) includeObj.bus = true;
    if (includes.includes("primaryDriver")) includeObj.primaryDriver = true;
    if (includes.includes("secondaryDriver")) includeObj.secondaryDriver = true;
    if (includes.includes("route")) {
      includeObj.routeSchedule = {
        include: {
          route: true,
        },
      };
    }
    if (includes.includes("tickets")) {
      includeObj._count = {
        ...(includeObj._count || {}),
        select: {
          ...(includeObj._count?.select || {}),
          tickets: true,
        },
      };
    }
    if (includes.includes("parcels")) {
      includeObj._count = {
        ...(includeObj._count || {}),
        select: {
          ...(includeObj._count?.select || {}),
          parcels: true,
        },
      };
    }

    // Return an empty schedule object with the requested includes
    // This is just a placeholder for the frontend to use for creating a new schedule
    return NextResponse.json({
      schedule: {
        id: "",
        routeId: "",
        busId: "",
        routeScheduleId: "",
        primaryDriverId: "",
        secondaryDriverId: null,
        departureDate: new Date().toISOString(),
        estimatedArrivalTime: new Date().toISOString(),
        actualDepartureTime: null,
        actualArrivalTime: null,
        price: 0,
        status: "scheduled",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(includeObj.bus && { bus: null }),
        ...(includeObj.primaryDriver && { primaryDriver: null }),
        ...(includeObj.secondaryDriver && { secondaryDriver: null }),
        ...(includeObj.routeSchedule && {
          routeSchedule: {
            id: "",
            routeId: "",
            departureTime: new Date().toISOString(),
            operatingDays: "",
            active: true,
            seasonStart: null,
            seasonEnd: null,
            estimatedArrivalTime: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            route: {
              id: "",
              name: "",
              originId: "",
              destinationId: "",
              estimatedDuration: 0,
              active: true,
              departureLane: "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
        }),
        ...(includeObj._count?.select?.tickets && { _count: { tickets: 0 } }),
        ...(includeObj._count?.select?.parcels && { _count: { parcels: 0 } }),
      },
    });
  } catch (error) {
    console.error("Error creating schedule template:", error);
    return NextResponse.json(
      { error: "Error al obtener la plantilla de viaje" },
      { status: 500 }
    );
  }
}

// POST method is not needed here as it's handled by the main /api/schedules endpoint
export async function POST(req: Request) {
  return NextResponse.json(
    { error: "Use the main /api/schedules endpoint for creating schedules" },
    { status: 405 }
  );
}
