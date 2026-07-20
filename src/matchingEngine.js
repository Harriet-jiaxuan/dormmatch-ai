export const MATCH_OUTCOME = {
  SUCCESS: 'success',
  FAILED: 'failed',
}

export const MATCH_REASON = {
  FIRST_PREFERENCE_AVAILABLE: 'first_preference_available',
  HIGHEST_AVAILABLE_PREFERENCE: 'highest_available_preference',
  NO_ACCEPTED_OPTIONS: 'no_accepted_options',
  NO_ACCEPTED_BED_AVAILABLE: 'no_accepted_bed_available',
}

function normalizePriority(value) {
  const priority = Number.parseInt(String(value), 10)
  return Number.isFinite(priority) ? priority : Number.MAX_SAFE_INTEGER
}

function canUseBed(applicant, bed) {
  if (!bed.partition || !applicant.partition) return true
  return bed.partition === applicant.partition
}

function getOrderedAcceptedRoomIds(applicant) {
  const acceptedRoomIds = new Set(applicant.acceptedRoomIds || [])
  const preferenceOrder = applicant.preferenceOrder || []
  return [
    ...preferenceOrder.filter((roomId) => acceptedRoomIds.has(roomId)),
    ...[...acceptedRoomIds].filter((roomId) => !preferenceOrder.includes(roomId)),
  ]
}

/**
 * Runs a deterministic lottery-priority allocation.
 *
 * Applicants are processed by lottery priority. The engine may move an earlier
 * applicant to another accepted room when that creates an additional valid
 * match, so it fills as many beds as possible without violating preferences or
 * housing partitions.
 * The function is intentionally independent from React and does not mutate
 * its inputs so it can be reused by simulations and automated tests.
 */
export function runAllocation({ applicants = [], beds = [] }) {
  const bedList = [...new Map(beds.map((bed) => [bed.id, { ...bed }])).values()]
    .sort((left, right) => String(left.id).localeCompare(String(right.id)))
  const orderedApplicants = [...applicants].sort((left, right) => {
    const priorityDifference = normalizePriority(left.lotteryNumber) - normalizePriority(right.lotteryNumber)
    if (priorityDifference !== 0) return priorityDifference
    return String(left.id).localeCompare(String(right.id))
  })
  const applicantsById = new Map(orderedApplicants.map((applicant) => [applicant.id, applicant]))
  const preferencesByApplicantId = new Map(
    orderedApplicants.map((applicant) => [applicant.id, getOrderedAcceptedRoomIds(applicant)]),
  )
  const bedsByRoomId = new Map()

  bedList.forEach((bed) => {
    const roomBeds = bedsByRoomId.get(bed.roomId) || []
    roomBeds.push(bed)
    bedsByRoomId.set(bed.roomId, roomBeds)
  })

  const applicantByBedId = new Map()
  const bedByApplicantId = new Map()

  const tryAssign = (applicantId, visitedApplicantIds, visitedBedIds) => {
    if (visitedApplicantIds.has(applicantId)) return false
    visitedApplicantIds.add(applicantId)

    const applicant = applicantsById.get(applicantId)
    const roomIds = preferencesByApplicantId.get(applicantId) || []

    for (const roomId of roomIds) {
      const roomBeds = bedsByRoomId.get(roomId) || []

      for (const bed of roomBeds) {
        if (visitedBedIds.has(bed.id) || !canUseBed(applicant, bed)) continue
        visitedBedIds.add(bed.id)

        const currentApplicantId = applicantByBedId.get(bed.id)
        if (
          !currentApplicantId
          || tryAssign(currentApplicantId, visitedApplicantIds, visitedBedIds)
        ) {
          applicantByBedId.set(bed.id, applicantId)
          bedByApplicantId.set(applicantId, bed)
          return true
        }
      }
    }

    return false
  }

  orderedApplicants.forEach((applicant) => {
    if ((preferencesByApplicantId.get(applicant.id) || []).length === 0) return
    tryAssign(applicant.id, new Set(), new Set())
  })

  const results = orderedApplicants.map((applicant) => {
    const orderedAcceptedRoomIds = preferencesByApplicantId.get(applicant.id) || []

    if (orderedAcceptedRoomIds.length === 0) {
      return {
        applicantId: applicant.id,
        outcome: MATCH_OUTCOME.FAILED,
        lotteryNumber: String(applicant.lotteryNumber),
        allocatedRoomId: null,
        allocatedPreferenceRank: null,
        unavailablePreferenceIds: [],
        suiteId: null,
        bedId: null,
        amountCharged: 0,
        authorizationStatus: 'released',
        reasonCode: MATCH_REASON.NO_ACCEPTED_OPTIONS,
      }
    }

    const allocatedBed = bedByApplicantId.get(applicant.id)
    const allocatedPreferenceRank = allocatedBed
      ? orderedAcceptedRoomIds.indexOf(allocatedBed.roomId) + 1
      : null

    if (!allocatedBed) {
      return {
        applicantId: applicant.id,
        outcome: MATCH_OUTCOME.FAILED,
        lotteryNumber: String(applicant.lotteryNumber),
        allocatedRoomId: null,
        allocatedPreferenceRank: null,
        unavailablePreferenceIds: orderedAcceptedRoomIds,
        suiteId: null,
        bedId: null,
        amountCharged: 0,
        authorizationStatus: 'released',
        reasonCode: MATCH_REASON.NO_ACCEPTED_BED_AVAILABLE,
      }
    }

    return {
      applicantId: applicant.id,
      outcome: MATCH_OUTCOME.SUCCESS,
      lotteryNumber: String(applicant.lotteryNumber),
      allocatedRoomId: allocatedBed.roomId,
      allocatedPreferenceRank,
      unavailablePreferenceIds: orderedAcceptedRoomIds.slice(0, allocatedPreferenceRank - 1),
      suiteId: allocatedBed.suiteId,
      bedId: allocatedBed.id,
      amountCharged: allocatedBed.price,
      authorizationStatus: 'captured',
      reasonCode: allocatedPreferenceRank === 1
        ? MATCH_REASON.FIRST_PREFERENCE_AVAILABLE
        : MATCH_REASON.HIGHEST_AVAILABLE_PREFERENCE,
    }
  })

  return {
    results,
    successfulMatches: results.filter((result) => result.outcome === MATCH_OUTCOME.SUCCESS),
    failedMatches: results.filter((result) => result.outcome === MATCH_OUTCOME.FAILED),
    remainingBeds: bedList.filter((bed) => !applicantByBedId.has(bed.id)),
  }
}
