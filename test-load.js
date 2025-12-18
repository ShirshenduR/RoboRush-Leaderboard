#!/usr/bin/env node

/**
 * Load Testing Script for RoboRush Leaderboard
 * Simulates multiple concurrent viewers
 */

const LEADERBOARD_URL = process.env.TEST_URL || 'http://localhost:3000'
const NUM_VIEWERS = parseInt(process.env.NUM_VIEWERS || '1000')
const POLL_INTERVAL = 2000 // 2 seconds

console.log(`\n🚀 Starting Load Test`)
console.log(`📊 Target: ${LEADERBOARD_URL}`)
console.log(`👥 Simulating: ${NUM_VIEWERS} concurrent viewers`)
console.log(`⏱️  Poll interval: ${POLL_INTERVAL}ms\n`)

let successCount = 0
let errorCount = 0
let totalRequests = 0
let responseTimes = []

// Simulate a single viewer
async function simulateViewer(id) {
  const startTime = Date.now()
  
  try {
    const response = await fetch(`${LEADERBOARD_URL}/api/teams`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    const responseTime = Date.now() - startTime
    responseTimes.push(responseTime)

    if (response.ok) {
      successCount++
      const data = await response.json()
      return { success: true, teams: data.data?.length || 0, responseTime }
    } else {
      errorCount++
      return { success: false, status: response.status, responseTime }
    }
  } catch (error) {
    errorCount++
    return { success: false, error: error.message, responseTime: Date.now() - startTime }
  } finally {
    totalRequests++
  }
}

// Simulate polling for one viewer
function startViewerPolling(id) {
  return setInterval(async () => {
    await simulateViewer(id)
  }, POLL_INTERVAL)
}

// Print stats
function printStats() {
  const avgResponseTime = responseTimes.length > 0 
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0
  
  const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0
  const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0
  
  console.clear()
  console.log(`\n📊 LOAD TEST STATISTICS`)
  console.log(`${'='.repeat(50)}`)
  console.log(`👥 Active Viewers:     ${NUM_VIEWERS}`)
  console.log(`📨 Total Requests:     ${totalRequests}`)
  console.log(`✅ Successful:         ${successCount} (${totalRequests > 0 ? Math.round(successCount/totalRequests*100) : 0}%)`)
  console.log(`❌ Errors:             ${errorCount}`)
  console.log(`\n⏱️  RESPONSE TIMES`)
  console.log(`${'='.repeat(50)}`)
  console.log(`📈 Average:            ${avgResponseTime}ms`)
  console.log(`⬆️  Max:                ${maxResponseTime}ms`)
  console.log(`⬇️  Min:                ${minResponseTime}ms`)
  console.log(`\n💡 Press Ctrl+C to stop the test\n`)
}

// Initial burst test
async function runInitialBurst() {
  console.log(`🔥 Running initial burst test with ${NUM_VIEWERS} concurrent requests...\n`)
  
  const promises = []
  for (let i = 0; i < NUM_VIEWERS; i++) {
    promises.push(simulateViewer(i))
  }
  
  await Promise.all(promises)
  
  console.log(`✅ Initial burst complete!`)
  console.log(`   Success: ${successCount}/${NUM_VIEWERS}`)
  console.log(`   Errors: ${errorCount}/${NUM_VIEWERS}\n`)
}

// Main execution
async function main() {
  try {
    // Test server availability first
    console.log(`🔍 Checking server availability...`)
    const testResponse = await fetch(`${LEADERBOARD_URL}/api/teams`)
    if (!testResponse.ok) {
      throw new Error(`Server returned ${testResponse.status}`)
    }
    console.log(`✅ Server is responding\n`)

    // Run initial burst
    await runInitialBurst()

    // Start continuous polling for all viewers
    console.log(`🔄 Starting continuous polling (${POLL_INTERVAL}ms interval)...\n`)
    const intervals = []
    for (let i = 0; i < NUM_VIEWERS; i++) {
      // Stagger the start times slightly to avoid exact synchronization
      setTimeout(() => {
        intervals.push(startViewerPolling(i))
      }, Math.random() * 1000)
    }

    // Print stats every second
    const statsInterval = setInterval(printStats, 1000)

    // Cleanup on exit
    process.on('SIGINT', () => {
      console.log(`\n\n🛑 Stopping load test...`)
      intervals.forEach(interval => clearInterval(interval))
      clearInterval(statsInterval)
      printStats()
      console.log(`\n✅ Test completed!\n`)
      process.exit(0)
    })

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`)
    console.error(`\nMake sure the server is running at ${LEADERBOARD_URL}\n`)
    process.exit(1)
  }
}

main()
