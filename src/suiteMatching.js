import { lifestyleQuestions } from './data.js'

const NEUTRAL_ANSWER = 'No strong preference'

function scoreAnswerPair(question, leftAnswer, rightAnswer) {
  if (!leftAnswer || !rightAnswer) return null
  if (leftAnswer === rightAnswer) return 100
  if (leftAnswer === NEUTRAL_ANSWER || rightAnswer === NEUTRAL_ANSWER) return 85

  const leftIndex = question.options.indexOf(leftAnswer)
  const rightIndex = question.options.indexOf(rightAnswer)
  if (leftIndex < 0 || rightIndex < 0) return null

  const maximumDistance = Math.max(1, question.options.length - 1)
  const normalizedDistance = Math.abs(leftIndex - rightIndex) / maximumDistance
  return Math.round(100 - normalizedDistance * 70)
}

/**
 * Compares two complete, structured lifestyle profiles.
 * Every answered question has equal weight. The result is only intended for
 * post-allocation suite placement and must never be used to decide bed access.
 */
export function calculateLifestyleCompatibility(leftAnswers = {}, rightAnswers = {}) {
  const dimensions = lifestyleQuestions.flatMap((question) => {
    const score = scoreAnswerPair(question, leftAnswers[question.id], rightAnswers[question.id])
    return score === null ? [] : [{ questionId: question.id, score }]
  })
  const score = dimensions.length === 0
    ? 0
    : Math.round(dimensions.reduce((total, dimension) => total + dimension.score, 0) / dimensions.length)

  return { score, comparedQuestionCount: dimensions.length, dimensions }
}

function summarizeGroup(residents) {
  const comparisons = []
  for (let leftIndex = 0; leftIndex < residents.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < residents.length; rightIndex += 1) {
      comparisons.push(calculateLifestyleCompatibility(
        residents[leftIndex].answers,
        residents[rightIndex].answers,
      ))
    }
  }

  const compatibilityScore = comparisons.length === 0
    ? 0
    : Math.round(comparisons.reduce((total, comparison) => total + comparison.score, 0) / comparisons.length)
  const strongestDimensionIds = lifestyleQuestions
    .map((question, questionIndex) => {
      const scores = comparisons.flatMap((comparison) => {
        const dimension = comparison.dimensions.find((item) => item.questionId === question.id)
        return dimension ? [dimension.score] : []
      })
      return {
        questionId: question.id,
        questionIndex,
        score: scores.length === 0 ? 0 : scores.reduce((sum, value) => sum + value, 0) / scores.length,
      }
    })
    .sort((left, right) => right.score - left.score || left.questionIndex - right.questionIndex)
    .slice(0, 2)
    .map((dimension) => dimension.questionId)

  return { compatibilityScore, strongestDimensionIds }
}

/**
 * Groups students who have already received beds. Each student is used once.
 * The next resident is chosen by their average compatibility with everyone
 * already in that suite, so the result is consistent for the whole group.
 */
export function createSuiteGroups(residents = [], suiteSize = 8) {
  const remaining = [...new Map(residents.map((resident) => [resident.id, { ...resident }])).values()]
  const groups = []

  while (remaining.length > 0) {
    const groupResidents = [remaining.shift()]
    while (groupResidents.length < Math.max(1, suiteSize) && remaining.length > 0) {
      let bestIndex = 0
      let bestScore = -1

      remaining.forEach((candidate, candidateIndex) => {
        const score = groupResidents.reduce(
          (total, resident) => total + calculateLifestyleCompatibility(resident.answers, candidate.answers).score,
          0,
        ) / groupResidents.length
        if (
          score > bestScore
          || (score === bestScore && String(candidate.id).localeCompare(String(remaining[bestIndex].id)) < 0)
        ) {
          bestIndex = candidateIndex
          bestScore = score
        }
      })

      groupResidents.push(remaining.splice(bestIndex, 1)[0])
    }

    groups.push({ residents: groupResidents, ...summarizeGroup(groupResidents) })
  }

  return groups
}

/** Returns the current student's placement from a complete, conflict-free grouping. */
export function createSuitePlacement(answers = {}, candidates = [], capacity = 7) {
  const currentStudentId = 'current-student'
  const groups = createSuiteGroups(
    [{ id: currentStudentId, answers }, ...candidates.filter((candidate) => candidate.id !== currentStudentId)],
    Math.max(1, capacity + 1),
  )
  const currentGroup = groups.find((group) => group.residents.some((resident) => resident.id === currentStudentId))
  const selectedCandidates = currentGroup?.residents.filter((resident) => resident.id !== currentStudentId) || []

  return {
    compatibilityScore: currentGroup?.compatibilityScore || 0,
    suiteMateCount: selectedCandidates.length,
    strongestDimensionIds: currentGroup?.strongestDimensionIds || [],
    selectedCandidateIds: selectedCandidates.map((candidate) => candidate.id),
  }
}
