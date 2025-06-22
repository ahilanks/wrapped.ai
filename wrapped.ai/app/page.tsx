"use client"

import { useState } from "react"
import LoginPage from "./components/login-page"
import Dashboard from "./components/dashboard"
import ConnectPage from "./components/connect-page"
import UploadPage from "./components/upload-page"
import ProfilePage from "./components/profile-page"

type Page = "dashboard" | "connect" | "upload" | "profile"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [currentPage, setCurrentPage] = useState<Page>("upload")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const handleLogin = (userData: { name: string; email: string }) => {
    setUser(userData)
    setIsAuthenticated(true)
    setCurrentPage("upload")
  }

  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
    setCurrentPage("upload")
    setSelectedUserId(null)
  }

  const handleNavigation = (page: Page, userId?: string) => {
    setCurrentPage(page)
    if (userId) {
      setSelectedUserId(userId)
    } else {
      setSelectedUserId(null)
    }
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  if (currentPage === "connect") {
    return <ConnectPage user={user} onLogout={handleLogout} onNavigate={handleNavigation} />
  }

  if (currentPage === "upload") {
    return <UploadPage user={user} onLogout={handleLogout} onNavigate={handleNavigation} />
  }

  if (currentPage === "profile" && selectedUserId) {
    return <ProfilePage user={user} selectedUserId={selectedUserId} onLogout={handleLogout} onNavigate={handleNavigation} />
  }

  return <Dashboard user={user} onLogout={handleLogout} onNavigate={handleNavigation} />
}
