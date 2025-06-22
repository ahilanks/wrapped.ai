"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, TrendingUp, Hash, Clock, MessageSquare, Code, Sun } from "lucide-react"
import Image from "next/image"

interface TopItem {
  name: string
  value: string
  percentage?: number
}

interface SlideData {
  id: number
  title: string
  description: string
  src: string
  fallback: string
  icon: any
  topItems: TopItem[]
  metric?: string
}

interface ImageSliderProps {
  data?: {
    topGenres?: TopItem[]
    mostDiscussed?: TopItem[]
    chatStreak?: TopItem[]
    totalMessages?: TopItem[]
    promptStyles?: TopItem[]
    topTimeOfDay?: TopItem[]
  }
}

export default function ImageSlider({ data }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageError, setImageError] = useState<Record<number, boolean>>({})

  // Default data if none provided
  const defaultData = {
    topGenres: [
      { name: "Technology", value: "45%", percentage: 45 },
      { name: "Creative Writing", value: "32%", percentage: 32 },
      { name: "Problem Solving", value: "28%", percentage: 28 },
      { name: "Learning", value: "22%", percentage: 22 },
      { name: "Entertainment", value: "18%", percentage: 18 }
    ],
    mostDiscussed: [
      { name: "AI & Machine Learning", value: "156 chats", percentage: 85 },
      { name: "Programming Help", value: "134 chats", percentage: 72 },
      { name: "Creative Projects", value: "98 chats", percentage: 53 },
      { name: "Study Assistance", value: "87 chats", percentage: 47 },
      { name: "General Questions", value: "76 chats", percentage: 41 }
    ],
    chatStreak: [
      { name: "Current Streak", value: "12 days", percentage: 100 },
      { name: "Longest Ever", value: "23 days", percentage: 100 },
      { name: "This Month", value: "18 days", percentage: 78 },
      { name: "Last Month", value: "15 days", percentage: 65 },
      { name: "Average", value: "8 days", percentage: 35 }
    ],
    totalMessages: [
      { name: "This Year", value: "2,847", percentage: 100 },
      { name: "This Month", value: "342", percentage: 12 },
      { name: "This Week", value: "89", percentage: 3 },
      { name: "Today", value: "12", percentage: 0.4 },
      { name: "Average/Day", value: "7.8", percentage: 0.3 }
    ],
    promptStyles: [
      { name: "Questions", value: "42%", percentage: 42 },
      { name: "Code Requests", value: "28%", percentage: 28 },
      { name: "Brainstorming", value: "18%", percentage: 18 },
      { name: "Analysis", value: "8%", percentage: 8 },
      { name: "Creative", value: "4%", percentage: 4 }
    ],
    topTimeOfDay: [
      { name: "Evening (6-9 PM)", value: "38%", percentage: 38 },
      { name: "Afternoon (2-5 PM)", value: "25%", percentage: 25 },
      { name: "Morning (9-12 AM)", value: "20%", percentage: 20 },
      { name: "Late Night (9-12 PM)", value: "12%", percentage: 12 },
      { name: "Early Morning (6-9 AM)", value: "5%", percentage: 5 }
    ]
  }

  const slideData: SlideData[] = [
    {
      id: 1,
      title: "Top ChatGPT Genres",
      description: "List of your favorite topics to discuss with ChatGPT",
      src: "/background.svg",
      fallback: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop&crop=center",
      icon: TrendingUp,
      topItems: data?.topGenres || defaultData.topGenres,
      metric: "usage"
    },
    {
      id: 2,
      title: "Most Discussed Topic",
      description: "The topic you chatted about most with ChatGPT this year",
      src: "/background1.svg",
      fallback: "https://images.unsplash.com/photo-1673187730327-4b2b3b3b3b3b?w=800&h=400&fit=crop&crop=center",
      icon: Hash,
      topItems: data?.mostDiscussed || defaultData.mostDiscussed,
      metric: "chats"
    },
    {
      id: 3,
      title: "Longest Chat Streak",
      description: "Your record for consecutive days chatting with ChatGPT",
      src: "/background2.svg",
      fallback: "https://images.unsplash.com/photo-1673187730327-4b2b3b3b3b3c?w=800&h=400&fit=crop&crop=center",
      icon: Clock,
      topItems: data?.chatStreak || defaultData.chatStreak,
      metric: "days"
    },
    {
      id: 4,
      title: "Total Messages Sent",
      description: "How many messages you sent to ChatGPT this year",
      src: "/background3.svg",
      fallback: "https://images.unsplash.com/photo-1673187730327-4b2b3b3b3b3d?w=800&h=400&fit=crop&crop=center",
      icon: MessageSquare,
      topItems: data?.totalMessages || defaultData.totalMessages,
      metric: "messages"
    },
    {
      id: 5,
      title: "Most Used Prompt Style",
      description: "The style of prompt you used most (e.g., questions, code, brainstorming)",
      src: "/background.svg",
      fallback: "https://images.unsplash.com/photo-1673187730327-4b2b3b3b3b3e?w=800&h=400&fit=crop&crop=center",
      icon: Code,
      topItems: data?.promptStyles || defaultData.promptStyles,
      metric: "usage"
    },
    {
      id: 6,
      title: "Top Time of Day",
      description: "When you most frequently chat with ChatGPT",
      src: "/background1.svg",
      fallback: "https://images.unsplash.com/photo-1673187730327-4b2b3b3b3b3f?w=800&h=400&fit=crop&crop=center",
      icon: Sun,
      topItems: data?.topTimeOfDay || defaultData.topTimeOfDay,
      metric: "activity"
    },
  ]

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? slideData.length - 1 : prevIndex - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === slideData.length - 1 ? 0 : prevIndex + 1))
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const handleImageError = (imageId: number) => {
    setImageError(prev => ({ ...prev, [imageId]: true }))
  }

  const getCurrentImageSrc = () => {
    const currentSlide = slideData[currentIndex]
    return imageError[currentSlide.id] ? currentSlide.fallback : currentSlide.src
  }

  const getImageSrc = (imageId: number) => {
    const slide = slideData.find(slide => slide.id === imageId)
    return imageError[imageId] ? slide?.fallback : slide?.src
  }

  const currentSlide = slideData[currentIndex]

  return (
    <div className="relative w-full">
      {/* Main Image Display */}
      <div className="relative w-full h-[400px] rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
        <Image
          src={getCurrentImageSrc()}
          alt={currentSlide.title}
          fill
          className="object-cover"
          onError={() => handleImageError(currentSlide.id)}
          priority
        />

        {/* Navigation Arrows */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white z-20"
          onClick={goToPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white z-20"
          onClick={goToNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Top 5 Data Overlay */}
        <div className="absolute inset-0 bg-black/20 z-5"></div>
        <div className="absolute inset-0 p-6 z-10">
          <div className="flex items-start justify-between h-full">
            {/* Left side - Title and Description */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <currentSlide.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white text-2xl font-bold mb-1">{currentSlide.title}</h3>
                  <p className="text-white/90 text-sm">{currentSlide.description}</p>
                </div>
              </div>
            </div>

            {/* Right side - Top 5 List */}
            <div className="flex-1 ml-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <h4 className="text-white font-semibold mb-3 text-center">Top 5</h4>
                <div className="space-y-2">
                  {currentSlide.topItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-400 text-yellow-900' :
                          index === 1 ? 'bg-gray-300 text-gray-700' :
                          index === 2 ? 'bg-amber-600 text-white' :
                          'bg-white/20 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-white text-sm font-medium truncate max-w-[120px]">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {item.percentage && (
                          <div className="w-16 bg-white/20 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(item.percentage, 100)}%` }}
                            ></div>
                          </div>
                        )}
                        <span className="text-white/90 text-sm font-semibold min-w-[60px] text-right">
                          {item.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center space-x-2 mt-4">
        {slideData.map((_, index) => (
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
      {/* <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
        {slideData.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => goToSlide(index)}
            className={`flex-shrink-0 w-20 h-12 rounded border-2 overflow-hidden transition-all ${
              index === currentIndex ? "border-blue-600 ring-2 ring-blue-200" : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <Image
              src={getImageSrc(slide.id) || "/background.svg"}
              alt={slide.title}
              width={80}
              height={48}
              className="w-full h-full object-cover"
              onError={() => handleImageError(slide.id)}
            />
          </button>
        ))}
      </div> */}

      {/* Counter */}
      <div className="text-center mt-2 text-sm text-gray-600">
        {currentIndex + 1} of {slideData.length}
      </div>
    </div>
  )
}
