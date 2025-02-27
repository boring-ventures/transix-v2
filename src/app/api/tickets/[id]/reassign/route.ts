import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Reassign a ticket to a different schedule
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { newScheduleId, newBusSeatId, reason } = await request.json();
    
    if (!newScheduleId || !newBusSeatId || !reason) {
      return NextResponse.json(
        { error: "New schedule ID, new bus seat ID, and reason are required" },
        { status: 400 }
      );
    }
    
    // Check if ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        schedule: true,
      },
    });
    
    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }
    
    // Check if ticket is active
    if (ticket.status !== "active") {
      return NextResponse.json(
        { error: "Only active tickets can be reassigned" },
        { status: 400 }
      );
    }
    
    // Check if new schedule exists
    const newSchedule = await prisma.schedule.findUnique({
      where: { id: newScheduleId },
    });
    
    if (!newSchedule) {
      return NextResponse.json(
        { error: "New schedule not found" },
        { status: 404 }
      );
    }
    
    // Check if new bus seat exists
    const newBusSeat = await prisma.busSeat.findUnique({
      where: { id: newBusSeatId },
    });
    
    if (!newBusSeat) {
      return NextResponse.json(
        { error: "New bus seat not found" },
        { status: 404 }
      );
    }
    
    // Check if new seat is already booked for the new schedule
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        scheduleId: newScheduleId,
        busSeatId: newBusSeatId,
        status: "active",
      },
    });
    
    if (existingTicket) {
      return NextResponse.json(
        { error: "The selected seat is already booked for the new schedule" },
        { status: 409 }
      );
    }
    
    // Use a transaction to update ticket and create reassignment record
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update ticket with new schedule and seat
      const updatedTicket = await tx.ticket.update({
        where: { id },
        data: {
          scheduleId: newScheduleId,
          busSeatId: newBusSeatId,
        },
      });
      
      // 2. Create reassignment record
      const reassignment = await tx.ticketReassignment.create({
        data: {
          ticketId: id,
          oldScheduleId: ticket.scheduleId,
          newScheduleId,
          reason,
        },
      });
      
      return { updatedTicket, reassignment };
    });
    
    return NextResponse.json({
      message: "Ticket reassigned successfully",
      ticket: result.updatedTicket,
      reassignment: result.reassignment,
    });
  } catch (error) {
    console.error("Error reassigning ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 