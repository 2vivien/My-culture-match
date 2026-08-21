import type { UserProfile, CompatibilityResult } from './types'
import {
  WEIGHTS,
  CULTURAL_REGIONS,
  AGE_RANGE_IDEAL,
  AGE_RANGE_MAX,
  LOCATION_SAME_COUNTRY,
  LOCATION_SAME_REGION,
  LOCATION_DIFFERENT,
} from './weights'

function overlapRatio(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0
  const setB = new Set(b.map((s) => s.toLowerCase().trim()))
  const matches = a.filter((item) => setB.has(item.toLowerCase().trim()))
  return matches.length / Math.max(a.length, b.length)
}

function findCommonItems(a: string[], b: string[]): string[] {
  const setB = new Set(b.map((s) => s.toLowerCase().trim()))
  return a.filter((item) => setB.has(item.toLowerCase().trim()))
}

function calculateTribeScore(user: UserProfile, target: UserProfile): { score: number; common: string[] } {
  const allUserTribes = [...user.tribes, ...user.interests]
  const allTargetTribes = [...target.tribes, ...target.interests]
  const common = findCommonItems(allUserTribes, allTargetTribes)
  const score = Math.round(overlapRatio(allUserTribes, allTargetTribes) * 100)
  return { score, common }
}

function calculateInterestScore(user: UserProfile, target: UserProfile): { score: number; common: string[] } {
  const common = findCommonItems(user.interests, target.interests)
  const score = Math.round(overlapRatio(user.interests, target.interests) * 100)
  return { score, common }
}

function calculateLocationScore(user: UserProfile, target: UserProfile): { score: number; region: string | null } {
  const userCountry = user.country.toLowerCase().trim()
  const targetCountry = target.country.toLowerCase().trim()

  if (userCountry === targetCountry) {
    return { score: LOCATION_SAME_COUNTRY, region: user.country }
  }

  for (const countries of Object.values(CULTURAL_REGIONS)) {
    const userIn = countries.some((c) => userCountry.includes(c.toLowerCase()))
    const targetIn = countries.some((c) => targetCountry.includes(c.toLowerCase()))
    if (userIn && targetIn) {
      return { score: LOCATION_SAME_REGION, region: countries[0] }
    }
  }

  return { score: LOCATION_DIFFERENT, region: null }
}

function calculateAgeScore(user: UserProfile, target: UserProfile): { score: number; diff: number } {
  const diff = Math.abs(user.age - target.age)
  if (diff <= AGE_RANGE_IDEAL) return { score: 100, diff }
  if (diff <= AGE_RANGE_MAX) {
    const score = Math.round(100 - ((diff - AGE_RANGE_IDEAL) / (AGE_RANGE_MAX - AGE_RANGE_IDEAL)) * 50)
    return { score, diff }
  }
  return { score: Math.max(20, 100 - diff * 3), diff }
}

function calculateLanguageScore(user: UserProfile, target: UserProfile): { score: number; common: string[] } {
  const common = findCommonItems(user.languages, target.languages)
  if (common.length > 0) {
    return { score: Math.min(100, 50 + common.length * 25), common }
  }
  return { score: 30, common: [] }
}

export function calculateCompatibility(
  user: UserProfile,
  target: UserProfile
): CompatibilityResult {
  const tribeResult = calculateTribeScore(user, target)
  const interestResult = calculateInterestScore(user, target)
  const locationResult = calculateLocationScore(user, target)
  const ageResult = calculateAgeScore(user, target)
  const languageResult = calculateLanguageScore(user, target)

  const breakdown = {
    tribes: { score: tribeResult.score, weight: WEIGHTS.tribes },
    interests: { score: interestResult.score, weight: WEIGHTS.interests },
    location: { score: locationResult.score, weight: WEIGHTS.location },
    age: { score: ageResult.score, weight: WEIGHTS.age },
    languages: { score: languageResult.score, weight: WEIGHTS.languages },
  }

  const overall = Math.round(
    (breakdown.tribes.score * breakdown.tribes.weight +
      breakdown.interests.score * breakdown.interests.weight +
      breakdown.location.score * breakdown.location.weight +
      breakdown.age.score * breakdown.age.weight +
      breakdown.languages.score * breakdown.languages.weight)
  )

  return {
    overall,
    breakdown,
    details: {
      commonTribes: tribeResult.common,
      commonInterests: interestResult.common,
      commonLanguages: languageResult.common,
      ageDifference: ageResult.diff,
      regionBonus: locationResult.region,
    },
  }
}

interface RawMatch {
  id: string
  name: string
  age: number
  gender: string
  country: string
  flag: string
  avatar: string
  online: boolean
  interest: string
  about: string
  tribes?: string[]
  languages?: string[]
}

export function enrichLoveMatches(
  user: UserProfile,
  matches: RawMatch[]
): (CompatibilityResult & RawMatch)[] {
  return matches.map((m) => {
    const targetProfile: UserProfile = {
      id: m.id,
      name: m.name,
      age: m.age,
      gender: m.gender,
      country: m.country,
      location: m.country,
      tribes: m.tribes || [m.interest.split(' • ')[0] || m.interest],
      interests: [m.interest, ...m.about.split(' ').filter((w) => w.length > 5)],
      languages: m.languages || ['English'],
    }

    const compat = calculateCompatibility(user, targetProfile)
    return { ...compat, ...m }
  })
}
