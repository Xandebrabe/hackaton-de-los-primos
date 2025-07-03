"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LoginLayout } from "@/components/login-layout"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Replace with your actual login logic / API call
    console.log("Logging in:", email)
    router.push("/") // Navigate to the homepage after login
  }

  return (
    <LoginLayout>
      <div className="max-w-lg w-full bg-white/90 backdrop-blur-lg p-10 rounded-2xl shadow-xl border border-primary-300">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-primary-900">Welcome to M33T</h1>
          <p className="mt-2 text-primary-700 text-lg">Log in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
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
            Log In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-primary-700">
            Don’t have an account?{" "}
            <a href="/register" className="text-primary-600 hover:underline font-medium">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </LoginLayout>
  )
}
