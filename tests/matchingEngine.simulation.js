import assert from 'node:assert/strict'
import { MATCH_OUTCOME, MATCH_REASON, runAllocation } from '../src/matchingEngine.js'

const DEFAULT_SEED = 20260718
const SMALL_SCENARIO_COUNT = 10000
const LARGE_SCENARIO_COUNT = 100
const FAIRNESS_ROUND_COUNT = 200
const PARTITIONS = ['female', 'male']
const ROOM_PRICES = [48000, 60000, 78000]

function createRandom(seed) {
  let state = seed >>> 0
  return () => {
    state += 0x6D2B79F5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function randomInteger(random, minimum, maximum) {
  return minimum + Math.floor(random() * (maximum - minimum + 1))
}

function shuffle(random, values) {
  const shuffled = [...values]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = randomInteger(random, 0, index)
    ;[shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]]
  }
  return shuffled
}

function orderedAcceptedRooms(applicant) {
  const accepted = new Set(applicant.acceptedRoomIds)
  return [
    ...applicant.preferenceOrder.filter((roomId) => accepted.has(roomId)),
    ...applicant.acceptedRoomIds.filter((roomId) => !applicant.preferenceOrder.includes(roomId)),
  ]
}

function compatible(applicant, bed) {
  return (
    applicant.acceptedRoomIds.includes(bed.roomId)
    && (!applicant.partition || !bed.partition || applicant.partition === bed.partition)
  )
}

function generateScenario(random, { applicantCount, bedCount, roomCount }) {
  const roomIds = Array.from({ length: roomCount }, (_, index) => `room-${index + 1}`)
  const lotteryNumbers = shuffle(
    random,
    Array.from({ length: applicantCount }, (_, index) => String(index + 1).padStart(4, '0')),
  )
  const applicants = Array.from({ length: applicantCount }, (_, index) => {
    const acceptedRoomIds = roomIds.filter(() => random() < 0.58)
    return {
      id: `student-${index + 1}`,
      lotteryNumber: lotteryNumbers[index],
      acceptedRoomIds,
      preferenceOrder: shuffle(random, acceptedRoomIds),
      partition: PARTITIONS[randomInteger(random, 0, PARTITIONS.length - 1)],
      submittedAt: `${String(randomInteger(random, 8, 9)).padStart(2, '0')}:${String(randomInteger(random, 0, 59)).padStart(2, '0')}`,
    }
  })
  const beds = Array.from({ length: bedCount }, (_, index) => ({
    id: `bed-${index + 1}`,
    roomId: roomIds[randomInteger(random, 0, roomIds.length - 1)],
    suiteId: `S${String(randomInteger(random, 1, 20)).padStart(2, '0')}`,
    price: ROOM_PRICES[randomInteger(random, 0, ROOM_PRICES.length - 1)],
    partition: PARTITIONS[randomInteger(random, 0, PARTITIONS.length - 1)],
  }))
  return { applicants, beds }
}

function bruteForceMaximumMatches(applicants, beds) {
  const memo = new Map()

  const search = (applicantIndex, usedBedMask) => {
    if (applicantIndex >= applicants.length) return 0
    const key = `${applicantIndex}:${usedBedMask}`
    if (memo.has(key)) return memo.get(key)

    let maximum = search(applicantIndex + 1, usedBedMask)
    for (let bedIndex = 0; bedIndex < beds.length; bedIndex += 1) {
      const bedBit = 1 << bedIndex
      if ((usedBedMask & bedBit) !== 0 || !compatible(applicants[applicantIndex], beds[bedIndex])) continue
      maximum = Math.max(maximum, 1 + search(applicantIndex + 1, usedBedMask | bedBit))
    }

    memo.set(key, maximum)
    return maximum
  }

  return search(0, 0)
}

function assertAllocationInvariants({ applicants, beds }, allocation, label) {
  assert.equal(allocation.results.length, applicants.length, `${label}: missing applicant result`)
  assert.equal(
    allocation.successfulMatches.length + allocation.failedMatches.length,
    applicants.length,
    `${label}: result totals do not match applicant count`,
  )

  const applicantsById = new Map(applicants.map((applicant) => [applicant.id, applicant]))
  const bedsById = new Map(beds.map((bed) => [bed.id, bed]))
  const resultApplicantIds = allocation.results.map((result) => result.applicantId)
  const assignedBedIds = allocation.successfulMatches.map((result) => result.bedId)

  assert.equal(new Set(resultApplicantIds).size, applicants.length, `${label}: duplicate applicant result`)
  assert.equal(new Set(assignedBedIds).size, assignedBedIds.length, `${label}: duplicate bed assignment`)

  allocation.successfulMatches.forEach((result) => {
    const applicant = applicantsById.get(result.applicantId)
    const allocatedBed = bedsById.get(result.bedId)
    const preferences = orderedAcceptedRooms(applicant)

    assert.ok(allocatedBed, `${label}: assigned bed does not exist`)
    assert.ok(applicant.acceptedRoomIds.includes(result.allocatedRoomId), `${label}: unacceptable room assigned`)
    assert.equal(result.allocatedRoomId, allocatedBed.roomId, `${label}: room and bed disagree`)
    assert.ok(compatible(applicant, allocatedBed), `${label}: incompatible housing partition`)
    assert.equal(result.allocatedPreferenceRank, preferences.indexOf(result.allocatedRoomId) + 1, `${label}: incorrect preference rank`)
    assert.equal(result.amountCharged, allocatedBed.price, `${label}: incorrect charge`)
    assert.equal(result.authorizationStatus, 'captured', `${label}: successful authorization not captured`)
    assert.equal(
      result.reasonCode,
      result.allocatedPreferenceRank === 1
        ? MATCH_REASON.FIRST_PREFERENCE_AVAILABLE
        : MATCH_REASON.HIGHEST_AVAILABLE_PREFERENCE,
      `${label}: incorrect success reason`,
    )
  })

  allocation.failedMatches.forEach((result) => {
    assert.equal(result.outcome, MATCH_OUTCOME.FAILED, `${label}: invalid failure outcome`)
    assert.equal(result.bedId, null, `${label}: failed applicant has a bed`)
    assert.equal(result.amountCharged, 0, `${label}: failed applicant was charged`)
    assert.equal(result.authorizationStatus, 'released', `${label}: failed authorization not released`)
  })

  const remainingBedIds = allocation.remainingBeds.map((bed) => bed.id)
  assert.equal(new Set(remainingBedIds).size, remainingBedIds.length, `${label}: duplicate remaining bed`)
  assert.equal(
    new Set([...assignedBedIds, ...remainingBedIds]).size,
    new Set(beds.map((bed) => bed.id)).size,
    `${label}: assigned and remaining beds do not cover inventory`,
  )
}

