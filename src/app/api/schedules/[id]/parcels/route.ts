import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ParcelStatus } from "@prisma/client";

// Get all parcels for a schedule
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Check if schedule exists
    const schedule = await prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Build where clause
    const whereClause = {
      scheduleId: id,
      ...(status ? { status: status as ParcelStatus } : {}),
    };

    // Get parcels
    const parcels = await prisma.parcel.findMany({
      where: whereClause,
      include: {
        sender: true,
        receiver: true,
        statusUpdates: {
          orderBy: {
            updatedAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ parcels });
  } catch (error) {
    console.error("Error fetching schedule parcels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new parcel for a schedule
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const {
      trackingNumber,
      weight,
      dimensions,
      senderId,
      receiverId,
      price,
      status,
    } = await request.json();

    // Validate required fields
    if (!trackingNumber || !senderId || !receiverId) {
      return NextResponse.json(
        { error: "Tracking number, sender ID, and receiver ID are required" },
        { status: 400 }
      );
    }

    // Check if schedule exists and is not cancelled
    const schedule = await prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    if (schedule.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot create parcel for a cancelled schedule" },
        { status: 400 }
      );
    }

    // Check if tracking number is unique
    const existingParcel = await prisma.parcel.findFirst({
      where: { id: trackingNumber },
    });

    if (existingParcel) {
      return NextResponse.json(
        { error: "Tracking number already exists" },
        { status: 409 }
      );
    }

    // Create parcel
    const parcel = await prisma.parcel.create({
      data: {
        scheduleId: id,
        weight,
        dimensions,
        senderId,
        receiverId,
        price: price || 0,
        status: status || "received",
        declaredValue: 0,
      },
      include: {
        sender: true,
        receiver: true,
        schedule: {
          include: {
            routeSchedule: {
              include: {
                route: {
                  include: {
                    origin: true,
                    destination: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Create initial status update
    await prisma.parcelStatusUpdate.create({
      data: {
        parcelId: parcel.id,
        status: parcel.status,
      },
    });

    return NextResponse.json({ parcel }, { status: 201 });
  } catch (error) {
    console.error("Error creating parcel:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 