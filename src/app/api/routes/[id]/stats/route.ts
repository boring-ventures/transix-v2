import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if route exists
    const route = await prisma.route.findUnique({
      where: { id },
    });

    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    // Get counts of related entities
    const [
      assignmentsCount,
      activeAssignmentsCount,
      routeSchedulesCount,
      activeRouteSchedulesCount,
      schedulesCount,
      completedSchedulesCount,
      cancelledSchedulesCount,
    ] = await prisma.$transaction([
      prisma.busAssignment.count({ where: { routeId: id } }),
      prisma.busAssignment.count({ where: { routeId: id, status: "active" } }),
      prisma.routeSchedule.count({ where: { routeId: id } }),
      prisma.routeSchedule.count({ where: { routeId: id, active: true } }),
      prisma.schedule.count({ where: { routeSchedule: { routeId: id } } }),
      prisma.schedule.count({ 
        where: { 
          routeSchedule: { routeId: id },
          status: "completed"
        } 
      }),
      prisma.schedule.count({ 
        where: { 
          routeSchedule: { routeId: id },
          status: "cancelled"
        } 
      }),
    ]);

    // Get statistics
    const stats = {
      assignmentsCount,
      activeAssignmentsCount,
      routeSchedulesCount,
      activeRouteSchedulesCount,
      schedulesCount,
      completedSchedulesCount,
      cancelledSchedulesCount,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching route statistics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 