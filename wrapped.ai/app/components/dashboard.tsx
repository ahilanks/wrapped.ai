"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ThreeScatterPlot from "./three-scatter-plot"
import ImageSlider from "./image-slider"

interface DashboardProps {
  user: { name: string; email: string } | null
  onLogout: () => void
  onNavigate: (page: "dashboard" | "connect" | "marketplace") => void
}

export default function Dashboard({ user, onLogout, onNavigate }: DashboardProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => onNavigate("connect")}
                variant="outline"
                size="sm"
                className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              >
                Connect
              </Button>
              <Button
                onClick={() => onNavigate("marketplace")}
                variant="outline"
                size="sm"
                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              >
                Marketplace
              </Button>
              <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
              <Button onClick={onLogout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* 3D Scatter Plot Section */}
          <Card>
            <CardHeader>
              <CardTitle>3D Data Visualization</CardTitle>
              <CardDescription>
                Interactive 3D scatter plot with clustered data points - drag to rotate, scroll to zoom
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[600px] rounded-lg overflow-hidden">
                <ThreeScatterPlot />
              </div>
            </CardContent>
          </Card>

          {/* Image Slider Section */}
          <Card>
            <CardHeader>
              <CardTitle>Business Insights Gallery</CardTitle>
              <CardDescription>Navigate through key business metrics and visual insights</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageSlider />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
