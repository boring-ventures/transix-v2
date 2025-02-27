"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Check, ChevronRight, Clock, MapPin, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

// Dummy data based on Prisma schema
const locations = [
  { id: "1", name: "Ciudad de México" },
  { id: "2", name: "Guadalajara" },
  { id: "3", name: "Monterrey" },
  { id: "4", name: "Puebla" },
  { id: "5", name: "Querétaro" },
]

const routes = [
  { id: "1", name: "CDMX - Guadalajara", originId: "1", destinationId: "2", estimatedDuration: 360 },
  { id: "2", name: "CDMX - Monterrey", originId: "1", destinationId: "3", estimatedDuration: 480 },
  { id: "3", name: "Guadalajara - CDMX", originId: "2", destinationId: "1", estimatedDuration: 360 },
  { id: "4", name: "Monterrey - CDMX", originId: "3", destinationId: "1", estimatedDuration: 480 },
]

const schedules = [
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
]

// Generate dummy seat data
const generateSeats = () => {
  const seats = []
  const rows = 10
  const cols = 4
  const tiers = [
    { id: "1", name: "Económico", basePrice: 100 },
    { id: "2", name: "Ejecutivo", basePrice: 150 },
    { id: "3", name: "Premium", basePrice: 200 },
  ]

  for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= cols; col++) {
      const seatNumber = `${row}${String.fromCharCode(64 + col)}`
      const tierId = row <= 3 ? "3" : row <= 7 ? "2" : "1"
      const tier = tiers.find((t) => t.id === tierId)

      seats.push({
        id: `${row}-${col}`,
        seatNumber,
        tierId,
        tierName: tier?.name,
        status: Math.random() > 0.3 ? "available" : "maintenance",
        price: tier?.basePrice,
      })
    }
  }

  return seats
}

const seats = generateSeats()

// Form steps
// Update the Step type to remove "passengers" and update the step navigation logic
type Step = "route" | "schedule" | "seats" | "review"

