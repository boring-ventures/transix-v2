import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cancel a ticket
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { reason } = await request.json();
    
    if (!reason) {
      return NextResponse.json(
        { error: "Cancellation reason is required" },
        { status: 400 }
      );
    }
    
    // Check if ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });
    
    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }
    
    // Check if ticket is already cancelled
    if (ticket.status === "cancelled") {
      return NextResponse.json(
        { error: "Ticket is already cancelled" },
        { status: 400 }
      );
    }
    
    // Use a transaction to update ticket status and create cancellation record
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update ticket status
      const updatedTicket = await tx.ticket.update({
        where: { id },
        data: {
          status: "cancelled",
        },
      });
      
      // 2. Create cancellation record
      const cancellation = await tx.ticketCancellation.create({
        data: {
          ticketId: id,
          reason,
        },
      });
      
      return { updatedTicket, cancellation };
    });
    
    return NextResponse.json({
      message: "Ticket cancelled successfully",
      ticket: result.updatedTicket,
      cancellation: result.cancellation,
    });
  } catch (error) {
    console.error("Error cancelling ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 