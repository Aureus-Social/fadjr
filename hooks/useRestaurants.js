import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Restaurants près de moi
export function useNearbyRestaurants({ latitude, longitude, radius = 10, limit = 20 }) {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!latitude || !longitude) return
    fetchNearby()
  }, [latitude, longitude])

  async function fetchNearby() {
    setLoading(true)
    try {
      // Bounding box simple (sans PostGIS)
      const latDelta = radius / 111
      const lngDelta = radius / (111 * Math.cos(latitude * Math.PI / 180))

      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          id, name, slug, address, cuisine_type,
          latitude, longitude, rating, review_count,
          halal_status, cover_image_url, logo_url,
          plan, is_featured, opening_hours,
          cities(name), countries(code, flag_emoji)
        `)
        .eq('status', 'active')
        .gte('latitude', latitude - latDelta)
        .lte('latitude', latitude + latDelta)
        .gte('longitude', longitude - lngDelta)
        .lte('longitude', longitude + lngDelta)
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false })
        .limit(limit)

      if (error) throw error

      // Calcul distance + tri
      const withDistance = (data || []).map(r => ({
        ...r,
        distance: getDistance(latitude, longitude, r.latitude, r.longitude)
      })).sort((a, b) => a.distance - b.distance)

      setRestaurants(withDistance)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return { restaurants, loading, error, refetch: fetchNearby }
}

// Restaurants par ville
export function useRestaurantsByCity({ citySlug, cuisine, limit = 50 }) {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!citySlug) return
    fetchByCity()
  }, [citySlug, cuisine])

  async function fetchByCity() {
    setLoading(true)
    try {
      let query = supabase
        .from('restaurants')
        .select(`
          id, name, slug, address, cuisine_type,
          latitude, longitude, rating, review_count,
          halal_status, cover_image_url, plan, is_featured,
          cities!inner(name, slug), countries(code, flag_emoji)
        `)
        .eq('status', 'active')
        .eq('cities.slug', citySlug)
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false })
        .limit(limit)

      if (cuisine) {
        query = query.contains('cuisine_type', [cuisine])
      }

      const { data, error } = await query
      if (error) throw error
      setRestaurants(data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return { restaurants, loading, error, refetch: fetchByCity }
}

// Détail d'un restaurant
export function useRestaurant(slug) {
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    supabase
      .from('restaurants')
      .select(`
        *,
        cities(name, slug),
        countries(name_fr, code, flag_emoji),
        reviews(id, rating, title, comment, created_at,
          profiles(username, avatar_url))
      `)
      .eq('slug', slug)
      .eq('status', 'active')
      .single()
      .then(({ data }) => {
        setRestaurant(data)
        setLoading(false)
        // Incrémenter view_count
        if (data) {
          supabase
            .from('restaurants')
            .update({ view_count: (data.view_count || 0) + 1 })
            .eq('id', data.id)
        }
      })
  }, [slug])

  return { restaurant, loading }
}

// Recherche globale
export async function searchRestaurants({ query, countryCode, citySlug, cuisine, halal }) {
  let q = supabase
    .from('restaurants')
    .select(`
      id, name, slug, address, cuisine_type,
      rating, halal_status, cover_image_url, plan,
      cities(name, slug), countries(code, flag_emoji)
    `)
    .eq('status', 'active')
    .ilike('name', `%${query}%`)
    .limit(30)

  if (countryCode) q = q.eq('countries.code', countryCode)
  if (citySlug) q = q.eq('cities.slug', citySlug)
  if (cuisine) q = q.contains('cuisine_type', [cuisine])
  if (halal) q = q.eq('halal_status', 'certified')

  const { data, error } = await q
  return { data, error }
}

// Calcul distance (km)
function getDistance(lat1, lng1, lat2, lng2) {
  if (!lat2 || !lng2) return 9999
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}
