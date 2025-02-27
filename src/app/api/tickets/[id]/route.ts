import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get a specific ticket by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
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
            bus: true,
          },
        },
        customer: true,
        busSeat: {
          include: {
            tier: true,
          },
        },
        profile: true,
        paymentLines: {
          include: {
            payment: true,
          },
        },
        cancellations: true,
        reassignments: {
          include: {
            oldSchedule: true,
            newSchedule: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update a ticket
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await request.json();
    const { customerId, notes, status } = json;

    // Check if ticket exists
    const existingTicket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!existingTicket) {
      return NextResponse.json(
        { error: "Ticket not found" },
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
          { error: "Customer not found" },
          { status: 404 }
        );
      }
    }

    // Update ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        customerId: customerId !== undefined ? customerId : undefined,
        notes: notes !== undefined ? notes : undefined,
        status: status !== undefined ? status : undefined,
      },
      include: {
        schedule: true,
        customer: true,
        busSeat: true,
        profile: true,
      },
    });

    return NextResponse.json({ ticket: updatedTicket });
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete a ticket (soft delete by setting status to cancelled)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if ticket exists
    const existingTicket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!existingTicket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Instead of deleting, mark as cancelled
    const cancelledTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status: "cancelled",
      },
    });

    return NextResponse.json({
      message: "Ticket cancelled successfully",
      ticket: cancelledTicket,
    });
  } catch (error) {
    console.error("Error cancelling ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 