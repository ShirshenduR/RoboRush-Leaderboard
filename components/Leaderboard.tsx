'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'
import { motion, AnimatePresence } from 'framer-motion'

type Team = Database['public']['Tables']['teams']['Row']

export default function Leaderboard() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'polling'>('connecting')
  const [updateMode, setUpdateMode] = useState<'realtime' | 'polling'>('realtime')
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    // Initial fetch
    fetchTeams()

    // Try realtime first, fallback to polling if connection fails
    attemptRealtimeConnection()

    return () => {
      cleanup()
    }
  }, [])

  function cleanup() {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }

  function attemptRealtimeConnection() {
    // Try to subscribe to realtime updates
    const channel = supabase
      .channel('leaderboard-updates', {
        config: {
          broadcast: { self: false },
          presence: { key: '' },
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
        },
        (payload) => {
          handleRealtimeUpdate(payload)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected')
          setUpdateMode('realtime')
          // Stop polling if it was running
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Connection failed - switch to polling mode
          setConnectionStatus('polling')
          setUpdateMode('polling')
          startPolling()
        }
      })

    channelRef.current = channel

    // Timeout: If not connected within 5 seconds, switch to polling
    setTimeout(() => {
      if (connectionStatus !== 'connected') {
        setConnectionStatus('polling')
        setUpdateMode('polling')
        startPolling()
      }
    }, 5000)
  }

  function startPolling() {
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    // Poll every 2 seconds for smooth updates
    pollingIntervalRef.current = setInterval(() => {
      fetchTeams()
    }, 2000)
  }

  async function fetchTeams() {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('score', { ascending: false })
        .order('team_name', { ascending: true })

      if (error) throw error
      
      // Only update if data has changed (avoid unnecessary re-renders)
      const newData = data || []
      if (JSON.stringify(newData) !== JSON.stringify(teams)) {
        setTeams(newData)
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleRealtimeUpdate(payload: any) {
    if (payload.eventType === 'INSERT') {
      setTeams((current) => {
        const newTeams = [...current, payload.new as Team]
        return sortTeams(newTeams)
      })
    } else if (payload.eventType === 'UPDATE') {
      setTeams((current) => {
        const updated = current.map((team) =>
          team.id === payload.new.id ? (payload.new as Team) : team
        )
        return sortTeams(updated)
      })
    } else if (payload.eventType === 'DELETE') {
      setTeams((current) => current.filter((team) => team.id !== payload.old.id))
    }
  }

  function sortTeams(teams: Team[]): Team[] {
    return [...teams].sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score
      }
      return a.team_name.localeCompare(b.team_name)
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-bg">
        <div className="text-neon-yellow text-2xl animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg bg-circuit-pattern text-white relative overflow-hidden">
      {/* Animated scan line effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-neon-yellow to-transparent opacity-20 animate-scan" />
      </div>

      {/* Header */}
      <header className="relative border-b-2 border-neon-yellow bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-neon-yellow tracking-wider" style={{ fontFamily: 'monospace' }}>
                ROBO RUSH 2026
              </h1>
              <p className="text-sm md:text-base text-gray-400 mt-1 tracking-widest">
                ERS CLUB • LIVE LEADERBOARD
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
                  connectionStatus === 'polling' ? 'bg-blue-500 animate-pulse' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
                  'bg-red-500'
                }`} />
                <span className="text-xs text-gray-400 uppercase tracking-wider hidden sm:inline">
                  {connectionStatus === 'polling' ? 'LIVE' : connectionStatus}
                </span>
              </div>
              <a
                href="/admin/login"
                className="flex items-center gap-2 px-3 py-2 bg-dark-panel border border-neon-yellow/30 hover:border-neon-yellow hover:bg-neon-yellow/10 rounded transition-all group"
                title="Admin Login"
              >
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-neon-yellow transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span className="text-xs text-gray-400 group-hover:text-neon-yellow uppercase tracking-wider hidden md:inline">
                  Admin
                </span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Leaderboard */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {teams.map((team, index) => (
              <motion.div
                key={team.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`
                  relative overflow-hidden
                  bg-gradient-to-r from-dark-panel to-dark-bg
                  border-2 ${index < 3 ? 'border-neon-yellow' : 'border-dark-border'}
                  ${index < 3 ? 'shadow-lg shadow-neon-yellow/20' : ''}
                  clip-corner
                `}
              >
                {/* Rank badge */}
                <div className={`
                  absolute top-0 left-0 w-20 h-20 flex items-center justify-center
                  ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-dark-border'}
                  clip-corner-small
                `}>
                  <span className="text-2xl md:text-3xl font-bold text-black" style={{ fontFamily: 'monospace' }}>
                    {index + 1}
                  </span>
                </div>

                {/* Team info */}
                <div className="flex items-center justify-between pl-24 pr-6 py-6">
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold text-white tracking-wide">
                      {team.team_name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`
                        text-xs px-2 py-1 rounded uppercase tracking-wider
                        ${team.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                          team.status === 'inactive' ? 'bg-gray-500/20 text-gray-400' : 
                          'bg-red-500/20 text-red-400'}
                      `}>
                        {team.status}
                      </span>
                      {team.last_score_update && (
                        <span className="text-xs text-gray-500">
                          Updated {new Date(team.last_score_update).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="text-4xl md:text-5xl font-bold text-neon-yellow" style={{ fontFamily: 'monospace' }}>
                      {team.score}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">
                      Points
                    </div>
                  </div>
                </div>

                {/* Circuit line decoration */}
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-neon-yellow/30 to-transparent" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {teams.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-xl">No teams registered yet</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm border-t border-neon-yellow/30 py-2">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-gray-500 tracking-wider">
            © 2026 ERS CLUB • REAL-TIME UPDATES ENABLED • {teams.length} TEAMS COMPETING
          </p>
        </div>
      </footer>

      <style jsx>{`
        .clip-corner {
          clip-path: polygon(
            0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%
          );
        }
        .clip-corner-small {
          clip-path: polygon(
            0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%
          );
        }
      `}</style>
    </div>
  )
}
