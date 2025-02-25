import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma, SeatStatus } from "@prisma/client";

// Get all bus seats with optional filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const busId = searchParams.get("busId");
    const tierId = searchParams.get("tierId");
    const status = searchParams.get("status");
    const isActive = searchParams.get("isActive");
    
    if (!busId) {
      return NextResponse.json(
        { error: "Bus ID is required" },
        { status: 400 }
      );
    }
    
    const whereClause: Prisma.BusSeatWhereInput = { busId };
    
    if (tierId) {
      whereClause.tierId = tierId;
    }
    
    if (status) {
      whereClause.status = status as SeatStatus;
    }
    
    if (isActive !== null) {
      whereClause.isActive = isActive === "true";
    }
    
    const busSeats = await prisma.busSeat.findMany({
      where: whereClause,
      include: {
        tier: true,
      },
      orderBy: {
        seatNumber: "asc",
      },
    });
    
    return NextResponse.json({ busSeats });
  } catch (error) {
    console.error("Error fetching bus seats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new bus seat
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { busId, seatNumber, tierId, status, isActive } = json;
    
    if (!busId || !seatNumber || !tierId) {
      return NextResponse.json(
        { error: "Missing required bus seat information" },
        { status: 400 }
      );
    }
    
    // Check if bus exists
    const bus = await prisma.bus.findUnique({
      where: { id: busId },
    });
    
    if (!bus) {
      return NextResponse.json(
        { error: "Bus not found" },
        { status: 404 }
      );
    }
    
    // Check if seat tier exists
    const seatTier = await prisma.seatTier.findUnique({
      where: { id: tierId },
    });
    
    if (!seatTier) {
      return NextResponse.json(
        { error: "Seat tier not found" },
        { status: 404 }
      );
    }
    
    // Check if seat number already exists for this bus
    const existingSeat = await prisma.busSeat.findFirst({
      where: {
        busId,
        seatNumber,
      },
    });
    
    if (existingSeat) {
      return NextResponse.json(
        { error: "Seat number already exists for this bus" },
        { status: 409 }
      );
    }
    
    // Create bus seat
    const busSeat = await prisma.busSeat.create({
      data: {
        busId,
        seatNumber,
        tierId,
        status: status || "available",
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        tier: true,
        bus: true,
      },
    });
    
    return NextResponse.json({ busSeat }, { status: 201 });
  } catch (error) {
    console.error("Error creating bus seat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 