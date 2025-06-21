"use client"

import { useState } from "react"
import LoginPage from "./components/login-page"
import Dashboard from "./components/dashboard"
import ConnectPage from "./components/connect-page"
import MarketplacePage from "./components/marketplace-page"

type Page = "dashboard" | "connect" | "marketplace"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [currentPage, setCurrentPage] = useState<Page>("dashboard")

  const handleLogin = (userData: { name: string; email: string }) => {
    setUser(userData)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
    setCurrentPage("dashboard")
  }

  const handleNavigation = (page: Page) => {
    setCurrentPage(page)
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  if (currentPage === "connect") {
    return <ConnectPage user={user} onLogout={handleLogout} onNavigate={handleNavigation} />
  }

  if (currentPage === "marketplace") {
    return <MarketplacePage user={user} onLogout={handleLogout} onNavigate={handleNavigation} />
  }

  return <Dashboard user={user} onLogout={handleLogout} onNavigate={handleNavigation} />
}
