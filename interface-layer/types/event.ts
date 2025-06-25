export interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  category: string
  price: number
  maxAttendees: number
  currentAttendees: number
  imageUrl: string
  organizer: string
  tags: string[]
}

export interface EventFormData {
  title: string
  description: string
  date: string
  time: string
  location: string
  category: string
  price: number
  maxAttendees: number
  imageUrl: string
  organizer: string
  tags: string[]
}
