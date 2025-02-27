import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Create multiple tickets at once
export async function POST(request: Request) {
  try {
    const { tickets, purchasedBy } = await request.json();
    
    if (!Array.isArray(tickets) || tickets.length === 0) {
      return NextResponse.json(
        { error: "No tickets provided" },
        { status: 400 }
      );
    }
    
    // Check if profile exists if purchasedBy is provided
    if (purchasedBy) {
      const profile = await prisma.profile.findUnique({
        where: { id: purchasedBy },
      });
      
      if (!profile) {
        return NextResponse.json(
          { error: "Profile not found" },
          { status: 404 }
        );
      }
    }
    
    // Validate all tickets before creating any
    for (const ticket of tickets) {
      const { scheduleId, busSeatId, customerId } = ticket;
      
      if (!scheduleId || !busSeatId) {
        return NextResponse.json(
          { error: "Each ticket must have scheduleId and busSeatId" },
          { status: 400 }
        );
      }
      
      // Check if schedule exists
      const schedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
      });
      
      if (!schedule) {
        return NextResponse.json(
          { error: `Schedule with ID ${scheduleId} not found` },
          { status: 404 }
        );
      }
      
      // Check if bus seat exists
      const busSeat = await prisma.busSeat.findUnique({
        where: { id: busSeatId },
      });
      
      if (!busSeat) {
        return NextResponse.json(
          { error: `Bus seat with ID ${busSeatId} not found` },
          { status: 404 }
        );
      }
      
      // Check if customer exists if customerId is provided
      if (customerId) {
        const customer = await prisma.customer.findUnique({
          where: { id: customerId },
        });
        
        if (!customer) {
          return NextResponse.json(
            { error: `Customer with ID ${customerId} not found` },
            { status: 404 }
          );
        }
      }
      
      // Check if seat is already booked for this schedule
      const existingTicket = await prisma.ticket.findFirst({
        where: {
          scheduleId,
          busSeatId,
          status: "active",
        },
      });
      
      if (existingTicket) {
        return NextResponse.json(
          { error: `Seat ${busSeat.seatNumber} is already booked for schedule ${scheduleId}` },
          { status: 409 }
        );
      }
    }
    
    // Create all tickets in a transaction
    const createdTickets = await prisma.$transaction(
      tickets.map(ticket => 
        prisma.ticket.create({
          data: {
            scheduleId: ticket.scheduleId,
            customerId: ticket.customerId,
            busSeatId: ticket.busSeatId,
            status: "active",
            price: ticket.price,
            purchasedBy,
            notes: ticket.notes,
          },
        })
      )
    );
    
    return NextResponse.json({ tickets: createdTickets }, { status: 201 });
  } catch (error) {
    console.error("Error creating tickets in bulk:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 