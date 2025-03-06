import type { Location, Route, Schedule, Seat } from "./types";

// Dummy data based on Prisma schema
export const locations: Location[] = [
  { id: "1", name: "Ciudad de México" },
  { id: "2", name: "Guadalajara" },
  { id: "3", name: "Monterrey" },
  { id: "4", name: "Puebla" },
  { id: "5", name: "Querétaro" },
];

export const routes: Route[] = [
  {
    id: "1",
    name: "CDMX - Guadalajara",
    originId: "1",
    destinationId: "2",
    estimatedDuration: 360,
  },
  {
    id: "2",
    name: "CDMX - Monterrey",
    originId: "1",
    destinationId: "3",
    estimatedDuration: 480,
  },
  {
    id: "3",
    name: "Guadalajara - CDMX",
    originId: "2",
    destinationId: "1",
    estimatedDuration: 360,
  },
  {
    id: "4",
    name: "Monterrey - CDMX",
    originId: "3",
    destinationId: "1",
    estimatedDuration: 480,
  },
];

export const schedules: Schedule[] = [
  {
    id: "1",
    routeId: "1",
    departureDate: new Date("2025-03-01T08:00:00"),
    estimatedArrivalTime: new Date("2025-03-01T14:00:00"),
    price: 850,
    status: "scheduled",
  },
  {
    id: "2",
    routeId: "1",
    departureDate: new Date("2025-03-01T12:00:00"),
    estimatedArrivalTime: new Date("2025-03-01T18:00:00"),
    price: 850,
    status: "scheduled",
  },
  {
    id: "3",
    routeId: "1",
    departureDate: new Date("2025-03-01T16:00:00"),
    estimatedArrivalTime: new Date("2025-03-01T22:00:00"),
    price: 950,
    status: "scheduled",
  },
  {
    id: "4",
    routeId: "2",
    departureDate: new Date("2025-03-01T07:00:00"),
    estimatedArrivalTime: new Date("2025-03-01T15:00:00"),
    price: 1200,
    status: "scheduled",
  },
];

// Generate dummy seat data
export const generateSeats = (): Seat[] => {
  const seats = [];
  const rows = 10;
  const cols = 4;
  const tiers = [
    { id: "1", name: "Económico", basePrice: 100 },
    { id: "2", name: "Ejecutivo", basePrice: 150 },
    { id: "3", name: "Premium", basePrice: 200 },
  ];

  for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= cols; col++) {
      const seatNumber = `${row}${String.fromCharCode(64 + col)}`;
      const tierId = row <= 3 ? "3" : row <= 7 ? "2" : "1";
      const tier = tiers.find((t) => t.id === tierId);

      seats.push({
        id: `${row}-${col}`,
        seatNumber,
        tierId,
        tierName: tier?.name,
        status: Math.random() > 0.3 ? "available" : "maintenance",
        price: tier?.basePrice,
      });
    }
  }

  return seats;
};

export const seats = generateSeats();
