"use client"

import type { Event } from "@/types/event"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, DollarSign, User, Clock } from "lucide-react"
import EventTokens from "@/components/event-tokens"

interface EventModalProps {
  event: Event | null
  isOpen: boolean
  onClose: () => void
  onSubscribe: (eventId: string) => void
}

export function EventModal({ event, isOpen, onClose, onSubscribe }: EventModalProps) {
  if (!event) return null

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const availableSpots = event.maxAttendees - event.currentAttendees

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary-900">{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="relative">
            <img
              src={event.imageUrl || "/placeholder.svg"}
              alt={event.title}
              className="w-full h-64 object-cover rounded-lg"
            />
            <Badge className="absolute top-3 right-3 bg-primary-600 text-white">{event.category}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 text-primary-700">
              <Calendar className="h-5 w-5" />
              <div>
                <p className="font-medium">{formatDate(event.date)}</p>
                <p className="text-sm text-primary-600">Date</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-primary-700">
              <Clock className="h-5 w-5" />
              <div>
                <p className="font-medium">{event.time}</p>
                <p className="text-sm text-primary-600">Time</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-primary-700">
              <MapPin className="h-5 w-5" />
              <div>
                <p className="font-medium">{event.location}</p>
                <p className="text-sm text-primary-600">Location</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-primary-700">
              <User className="h-5 w-5" />
              <div>
                <p className="font-medium">{event.organizer}</p>
                <p className="text-sm text-primary-600">Organizer</p>
              </div>
            </div>
          </div>

          <div className="bg-primary-50 p-4 rounded-lg">
            <h4 className="font-semibold text-primary-900 mb-2">Event Details</h4>
            <p className="text-primary-700 leading-relaxed">{event.description}</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-primary-700">
                <Users className="h-5 w-5" />
                <span className="font-medium">{availableSpots} spots available</span>
              </div>

              <div className="flex items-center space-x-2 text-primary-700">
                <DollarSign className="h-5 w-5" />
                <span className="font-medium text-lg">{event.price === 0 ? "Free" : `$${event.price}`}</span>
              </div>
            </div>

            <Button
              onClick={() => onSubscribe(event.id)}
              disabled={availableSpots === 0}
              className="bg-primary-600 hover:bg-primary-700 text-white px-8"
            >
              {availableSpots === 0 ? "Sold Out" : "Subscribe Now"}
            </Button>
          </div>

          {event.walletId && (
            <div className="mt-2 text-xs text-primary-600 break-all">
              Wallet: {event.walletId.slice(0, 6)}...{event.walletId.slice(-4)}
              {event.blockchain && <span className="ml-1">({event.blockchain})</span>}
            </div>
          )}

          <div>
            <h4 className="font-semibold text-primary-900 mb-3">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="border-primary-300 text-primary-700">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Event Tokens Section */}
          <div className="border-t pt-6">
            <EventTokens eventId={event.id} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
