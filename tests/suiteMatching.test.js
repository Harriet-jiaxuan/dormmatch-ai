import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateLifestyleCompatibility, createSuiteGroups, createSuitePlacement } from '../src/suiteMatching.js'

const quietProfile = {
  sleep: '23:00-00:00',
  wake: '07:00-09:00',
  cleanliness: 'Tidy at all times',
  noise: 'As quiet as possible',
  guests: 'Prefer very little',
  temperature: 'Cooler',
}

test('suite matching scores identical profiles at 100', () => {
  const result = calculateLifestyleCompatibility(quietProfile, quietProfile)

  assert.equal(result.score, 100)
  assert.equal(result.comparedQuestionCount, 6)
  assert.ok(result.dimensions.every((dimension) => dimension.score === 100))
})

test('suite matching gives different answers a lower score', () => {
  const oppositeProfile = {
    sleep: 'After 01:00',
    wake: '10:00-11:00',
    cleanliness: 'Clean when needed',
    noise: 'A lively environment is fine',
    guests: 'Often is fine within residence rules',
    temperature: 'Warmer',
  }

  assert.ok(calculateLifestyleCompatibility(quietProfile, oppositeProfile).score < 50)
})

test('a neutral temperature answer remains broadly compatible', () => {
  const neutralProfile = { ...quietProfile, temperature: 'No strong preference' }
  const temperature = calculateLifestyleCompatibility(quietProfile, neutralProfile)
    .dimensions.find((dimension) => dimension.questionId === 'temperature')

  assert.equal(temperature.score, 85)
})

test('suite placement selects the seven most compatible residents', () => {
  const candidates = Array.from({ length: 9 }, (_, index) => ({
    id: `resident-${index + 1}`,
    answers: index < 7 ? quietProfile : { ...quietProfile, sleep: 'After 01:00', noise: 'A lively environment is fine' },
  }))
  const placement = createSuitePlacement(quietProfile, candidates, 7)

  assert.deepEqual(placement.selectedCandidateIds, candidates.slice(0, 7).map((candidate) => candidate.id))
  assert.equal(placement.suiteMateCount, 7)
  assert.equal(placement.compatibilityScore, 100)
})

test('suite placement is deterministic and does not mutate its inputs', () => {
  const candidates = [
    { id: 'b', answers: quietProfile },
    { id: 'a', answers: quietProfile },
  ]
  const original = structuredClone(candidates)
  const first = createSuitePlacement(quietProfile, candidates, 1)
  const second = createSuitePlacement(quietProfile, candidates, 1)

  assert.deepEqual(first, second)
  assert.deepEqual(first.selectedCandidateIds, ['a'])
  assert.deepEqual(candidates, original)
})

test('complete suite grouping uses every resident exactly once and respects capacity', () => {
  const residents = Array.from({ length: 17 }, (_, index) => ({
    id: `resident-${index + 1}`,
    answers: index % 2 ? quietProfile : { ...quietProfile, sleep: 'After 01:00' },
  }))
  const groups = createSuiteGroups(residents, 8)
  const groupedIds = groups.flatMap((group) => group.residents.map((resident) => resident.id))

  assert.equal(groups.length, 3)
  assert.ok(groups.every((group) => group.residents.length <= 8))
  assert.equal(new Set(groupedIds).size, residents.length)
  assert.deepEqual(new Set(groupedIds), new Set(residents.map((resident) => resident.id)))
})

test('missing answers never create a false high compatibility score', () => {
  const result = calculateLifestyleCompatibility({}, quietProfile)

  assert.equal(result.score, 0)
  assert.equal(result.comparedQuestionCount, 0)
})
