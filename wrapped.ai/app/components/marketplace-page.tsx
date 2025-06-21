"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Sparkles, Star, ExternalLink, ShoppingCart, TrendingUp, Zap } from "lucide-react"

interface MarketplacePageProps {
  user: { name: string; email: string } | null
  onLogout: () => void
  onNavigate: (page: "dashboard" | "connect" | "marketplace") => void
}

type MarketplaceState = "initial" | "loading" | "results"

interface Product {
  id: number
  name: string
  description: string
  price: string
  rating: number
  category: string
  relevanceScore: number
  features: string[]
  vendor: string
  image: string
}

export default function MarketplacePage({ user, onLogout, onNavigate }: MarketplacePageProps) {
  const [state, setState] = useState<MarketplaceState>("initial")
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [products, setProducts] = useState<Product[]>([])

  const mockProducts: Product[] = [
    {
      id: 1,
      name: "AI Analytics Pro",
      description: "Advanced AI-powered analytics platform with real-time insights and predictive modeling",
      price: "$299/month",
      rating: 4.8,
      category: "Analytics",
      relevanceScore: 98,
      features: ["Real-time Analytics", "Predictive AI", "Custom Dashboards", "API Integration"],
      vendor: "DataFlow Inc.",
      image: "/placeholder.svg?height=200&width=300&text=AI+Analytics+Pro",
    },
    {
      id: 2,
      name: "Social Media Manager",
      description: "Comprehensive social media management tool with AI content generation and scheduling",
      price: "$149/month",
      rating: 4.6,
      category: "Social Media",
      relevanceScore: 95,
      features: ["AI Content Generation", "Multi-platform Posting", "Analytics Dashboard", "Team Collaboration"],
      vendor: "SocialBoost",
      image: "/placeholder.svg?height=200&width=300&text=Social+Media+Manager",
    },
    {
      id: 3,
      name: "Customer Insights Engine",
      description: "Deep customer behavior analysis with machine learning-powered segmentation",
      price: "$199/month",
      rating: 4.7,
      category: "Customer Analytics",
      relevanceScore: 92,
      features: ["Behavior Tracking", "ML Segmentation", "Predictive Scoring", "Integration APIs"],
      vendor: "InsightTech",
      image: "/placeholder.svg?height=200&width=300&text=Customer+Insights",
    },
    {
      id: 4,
      name: "Revenue Optimization Suite",
      description: "AI-driven revenue optimization with dynamic pricing and conversion analysis",
      price: "$399/month",
      rating: 4.9,
      category: "Revenue",
      relevanceScore: 89,
      features: ["Dynamic Pricing", "A/B Testing", "Conversion Analytics", "Revenue Forecasting"],
      vendor: "RevenueMax",
      image: "/placeholder.svg?height=200&width=300&text=Revenue+Suite",
    },
    {
      id: 5,
      name: "Marketing Automation Hub",
      description: "Complete marketing automation platform with AI-powered campaign optimization",
      price: "$249/month",
      rating: 4.5,
      category: "Marketing",
      relevanceScore: 87,
      features: ["Campaign Automation", "Lead Scoring", "Email Marketing", "Performance Analytics"],
      vendor: "MarketFlow",
      image: "/placeholder.svg?height=200&width=300&text=Marketing+Hub",
    },
  ]

  const startAIWorkflow = async () => {
    setState("loading")
    setLoadingProgress(0)

    // Simulate AI processing with progress updates
    const steps = [
      { progress: 20, message: "Analyzing your data patterns..." },
      { progress: 40, message: "Processing market trends..." },
      { progress: 60, message: "Evaluating product compatibility..." },
      { progress: 80, message: "Calculating relevance scores..." },
      { progress: 100, message: "Finalizing recommendations..." },
    ]

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setLoadingProgress(step.progress)
    }

    // Sort products by relevance score and take top 5
    const topProducts = mockProducts.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 5)
    setProducts(topProducts)
    setState("results")
  }

  const resetWorkflow = () => {
    setState("initial")
    setLoadingProgress(0)
    setProducts([])
  }

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-gray-900">AI Marketplace</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
                <Button onClick={onLogout} variant="outline" size="sm">
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Loading Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Agent Working</h2>
              <p className="text-gray-600">Our AI is analyzing your needs and finding the best products for you...</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md mx-auto mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{loadingProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Loading Steps */}
            <div className="space-y-4 max-w-md mx-auto">
              <div className="flex items-center space-x-3 text-left">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-700">
                  {loadingProgress >= 20 && "Analyzing your data patterns..."}
                  {loadingProgress >= 40 && loadingProgress < 60 && "Processing market trends..."}
                  {loadingProgress >= 60 && loadingProgress < 80 && "Evaluating product compatibility..."}
                  {loadingProgress >= 80 && loadingProgress < 100 && "Calculating relevance scores..."}
                  {loadingProgress === 100 && "Finalizing recommendations..."}
                  {loadingProgress < 20 && "Initializing AI workflow..."}
                </span>
              </div>
            </div>

            {/* Animated Elements */}
            <div className="mt-12 flex justify-center space-x-4">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (state === "results") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => onNavigate("dashboard")}
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Dashboard</span>
                </Button>
                <h1 className="text-xl font-semibold text-gray-900">AI Marketplace - Results</h1>
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
                <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
                <Button onClick={onLogout} variant="outline" size="sm">
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Results Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Top 5 Recommended Products</h2>
                <p className="text-gray-600">AI-curated products based on your profile and needs</p>
              </div>
              <Button onClick={resetWorkflow} variant="outline" className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4" />
                <span>Get New Recommendations</span>
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="space-y-6">
            {products.map((product, index) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-6">
                    {/* Rank Badge */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        #{index + 1}
                      </div>
                    </div>

                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">{product.name}</h3>
                          <p className="text-gray-600 mb-2">{product.description}</p>
                          <div className="flex items-center space-x-4 mb-3">
                            <Badge variant="secondary">{product.category}</Badge>
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium">{product.rating}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium text-green-600">
                                {product.relevanceScore}% match
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {product.features.map((feature, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm text-gray-500">by {product.vendor}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 mb-2">{product.price}</div>
                          <div className="space-y-2">
                            <Button className="w-full">
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Get Started
                            </Button>
                            <Button variant="outline" size="sm" className="w-full">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Learn More
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Actions */}
          <div className="mt-8 text-center">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <Zap className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Want More Personalized Results?</h3>
                <p className="text-gray-600 mb-4">Connect more accounts to get even better AI recommendations</p>
                <Button onClick={() => onNavigate("connect")} className="bg-blue-600 hover:bg-blue-700">
                  Connect More Accounts
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  // Initial state
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => onNavigate("dashboard")}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">AI Marketplace</h1>
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
              <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
              <Button onClick={onLogout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">AI-Powered Product Discovery</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Let our advanced AI agent analyze your needs and discover the most relevant products tailored specifically
              for you.
            </p>
          </div>

          <Card className="max-w-2xl mx-auto mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span>Personalized Recommendations</span>
              </CardTitle>
              <CardDescription>
                Our AI considers your connected accounts, usage patterns, and business needs to find the perfect
                products
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Account Analysis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Market Trends</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Compatibility Check</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Relevance Scoring</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={startAIWorkflow}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Get My Top 5 Products
          </Button>

          <p className="text-sm text-gray-500 mt-4">This process typically takes 10-15 seconds</p>
        </div>
      </main>
    </div>
  )
}
