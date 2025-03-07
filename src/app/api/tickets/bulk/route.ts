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

    // Process each ticket and create customers if needed
    const processedTickets = [];

    for (const ticket of tickets) {
      const {
        scheduleId,
        busSeatId,
        customerId,
        passengerName,
        passengerDocument,
        contactPhone,
        contactEmail,
      } = ticket;

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
          {
            error: `Seat ${busSeat.seatNumber} is already booked for schedule ${scheduleId}`,
          },
          { status: 409 }
        );
      }

      // Handle customer creation or lookup if needed
      let finalCustomerId = customerId;

      if (!finalCustomerId && passengerName && passengerDocument) {
        // Try to find existing customer by document ID
        const existingCustomer = await prisma.customer.findFirst({
          where: { documentId: passengerDocument },
        });

        if (existingCustomer) {
          // Use existing customer
          finalCustomerId = existingCustomer.id;
          console.log(
            `Using existing customer ${existingCustomer.id} for passenger ${passengerName}`
          );
        } else {
          // Create new customer
          try {
            const newCustomer = await prisma.customer.create({
              data: {
                fullName: passengerName,
                documentId: passengerDocument,
                phone: contactPhone,
                email: contactEmail,
              },
            });
            finalCustomerId = newCustomer.id;
            console.log(
              `Created new customer ${newCustomer.id} for passenger ${passengerName}`
            );
          } catch (err) {
            console.error(
              `Failed to create customer for passenger ${passengerName}:`,
              err
            );
            // Continue without customer ID if creation fails
          }
        }
      }

      // Add processed ticket to the list
      processedTickets.push({
        ...ticket,
        customerId: finalCustomerId,
      });
    }

    // Create all tickets in a transaction
    const createdTickets = await prisma.$transaction(
      processedTickets.map((ticket) =>
        prisma.ticket.create({
          data: {
            scheduleId: ticket.scheduleId,
            customerId: ticket.customerId,
            busSeatId: ticket.busSeatId,
            status: "active",
            price: ticket.price,
            purchasedBy,
            notes:
              ticket.notes ||
              `Passenger: ${ticket.passengerName || "Unknown"}, Document: ${ticket.passengerDocument || "Unknown"}`,
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