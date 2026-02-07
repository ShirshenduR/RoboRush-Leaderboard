'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [showContent, setShowContent] = useState(false)
  const pathname = usePathname()
  
  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (isLoginPage) {
      // Always show login page
      setShowContent(true)
      return
    }

    // For admin pages, check if just logged in
    const justLoggedIn = typeof window !== 'undefined' && sessionStorage.getItem('just_logged_in') === 'true'
    
    if (justLoggedIn) {
      // User just logged in, show content immediately
      sessionStorage.removeItem('just_logged_in')
      setShowContent(true)
      console.log('Showing admin panel after login')
      return
    }

    // Otherwise, verify authentication
    console.log('Checking authentication...')
    checkAuth()
  }, [pathname, isLoginPage])

  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/check', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })
      
      const { authenticated } = await response.json()
      console.log('Auth check result:', authenticated)
      
      if (authenticated) {
        setShowContent(true)
      } else {
        console.log('Not authenticated, redirecting to login')
        window.location.href = '/admin/login'
      }
    } catch (error) {
      console.error('Auth check error:', error)
      window.location.href = '/admin/login'
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/admin/login'
    } catch (error) {
      console.error('Logout failed:', error)
      window.location.href = '/admin/login'
    }
  }

  if (!showContent) {
    return (
      <div style={{ backgroundColor: '#050b18' }} className="min-h-screen flex items-center justify-center">
        <div style={{ color: '#38bdf8' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#050b18' }} className="min-h-screen">
      {!isLoginPage && (
        <div className="border-b px-4 py-3 flex justify-between items-center" style={{ borderColor: '#1b2b4b', backgroundColor: '#0b1635' }}>
          <h1 style={{ color: '#38bdf8' }} className="text-xl font-bold font-display">ADMIN PANEL</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded transition-colors"
            style={{ 
              backgroundColor: 'transparent', 
              border: '1px solid #38bdf8',
              color: '#38bdf8'
            }}
          >
            Logout
          </button>
        </div>
      )}
      {children}
    </div>
  )
}
