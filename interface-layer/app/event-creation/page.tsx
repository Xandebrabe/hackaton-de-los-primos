"use client"

import { useState } from "react"
import type { Event, EventFormData } from "@/types/event"
import { Layout } from "@/components/layout"
import { EventCard } from "@/components/event-card"
import { EventModal } from "@/components/event-modal"
import { CreateEventForm } from "@/components/create-event-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"
import { createPoolTransaction, signAndSubmitTransaction } from "@/lib/solana-utils"
import { TokenSwap } from "@/components/token-swap"
import UserTokens from "@/components/user-tokens"

// Sample events data
const sampleEvents: Event[] = [
    {
        id: "1",
        title: "Tech Innovation Summit 2024",
        description: "Join industry leaders and innovators for a day of cutting-edge technology discussions, networking, and hands-on workshops. Discover the latest trends in AI, blockchain, and sustainable tech solutions.",
        date: "2024-02-15",
        time: "09:00",
        location: "San Francisco Convention Center",
        category: "Technology",
        price: 299,
        maxAttendees: 500,
        currentAttendees: 342,
        imageUrl: "/meet_event_platform.png",
        organizer: "TechCorp Events",
        blockchain: "SOL",
        tags: ["AI", "Blockchain", "Networking", "Innovation"],
        blockchain: ""
    },
    {
        id: "2",
        title: "Creative Design Workshop",
        description: "Unleash your creativity in this hands-on design workshop. Learn from professional designers and create stunning visual content using the latest design tools and techniques.",
        date: "2024-02-20",
        time: "14:00",
        location: "Design Studio Downtown",
        category: "Design",
        price: 0,
        maxAttendees: 30,
        currentAttendees: 18,
        imageUrl: "/meet_event_platform.png",
        organizer: "Creative Collective",
        blockchain: "SOL",
        tags: ["Design", "Workshop", "Creative", "Free"],
        blockchain: ""
    },
    {
        id: "3",
        title: "Startup Pitch Competition",
        description: "Watch promising startups pitch their innovative ideas to a panel of expert judges and investors. Network with entrepreneurs and discover the next big thing in business.",
        date: "2024-02-25",
        time: "18:30",
        location: "Innovation Hub",
        category: "Business",
        price: 50,
        maxAttendees: 200,
        currentAttendees: 156,
        imageUrl: "/meet_event_platform.png",
        organizer: "Startup Accelerator",
        blockchain: "SOL",
        tags: ["Startup", "Pitch", "Investment", "Networking"],
        blockchain: ""
    },
]

