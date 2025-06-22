"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import dynamic from 'next/dynamic'
import GoogleProfileButton from "./google-profile-button"

const Modern3DUMAP = dynamic(() => import('./Modern3DUMAP'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black flex items-center justify-center text-white">Loading Visualization...</div>
})

interface ConnectPageProps {
  user: { name: string; email: string } | null
  onLogout: () => void
  onNavigate: (page: "dashboard" | "connect" | "upload" | "profile", userId?: string) => void
}

export default function ConnectPage({ user, onLogout, onNavigate }: ConnectPageProps) {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 shadow-lg border-b border-gray-700 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => onNavigate("dashboard")}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-gray-300 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <h1 className="text-xl font-semibold text-white">Connect with Others</h1>
            </div>
            <div className="flex items-center space-x-4">
              <GoogleProfileButton user={user} onLogout={onLogout} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Modern3DUMAP />
      </main>
    </div>
  )
}
