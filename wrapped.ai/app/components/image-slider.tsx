"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"

const images = [
  {
    id: 1,
    title: "Market Analysis Dashboard",
    description: "Comprehensive overview of market trends and performance indicators",
    src: "/placeholder.svg?height=400&width=600&text=Market+Analysis",
  },
  {
    id: 2,
    title: "Revenue Growth Metrics",
    description: "Detailed breakdown of revenue streams and growth patterns",
    src: "/placeholder.svg?height=400&width=600&text=Revenue+Growth",
  },
  {
    id: 3,
    title: "Customer Engagement Analytics",
    description: "User behavior patterns and engagement statistics",
    src: "/placeholder.svg?height=400&width=600&text=Customer+Engagement",
  },
  {
    id: 4,
    title: "Performance Benchmarks",
    description: "Key performance indicators and benchmark comparisons",
    src: "/placeholder.svg?height=400&width=600&text=Performance+Metrics",
  },
  {
    id: 5,
    title: "Predictive Analytics",
    description: "Future trends and predictive modeling insights",
    src: "/placeholder.svg?height=400&width=600&text=Predictive+Analytics",
  },
  {
    id: 6,
    title: "Competitive Intelligence",
    description: "Market positioning and competitive landscape analysis",
    src: "/placeholder.svg?height=400&width=600&text=Competitive+Intelligence",
  },
]

export default function ImageSlider() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1))
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <div className="relative w-full">
      {/* Main Image Display */}
      <div className="relative w-full h-[400px] rounded-lg overflow-hidden bg-gray-100">
        <Image
          src={images[currentIndex].src || "/placeholder.svg"}
          alt={images[currentIndex].title}
          fill
          className="object-cover"
        />

        {/* Navigation Arrows */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
          onClick={goToPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
          onClick={goToNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Image Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
          <h3 className="text-white text-xl font-semibold mb-2">{images[currentIndex].title}</h3>
          <p className="text-white/90 text-sm">{images[currentIndex].description}</p>
        </div>
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center space-x-2 mt-4">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentIndex ? "bg-blue-600" : "bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Thumbnail Navigation */}
      <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => goToSlide(index)}
            className={`flex-shrink-0 w-20 h-12 rounded border-2 overflow-hidden transition-all ${
              index === currentIndex ? "border-blue-600 ring-2 ring-blue-200" : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <Image
              src={image.src || "/placeholder.svg"}
              alt={image.title}
              width={80}
              height={48}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Counter */}
      <div className="text-center mt-2 text-sm text-gray-600">
        {currentIndex + 1} of {images.length}
      </div>
    </div>
  )
}
