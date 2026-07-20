import test from 'node:test'
import assert from 'node:assert/strict'
import { MATCH_OUTCOME, MATCH_REASON, runAllocation } from '../src/matchingEngine.js'

const applicant = ({
  id,
  lotteryNumber,
  acceptedRoomIds,
  preferenceOrder = acceptedRoomIds,
  partition,
  submittedAt,
}) => ({
  id,
  lotteryNumber,
  acceptedRoomIds,
  preferenceOrder,
  partition,
  submittedAt,
})

const bed = ({ id, roomId, price = 60000, suiteId = 'S01', partition }) => ({
  id,
  roomId,
  price,
  suiteId,
  partition,
})

test('1. allocates an available first preference', () => {
  const allocation = runAllocation({
    applicants: [applicant({ id: 's1', lotteryNumber: '001', acceptedRoomIds: ['room-a'] })],
    beds: [bed({ id: 'A1', roomId: 'room-a', price: 78000 })],
  })

  assert.equal(allocation.results[0].outcome, MATCH_OUTCOME.SUCCESS)
  assert.equal(allocation.results[0].allocatedPreferenceRank, 1)
  assert.equal(allocation.results[0].reasonCode, MATCH_REASON.FIRST_PREFERENCE_AVAILABLE)
})

test('2. allocates the highest available alternative preference', () => {
  const allocation = runAllocation({
    applicants: [applicant({ id: 's1', lotteryNumber: '001', acceptedRoomIds: ['room-a', 'room-b'] })],
    beds: [bed({ id: 'B1', roomId: 'room-b', price: 48000 })],
  })

  assert.equal(allocation.results[0].allocatedRoomId, 'room-b')
  assert.equal(allocation.results[0].allocatedPreferenceRank, 2)
  assert.deepEqual(allocation.results[0].unavailablePreferenceIds, ['room-a'])
  assert.equal(allocation.results[0].reasonCode, MATCH_REASON.HIGHEST_AVAILABLE_PREFERENCE)
})

test('3. rejects an application with no accepted options', () => {
  const allocation = runAllocation({
    applicants: [applicant({ id: 's1', lotteryNumber: '001', acceptedRoomIds: [] })],
    beds: [bed({ id: 'A1', roomId: 'room-a' })],
  })

  assert.equal(allocation.results[0].outcome, MATCH_OUTCOME.FAILED)
  assert.equal(allocation.results[0].reasonCode, MATCH_REASON.NO_ACCEPTED_OPTIONS)
})

test('4. fails when every accepted room is unavailable', () => {
  const allocation = runAllocation({
    applicants: [applicant({ id: 's1', lotteryNumber: '001', acceptedRoomIds: ['room-a'] })],
    beds: [bed({ id: 'B1', roomId: 'room-b' })],
  })

  assert.equal(allocation.results[0].outcome, MATCH_OUTCOME.FAILED)
  assert.equal(allocation.results[0].reasonCode, MATCH_REASON.NO_ACCEPTED_BED_AVAILABLE)
})

test('5. gives a contested bed to the better lottery priority', () => {
  const allocation = runAllocation({
    applicants: [
      applicant({ id: 'later', lotteryNumber: '120', acceptedRoomIds: ['room-a'] }),
      applicant({ id: 'earlier', lotteryNumber: '003', acceptedRoomIds: ['room-a'] }),
    ],
    beds: [bed({ id: 'A1', roomId: 'room-a' })],
  })

  assert.equal(allocation.successfulMatches[0].applicantId, 'earlier')
  assert.equal(allocation.failedMatches[0].applicantId, 'later')
})

test('6. ignores submission time when lottery priorities differ', () => {
  const allocation = runAllocation({
    applicants: [
      applicant({ id: 'submitted-first', lotteryNumber: '200', acceptedRoomIds: ['room-a'], submittedAt: '08:00' }),
      applicant({ id: 'submitted-last', lotteryNumber: '010', acceptedRoomIds: ['room-a'], submittedAt: '09:59' }),
    ],
    beds: [bed({ id: 'A1', roomId: 'room-a' })],
  })

  assert.equal(allocation.successfulMatches[0].applicantId, 'submitted-last')
})

test('7. charges the allocated bed price rather than the authorization ceiling', () => {
  const allocation = runAllocation({
    applicants: [applicant({ id: 's1', lotteryNumber: '001', acceptedRoomIds: ['room-a', 'room-b'] })],
    beds: [bed({ id: 'B1', roomId: 'room-b', price: 48000 })],
  })

  assert.equal(allocation.results[0].amountCharged, 48000)
  assert.equal(allocation.results[0].authorizationStatus, 'captured')
})

test('8. releases authorization and charges zero after failure', () => {
  const allocation = runAllocation({
    applicants: [applicant({ id: 's1', lotteryNumber: '001', acceptedRoomIds: ['room-a'] })],
    beds: [],
  })

  assert.equal(allocation.results[0].amountCharged, 0)
  assert.equal(allocation.results[0].authorizationStatus, 'released')
})

test('9. does not allocate a bed from a different housing partition', () => {
  const allocation = runAllocation({
    applicants: [applicant({ id: 's1', lotteryNumber: '001', acceptedRoomIds: ['room-a'], partition: 'female' })],
    beds: [bed({ id: 'A1', roomId: 'room-a', partition: 'male' })],
  })

  assert.equal(allocation.results[0].outcome, MATCH_OUTCOME.FAILED)
})

