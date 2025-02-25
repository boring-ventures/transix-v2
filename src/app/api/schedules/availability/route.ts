import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get available seats for a schedule
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get("scheduleId");
    
    if (!scheduleId) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      );
    }
    
    // Check if schedule exists
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        bus: {
          include: {
            busSeats: {
              include: {
                tier: true,
              },
            },
          },
        },
      },
    });
    
    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }
    
    // Get booked seats
    const bookedSeats = await prisma.ticket.findMany({
      where: {
        scheduleId,
        status: "active",
      },
      select: {
        busSeatId: true,
      },
    });
    
    const bookedSeatIds = bookedSeats.map(seat => seat.busSeatId);
    
    // Filter available seats
    const allSeats = schedule.bus?.busSeats || [];
    const availableSeats = allSeats.filter(seat => 
      !bookedSeatIds.includes(seat.id) && 
      seat.isActive && 
      seat.status === "available"
    );
    
    // Group seats by tier
    const seatsByTier = availableSeats.reduce((acc, seat) => {
      const tierName = seat.tier?.name || "Unknown";
      if (!acc[tierName]) {
        acc[tierName] = [];
      }
      acc[tierName].push(seat);
      return acc;
    }, {} as Record<string, typeof availableSeats>);
    
    return NextResponse.json({
      schedule,
      availableSeats,
      seatsByTier,
      totalAvailable: availableSeats.length,
      totalCapacity: allSeats.length,
      occupancyRate: allSeats.length > 0 
        ? ((allSeats.length - availableSeats.length) / allSeats.length) * 100 
        : 0,
    });
  } catch (error) {
    console.error("Error fetching schedule availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 