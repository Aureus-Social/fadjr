import { useState, useEffect } from 'react'
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator, RefreshControl,
  StatusBar, Platform
} from 'react-native'
import * as Location from 'expo-location'
import { supabase } from './lib/supabase'
import { useNearbyRestaurants } from './hooks/useRestaurants'

const COLORS = {
  night: '#0d0d1a',
  deep: '#12122a',
  card: '#1e1e3a',
  border: '#2a2a4a',
  gold: '#c9a84c',
  goldLight: '#e8c96a',
  goldDim: '#7a6030',
  ivory: '#f5f0e8',
  white: '#ffffff',
  muted: '#8888aa',
  green: '#2d6a4f',
}

const PRAYERS = [
  { name: 'Fajr', time: '05:42', next: false },
  { name: 'Dhuhr', time: '13:15', next: false },
  { name: 'Asr', time: '16:30', next: false },
  { name: 'Maghrib', time: '19:02', next: true },
  { name: 'Isha', time: '20:45', next: false },
]

const TABS = ['Accueil', 'Restos', 'Coran', 'Communauté', 'Profil']
const TAB_ICONS = ['🏠', '🍽️', '📖', '👥', '👤']

export default function App() {
  const [activeTab, setActiveTab] = useState(0)
  const [location, setLocation] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCuisine, setSelectedCuisine] = useState(null)

  useEffect(() => {
    getLocation()
  }, [])

  async function getLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({})
      setLocation(loc.coords)
    }
  }

  const nextPrayer = PRAYERS.find(p => p.next)

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.night} />

      {/* CONTENT */}
      <View style={styles.content}>
        {activeTab === 0 && <HomeScreen location={location} nextPrayer={nextPrayer} />}
        {activeTab === 1 && <RestosScreen location={location} />}
        {activeTab === 2 && <CoranScreen />}
        {activeTab === 3 && <CommunauteScreen />}
        {activeTab === 4 && <ProfilScreen />}
      </View>

      {/* NAV BAR */}
      <View style={styles.navBar}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={styles.navItem}
            onPress={() => setActiveTab(i)}
          >
            <Text style={styles.navIcon}>{TAB_ICONS[i]}</Text>
            <Text style={[styles.navLabel, activeTab === i && styles.navLabelActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

// ============================================================
// SCREEN: ACCUEIL
// ============================================================
function HomeScreen({ location, nextPrayer }) {
  const { restaurants, loading } = useNearbyRestaurants({
    latitude: location?.latitude || 50.8503,
    longitude: location?.longitude || 4.3517,
    radius: 5,
    limit: 5
  })

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.homeHeader}>
        <View>
          <Text style={styles.greeting}>Assalamu Alaikum 🌙</Text>
          <Text style={styles.headerTitle}>Bienvenue sur FADJR</Text>
        </View>
        <Text style={styles.bellIcon}>🔔</Text>
      </View>

      {/* Prayer Card */}
      <View style={styles.prayerCard}>
        <Text style={styles.mosqueIcon}>🕌</Text>
        <View>
          <Text style={styles.prayerTime}>{nextPrayer?.time || '18:42'}</Text>
          <Text style={styles.prayerName}>{nextPrayer?.name || 'Maghrib'}</Text>
          <Text style={styles.prayerNext}>Prochain : Isha dans 2h 15min</Text>
        </View>
      </View>

      {/* Quick Grid */}
      <View style={styles.quickGrid}>
        {[
          { icon: '📿', label: 'Coran' },
          { icon: '🧭', label: 'Qibla' },
          { icon: '🍽️', label: 'Restos' },
          { icon: '🛒', label: 'Shop' },
        ].map(item => (
          <TouchableOpacity key={item.label} style={styles.quickItem}>
            <Text style={styles.quickIcon}>{item.icon}</Text>
            <Text style={styles.quickLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Nearby Restaurants */}
      <Text style={styles.sectionTitle}>RESTOS PRÈS DE VOUS</Text>
      {loading ? (
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 20 }} />
      ) : restaurants.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucun restaurant trouvé près de vous</Text>
        </View>
      ) : (
        restaurants.map(resto => (
          <RestoCard key={resto.id} resto={resto} />
        ))
      )}
    </ScrollView>
  )
}

