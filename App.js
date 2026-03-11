import { useState } from "react"
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar } from "react-native"
import { supabase } from "./lib/supabase"

export default function App() {
  const [tab, setTab] = useState("home")
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(false)

  const loadRestaurants = async () => {
    setLoading(true)
    const { data } = await supabase.from("restaurants").select("*").limit(20)
    if (data) setRestaurants(data)
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      <View style={styles.header}>
        <Text style={styles.logo}>🕌 FADJR</Text>
        <Text style={styles.subtitle}>Super App Halal</Text>
      </View>

      <ScrollView style={styles.content}>
        {tab === "home" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bienvenue sur FADJR</Text>
            <Text style={styles.text}>Trouvez des restaurants halal partout dans le monde 🌍</Text>
            <TouchableOpacity style={styles.btn} onPress={loadRestaurants}>
              <Text style={styles.btnText}>{loading ? "Chargement..." : "🍽️ Voir les restaurants"}</Text>
            </TouchableOpacity>
            {restaurants.map((r, i) => (
              <View key={i} style={styles.card}>
                <Text style={styles.cardTitle}>{r.name}</Text>
                <Text style={styles.cardText}>{r.address}</Text>
                <Text style={styles.cardText}>⭐ {r.rating}</Text>
              </View>
            ))}
          </View>
        )}
        {tab === "prayer" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🕌 Horaires de prière</Text>
            <Text style={styles.text}>Bientôt disponible</Text>
          </View>
        )}
        {tab === "quran" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📖 Coran</Text>
            <Text style={styles.text}>Bientôt disponible</Text>
          </View>
        )}
        {tab === "community" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👥 Communauté</Text>
            <Text style={styles.text}>Bientôt disponible</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.tabBar}>
        {[
          { key: "home", icon: "🏠", label: "Accueil" },
          { key: "prayer", icon: "🕌", label: "Prière" },
          { key: "quran", icon: "📖", label: "Coran" },
          { key: "community", icon: "👥", label: "Communauté" },
        ].map(t => (
          <TouchableOpacity key={t.key} style={styles.tabItem} onPress={() => setTab(t.key)}>
            <Text style={styles.tabIcon}>{t.icon}</Text>
            <Text style={[styles.tabLabel, tab === t.key && styles.tabActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  header: { backgroundColor: "#16213e", padding: 20, paddingTop: 50, alignItems: "center" },
  logo: { fontSize: 28, fontWeight: "bold", color: "#f0a500" },
  subtitle: { color: "#aaa", fontSize: 14, marginTop: 4 },
  content: { flex: 1, padding: 16 },
  section: { paddingBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: "bold", color: "#f0a500", marginBottom: 12 },
  text: { color: "#ccc", fontSize: 16, marginBottom: 16 },
  btn: { backgroundColor: "#f0a500", padding: 14, borderRadius: 10, alignItems: "center", marginBottom: 16 },
  btnText: { color: "#1a1a2e", fontWeight: "bold", fontSize: 16 },
  card: { backgroundColor: "#16213e", padding: 14, borderRadius: 10, marginBottom: 10 },
  cardTitle: { color: "#f0a500", fontWeight: "bold", fontSize: 16 },
  cardText: { color: "#aaa", fontSize: 14, marginTop: 4 },
  tabBar: { flexDirection: "row", backgroundColor: "#16213e", borderTopWidth: 1, borderTopColor: "#333" },
  tabItem: { flex: 1, alignItems: "center", padding: 10 },
  tabIcon: { fontSize: 22 },
  tabLabel: { color: "#aaa", fontSize: 11, marginTop: 2 },
  tabActive: { color: "#f0a500" },
})
