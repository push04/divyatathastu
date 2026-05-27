export interface CityCoords {
  name: string
  lat: number
  lng: number
}

export const CITIES: CityCoords[] = [
  { name: 'New Delhi',  lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai',     lat: 19.0760, lng: 72.8777 },
  { name: 'Varanasi',   lat: 25.3176, lng: 82.9739 },
  { name: 'Kolkata',    lat: 22.5726, lng: 88.3639 },
  { name: 'Chennai',    lat: 13.0827, lng: 80.2707 },
  { name: 'Bengaluru',  lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad',  lat: 17.3850, lng: 78.4867 },
  { name: 'Pune',       lat: 18.5204, lng: 73.8567 },
  { name: 'Ahmedabad',  lat: 23.0225, lng: 72.5714 },
  { name: 'Jaipur',     lat: 26.9124, lng: 75.7873 },
  { name: 'Lucknow',    lat: 26.8467, lng: 80.9462 },
  { name: 'Surat',      lat: 21.1702, lng: 72.8311 },
  { name: 'Nagpur',     lat: 21.1458, lng: 79.0882 },
  { name: 'Bhopal',     lat: 23.2599, lng: 77.4126 },
  { name: 'Indore',     lat: 22.7196, lng: 75.8577 },
  { name: 'Patna',      lat: 25.5941, lng: 85.1376 },
  { name: 'Amritsar',   lat: 31.6340, lng: 74.8723 },
  { name: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { name: 'Kochi',      lat: 9.9312,  lng: 76.2673 },
  { name: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
]

const DELHI: CityCoords = { name: 'New Delhi', lat: 28.6139, lng: 77.2090 }
export const STORAGE_KEY = 'dt_preferred_city'

export function getSavedCity(): CityCoords | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as CityCoords
  } catch {}
  return null
}

export function saveCity(city: CityCoords) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(city))
}

export function getUserLocation(): Promise<CityCoords> {
  const saved = getSavedCity()
  if (saved) return Promise.resolve(saved)

  return new Promise(resolve => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(DELHI)
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ name: 'My Location', lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(DELHI),
      { timeout: 5000, maximumAge: 600000 }
    )
  })
}
