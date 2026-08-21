export interface UserProfile {
  id: string
  name: string
  age: number
  gender: string
  country: string
  location: string
  tribes: string[]
  interests: string[]
  languages: string[]
}

export interface CompatibilityResult {
  overall: number
  breakdown: {
    tribes: { score: number; weight: number }
    interests: { score: number; weight: number }
    location: { score: number; weight: number }
    age: { score: number; weight: number }
    languages: { score: number; weight: number }
  }
  details: {
    commonTribes: string[]
    commonInterests: string[]
    commonLanguages: string[]
    ageDifference: number
    regionBonus: string | null
  }
}
