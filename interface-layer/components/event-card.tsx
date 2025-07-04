"use client"

import type { Event } from "@/types/event"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, DollarSign } from "lucide-react"

interface EventCardProps {
  event: Event
  onClick: (event: Event) => void
}

export function EventCard({ event, onClick }: EventCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const availableSpots = event.maxAttendees - event.currentAttendees

  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-white border-primary-200"
      onClick={() => onClick(event)}
    >
      <div className="relative">
        <img
          src={event.imageUrl || "/placeholder.svg"}
          alt={event.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <div className="absolute top-3 right-3">
          <Badge className="bg-primary-600 text-white">{event.category}</Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="text-lg font-semibold text-primary-900 mb-2 line-clamp-2">{event.title}</h3>

        <div className="space-y-2 text-sm text-primary-700">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(event.date)} at {event.time}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{event.location}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{availableSpots} spots left</span>
            </div>

            <div className="flex items-center space-x-1 font-semibold text-primary-800">
              <DollarSign className="h-4 w-4" />
              <span>{event.price === 0 ? "Free" : event.price}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {event.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs border-primary-300 text-primary-700">
              {tag}
            </Badge>
          ))}
          {event.tags.length > 3 && (
            <Badge variant="outline" className="text-xs border-primary-300 text-primary-700">
              +{event.tags.length - 3}
            </Badge>
          )}
        </div>

        {event.walletId && (
          <div className="mt-2 text-xs text-primary-600 break-all">
            Wallet: {event.walletId.slice(0, 6)}...{event.walletId.slice(-4)}
            {event.blockchain && <span className="ml-1">({event.blockchain})</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
