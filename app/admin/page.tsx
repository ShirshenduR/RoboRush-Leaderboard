'use client'

import { useState, useEffect } from 'react'
import { Database } from '@/types/database.types'
import { motion, AnimatePresence } from 'framer-motion'

type Team = Database['public']['Tables']['teams']['Row']

export default function AdminDashboard() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadTeams()
  }, [])

  async function loadTeams() {
    setLoading(true)
    try {
      const response = await fetch('/api/teams')
      const result = await response.json()
      if (result.success && result.data) {
        setTeams(result.data)
      }
    } catch (error) {
      console.error('Failed to load teams:', error)
    }
    setLoading(false)
  }

  async function handleScoreUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedTeam) return

    const formData = new FormData(e.currentTarget)
    const newScore = Number(formData.get('newScore'))

    const oldTeams = [...teams]
    setTeams(prevTeams => 
      prevTeams.map(t => 
        t.id === selectedTeam.id 
          ? { ...t, score: newScore, last_score_update: new Date().toISOString() }
          : t
      ).sort((a, b) => b.score - a.score)
    )
    setSelectedTeam(null)
    setMessage({ type: 'success', text: 'Score updated!' })

    try {
      const response = await fetch('/api/teams/score', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTeam.id, newScore }),
      })
      const result = await response.json()

      if (!result.success) {
        setTeams(oldTeams)
        setMessage({ type: 'error', text: result.error || 'Failed to update score' })
      }
    } catch (error) {
      setTeams(oldTeams)
      setMessage({ type: 'error', text: 'Failed to update score' })
    }

    setTimeout(() => setMessage(null), 2000)
  }

  async function handleCreateTeam(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const team_name = formData.get('teamName') as string

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_name }),
      })
      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: 'Team created successfully!' })
        setShowCreateModal(false)
        loadTeams()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create team' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create team' })
    }

    setTimeout(() => setMessage(null), 3000)
  }

  async function handleBulkImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const teamsList = formData.get('teamsList') as string

    if (!teamsList.trim()) {
      setMessage({ type: 'error', text: 'Please enter team names' })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    try {
      const response = await fetch('/api/teams/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamsList }),
      })
      const result = await response.json()

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: result.message || 'Teams imported successfully!' 
        })
        setShowImportModal(false)
        loadTeams()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to import teams' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to import teams' })
    }

    setTimeout(() => setMessage(null), 5000)
  }

  async function handleStatusChange(team: Team, newStatus: string) {
    if (newStatus !== 'active' && newStatus !== 'inactive' && newStatus !== 'disqualified') {
      return
    }

    const oldTeams = [...teams]
    setTeams(prevTeams => 
      prevTeams.map(t => 
        t.id === team.id ? { ...t, status: newStatus as 'active' | 'inactive' | 'disqualified' } : t
      )
    )
    setMessage({ type: 'success', text: 'Status updated!' })

    try {
      const response = await fetch('/api/teams/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: team.id, status: newStatus }),
      })
      const result = await response.json()

      if (!result.success) {
        setTeams(oldTeams)
        setMessage({ type: 'error', text: result.error || 'Failed to update status' })
      }
    } catch (error) {
      setTeams(oldTeams)
      setMessage({ type: 'error', text: 'Failed to update status' })
    }

    setTimeout(() => setMessage(null), 2000)
  }

  async function handleDeleteTeam(teamId: string) {
    if (!confirm('Are you sure you want to delete this team?')) return

    const oldTeams = [...teams]
    setTeams(prevTeams => prevTeams.filter(t => t.id !== teamId))
    setMessage({ type: 'success', text: 'Team deleted!' })

    try {
      const response = await fetch(`/api/teams?id=${teamId}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (!result.success) {
        setTeams(oldTeams)
        setMessage({ type: 'error', text: result.error || 'Failed to delete team' })
      }
    } catch (error) {
      setTeams(oldTeams)
      setMessage({ type: 'error', text: 'Failed to delete team' })
    }

    setTimeout(() => setMessage(null), 2000)
  }

  const filteredTeams = teams.filter(team =>
    team.team_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#38bdf8' }} />
          <div style={{ color: '#38bdf8' }} className="text-xl font-mono">Loading...</div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`fixed top-20 right-4 px-4 sm:px-6 py-3 rounded-lg shadow-2xl z-50 flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-green-500 border-2 border-green-300' 
                : 'bg-red-500 border-2 border-red-300'
            } text-white max-w-sm`}
          >
            <span className="text-lg">
              {message.type === 'success' ? '✓' : '✕'}
            </span>
            <span className="font-medium text-sm sm:text-base">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 space-y-4"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display" style={{ color: '#38bdf8' }}>
              Team Management
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {teams.length} teams • {teams.filter(t => t.status === 'active').length} active
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 text-sm sm:text-base shadow-lg"
            >
              <span className="text-lg">📋</span>
              <span className="hidden sm:inline">Import Teams</span>
              <span className="sm:hidden">Import</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 sm:px-6 py-2 font-bold rounded-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 text-sm sm:text-base shadow-lg shadow-sky-500/40"
              style={{ backgroundColor: '#38bdf8', color: '#050b18' }}
            >
              <span className="text-lg">+</span>
              Create Team
            </button>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-black/40 border-2 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-dsl-blue transition-colors"
            style={{ borderColor: '#1b2b4b' }}
          />
          <svg
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </motion.div>

      <div className="grid gap-3 sm:gap-4">
        <AnimatePresence mode="popLayout">
          {filteredTeams.map((team, index) => (
            <motion.div
              key={team.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
              className="border rounded-lg p-4 sm:p-6 backdrop-blur-sm hover:shadow-xl transition-all"
              style={{ 
                backgroundColor: '#0b1635',
                borderColor: team.status === 'active' ? '#38bdf8' : '#1b2b4b',
                borderWidth: team.status === 'active' ? '2px' : '1px'
              }}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                <div className="flex-1 w-full">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-lg sm:text-xl font-bold text-white break-words flex-1">
                      {team.team_name}
                    </h3>
                    <span className="text-2xl sm:text-3xl font-bold font-mono flex-shrink-0" style={{ color: '#38bdf8' }}>
                      {team.score}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <select
                      value={team.status}
                      onChange={(e) => handleStatusChange(team, e.target.value)}
                      className="px-3 py-1.5 bg-black/60 border text-white rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-dsl-blue/60 transition-all"
                      style={{ borderColor: '#1b2b4b' }}
                    >
                      <option value="active">✓ Active</option>
                      <option value="inactive">⏸ Inactive</option>
                      <option value="disqualified">✕ Disqualified</option>
                    </select>
                    {team.last_score_update && (
                      <span className="text-xs text-gray-500">
                        Updated {new Date(team.last_score_update).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 w-full lg:w-auto">
                  <button
                    onClick={() => setSelectedTeam(team)}
                    className="flex-1 lg:flex-initial px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all transform hover:scale-105 active:scale-95 text-xs sm:text-sm font-medium shadow-lg"
                  >
                    📊 Update
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    className="flex-1 lg:flex-initial px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all transform hover:scale-105 active:scale-95 text-xs sm:text-sm font-medium shadow-lg"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredTeams.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <p className="text-gray-500 text-lg sm:text-xl">
            {searchQuery ? 'No teams found matching your search' : 'No teams registered yet'}
          </p>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedTeam(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="border-2 p-6 sm:p-8 rounded-lg max-w-md w-full shadow-2xl"
              style={{ backgroundColor: '#0b1635', borderColor: '#38bdf8' }}
            >
              <h3 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: '#38bdf8' }}>
                Update Score
              </h3>
              <p className="text-gray-300 mb-4 text-sm sm:text-base">{selectedTeam.team_name}</p>
              <form onSubmit={handleScoreUpdate} className="space-y-4">
                <input type="hidden" name="teamId" value={selectedTeam.id} />
                <div>
                  <label className="block text-sm text-gray-400 mb-2">New Score</label>
                  <input
                    type="number"
                    name="newScore"
                    defaultValue={selectedTeam.score}
                    className="w-full px-4 py-3 bg-black/60 border-2 text-white rounded-lg focus:outline-none focus:border-dsl-blue transition-colors text-lg font-mono"
                    style={{ borderColor: '#1b2b4b' }}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Reason (optional)</label>
                  <input
                    type="text"
                    name="reason"
                    placeholder="e.g., Round 1 completed"
                    className="w-full px-4 py-2 bg-black/60 border text-white rounded-lg focus:outline-none focus:border-dsl-blue transition-colors"
                    style={{ borderColor: '#1b2b4b' }}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 font-bold rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                    style={{ backgroundColor: '#38bdf8', color: '#050b18' }}
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTeam(null)}
                    className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all transform hover:scale-105 active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="border-2 p-6 sm:p-8 rounded-lg max-w-md w-full shadow-2xl"
              style={{ backgroundColor: '#0b1635', borderColor: '#38bdf8' }}
            >
              <h3 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: '#38bdf8' }}>
                Create New Team
              </h3>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Team Name</label>
                  <input
                    type="text"
                    name="teamName"
                    placeholder="Enter team name"
                    className="w-full px-4 py-3 bg-black/60 border-2 text-white rounded-lg focus:outline-none focus:border-dsl-blue transition-colors"
                    style={{ borderColor: '#1b2b4b' }}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Initial Score</label>
                  <input
                    type="number"
                    name="initialScore"
                    defaultValue={0}
                    className="w-full px-4 py-3 bg-black/60 border text-white rounded-lg font-mono focus:outline-none focus:border-dsl-blue transition-colors"
                    style={{ borderColor: '#1b2b4b' }}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 font-bold rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                    style={{ backgroundColor: '#38bdf8', color: '#050b18' }}
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all transform hover:scale-105 active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowImportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black/40 border-2 border-blue-500 p-6 sm:p-8 rounded-lg max-w-2xl w-full shadow-2xl backdrop-blur-md"
              style={{ backgroundColor: '#0b1635' }}
            >
              <h3 className="text-xl sm:text-2xl font-bold text-blue-400 mb-2">
                📋 Bulk Import Teams
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 mb-4">
                Enter team names, one per line. All teams will be created with a score of 0.
              </p>
              <form onSubmit={handleBulkImport} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Team Names (one per line)
                  </label>
                  <textarea
                    name="teamsList"
                    placeholder="Team Alpha&#10;Team Beta&#10;Team Gamma&#10;Team Delta"
                    className="w-full px-4 py-3 bg-black/60 border-2 border-gray-700 text-white rounded-lg font-mono text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    rows={12}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    💡 Tip: Copy team names from Excel/Sheets and paste here
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                  >
                    Import All Teams
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all transform hover:scale-105 active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
