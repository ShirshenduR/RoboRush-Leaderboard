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
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-neon-yellow text-2xl animate-pulse"
        >
          Loading...
        </motion.div>
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
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative border-b-2 border-neon-yellow bg-black/50 backdrop-blur-sm sticky top-0 z-40"
      >
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <motion.h1 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-neon-yellow tracking-wider" 
                style={{ fontFamily: 'monospace' }}
              >
                ROBO RUSH 2026
              </motion.h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-400 mt-1 tracking-widest">
                ERS CLUB • LIVE LEADERBOARD
              </p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 px-3 py-2 bg-black/40 rounded-lg border"
                style={{ borderColor: '#1a1a1a' }}
              >
                <motion.div 
                  animate={{ 
                    scale: connectionStatus === 'connected' || connectionStatus === 'polling' ? [1, 1.2, 1] : 1,
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500' : 
                    connectionStatus === 'polling' ? 'bg-blue-500' :
                    connectionStatus === 'connecting' ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`} 
                />
                <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                  {connectionStatus === 'polling' ? 'LIVE' : connectionStatus}
                </span>
              </motion.div>
              <motion.a
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                href="/admin/login"
                className="flex items-center gap-2 px-3 py-2 bg-dark-panel border border-neon-yellow/30 hover:border-neon-yellow hover:bg-neon-yellow/10 rounded-lg transition-all group"
                title="Admin Login"3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-20">
        <div className="space-y-2 sm:space-y-3">
          <AnimatePresence mode="popLayout">
            {teams.map((team, index) => (
              <motion.div
                key={team.id}
                layout
                initial={{ opacity: 0, x: -50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.95 }}
                transition={{ 
                  duration: 0.4,
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ scale: 1.02, x: 5 }}
                className={`
                  relative overflow-hidden
                  bg-gradient-to-r from-dark-panel to-dark-bg
                  border-2 ${index < 3 ? 'border-neon-yellow' : 'border-dark-border'}
                  ${index < 3 ? 'shadow-lg shadow-neon-yellow/20' : ''}
                  rounded-lg sm:rounded-xl
                  transition-all duration-300
                `}
              >
                {/* Animated gradient overlay for top 3 */}
                {index < 3 && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-neon-yellow/5 via-transparent to-neon-yellow/5"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                )}

                {/* Rank badge */}
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: index * 0.05 + 0.2, type: "spring" }}
                  className={`
                    absolute top-0 left-0 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center
                    ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' : 
                      index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 
                      'bg-gradient-to-br from-gray-700 to-gray-900'}
                    rounded-br-2xl shadow-lg
                  `}
                >
                  <span className="text-xl sm:text-2xl md:text-3xl font-bold text-black drop-shadow-lg" style={{ fontFamily: 'monospace' }}>
                    {index + 1}
                  </span>
                  {index < 3 && (
                    <motion.div
                      className="absolute -top-1 -right-1"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      {index === 0 && <span className="text-2xl">👑</span>}
                      {index === 1 && <span className="text-xl">⭐</span>}
                      {index === 2 && <span className="text-xl">✨</span>}
                    </motion.div>
                  )}
                </motion.div>

                {/* Team info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pl-20 sm:pl-24 pr-4 sm:pr-6 py-4 sm:py-6 gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <motion.h3 
                      className="text-base sm:text-xl md:text-2xl font-bold text-white tracking-wide break-words"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 + 0.3 }}
                    >
                      {team.team_name}
                    </motion.h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 sm:mt-2">
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.05 + 0.4 }}
                        className={`
                          text-xs px-2 py-0.5 sm:py-1 rounded-full uppercase tracking-wider font-medium
                          ${team.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 
                            team.status === 'inactive' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/40' : 
                            'bg-red-500/20 text-red-400 border border-red-500/40'}
                        `}
                      >
                        {team.status}
                      </motion.span>
                      {team.last_score_update && (
                        <span className="text-xs text-gray-500 hidden sm:inline">
                          Updated {new Date(team.last_score_update).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <motion.div 
                    className="text-right"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.05 + 0.5, type: "spring" }}
       motion.footer 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm border-t border-neon-yellow/30 py-2 sm:py-3 z-30"
      >
        <div className="container mx-auto px-3 sm:px-4 text-center">
          <p className="text-xs sm:text-sm text-gray-500 tracking-wider">
            <span className="hidden sm:inline">© 2026 ERS CLUB • </span>
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-green-400"
            >
              LIVE
            </motion.span>
            <span className="mx-2">•</span>
            <span className="font-mono text-neon-yellow">{teams.length}</span> TEAMS
          </p>
        </div>
      </motion.footer   animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {teams.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              🏆
            </motion.div>
            <p className="text-gray-500 text-lg sm:text-xl">No teams registered yet</p>
            <p className="text-gray-600 text-sm mt-2">The competition will begin soon!</p>
          </motion.          )}
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