function runSmallScenarioChecks(random) {
  for (let index = 0; index < SMALL_SCENARIO_COUNT; index += 1) {
    const scenario = generateScenario(random, {
      applicantCount: randomInteger(random, 1, 8),
      bedCount: randomInteger(random, 0, 8),
      roomCount: randomInteger(random, 1, 4),
    })
    const allocation = runAllocation(scenario)
    const label = `small scenario ${index + 1}`

    assertAllocationInvariants(scenario, allocation, label)
    assert.equal(
      allocation.successfulMatches.length,
      bruteForceMaximumMatches(scenario.applicants, scenario.beds),
      `${label}: allocation is not maximum`,
    )
  }
}

function runLargeScenarioChecks(random) {
  let largestApplicantCount = 0
  let largestBedCount = 0

  for (let index = 0; index < LARGE_SCENARIO_COUNT; index += 1) {
    const scenario = generateScenario(random, {
      applicantCount: randomInteger(random, 100, 500),
      bedCount: randomInteger(random, 50, 300),
      roomCount: 5,
    })
    largestApplicantCount = Math.max(largestApplicantCount, scenario.applicants.length)
    largestBedCount = Math.max(largestBedCount, scenario.beds.length)
    assertAllocationInvariants(scenario, runAllocation(scenario), `large scenario ${index + 1}`)
  }

  return { largestApplicantCount, largestBedCount }
}

function runFairnessCheck(random) {
  const applicantCount = 240
  const bedCount = 214
  const wins = new Map(Array.from({ length: applicantCount }, (_, index) => [`student-${index + 1}`, 0]))
  const beds = Array.from({ length: bedCount }, (_, index) => ({
    id: `bed-${index + 1}`,
    roomId: 'room-a',
    suiteId: `S${String(Math.floor(index / 8) + 1).padStart(2, '0')}`,
    price: 60000,
  }))

  for (let round = 0; round < FAIRNESS_ROUND_COUNT; round += 1) {
    const priorities = shuffle(random, Array.from({ length: applicantCount }, (_, index) => index + 1))
    const applicants = Array.from({ length: applicantCount }, (_, index) => ({
      id: `student-${index + 1}`,
      lotteryNumber: String(priorities[index]).padStart(3, '0'),
      acceptedRoomIds: ['room-a'],
      preferenceOrder: ['room-a'],
    }))
    const allocation = runAllocation({ applicants, beds })
    assert.equal(allocation.successfulMatches.length, bedCount, `fairness round ${round + 1}: incorrect winner count`)
    allocation.successfulMatches.forEach((result) => wins.set(result.applicantId, wins.get(result.applicantId) + 1))
  }

  const rates = [...wins.values()].map((winCount) => winCount / FAIRNESS_ROUND_COUNT)
  const expectedRate = bedCount / applicantCount
  const averageRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length
  const minimumRate = Math.min(...rates)
  const maximumRate = Math.max(...rates)

  assert.ok(Math.abs(averageRate - expectedRate) < 1e-12, 'fairness: average win rate is incorrect')
  assert.ok(minimumRate >= expectedRate - 0.12, 'fairness: one applicant wins far less often than expected')
  assert.ok(maximumRate <= expectedRate + 0.12, 'fairness: one applicant wins far more often than expected')

  return { expectedRate, averageRate, minimumRate, maximumRate }
}

const seed = Number.parseInt(process.env.SIMULATION_SEED || `${DEFAULT_SEED}`, 10)
const random = createRandom(seed)
const startedAt = performance.now()

runSmallScenarioChecks(random)
const largeSummary = runLargeScenarioChecks(random)
const fairnessSummary = runFairnessCheck(random)

const elapsedMilliseconds = performance.now() - startedAt

console.log(JSON.stringify({
  seed,
  smallScenarios: SMALL_SCENARIO_COUNT,
  largeScenarios: LARGE_SCENARIO_COUNT,
  largestApplicantCount: largeSummary.largestApplicantCount,
  largestBedCount: largeSummary.largestBedCount,
  fairnessRounds: FAIRNESS_ROUND_COUNT,
  expectedWinRate: Number(fairnessSummary.expectedRate.toFixed(4)),
  averageWinRate: Number(fairnessSummary.averageRate.toFixed(4)),
  minimumWinRate: Number(fairnessSummary.minimumRate.toFixed(4)),
  maximumWinRate: Number(fairnessSummary.maximumRate.toFixed(4)),
  elapsedMilliseconds: Number(elapsedMilliseconds.toFixed(2)),
  status: 'passed',
}, null, 2))