export default function TicketSalesForm() {
  const [currentStep, setCurrentStep] = useState<Step>("route")
  const [formData, setFormData] = useState({
    originId: "",
    destinationId: "",
    scheduleId: "",
    selectedSeats: [] as string[],
    passengers: [] as { fullName: string; documentId: string; seatNumber: string }[],
  })

  // Selected data
  const selectedRoute = routes.find(
    (route) => route.originId === formData.originId && route.destinationId === formData.destinationId,
  )

  const availableSchedules = schedules.filter((schedule) =>
    routes.some(
      (route) =>
        route.id === schedule.routeId &&
        route.originId === formData.originId &&
        route.destinationId === formData.destinationId,
    ),
  )

  const selectedSchedule = schedules.find((schedule) => schedule.id === formData.scheduleId)

  const availableSeats = seats.filter((seat) => seat.status === "available")

  const [expandedPassenger, setExpandedPassenger] = useState<string | null>(null)

  useEffect(() => {
    if (formData.passengers.length > 0 && !expandedPassenger) {
      setExpandedPassenger(formData.passengers[0].seatNumber)
    }
  }, [formData.passengers, expandedPassenger])

  // Handle form data changes
  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  // Handle next step
  const goToNextStep = () => {
    switch (currentStep) {
      case "route":
        setCurrentStep("schedule")
        break
      case "schedule":
        setCurrentStep("seats")
        break
      case "seats":
        setCurrentStep("review")
        break
      case "review":
        // Submit form (would connect to backend in a real implementation)
        alert("Ticket purchase completed!")
        break
    }
  }

  // Handle previous step
  const goToPreviousStep = () => {
    switch (currentStep) {
      case "schedule":
        setCurrentStep("route")
        break
      case "seats":
        setCurrentStep("schedule")
        break
      case "review":
        setCurrentStep("seats")
        break
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case "route":
        return formData.originId && formData.destinationId
      case "schedule":
        return availableSchedules.length === 0 || formData.scheduleId
      case "seats":
        return (
          formData.selectedSeats.length > 0 &&
          formData.passengers.filter((p) => p.seatNumber).every((p) => p.fullName && p.documentId)
        )
      case "review":
        return true
    }
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  // Format time for display
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("es", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!selectedSchedule) return 0

    return (
      formData.selectedSeats.reduce((total, seatId) => {
        const seat = seats.find((s) => s.id === seatId)
        return total + (seat?.price || 0)
      }, 0) +
      selectedSchedule.price * formData.selectedSeats.length
    )
  }

  const navigateToStep = (step: Step) => {
    // Check if we can navigate to the selected step
    if (
      step === "route" ||
      (step === "schedule" && formData.originId && formData.destinationId) ||
      (step === "seats" && formData.scheduleId) ||
      (step === "review" &&
        formData.selectedSeats.length > 0 &&
        formData.passengers.filter((p) => p.seatNumber).every((p) => p.fullName && p.documentId))
    ) {
      setCurrentStep(step)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Steps indicator */}
      <div className="flex justify-between items-center mb-8">
        <StepIndicator
          label="Ruta"
          description="Seleccione origen y destino"
          icon={<MapPin className="h-5 w-5" />}
          active={currentStep === "route"}
          completed={currentStep !== "route" && formData.originId && formData.destinationId}
          onClick={() => navigateToStep("route")}
        />
        <div className="h-px w-full max-w-12 bg-gray-200" />
        <StepIndicator
          label="Horario"
          description="Elija fecha y hora"
          icon={<Clock className="h-5 w-5" />}
          active={currentStep === "schedule"}
          completed={currentStep !== "route" && currentStep !== "schedule" && formData.scheduleId}
          onClick={() => navigateToStep("schedule")}
        />
        <div className="h-px w-full max-w-12 bg-gray-200" />
        <StepIndicator
          label="Asientos y Pasajeros"
          description="Seleccione asientos y detalles"
          icon={<Users className="h-5 w-5" />}
          active={currentStep === "seats"}
          completed={currentStep === "review" && formData.selectedSeats.length > 0}
          onClick={() => navigateToStep("seats")}
        />
        <div className="h-px w-full max-w-12 bg-gray-200" />
        <StepIndicator
          label="Revisión"
          description="Confirme los detalles"
          icon="R"
          active={currentStep === "review"}
          completed={false}
          onClick={() => navigateToStep("review")}
        />
      </div>

      <Card className="w-full">
        <CardContent className="pt-6">
          {/* Route Selection Step */}
          {currentStep === "route" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="origin">Origen</Label>
                <Select
                  value={formData.originId}
                  onValueChange={(value) =>
                    updateFormData({
                      originId: value,
                      destinationId: formData.destinationId === value ? "" : formData.destinationId,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Destino</Label>
                <Select
                  value={formData.destinationId}
                  onValueChange={(value) => updateFormData({ destinationId: value })}
                  disabled={!formData.originId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations
                      .filter((location) => location.id !== formData.originId)
                      .map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Schedule Selection Step */}
          {currentStep === "schedule" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {locations.find((l) => l.id === formData.originId)?.name} -{" "}
                {locations.find((l) => l.id === formData.destinationId)?.name}
              </h3>

              {availableSchedules.length === 0 ? (
                <p className="text-muted-foreground">No hay horarios disponibles para esta ruta.</p>
              ) : (
                <RadioGroup
                  value={formData.scheduleId}
                  onValueChange={(value) => updateFormData({ scheduleId: value })}
                  className="space-y-3"
                >
                  {availableSchedules.map((schedule) => (
                    <div key={schedule.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={schedule.id} id={schedule.id} />
                      <Label htmlFor={schedule.id} className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-center border rounded-md p-3 hover:bg-muted/50">
                          <div>
                            <p className="font-medium">{formatDate(schedule.departureDate)}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{formatTime(schedule.departureDate)}</span>
                              <ChevronRight className="h-4 w-4" />
                              <span>{formatTime(schedule.estimatedArrivalTime)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${schedule.price}</p>
                            <p className="text-sm text-muted-foreground">
                              {Math.floor(
                                (schedule.estimatedArrivalTime.getTime() - schedule.departureDate.getTime()) /
                                  (1000 * 60),
                              )}{" "}
                              min
                            </p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          )}

          {/* Seat Selection and Passenger Details Step */}
          {currentStep === "seats" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  {locations.find((l) => l.id === formData.originId)?.name} -{" "}
                  {locations.find((l) => l.id === formData.destinationId)?.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formatDate(selectedSchedule?.departureDate || new Date())} •{" "}
                  {formatTime(selectedSchedule?.departureDate || new Date())}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left side: Seat selection */}
                <div className="md:col-span-2">
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      Bus
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {seats.map((seat) => {
                      const isSelected = formData.selectedSeats.includes(seat.id)
                      const isAvailable = seat.status === "available"

                      return (
                        <div key={seat.id} className="relative">
                          <button
                            type="button"
                            disabled={!isAvailable}
                            className={cn(
                              "w-full p-3 border rounded-md flex flex-col items-center justify-center transition-colors",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : isAvailable
                                  ? "hover:bg-primary/10"
                                  : "bg-muted text-muted-foreground cursor-not-allowed",
                            )}
                            onClick={() => {
                              if (isSelected) {
                                // Remove seat and its passenger data
                                updateFormData({
                                  selectedSeats: formData.selectedSeats.filter((id) => id !== seat.id),
                                  passengers: formData.passengers.filter((p) => p.seatNumber !== seat.seatNumber),
                                })
                                if (expandedPassenger === seat.seatNumber) {
                                  setExpandedPassenger(null)
                                }
                              } else {
                                // Add seat and initialize passenger data
                                const newPassenger = {
                                  fullName: "",
                                  documentId: "",
                                  seatNumber: seat.seatNumber,
                                }
                                updateFormData({
                                  selectedSeats: [...formData.selectedSeats, seat.id],
                                  passengers: [...formData.passengers, newPassenger],
                                })
                                setExpandedPassenger(seat.seatNumber)
                              }
                            }}
                          >
                            <span className="text-lg font-medium">{seat.seatNumber}</span>
                            <span className="text-xs">{seat.tierName}</span>
                            <span className="text-xs mt-1">${seat.price}</span>
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm bg-primary" />
                        <span className="text-sm">Seleccionado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm border" />
                        <span className="text-sm">Disponible</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm bg-muted" />
                        <span className="text-sm">No disponible</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side: Passenger details and summary */}
                <div>
                  <div className="bg-muted p-4 rounded-md mb-4">
                    <h4 className="font-medium mb-2">Resumen de selección</h4>
                    <p>Asientos seleccionados: {formData.selectedSeats.length}</p>
                    <p className="font-medium mt-2">Total: ${calculateTotalPrice()}</p>
                  </div>

                  <h4 className="font-medium mb-4">Detalles de pasajeros</h4>

                  {formData.selectedSeats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-6 border rounded-md bg-muted/20">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Seleccione asientos para ingresar los datos de los pasajeros
                      </p>
                    </div>
                  ) : (
                    <Accordion
                      type="single"
                      collapsible
                      value={expandedPassenger || undefined}
                      onValueChange={(value) => setExpandedPassenger(value)}
                    >
                      {formData.passengers.map((passenger, index) => (
                        <AccordionItem key={index} value={passenger.seatNumber}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center justify-between w-full">
                              <span>
                                Pasajero {index + 1} - Asiento {passenger.seatNumber}
                              </span>
                              {passenger.fullName && passenger.documentId && (
                                <Check className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 mt-2">
                              <div className="space-y-2">
                                <Label htmlFor={`fullName-${index}`}>Nombre completo</Label>
                                <Input
                                  id={`fullName-${index}`}
                                  value={passenger.fullName}
                                  onChange={(e) => {
                                    const newPassengers = [...formData.passengers]
                                    newPassengers[index].fullName = e.target.value
                                    updateFormData({ passengers: newPassengers })
                                  }}
                                  placeholder="Nombre y apellidos"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`documentId-${index}`}>Documento de identidad</Label>
                                <Input
                                  id={`documentId-${index}`}
                                  value={passenger.documentId}
                                  onChange={(e) => {
                                    const newPassengers = [...formData.passengers]
                                    newPassengers[index].documentId = e.target.value
                                    updateFormData({ passengers: newPassengers })
                                  }}
                                  placeholder="Número de documento"
                                />
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Review Step */}
          {currentStep === "review" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Revise su compra</h3>

              <div className="space-y-4">
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-2">Detalles del viaje</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Ruta</p>
                      <p className="font-medium">
                        {locations.find((l) => l.id === formData.originId)?.name} -{" "}
                        {locations.find((l) => l.id === formData.destinationId)?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha y hora</p>
                      <p className="font-medium">
                        {formatDate(selectedSchedule?.departureDate || new Date())} •{" "}
                        {formatTime(selectedSchedule?.departureDate || new Date())}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-2">Pasajeros</h4>
                  <div className="space-y-3">
                    {formData.passengers.map((passenger, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{passenger.fullName}</p>
                          <p className="text-sm text-muted-foreground">Doc: {passenger.documentId}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Asiento {passenger.seatNumber}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-2">Resumen de pago</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p>
                        Precio base ({formData.selectedSeats.length}{" "}
                        {formData.selectedSeats.length === 1 ? "asiento" : "asientos"})
                      </p>
                      <p>
                        ${selectedSchedule?.price || 0} × {formData.selectedSeats.length}
                      </p>
                    </div>
                    <div className="flex justify-between">
                      <p>Cargos por tipo de asiento</p>
                      <p>
                        $
                        {formData.selectedSeats.reduce((total, seatId) => {
                          const seat = seats.find((s) => s.id === seatId)
                          return total + (seat?.price || 0)
                        }, 0)}
                      </p>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-medium">
                      <p>Total</p>
                      <p>${calculateTotalPrice()}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-md">
                  <div className="flex items-start space-x-2">
                    <Checkbox id="terms" />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="terms" className="text-sm font-normal leading-snug">
                        Acepto los términos y condiciones y la política de privacidad.
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={goToPreviousStep} disabled={currentStep === "route"}>
          Atrás
        </Button>

        {/* Update the step counter at the bottom */}
        <div className="text-center text-sm text-muted-foreground">
          Paso {currentStep === "route" ? "1" : currentStep === "schedule" ? "2" : currentStep === "seats" ? "3" : "4"}{" "}
          de 4
        </div>

        <Button onClick={goToNextStep} disabled={!isStepValid()}>
          {currentStep === "review" ? "Confirmar compra" : "Siguiente"}
        </Button>
      </div>
    </div>
  )
}

// Step indicator component
interface StepIndicatorProps {
  label: string
  description: string
  icon: React.ReactNode
  active: boolean
  completed: boolean
  onClick: () => void
}

function StepIndicator({ label, description, icon, active, completed, onClick }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center text-center cursor-pointer" onClick={onClick}>
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center mb-2",
          active
            ? "bg-primary text-primary-foreground"
            : completed
              ? "bg-primary/20 text-primary"
              : "bg-muted text-muted-foreground",
        )}
      >
        {completed ? <Check className="h-5 w-5" /> : icon}
      </div>
      <span className="font-medium text-sm">{label}</span>
      <span className="text-xs text-muted-foreground max-w-[120px]">{description}</span>
    </div>
  )
}

