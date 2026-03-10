/**
 * FADJR — Scraper restaurants halal
 * Utilise Google Places API pour remplir la DB automatiquement
 * 
 * Usage: node scraper.js --city "Bruxelles" --country "BE"
 * 
 * Prérequis:
 *   npm install @supabase/supabase-js node-fetch dotenv
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY

// ============================================================
// VILLES À SCRAPER — Ajoute autant de villes que tu veux
// ============================================================
export const CITIES_TO_SCRAPE = [
  // BELGIQUE
  { city: 'Brussels', country: 'BE', lat: 50.8503, lng: 4.3517 },
  { city: 'Antwerp', country: 'BE', lat: 51.2194, lng: 4.4025 },
  { city: 'Ghent', country: 'BE', lat: 51.0543, lng: 3.7174 },
  { city: 'Liège', country: 'BE', lat: 50.6292, lng: 5.5797 },
  { city: 'Charleroi', country: 'BE', lat: 50.4108, lng: 4.4446 },

  // FRANCE
  { city: 'Paris', country: 'FR', lat: 48.8566, lng: 2.3522 },
  { city: 'Lyon', country: 'FR', lat: 45.7640, lng: 4.8357 },
  { city: 'Marseille', country: 'FR', lat: 43.2965, lng: 5.3698 },
  { city: 'Toulouse', country: 'FR', lat: 43.6047, lng: 1.4442 },
  { city: 'Nice', country: 'FR', lat: 43.7102, lng: 7.2620 },
  { city: 'Strasbourg', country: 'FR', lat: 48.5734, lng: 7.7521 },
  { city: 'Bordeaux', country: 'FR', lat: 44.8378, lng: -0.5792 },
  { city: 'Lille', country: 'FR', lat: 50.6292, lng: 3.0573 },

  // MAROC
  { city: 'Casablanca', country: 'MA', lat: 33.5731, lng: -7.5898 },
  { city: 'Rabat', country: 'MA', lat: 34.0209, lng: -6.8416 },
  { city: 'Marrakech', country: 'MA', lat: 31.6295, lng: -7.9811 },
  { city: 'Fès', country: 'MA', lat: 34.0181, lng: -5.0078 },

  // ROYAUME-UNI
  { city: 'London', country: 'GB', lat: 51.5074, lng: -0.1278 },
  { city: 'Birmingham', country: 'GB', lat: 52.4862, lng: -1.8904 },
  { city: 'Manchester', country: 'GB', lat: 53.4808, lng: -2.2426 },

  // ALLEMAGNE
  { city: 'Berlin', country: 'DE', lat: 52.5200, lng: 13.4050 },
  { city: 'Hamburg', country: 'DE', lat: 53.5511, lng: 9.9937 },
  { city: 'Cologne', country: 'DE', lat: 50.9333, lng: 6.9500 },

  // PAYS-BAS
  { city: 'Amsterdam', country: 'NL', lat: 52.3676, lng: 4.9041 },
  { city: 'Rotterdam', country: 'NL', lat: 51.9244, lng: 4.4777 },
  { city: 'The Hague', country: 'NL', lat: 52.0705, lng: 4.3007 },

  // ÉTATS-UNIS
  { city: 'New York', country: 'US', lat: 40.7128, lng: -74.0060 },
  { city: 'Los Angeles', country: 'US', lat: 34.0522, lng: -118.2437 },
  { city: 'Chicago', country: 'US', lat: 41.8781, lng: -87.6298 },
  { city: 'Dearborn', country: 'US', lat: 42.3223, lng: -83.1763 }, // grande communauté

  // CANADA
  { city: 'Toronto', country: 'CA', lat: 43.6532, lng: -79.3832 },
  { city: 'Montreal', country: 'CA', lat: 45.5017, lng: -73.5673 },

  // ÉMIRATS
  { city: 'Dubai', country: 'AE', lat: 25.2048, lng: 55.2708 },
  { city: 'Abu Dhabi', country: 'AE', lat: 24.4539, lng: 54.3773 },

  // AUSTRALIE
  { city: 'Sydney', country: 'AU', lat: -33.8688, lng: 151.2093 },
  { city: 'Melbourne', country: 'AU', lat: -37.8136, lng: 144.9631 },
]

// ============================================================
// SCRAPER PRINCIPAL
// ============================================================

async function searchHalalRestaurants(lat, lng, cityName, radius = 5000) {
  const queries = [
    'halal restaurant',
    'restaurant halal',
    'مطعم حلال',
    'helal restaurant',
  ]

  const results = []
  const seenPlaceIds = new Set()

  for (const query of queries) {
    let nextPageToken = null

    do {
      const url = nextPageToken
        ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${nextPageToken}&key=${GOOGLE_API_KEY}`
        : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + ' ' + cityName)}&location=${lat},${lng}&radius=${radius}&type=restaurant&key=${GOOGLE_API_KEY}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.results) {
        for (const place of data.results) {
          if (!seenPlaceIds.has(place.place_id)) {
            seenPlaceIds.add(place.place_id)
            results.push(place)
          }
        }
      }

      nextPageToken = data.next_page_token
      if (nextPageToken) await sleep(2000) // Google demande 2s entre pages

    } while (nextPageToken)

    await sleep(500)
  }

  return results
}

async function getPlaceDetails(placeId) {
  const fields = 'name,formatted_address,formatted_phone_number,website,opening_hours,photos,rating,user_ratings_total,geometry,url'
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}`

  const response = await fetch(url)
  const data = await response.json()
  return data.result
}

function formatOpeningHours(googleHours) {
  if (!googleHours?.periods) return null

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const result = {}

  for (const day of days) {
    result[day] = { open: '12:00', close: '22:00', closed: false }
  }

  for (const period of googleHours.periods) {
    const dayName = days[period.open?.day]
    if (dayName) {
      const openTime = period.open?.time
      const closeTime = period.close?.time
      if (openTime && closeTime) {
        result[dayName] = {
          open: `${openTime.slice(0, 2)}:${openTime.slice(2)}`,
          close: `${closeTime.slice(0, 2)}:${closeTime.slice(2)}`,
          closed: false
        }
      }
    }
  }

  return result
}

async function scrapeCity(cityConfig) {
  const { city, country, lat, lng } = cityConfig
  console.log(`\n🔍 Scraping ${city} (${country})...`)

  // Récupérer les IDs country et city depuis Supabase
  const { data: countryData } = await supabase
    .from('countries')
    .select('id')
    .eq('code', country)
    .single()

  if (!countryData) {
    console.log(`❌ Pays ${country} non trouvé dans la DB`)
    return
  }

  // Créer la ville si elle n'existe pas
  const citySlug = city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const { data: cityData } = await supabase
    .from('cities')
    .upsert({
      country_id: countryData.id,
      name: city,
      slug: citySlug,
      latitude: lat,
      longitude: lng
    }, { onConflict: 'country_id,slug' })
    .select('id')
    .single()

  const places = await searchHalalRestaurants(lat, lng, city)
  console.log(`  📍 ${places.length} restaurants trouvés`)

  let inserted = 0
  let skipped = 0

  for (const place of places) {
    // Vérifier si déjà en DB
    const { data: existing } = await supabase
      .from('restaurants')
      .select('id')
      .eq('google_place_id', place.place_id)
      .single()

    if (existing) {
      skipped++
      continue
    }

    // Détails complets
    const details = await getPlaceDetails(place.place_id)
    await sleep(200)

    const restaurant = {
      country_id: countryData.id,
      city_id: cityData?.id,
      name: place.name,
      slug: place.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + place.place_id.slice(-6),
      address: place.formatted_address,
      latitude: place.geometry?.location?.lat,
      longitude: place.geometry?.location?.lng,
      phone: details?.formatted_phone_number,
      website: details?.website,
      rating: place.rating || 0,
      review_count: place.user_ratings_total || 0,
      opening_hours: formatOpeningHours(details?.opening_hours),
      google_place_id: place.place_id,
      google_maps_url: details?.url,
      halal_status: 'unverified',
      source: 'scraper',
      status: 'active',
      plan: 'free',
    }

    const { error } = await supabase
      .from('restaurants')
      .insert(restaurant)

    if (error) {
      console.log(`  ⚠️  Erreur insertion ${place.name}: ${error.message}`)
    } else {
      inserted++
    }
  }

  console.log(`  ✅ ${inserted} insérés, ${skipped} déjà en DB`)
  return { inserted, skipped, total: places.length }
}

// ============================================================
// LANCEMENT
// ============================================================

async function main() {
  const args = process.argv.slice(2)
  const cityArg = args.find(a => a.startsWith('--city='))?.split('=')[1]
  const countryArg = args.find(a => a.startsWith('--country='))?.split('=')[1]
  const allFlag = args.includes('--all')

  let citiesToProcess = CITIES_TO_SCRAPE

  if (cityArg) {
    citiesToProcess = CITIES_TO_SCRAPE.filter(c =>
      c.city.toLowerCase().includes(cityArg.toLowerCase())
    )
  } else if (countryArg) {
    citiesToProcess = CITIES_TO_SCRAPE.filter(c => c.country === countryArg)
  } else if (!allFlag) {
    // Par défaut : Bruxelles seulement pour test
    citiesToProcess = CITIES_TO_SCRAPE.slice(0, 1)
    console.log('💡 Mode test : Bruxelles seulement. Utilise --all pour toutes les villes.')
  }

  console.log(`\n🚀 FADJR Scraper — ${citiesToProcess.length} ville(s) à traiter`)

  let totalInserted = 0
  let totalSkipped = 0

  for (const city of citiesToProcess) {
    const result = await scrapeCity(city)
    if (result) {
      totalInserted += result.inserted
      totalSkipped += result.skipped
    }
    await sleep(1000)
  }

  console.log(`\n✅ TERMINÉ — ${totalInserted} restaurants insérés, ${totalSkipped} ignorés`)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

main().catch(console.error)