export default function HomePage() {
    const [events, setEvents] = useState<Event[]>(sampleEvents)
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
    const [isEventModalOpen, setIsEventModalOpen] = useState(false)
    const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [isCreatingToken, setIsCreatingToken] = useState(false)

    const { session, isConnected } = useWallet()

    const categories = ["All", ...Array.from(new Set(events.map((event) => event.category)))]

    const filteredEvents = events.filter((event) => {
        const matchesSearch =
            event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.description.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === "All" || event.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const handleEventClick = (event: Event) => {
        setSelectedEvent(event)
        setIsEventModalOpen(true)
    }

    const handleSubscribe = (eventId: string) => {
        setEvents((prevEvents) =>
            prevEvents.map((event) =>
                event.id === eventId ? { ...event, currentAttendees: event.currentAttendees + 1 } : event,
            ),
        )
        setIsEventModalOpen(false)
        // Here you would typically make an API call to subscribe the user
        alert("Successfully subscribed to the event!")
    }

    const handleCreateEvent = async (eventData: EventFormData) => {
        try {
            const res = await fetch("/api/circle/create-wallet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ walletSetName: eventData.walletSetName || eventData.title, blockchains: [eventData.blockchain] }),
            });

            const result = await res.json();

            if (!result.success) {
                throw new Error(result.error || "Failed to create wallet");
            }

            const newEvent: Event = {
                ...eventData,
                id: Date.now().toString(),
                currentAttendees: 0,
                walletId: result.wallets[0].id,
                blockchain: eventData.blockchain,
            };

            setEvents((prevEvents) => [newEvent, ...prevEvents]);

            alert(`Event created successfully with wallet: ${result.wallets[0].id}`);
        } catch (err) {
            console.error("Create event failed:", err)
            alert(`Create event failed: ${err instanceof Error ? err.message : "Unknown error"}`)
        }
    }


    const handleTestCreateToken = async () => {
        if (!isConnected || !session?.publicKey) {
            alert("Please connect your wallet first!")
            return
        }

        setIsCreatingToken(true)

        try {
            // Generate test token parameters
            const testTokenData = {
                userPublicKey: session.publicKey,
                name: "Test Hackathon Token",
                symbol: "THT",
                uri: "https://example.com/metadata.json", // Test metadata URI
            }

            console.log("Creating test token with data:", testTokenData)

            // Step 1: Create the transaction on the server
            const createResult = await createPoolTransaction(testTokenData)

            if (!createResult.success || !createResult.transaction) {
                throw new Error(createResult.error || "Failed to create transaction")
            }

            console.log("Transaction created successfully, requesting signature...")
            console.log("Token data:", createResult.tokenData)

            // Step 2: Sign and submit the transaction
            const submitResult = await signAndSubmitTransaction(
                createResult.transaction,
                createResult.tokenData?.mintAddress
            )

            if (submitResult.success && submitResult.signature) {
                alert(`Token pool created successfully! Transaction: ${submitResult.signature}`)
                console.log("Transaction signature:", submitResult.signature)
                console.log("Mint address:", createResult.tokenData?.mintAddress)
                console.log("Pool address:", createResult.tokenData?.poolAddress)
            } else {
                throw new Error(submitResult.error || "Failed to submit transaction")
            }

        } catch (error) {
            console.error("Test create token error:", error)
            alert(`Failed to create token: ${error instanceof Error ? error.message : "Unknown error"}`)
        } finally {
            setIsCreatingToken(false)
        }
    }

    return (
        <Layout
            onCreateEvent={() => setIsCreateFormOpen(true)}
            onTestCreateToken={handleTestCreateToken}
            isTestTokenLoading={isCreatingToken}
        >
            <div className="space-y-6">
                {/* Search and Filter Section */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-primary-200">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-500 h-4 w-4" />
                            <Input
                                placeholder="Search events..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 border-primary-300 focus:border-primary-500"
                            />
                        </div>

                        <div className="flex gap-2">
                            {categories.map((category) => (
                                <Button
                                    key={category}
                                    variant={selectedCategory === category ? "default" : "outline"}
                                    onClick={() => setSelectedCategory(category)}
                                    className={
                                        selectedCategory === category
                                            ? "bg-primary-600 hover:bg-primary-700 text-white"
                                            : "border-primary-300 text-primary-700 hover:bg-primary-50"
                                    }
                                >
                                    {category}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Events Grid */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-primary-900">Open Events ({filteredEvents.length})</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEvents.map((event) => (
                            <EventCard key={event.id} event={event} onClick={handleEventClick} />
                        ))}
                    </div>

                    {filteredEvents.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-primary-600 text-lg">No events found matching your criteria.</p>
                        </div>
                    )}
                </div>

                {/* Token Swap Section */}
                <div className="border-t pt-6">
                    <h2 className="text-2xl font-bold mb-4">Token Swap</h2>
                    <TokenSwap />
                </div>

                {/* User Tokens Section */}
                {isConnected && session?.publicKey && (
                    <div className="border-t pt-6">
                        <h2 className="text-2xl font-bold mb-4">My Token Portfolio</h2>
                        <UserTokens userAddress={session.publicKey} />
                    </div>
                )}
            </div>

            {/* Event Detail Modal */}
            <EventModal
                event={selectedEvent}
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                onSubscribe={handleSubscribe}
            />

            {/* Create Event Form */}
            <CreateEventForm
                isOpen={isCreateFormOpen}
                onClose={() => setIsCreateFormOpen(false)}
                onSubmit={handleCreateEvent}
            />
        </Layout>
    )
}
