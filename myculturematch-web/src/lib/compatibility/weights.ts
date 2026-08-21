export const WEIGHTS = {
  tribes: 0.35,
  interests: 0.25,
  location: 0.20,
  age: 0.10,
  languages: 0.10,
} as const

export const CULTURAL_REGIONS: Record<string, string[]> = {
  'West Africa': ['Benin', 'Nigeria', 'Ghana', 'Senegal', 'Mali', 'Ivory Coast', 'Togo'],
  'East Africa': ['Kenya', 'Tanzania', 'Ethiopia', 'Uganda', 'Rwanda'],
  'North Africa': ['Morocco', 'Algeria', 'Tunisia', 'Egypt', 'Libya'],
  'Southern Africa': ['South Africa', 'Namibia', 'Zimbabwe', 'Botswana'],
  'Western Europe': ['France', 'UK', 'Germany', 'Spain', 'Portugal', 'Italy'],
  'Northern Europe': ['Norway', 'Sweden', 'Denmark', 'Finland', 'Iceland'],
  'East Asia': ['Japan', 'China', 'South Korea', 'Taiwan'],
  'South America': ['Peru', 'Brazil', 'Colombia', 'Argentina', 'Chile'],
  'Oceania': ['New Zealand', 'Australia', 'Fiji'],
  'North America': ['USA', 'Canada', 'Mexico'],
}

export function getCulturalRegion(country: string): string | null {
  for (const [region, countries] of Object.entries(CULTURAL_REGIONS)) {
    if (countries.some((c) => country.toLowerCase().includes(c.toLowerCase()))) {
      return region
    }
  }
  return null
}

export const AGE_RANGE_IDEAL = 5
export const AGE_RANGE_MAX = 15
export const LOCATION_SAME_COUNTRY = 100
export const LOCATION_SAME_REGION = 70
export const LOCATION_DIFFERENT = 30
