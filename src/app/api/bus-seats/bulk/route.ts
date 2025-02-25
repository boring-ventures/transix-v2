import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Bulk create bus seats
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { busId, seats } = json;
    
    if (!busId || !seats || !Array.isArray(seats) || seats.length === 0) {
      return NextResponse.json(
        { error: "Invalid request data" },
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
    
    // Validate seat data
    for (const seat of seats) {
      if (!seat.seatNumber || !seat.tierId) {
        return NextResponse.json(
          { error: "Each seat must have a seatNumber and tierId" },
          { status: 400 }
        );
      }
      
      // Check if seat tier exists
      const seatTier = await prisma.seatTier.findUnique({
        where: { id: seat.tierId },
      });
      
      if (!seatTier) {
        return NextResponse.json(
          { error: `Seat tier with ID ${seat.tierId} not found` },
          { status: 404 }
        );
      }
    }
    
    // Check for duplicate seat numbers
    const seatNumbers = seats.map(seat => seat.seatNumber);
    const uniqueSeatNumbers = new Set(seatNumbers);
    
    if (seatNumbers.length !== uniqueSeatNumbers.size) {
      return NextResponse.json(
        { error: "Duplicate seat numbers are not allowed" },
        { status: 400 }
      );
    }
    
    // Check if any seat numbers already exist for this bus
    const existingSeats = await prisma.busSeat.findMany({
      where: {
        busId,
        seatNumber: {
          in: seatNumbers,
        },
      },
      select: {
        seatNumber: true,
      },
    });
    
    if (existingSeats.length > 0) {
      const existingSeatNumbers = existingSeats.map(seat => seat.seatNumber);
      return NextResponse.json(
        { 
          error: "Some seat numbers already exist for this bus",
          existingSeatNumbers,
        },
        { status: 409 }
      );
    }
    
    // Create bus seats
    const createdSeats = await prisma.$transaction(
      seats.map(seat => 
        prisma.busSeat.create({
          data: {
            busId,
            seatNumber: seat.seatNumber,
            tierId: seat.tierId,
            status: seat.status || "available",
            isActive: seat.isActive !== undefined ? seat.isActive : true,
          },
        })
      )
    );
    
    return NextResponse.json({ busSeats: createdSeats }, { status: 201 });
  } catch (error) {
    console.error("Error creating bus seats in bulk:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Bulk update bus seats
export async function PATCH(request: Request) {
  try {
    const json = await request.json();
    const { updates } = json;
    
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }
    
    // Validate update data
    for (const update of updates) {
      if (!update.id) {
        return NextResponse.json(
          { error: "Each update must have an id" },
          { status: 400 }
        );
      }
      
      // Check if bus seat exists
      const busSeat = await prisma.busSeat.findUnique({
        where: { id: update.id },
      });
      
      if (!busSeat) {
        return NextResponse.json(
          { error: `Bus seat with ID ${update.id} not found` },
          { status: 404 }
        );
      }
      
      // If changing tier, check if tier exists
      if (update.tierId) {
        const seatTier = await prisma.seatTier.findUnique({
          where: { id: update.tierId },
        });
        
        if (!seatTier) {
          return NextResponse.json(
            { error: `Seat tier with ID ${update.tierId} not found` },
            { status: 404 }
          );
        }
      }
    }
    
    // Update bus seats
    const updatedSeats = await prisma.$transaction(
      updates.map(update => 
        prisma.busSeat.update({
          where: { id: update.id },
          data: {
            tierId: update.tierId !== undefined ? update.tierId : undefined,
            status: update.status !== undefined ? update.status : undefined,
            isActive: update.isActive !== undefined ? update.isActive : undefined,
          },
        })
      )
    );
    
    return NextResponse.json({ busSeats: updatedSeats });
  } catch (error) {
    console.error("Error updating bus seats in bulk:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 