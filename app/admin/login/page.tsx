'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        router.push('/admin')
      } else {
        setError(result.error || 'Authentication failed')
        setPassword('')
      }
    } catch (err) {
      setError('Authentication failed')
      setPassword('')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="w-full max-w-md">
        <div className="border-2 p-8 rounded" style={{ backgroundColor: '#111111', borderColor: '#FFFF00' }}>
          <h1 className="text-3xl font-bold text-center mb-6" style={{ color: '#FFFF00' }}>
            ADMIN ACCESS
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm mb-2" style={{ color: '#9ca3af' }}>
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded"
                style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', color: 'white' }}
                placeholder="Enter admin password"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="px-4 py-2 rounded text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgb(239, 68, 68)', color: 'rgb(248, 113, 113)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold py-3 rounded transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#FFFF00', color: 'black' }}
            >
              {loading ? 'Authenticating...' : 'Login'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm" style={{ color: '#6b7280' }}>
            ← Back to Leaderboard
          </a>
        </div>
      </div>
    </div>
  )
}
