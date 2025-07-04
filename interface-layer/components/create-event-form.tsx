"use client"

import type React from "react"

import { useState } from "react"
import type { EventFormData } from "@/types/event"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface CreateEventFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (eventData: EventFormData) => void
}

export function CreateEventForm({ isOpen, onClose, onSubmit }: CreateEventFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    category: "",
    price: 0,
    maxAttendees: 50,
    imageUrl: "/placeholder.svg?height=300&width=400",
    organizer: "Admin",
    tags: [],
    walletSetName: "",
    blockchain: "",
  })

  const [tagsInput, setTagsInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag)
    onSubmit({ ...formData, tags })

    // Reset form
    setFormData({
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      category: "",
      price: 0,
      maxAttendees: 50,
      imageUrl: "/placeholder.svg?height=300&width=400",
      organizer: "Admin",
      tags: [],
      walletSetName: "",
      blockchain: "",
    })
    setTagsInput("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary-900">Create New Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="border-primary-300 focus:border-primary-500"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="border-primary-300 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
              className="border-primary-300 focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="border-primary-300 focus:border-primary-500"
              />
            </div>

            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
                className="border-primary-300 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
              className="border-primary-300 focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) || 0 })}
                className="border-primary-300 focus:border-primary-500"
              />
            </div>

            <div>
              <Label htmlFor="maxAttendees">Max Attendees</Label>
              <Input
                id="maxAttendees"
                type="number"
                min="1"
                value={formData.maxAttendees}
                onChange={(e) => setFormData({ ...formData, maxAttendees: Number.parseInt(e.target.value) || 50 })}
                className="border-primary-300 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="border-primary-300 focus:border-primary-500"
            />
          </div>
          <div>
            <Label htmlFor="blockchain">Blockchain</Label>
            <select
              id="blockchain"
              value={formData.blockchain || "MATIC-AMOY"}
              onChange={(e) => setFormData({ ...formData, blockchain: e.target.value })}
              required
              className="border-primary-300 focus:border-primary-500 w-full p-2 rounded"
            >
              <option value="MATIC-AMOY">Polygon Amoy (MATIC-AMOY)</option>
              <option value="ETH-SEPOLIA">Ethereum Sepolia (ETH-SEPOLIA)</option>
              <option value="AVAX-FUJI">Avalanche Fuji (AVAX-FUJI)</option>
              <option value="SOL-DEVNET">Solana Devnet (SOL-DEVNET)</option>
              <option value="ARB-SEPOLIA">Arbitrum Sepolia (ARB-SEPOLIA)</option>
            </select>
          </div>


          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. networking, tech, workshop"
              className="border-primary-300 focus:border-primary-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-primary-300 text-primary-700 hover:bg-primary-50"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white">
              Create Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
