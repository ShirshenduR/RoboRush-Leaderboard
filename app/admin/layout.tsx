'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  
  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (!isLoginPage) {
      // Check if user just logged in
      const justLoggedIn = typeof window !== 'undefined' && sessionStorage.getItem('just_logged_in') === 'true'
      
      if (justLoggedIn) {
        // Clear the flag and assume authenticated
        sessionStorage.removeItem('just_logged_in')
        setIsAuthenticated(true)
        setLoading(false)
        // Verify in background
        verifyAuth()
      } else {
        checkAuth()
      }
    } else {
      setLoading(false)
      setIsAuthenticated(false)
    }
  }, [pathname, isLoginPage])

  async function verifyAuth() {
    // Background verification without blocking UI
    try {
      const response = await fetch('/api/auth/check', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      const { authenticated } = await response.json()
      if (!authenticated) {
        router.push('/admin/login')
      }
    } catch (error) {
      console.error('Background auth verification failed:', error)
    }
  }

  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/check', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      })
      
      if (!response.ok) {
        throw new Error('Auth check failed')
      }
      
      const { authenticated } = await response.json()
      
      if (authenticated) {
        setIsAuthenticated(true)
        setLoading(false)
      } else {
        setIsAuthenticated(false)
        setLoading(false)
        router.push('/admin/login')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setIsAuthenticated(false)
      setLoading(false)
      router.push('/admin/login')
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/admin/login')
    } catch (error) {
      router.push('/admin/login')
    }
  }

  // Don't show loading or check auth on login page
  if (isLoginPage) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-bg">
        <div className="text-neon-yellow text-2xl animate-pulse">Verifying...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-dark-bg bg-circuit-pattern">
      <nav className="border-b-2 border-neon-yellow bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neon-yellow tracking-wider" style={{ fontFamily: 'monospace' }}>
            ADMIN PANEL
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>
      {children}
    </div>
  )
}
