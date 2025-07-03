"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LoginLayout } from "@/components/login-layout"

export default function RegisterPage() {
  const [role, setRole] = useState<"creator" | "participant" | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) {
      alert("Please select a role to continue.")
      return
    }
    // TODO: Replace with your actual registration logic / API call
    console.log("Registering as:", role, email)
    router.push("/") // Navigate to the homepage after registration
  }

  return (
    <LoginLayout>
      <div className="max-w-lg w-full bg-white/90 backdrop-blur-lg p-10 rounded-2xl shadow-xl border border-primary-300">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-primary-900">Create your M33T account</h1>
          <p className="mt-2 text-primary-700 text-lg">Select your role to get started</p>
        </div>

        {/* Role Selection */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            size="lg"
            variant={role === "creator" ? "default" : "outline"}
            onClick={() => setRole("creator")}
            className={
              role === "creator"
                ? "bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 text-lg"
                : "border-primary-300 text-primary-700 hover:bg-primary-50 px-6 py-3 text-lg"
            }
          >
            Event Creator
          </Button>
          <Button
            size="lg"
            variant={role === "participant" ? "default" : "outline"}
            onClick={() => setRole("participant")}
            className={
              role === "participant"
                ? "bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 text-lg"
                : "border-primary-300 text-primary-700 hover:bg-primary-50 px-6 py-3 text-lg"
            }
          >
            Participant
          </Button>
        </div>

        {/* Register Form */}
        <form onSubmit={handleRegister} className="space-y-6">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 text-lg border-primary-300 focus:border-primary-500"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-12 text-lg border-primary-300 focus:border-primary-500"
          />
          <Button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white text-lg py-3 rounded-xl shadow-md"
          >
            Register
          </Button>
        </form>

        {/* Link to Login */}
        <div className="mt-6 text-center">
          <p className="text-primary-700">
            Already have an account?{" "}
            <a href="/" className="text-primary-600 hover:underline font-medium">
              Log in
            </a>
          </p>
        </div>
      </div>
    </LoginLayout>
  )
}