test('10. allocates a compatible bed from the same housing partition', () => {
  const allocation = runAllocation({
    applicants: [applicant({ id: 's1', lotteryNumber: '001', acceptedRoomIds: ['room-a'], partition: 'female' })],
    beds: [bed({ id: 'A1', roomId: 'room-a', partition: 'female' })],
  })

  assert.equal(allocation.results[0].outcome, MATCH_OUTCOME.SUCCESS)
})

test('11. moves a flexible applicant to maximize the number of successful students', () => {
  const allocation = runAllocation({
    applicants: [
      applicant({ id: 'flexible', lotteryNumber: '001', acceptedRoomIds: ['room-a', 'room-b'] }),
      applicant({ id: 'only-a', lotteryNumber: '002', acceptedRoomIds: ['room-a'] }),
    ],
    beds: [
      bed({ id: 'A1', roomId: 'room-a' }),
      bed({ id: 'B1', roomId: 'room-b' }),
    ],
  })

  assert.equal(allocation.successfulMatches.length, 2)
  assert.equal(allocation.results.find((result) => result.applicantId === 'flexible').allocatedRoomId, 'room-b')
  assert.equal(allocation.results.find((result) => result.applicantId === 'only-a').allocatedRoomId, 'room-a')
})

test('12. never assigns the same bed to more than one applicant', () => {
  const allocation = runAllocation({
    applicants: [1, 2, 3].map((number) => applicant({ id: `s${number}`, lotteryNumber: `00${number}`, acceptedRoomIds: ['room-a'] })),
    beds: [bed({ id: 'A1', roomId: 'room-a' }), bed({ id: 'A2', roomId: 'room-a' })],
  })
  const assignedBeds = allocation.successfulMatches.map((result) => result.bedId)

  assert.equal(allocation.successfulMatches.length, 2)
  assert.equal(new Set(assignedBeds).size, assignedBeds.length)
})

test('13. reports unused beds when demand is below capacity', () => {
  const allocation = runAllocation({
    applicants: [applicant({ id: 's1', lotteryNumber: '001', acceptedRoomIds: ['room-a'] })],
    beds: [bed({ id: 'A1', roomId: 'room-a' }), bed({ id: 'A2', roomId: 'room-a' })],
  })

  assert.equal(allocation.successfulMatches.length, 1)
  assert.equal(allocation.remainingBeds.length, 1)
})

test('14. allocates exactly 214 unique beds among 240 identical applicants', () => {
  const applicants = Array.from({ length: 240 }, (_, index) => applicant({
    id: `student-${index + 1}`,
    lotteryNumber: String(index + 1).padStart(3, '0'),
    acceptedRoomIds: ['room-a'],
  }))
  const beds = Array.from({ length: 214 }, (_, index) => bed({
    id: `A${index + 1}`,
    roomId: 'room-a',
  }))
  const allocation = runAllocation({ applicants, beds })

  assert.equal(allocation.successfulMatches.length, 214)
  assert.equal(allocation.failedMatches.length, 26)
  assert.equal(new Set(allocation.successfulMatches.map((result) => result.bedId)).size, 214)
  assert.equal(allocation.successfulMatches[0].applicantId, 'student-1')
  assert.equal(allocation.successfulMatches.at(-1).applicantId, 'student-214')
})

test('15. returns deterministic results without mutating inputs', () => {
  const applicants = [
    applicant({ id: 's2', lotteryNumber: '002', acceptedRoomIds: ['room-a', 'room-b'] }),
    applicant({ id: 's1', lotteryNumber: '001', acceptedRoomIds: ['room-a'] }),
  ]
  const beds = [bed({ id: 'A1', roomId: 'room-a' }), bed({ id: 'B1', roomId: 'room-b' })]
  const originalApplicants = structuredClone(applicants)
  const originalBeds = structuredClone(beds)

  const firstRun = runAllocation({ applicants, beds })
  const secondRun = runAllocation({ applicants, beds })

  assert.deepEqual(firstRun, secondRun)
  assert.deepEqual(applicants, originalApplicants)
  assert.deepEqual(beds, originalBeds)
})

test('16. lifestyle answers never change who receives a bed', () => {
  const baseApplicants = [
    applicant({ id: 's1', lotteryNumber: '001', acceptedRoomIds: ['room-a'] }),
    applicant({ id: 's2', lotteryNumber: '002', acceptedRoomIds: ['room-a'] }),
  ]
  const beds = [bed({ id: 'A1', roomId: 'room-a' })]
  const firstRun = runAllocation({
    applicants: baseApplicants.map((student, index) => ({ ...student, lifestyleAnswers: { sleep: index ? 'After 01:00' : 'Before 23:00' } })),
    beds,
  })
  const secondRun = runAllocation({
    applicants: baseApplicants.map((student, index) => ({ ...student, lifestyleAnswers: { sleep: index ? 'Before 23:00' : 'After 01:00' } })),
    beds,
  })

  assert.deepEqual(firstRun, secondRun)
  assert.equal(firstRun.successfulMatches[0].applicantId, 's1')
})