// ============================================================
// SCREEN: RESTAURANTS
// ============================================================
function RestosScreen({ location }) {
  const [cuisine, setCuisine] = useState(null)
  const CUISINES = ['Tous', 'Burger', 'Kebab', 'Libanais', 'Turc', 'Poulet', 'Pizza']

  const { restaurants, loading, refetch } = useNearbyRestaurants({
    latitude: location?.latitude || 50.8503,
    longitude: location?.longitude || 4.3517,
    radius: 10,
    limit: 30
  })

  return (
    <View style={styles.screen}>
      <View style={styles.screenPadding}>
        <Text style={styles.screenTitle}>Restaurants Halal</Text>

        {/* Search */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Chercher un restaurant...</Text>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
          {CUISINES.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, (c === 'Tous' && !cuisine || cuisine === c) && styles.chipActive]}
              onPress={() => setCuisine(c === 'Tous' ? null : c)}
            >
              <Text style={[styles.chipText, (c === 'Tous' && !cuisine || cuisine === c) && styles.chipTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <RestoCardBig resto={item} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={COLORS.gold} />}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Aucun restaurant trouvé</Text>
              <Text style={styles.emptySubtext}>Les données arrivent bientôt dans votre ville !</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

// ============================================================
// SCREEN: CORAN (placeholder)
// ============================================================
function CoranScreen() {
  return (
    <ScrollView style={[styles.screen, { backgroundColor: '#0d1a0d' }]}>
      <View style={styles.screenPadding}>
        <Text style={styles.screenTitle}>Saint Coran</Text>
        <View style={styles.bismillahCard}>
          <Text style={styles.bismillah}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</Text>
          <Text style={styles.bismillahTrans}>Au nom d'Allah, le Tout Miséricordieux</Text>
        </View>
        <Text style={styles.comingSoon}>Lecture et écoute du Coran — bientôt disponible</Text>
      </View>
    </ScrollView>
  )
}

// ============================================================
// SCREEN: COMMUNAUTÉ (placeholder)
// ============================================================
function CommunauteScreen() {
  return (
    <ScrollView style={styles.screen}>
      <View style={styles.screenPadding}>
        <Text style={styles.screenTitle}>Communauté</Text>
        <Text style={styles.comingSoon}>Événements et publications — bientôt disponible</Text>
      </View>
    </ScrollView>
  )
}

// ============================================================
// SCREEN: PROFIL (placeholder)
// ============================================================
function ProfilScreen() {
  return (
    <ScrollView style={styles.screen}>
      <View style={styles.screenPadding}>
        <Text style={styles.screenTitle}>Mon Profil</Text>
        <TouchableOpacity style={styles.loginBtn}>
          <Text style={styles.loginBtnText}>Se connecter / S'inscrire</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

// ============================================================
// COMPOSANTS
// ============================================================
function RestoCard({ resto }) {
  const halalColor = resto.halal_status === 'certified' ? COLORS.gold : COLORS.muted
  const dist = resto.distance ? `${resto.distance.toFixed(1)} km` : ''

  return (
    <View style={styles.restoCard}>
      <View style={styles.restoEmoji}>
        <Text style={{ fontSize: 20 }}>🍽️</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.restoName}>{resto.name}</Text>
        <View style={styles.restoTagRow}>
          <Text style={[styles.restoTag, { color: halalColor }]}>
            {resto.halal_status === 'certified' ? '✓ Certifié halal' : '◎ Halal non vérifié'}
          </Text>
        </View>
      </View>
      {dist ? <Text style={styles.restoDist}>{dist}</Text> : null}
    </View>
  )
}

function RestoCardBig({ resto }) {
  return (
    <View style={styles.restoCardBig}>
      <View style={styles.restoCardBigImg}>
        <Text style={{ fontSize: 36 }}>🍽️</Text>
        <View style={styles.certBadge}>
          <Text style={styles.certBadgeText}>HALAL ✓</Text>
        </View>
      </View>
      <View style={styles.restoCardBigInfo}>
        <Text style={styles.restoCardBigName}>{resto.name}</Text>
        <View style={styles.restoCardBigMeta}>
          <Text style={styles.metaText}>⭐ {resto.rating || '—'}</Text>
          {resto.distance && <Text style={styles.metaText}>📍 {resto.distance.toFixed(1)} km</Text>}
          <Text style={styles.metaText}>{resto.address?.slice(0, 30)}...</Text>
        </View>
      </View>
    </View>
  )
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.night },
  content: { flex: 1 },
  screen: { flex: 1, backgroundColor: COLORS.night },
  screenPadding: { padding: 20 },
  screenTitle: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 22, fontWeight: '700', color: COLORS.gold, marginBottom: 16, marginTop: 8 },

  // NAV
  navBar: { flexDirection: 'row', backgroundColor: COLORS.deep, borderTopWidth: 1, borderTopColor: COLORS.border, paddingBottom: 8, paddingTop: 8 },
  navItem: { flex: 1, alignItems: 'center', gap: 2 },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 9, color: COLORS.muted },
  navLabelActive: { color: COLORS.gold },

  // HOME
  homeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50 },
  greeting: { fontSize: 12, color: COLORS.muted },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.white },
  bellIcon: { fontSize: 22 },

  // PRAYER CARD
  prayerCard: { marginHorizontal: 20, marginBottom: 16, backgroundColor: '#1e1e3a', borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  mosqueIcon: { fontSize: 36, opacity: 0.7 },
  prayerTime: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 36, color: COLORS.gold, fontWeight: '700' },
  prayerName: { fontSize: 12, color: COLORS.muted, letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 },
  prayerNext: { fontSize: 11, color: COLORS.goldDim, marginTop: 6 },

  // QUICK GRID
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginBottom: 20 },
  quickItem: { width: '47%', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, alignItems: 'center' },
  quickIcon: { fontSize: 24, marginBottom: 4 },
  quickLabel: { fontSize: 11, color: COLORS.muted },

  // SECTION
  sectionTitle: { fontSize: 11, letterSpacing: 2, color: COLORS.goldDim, marginHorizontal: 20, marginBottom: 10 },

  // RESTO CARD (small)
  restoCard: { marginHorizontal: 20, backgroundColor: COLORS.card, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  restoEmoji: { width: 44, height: 44, borderRadius: 10, backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center' },
  restoName: { fontSize: 13, fontWeight: '600', color: COLORS.white },
  restoTagRow: { flexDirection: 'row', marginTop: 2 },
  restoTag: { fontSize: 10, backgroundColor: 'rgba(201,168,76,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  restoDist: { fontSize: 10, color: COLORS.muted },

  // RESTO CARD (big)
  restoCardBig: { backgroundColor: COLORS.card, borderRadius: 16, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  restoCardBigImg: { height: 100, backgroundColor: '#2d4a35', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  certBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.gold, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  certBadgeText: { fontSize: 9, fontWeight: '700', color: COLORS.night, letterSpacing: 1 },
  restoCardBigInfo: { padding: 12 },
  restoCardBigName: { fontSize: 14, fontWeight: '600', color: COLORS.white, marginBottom: 4 },
  restoCardBigMeta: { flexDirection: 'row', gap: 10 },
  metaText: { fontSize: 11, color: COLORS.muted },

  // SEARCH
  searchBar: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  searchIcon: { fontSize: 16 },
  searchPlaceholder: { fontSize: 13, color: COLORS.muted },

  // FILTERS
  filtersRow: { marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginRight: 6 },
  chipActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  chipText: { fontSize: 11, color: COLORS.muted },
  chipTextActive: { color: COLORS.night, fontWeight: '600' },

  // CORAN
  bismillahCard: { backgroundColor: '#1e2a1e', borderWidth: 1, borderColor: '#2a3a2a', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  bismillah: { fontSize: 22, color: COLORS.gold, marginBottom: 8, textAlign: 'center' },
  bismillahTrans: { fontSize: 12, color: COLORS.muted, textAlign: 'center' },

  // MISC
  comingSoon: { fontSize: 14, color: COLORS.muted, textAlign: 'center', marginTop: 40 },
  emptyCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 30, alignItems: 'center', marginHorizontal: 20, marginTop: 20, borderWidth: 1, borderColor: COLORS.border },
  emptyText: { fontSize: 14, color: COLORS.muted, textAlign: 'center' },
  emptySubtext: { fontSize: 12, color: COLORS.goldDim, textAlign: 'center', marginTop: 6 },
  loginBtn: { backgroundColor: COLORS.gold, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  loginBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.night },
})
