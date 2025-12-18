'use client'

import { useState, useEffect } from 'react'
import { Database } from '@/types/database.types'

type Team = Database['public']['Tables']['teams']['Row']

export default function AdminDashboard() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

    // Optimistic update - update UI immediately
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
        // Revert on failure
        setTeams(oldTeams)
        setMessage({ type: 'error', text: result.error || 'Failed to update score' })
      }
    } catch (error) {
      // Revert on error
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
    // Type guard for valid status
    if (newStatus !== 'active' && newStatus !== 'inactive' && newStatus !== 'disqualified') {
      return
    }

    // Optimistic update
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
        // Revert on failure
        setTeams(oldTeams)
        setMessage({ type: 'error', text: result.error || 'Failed to update status' })
      }
    } catch (error) {
      // Revert on error
      setTeams(oldTeams)
      setMessage({ type: 'error', text: 'Failed to update status' })
    }

    setTimeout(() => setMessage(null), 2000)
  }

  async function handleDeleteTeam(teamId: string) {
    if (!confirm('Are you sure you want to delete this team?')) return

    // Optimistic update
    const oldTeams = [...teams]
    setTeams(prevTeams => prevTeams.filter(t => t.id !== teamId))
    setMessage({ type: 'success', text: 'Team deleted!' })

    try {
      const response = await fetch(`/api/teams?id=${teamId}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (!result.success) {
        // Revert on failure
        setTeams(oldTeams)
        setMessage({ type: 'error', text: result.error || 'Failed to delete team' })
      }
    } catch (error) {
      // Revert on error
      setTeams(oldTeams)
      setMessage({ type: 'error', text: 'Failed to delete team' })
    }

    setTimeout(() => setMessage(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-neon-yellow text-2xl animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Message Toast */}
      {message && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded shadow-lg z-50 ${
          message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-3xl font-bold text-white">Team Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-colors"
          >
            📋 Import Teams
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-neon-yellow hover:bg-yellow-400 text-black font-bold rounded transition-colors"
          >
            + Create Team
          </button>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid gap-4">
        {teams.map((team) => (
          <div
            key={team.id}
            className="bg-dark-panel border border-dark-border p-6 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">{team.team_name}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-3xl font-bold text-neon-yellow" style={{ fontFamily: 'monospace' }}>
                    {team.score} pts
                  </span>
                  <select
                    value={team.status}
                    onChange={(e) => handleStatusChange(team, e.target.value)}
                    className="px-3 py-1 bg-dark-bg border border-dark-border text-white rounded text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="disqualified">Disqualified</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedTeam(team)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  Update Score
                </button>
                <button
                  onClick={() => handleDeleteTeam(team.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Update Score Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-panel border-2 border-neon-yellow p-8 rounded-lg max-w-md w-full">
            <h3 className="text-2xl font-bold text-neon-yellow mb-4">
              Update Score: {selectedTeam.team_name}
            </h3>
            <form onSubmit={handleScoreUpdate} className="space-y-4">
              <input type="hidden" name="teamId" value={selectedTeam.id} />
              <div>
                <label className="block text-sm text-gray-400 mb-2">New Score</label>
                <input
                  type="number"
                  name="newScore"
                  defaultValue={selectedTeam.score}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-white rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Reason (optional)</label>
                <input
                  type="text"
                  name="reason"
                  placeholder="e.g., Round 1 completed"
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-white rounded"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-neon-yellow hover:bg-yellow-400 text-black font-bold rounded transition-colors"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTeam(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-panel border-2 border-neon-yellow p-8 rounded-lg max-w-md w-full">
            <h3 className="text-2xl font-bold text-neon-yellow mb-4">Create New Team</h3>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Team Name</label>
                <input
                  type="text"
                  name="teamName"
                  placeholder="Enter team name"
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-white rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Initial Score</label>
                <input
                  type="number"
                  name="initialScore"
                  defaultValue={0}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-white rounded"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-neon-yellow hover:bg-yellow-400 text-black font-bold rounded transition-colors"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Teams Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-panel border-2 border-blue-500 p-8 rounded-lg max-w-2xl w-full">
            <h3 className="text-2xl font-bold text-blue-400 mb-2">Bulk Import Teams</h3>
            <p className="text-sm text-gray-400 mb-4">
              Enter team names, one per line. All teams will be created with a score of 0.
            </p>
            <form onSubmit={handleBulkImport} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Team Names (one per line)</label>
                <textarea
                  name="teamsList"
                  placeholder="Team Alpha&#10;Team Beta&#10;Team Gamma&#10;Team Delta"
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border text-white rounded font-mono text-sm"
                  rows={12}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tip: Copy team names from Excel/Sheets and paste here
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-colors"
                >
                  Import All Teams
                </button>
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
