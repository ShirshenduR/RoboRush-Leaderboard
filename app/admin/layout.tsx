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
      checkAuth()
    } else {
      setLoading(false)
      setIsAuthenticated(false)
    }
  }, [pathname, isLoginPage])

  async function checkAuth() {
    try {
      // Add a small delay to ensure cookie is set
      await new Promise(resolve => setTimeout(resolve, 100))
      
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
