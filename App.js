import 'react-native-url-polyfill/auto'
import { useState, useEffect, useRef, createContext, useContext, useCallback } from "react"
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  StatusBar, TextInput, ActivityIndicator, Dimensions, FlatList,
  KeyboardAvoidingView, Platform, Alert, Switch
} from "react-native"
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Audio } from 'expo-av'

// ─── Notifications handler (foreground) ──────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// ─── Supabase ────────────────────────────────────────────────────────────────
const supabase = createClient(
  'https://bpvrqphmxrnjrbjtaxuw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwdnJxcGhteHJuanJianRheHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTQ0MjMsImV4cCI6MjA4ODczMDQyM30.9WaS5gYPcB2d11S604xpu4hZmwtV55yDlxxgNUaZEwA',
  { auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true } }
)

// ─── Auth + Profile Context ───────────────────────────────────────────────────
const AuthContext = createContext(null)
const useAuth = () => useContext(AuthContext)

// ─── Design System ────────────────────────────────────────────────────────────
const C = {
  bg:"#0A0A14", card:"#12121E", card2:"#1A1A2E",
  gold:"#C9A84C", goldL:"#F0D080", white:"#F0EAD8",
  muted:"#5A5A7A", green:"#2ECC71", blue:"#3498DB",
  red:"#E74C3C", purple:"#9B59B6", teal:"#1ABC9C",
  brown:"#8B5E3C", border:"rgba(201,168,76,0.15)",
}
const { width: W } = Dimensions.get("window")

// ─── Helpers date ─────────────────────────────────────────────────────────────
const todayKey = () => new Date().toISOString().slice(0, 10)

// ─── Data statique ────────────────────────────────────────────────────────────
const COMMERCES = [
  { id:1, nom:"Le Sultane", type:"Restaurant", adresse:"Chaussee de Wavre 142, Ixelles", distance:"0.3 km", note:4.8, certif:"HBE", emoji:"🍽️", color:"#C9A84C", ouvert:true, spec:"Cuisine orientale, tagine, couscous" },
  { id:2, nom:"Boucherie Al Madina", type:"Boucherie", adresse:"Rue Molenbeek 67, Molenbeek", distance:"0.7 km", note:4.6, certif:"AVS", emoji:"🥩", color:"#E74C3C", ouvert:true, spec:"Agneau, veau, poulet, merguez" },
  { id:3, nom:"Al Bouraq Books", type:"Librairie", adresse:"Rue de Flandre 88, Bruxelles", distance:"1.1 km", note:4.9, certif:"FADJR", emoji:"📚", color:"#8B5E3C", ouvert:true, spec:"Coran, hadith, livres enfants" },
  { id:4, nom:"Nour Abaya", type:"Boutique", adresse:"Chaussee d Anvers 234, Laeken", distance:"1.4 km", note:4.7, certif:"FADJR", emoji:"👗", color:"#9B59B6", ouvert:false, spec:"Abaya, qamis, hijab, tenues mariage" },
  { id:5, nom:"Oud et Musc BXL", type:"Parfumerie", adresse:"Rue des Alexiens 12, Centre", distance:"1.8 km", note:4.5, certif:"FADJR", emoji:"🌸", color:"#1ABC9C", ouvert:true, spec:"Oud, musc, attar sans alcool" },
  { id:6, nom:"Omra Express Belgique", type:"Voyage", adresse:"Av. de Stalingrad 55, St-Gilles", distance:"2.1 km", note:4.9, certif:"FADJR", emoji:"✈️", color:"#3498DB", ouvert:true, spec:"Omra, Hajj, voyages halal-friendly" },
  { id:7, nom:"Ecole Dar Al Ilm", type:"Ecole", adresse:"Rue de la Colonne 7, Anderlecht", distance:"2.4 km", note:5.0, certif:"FADJR", emoji:"🎓", color:"#2ECC71", ouvert:true, spec:"Coran, tajwid, arabe, tous niveaux" },
  { id:8, nom:"Takaful Belux", type:"Finance", adresse:"Bd Anspach 110, Bruxelles", distance:"2.9 km", note:4.4, certif:"FADJR", emoji:"🏦", color:"#9B59B6", ouvert:true, spec:"Assurance islamique, epargne halal" },
]
const CATEGORIES = ["Tous","Restaurant","Boucherie","Librairie","Boutique","Parfumerie","Voyage","Ecole","Finance"]
const DHIKR = [
  { ar:"Subhan Allah", fr:"Subhan Allah", trad:"Gloire a Allah", count:33 },
  { ar:"Alhamdulillah", fr:"Alhamdulillah", trad:"Louange a Allah", count:33 },
  { ar:"Allahu Akbar", fr:"Allahu Akbar", trad:"Allah est le Plus Grand", count:34 },
  { ar:"La ilaha illallah", fr:"La ilaha illallah", trad:"Nulle divinite sauf Allah", count:100 },
]
const PRAYER_NAMES = ["Fajr","Sunrise","Dhuhr","Asr","Maghrib","Isha"]
const PRAYER_AR = ["Al-Fajr","Ash-Shurouq","Adh-Dhuhr","Al-Asr","Al-Maghrib","Al-Icha"]
const PRAYER_EMOJI = ["🌙","🌅","☀️","🌤️","🌇","🌃"]
// Prières notifiables (sans Sunrise)
const NOTIF_PRAYERS = ["Fajr","Dhuhr","Asr","Maghrib","Isha"]

// ─── Notifications helpers ────────────────────────────────────────────────────
async function requestNotifPermission() {
  if (!Device.isDevice) return false
  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === 'granted') return true
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

async function schedulePrayerNotifications(prayers) {
  await Notifications.cancelAllScheduledNotificationsAsync()
  const granted = await requestNotifPermission()
  if (!granted) return false

  const now = new Date()
  let scheduled = 0

  for (const p of prayers) {
    if (!NOTIF_PRAYERS.includes(p.name)) continue
    const [h, m] = p.time.split(":").map(Number)
    const trigger = new Date()
    trigger.setHours(h, m, 0, 0)
    if (trigger <= now) continue // déjà passée aujourd'hui

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${p.emoji} ${p.name} — il est l'heure`,
        body: `${p.ar} · ${p.time}`,
        sound: true,
        data: { prayer: p.name },
      },
      trigger: { date: trigger },
    })
    scheduled++
  }
  return scheduled
}

// ─── Supabase Profile helpers ─────────────────────────────────────────────────
async function upsertProfile(userId, data) {
  // La table profiles utilise id = auth.users.id (pas user_id)
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...data, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (error) console.warn('upsertProfile:', error.message)
}

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error && error.code !== 'PGRST116') console.warn('fetchProfile:', error.message)
  return data
}

async function savePrayerTracked(userId, prayers_today) {
  const key = todayKey()
  const { error } = await supabase
    .from('prayer_tracker')
    .upsert({ user_id: userId, date: key, prayers: prayers_today, updated_at: new Date().toISOString() }, { onConflict: 'user_id,date' })
  if (error) console.warn('savePrayerTracked:', error.message)
}

async function fetchPrayerTracked(userId) {
  const key = todayKey()
  const { data } = await supabase
    .from('prayer_tracker')
    .select('prayers')
    .eq('user_id', userId)
    .eq('date', key)
    .single()
  return data?.prayers || {}
}

// ─── Écran Auth ───────────────────────────────────────────────────────────────
function EcranAuth() {
  const [mode, setMode] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nom, setNom] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async () => {
    if (!email || !password) { setError("Email et mot de passe requis"); return }
    setLoading(true); setError("")
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (err) setError(err.message === "Invalid login credentials" ? "Email ou mot de passe incorrect" : err.message)
  }

  const handleSignup = async () => {
    if (!email || !password || !nom) { setError("Tous les champs sont requis"); return }
    if (password.length < 6) { setError("Mot de passe minimum 6 caracteres"); return }
    setLoading(true); setError("")
    const { error: err } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { data: { full_name: nom.trim() } }
    })
    setLoading(false)
    if (err) setError(err.message)
    else Alert.alert("Compte cree !", "Verifiez votre email pour confirmer votre compte.")
  }

  const handleGuestLogin = async () => {
    setLoading(true); setError("")
    const { error: err } = await supabase.auth.signInAnonymously()
    setLoading(false)
    if (err) setError(err.message)
  }

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor:C.bg }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={{ flexGrow:1, justifyContent:"center", padding:24 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems:"center", marginBottom:40 }}>
          <Text style={{ color:C.gold, fontSize:42, fontWeight:"900", letterSpacing:6 }}>FADJR</Text>
          <Text style={{ color:C.muted, fontSize:13, letterSpacing:2, marginTop:4 }}>LA SUPER-APP HALAL</Text>
        </View>
        <View style={{ flexDirection:"row", backgroundColor:C.card, borderRadius:12, marginBottom:24, padding:4 }}>
          {[["login","Connexion"],["signup","Inscription"]].map(([m, label]) => (
            <TouchableOpacity key={m} onPress={() => { setMode(m); setError("") }}
              style={{ flex:1, paddingVertical:10, borderRadius:9, alignItems:"center",
                backgroundColor:mode===m ? "rgba(201,168,76,.15)" : "transparent",
                borderWidth:mode===m ? 1 : 0, borderColor:C.border }}>
              <Text style={{ color:mode===m ? C.gold : C.muted, fontSize:13, fontWeight:mode===m ? "700" : "400" }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ gap:12 }}>
          {mode === "signup" && (
            <TextInput value={nom} onChangeText={setNom} placeholder="Prenom" placeholderTextColor={C.muted}
              style={styles.input} autoCapitalize="words" />
          )}
          <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={C.muted}
            style={styles.input} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          <TextInput value={password} onChangeText={setPassword} placeholder="Mot de passe" placeholderTextColor={C.muted}
            style={styles.input} secureTextEntry />
        </View>
        {!!error && (
          <View style={{ marginTop:12, padding:12, backgroundColor:"rgba(231,76,60,.12)", borderRadius:10, borderWidth:1, borderColor:"rgba(231,76,60,.3)" }}>
            <Text style={{ color:C.red, fontSize:13 }}>{error}</Text>
          </View>
        )}
        <TouchableOpacity onPress={mode === "login" ? handleLogin : handleSignup} disabled={loading}
          style={{ marginTop:20, backgroundColor:C.gold, borderRadius:12, paddingVertical:15, alignItems:"center" }}>
          {loading
            ? <ActivityIndicator color="#0A0A14" />
            : <Text style={{ color:"#0A0A14", fontSize:15, fontWeight:"900", letterSpacing:1 }}>
                {mode === "login" ? "SE CONNECTER" : "CREER MON COMPTE"}
              </Text>
          }
        </TouchableOpacity>
        <View style={{ flexDirection:"row", alignItems:"center", marginVertical:20, gap:12 }}>
          <View style={{ flex:1, height:1, backgroundColor:C.border }} />
          <Text style={{ color:C.muted, fontSize:12 }}>ou</Text>
          <View style={{ flex:1, height:1, backgroundColor:C.border }} />
        </View>
        <TouchableOpacity onPress={handleGuestLogin} disabled={loading}
          style={{ borderWidth:1, borderColor:C.border, borderRadius:12, paddingVertical:13, alignItems:"center", backgroundColor:C.card }}>
          <Text style={{ color:C.muted, fontSize:13 }}>Continuer sans compte</Text>
        </TouchableOpacity>
        <Text style={{ color:C.muted, fontSize:11, textAlign:"center", marginTop:20, lineHeight:16 }}>
          En continuant, vous acceptez nos conditions d'utilisation.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ─── Écran Accueil ────────────────────────────────────────────────────────────
function EcranAccueil({ prayers, city, nextPrayer, timeToNext, setTab, hijriDate }) {
  const now = new Date()
  const h = now.getHours()
  const greeting = h < 12 ? "Sabah al-khayr" : h < 18 ? "Assalamu alaykum" : "Masa al-khayr"
  return (
    <ScrollView style={{ flex:1 }} showsVerticalScrollIndicator={false}>
      <View style={styles.heroHeader}>
        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <View>
            <Text style={{ color:C.muted, fontSize:13, marginBottom:4 }}>{greeting}</Text>
            <Text style={{ color:C.gold, fontSize:26, fontWeight:"900", letterSpacing:3 }}>FADJR</Text>
            <Text style={{ color:C.gold, fontSize:11, letterSpacing:2, opacity:.7 }}>☪ {city}</Text>
          </View>
          <View style={{ alignItems:"flex-end" }}>
            <Text style={{ color:C.muted, fontSize:11 }}>{now.toLocaleDateString("fr-BE",{weekday:"long",day:"numeric",month:"long"})}</Text>
            <Text style={{ color:C.gold, fontSize:12, marginTop:3 }}>{hijriDate || "..."}</Text>
          </View>
        </View>
        {nextPrayer && (
          <View style={styles.nextPrayerCard}>
            <View>
              <Text style={{ color:C.muted, fontSize:10, letterSpacing:2, marginBottom:4 }}>PROCHAINE PRIERE</Text>
              <Text style={{ color:C.gold, fontSize:24, fontWeight:"900" }}>{nextPrayer?.name}</Text>
              <Text style={{ color:C.white, fontSize:13, opacity:.6 }}>{nextPrayer?.ar}</Text>
            </View>
            <View style={{ alignItems:"flex-end" }}>
              <Text style={{ color:C.white, fontSize:30, fontWeight:"900" }}>{nextPrayer?.time}</Text>
              <Text style={{ color:C.green, fontSize:12, marginTop:4 }}>dans {timeToNext}</Text>
              <Text style={{ fontSize:20, marginTop:4 }}>{nextPrayer?.emoji}</Text>
            </View>
          </View>
        )}
      </View>
      <View style={{ padding:16 }}>
        <Text style={styles.sectionLabel}>EXPLORER</Text>
        <View style={{ flexDirection:"row", flexWrap:"wrap", gap:10, marginBottom:24 }}>
          {[
            { icon:"🕌", label:"Priere", color:C.gold, tab:"priere" },
            { icon:"🍽️", label:"Halal", color:C.red, tab:"carte" },
            { icon:"📚", label:"Culture", color:C.brown, tab:"culture" },
            { icon:"🏦", label:"Finance", color:C.purple, tab:"finance" },
            { icon:"✈️", label:"Voyage", color:C.blue, tab:"voyage" },
            { icon:"👥", label:"Communaute", color:C.teal, tab:"profil" },
          ].map(p => (
            <TouchableOpacity key={p.tab} onPress={() => setTab(p.tab)}
              style={[styles.pilierBtn, { borderTopColor:p.color, borderTopWidth:2, width:(W-48)/3 }]}>
              <Text style={{ fontSize:26 }}>{p.icon}</Text>
              <Text style={{ color:C.white, fontSize:10, fontWeight:"700", letterSpacing:1, marginTop:4 }}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <Text style={styles.sectionLabel}>PRES DE VOUS</Text>
          <TouchableOpacity onPress={() => setTab("carte")}>
            <Text style={{ color:C.gold, fontSize:12 }}>Voir tout →</Text>
          </TouchableOpacity>
        </View>
        {COMMERCES.slice(0,3).map(c => (
          <View key={c.id} style={[styles.card, { flexDirection:"row", alignItems:"center", gap:14, marginBottom:10 }]}>
            <View style={{ width:46, height:46, borderRadius:12, backgroundColor:c.color+"18", alignItems:"center", justifyContent:"center" }}>
              <Text style={{ fontSize:22 }}>{c.emoji}</Text>
            </View>
            <View style={{ flex:1 }}>
              <View style={{ flexDirection:"row", justifyContent:"space-between" }}>
                <Text style={{ color:C.white, fontSize:14, fontWeight:"700" }}>{c.nom}</Text>
                <Text style={{ color:C.muted, fontSize:11 }}>{c.distance}</Text>
              </View>
              <Text style={{ color:C.gold, fontSize:11 }}>{"★".repeat(Math.floor(c.note))} {c.note}</Text>
              <Text style={{ color:C.muted, fontSize:11, marginTop:2 }}>{c.spec.substring(0,38)}...</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

// ─── Écran Prière ─────────────────────────────────────────────────────────────
function EcranPriere({ prayers, city, loading, nextPrayer, prayedToday, onTogglePrayed }) {
  const [subTab, setSubTab] = useState("horaires")
  const [dhikrIdx, setDhikrIdx] = useState(0)
  const [dhikrCount, setDhikrCount] = useState(0)
  const d = DHIKR[dhikrIdx]

  const prayedCount = Object.values(prayedToday).filter(Boolean).length

  return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <Text style={styles.sectionLabel}>PRIERE & SPIRITUALITE</Text>
        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
          <Text style={{ color:C.gold, fontSize:18, fontWeight:"900" }}>☪ {city}</Text>
          {/* Compteur journalier */}
          <View style={{ flexDirection:"row", gap:4 }}>
            {NOTIF_PRAYERS.map((name, i) => (
              <View key={i} style={{
                width:8, height:8, borderRadius:4,
                backgroundColor: prayedToday[name] ? C.green : "rgba(255,255,255,.1)"
              }} />
            ))}
            <Text style={{ color:C.gold, fontSize:11, marginLeft:6, fontWeight:"700" }}>{prayedCount}/5</Text>
          </View>
        </View>
        <View style={{ flexDirection:"row", gap:8, marginTop:12 }}>
          {[["horaires","Horaires"],["tracker","Tracker"],["dhikr","Dhikr"]].map(([key,label]) => (
            <TouchableOpacity key={key} onPress={() => setSubTab(key)}
              style={[styles.subTabBtn, subTab===key && styles.subTabActive]}>
              <Text style={{ color:subTab===key ? C.gold : C.muted, fontSize:12, fontWeight:subTab===key?"700":"400" }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>

        {/* ── Horaires ── */}
        {subTab==="horaires" && (loading ? (
          <View style={{ alignItems:"center", paddingTop:60 }}>
            <ActivityIndicator color={C.gold} size="large" />
            <Text style={{ color:C.muted, marginTop:16 }}>Chargement Aladhan API...</Text>
          </View>
        ) : (prayers || []).map((p,i) => {
          const isNext = nextPrayer?.name === p.name
          const isPrayed = prayedToday[p.name]
          return (
            <TouchableOpacity key={i} onPress={() => onTogglePrayed(p.name)}
              style={[styles.card, { flexDirection:"row", alignItems:"center", gap:14, marginBottom:10,
                borderLeftWidth:4,
                borderLeftColor: isPrayed ? C.green : isNext ? C.gold : "transparent",
                backgroundColor: isPrayed ? "rgba(46,204,113,.06)" : isNext ? "#1C1C35" : C.card }]}>
              <Text style={{ fontSize:28, width:36, textAlign:"center" }}>{isPrayed ? "✅" : p.emoji}</Text>
              <View style={{ flex:1 }}>
                <Text style={{ color: isPrayed ? C.green : isNext ? C.gold : C.white, fontSize:16, fontWeight:"700" }}>{p.name}</Text>
                <Text style={{ color:C.muted, fontSize:13 }}>{p.ar}</Text>
              </View>
              <View style={{ alignItems:"flex-end" }}>
                <Text style={{ color: isPrayed ? C.green : isNext ? C.gold : C.white, fontSize:22, fontWeight:"900" }}>{p.time}</Text>
                {isPrayed && <Text style={{ color:C.green, fontSize:10, marginTop:2 }}>accomplie</Text>}
                {!isPrayed && isNext && <Text style={{ color:C.gold, fontSize:10, marginTop:2 }}>prochaine</Text>}
              </View>
            </TouchableOpacity>
          )
        }))}

        {/* ── Tracker journalier ── */}
        {subTab==="tracker" && (
          <View>
            <View style={[styles.card, { alignItems:"center", paddingVertical:24, marginBottom:16 }]}>
              <Text style={{ color:C.muted, fontSize:11, letterSpacing:2, marginBottom:8 }}>PRIÈRES DU JOUR</Text>
              <Text style={{ color: prayedCount === 5 ? C.green : C.gold, fontSize:52, fontWeight:"900" }}>
                {prayedCount}<Text style={{ fontSize:28, color:C.muted }}>/5</Text>
              </Text>
              {prayedCount === 5 && <Text style={{ color:C.green, fontSize:14, marginTop:8 }}>MashAllah — journée complète 🎉</Text>}
              {prayedCount === 0 && <Text style={{ color:C.muted, fontSize:13, marginTop:8 }}>Que ta journée commence avec Fajr</Text>}
            </View>
            {NOTIF_PRAYERS.map((name, i) => {
              const p = prayers.find(pr => pr.name === name)
              const done = prayedToday[name]
              return (
                <TouchableOpacity key={name} onPress={() => onTogglePrayed(name)}
                  style={[styles.card, { flexDirection:"row", alignItems:"center", gap:16, marginBottom:10,
                    backgroundColor: done ? "rgba(46,204,113,.08)" : C.card,
                    borderColor: done ? "rgba(46,204,113,.3)" : C.border }]}>
                  <View style={{ width:44, height:44, borderRadius:22, backgroundColor: done ? "rgba(46,204,113,.15)" : "rgba(255,255,255,.05)", alignItems:"center", justifyContent:"center" }}>
                    <Text style={{ fontSize:20 }}>{done ? "✅" : (p?.emoji || "🕌")}</Text>
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={{ color: done ? C.green : C.white, fontSize:16, fontWeight:"700" }}>{name}</Text>
                    <Text style={{ color:C.muted, fontSize:12 }}>{p?.time || "--:--"}</Text>
                  </View>
                  <View style={{ width:28, height:28, borderRadius:14, borderWidth:2,
                    borderColor: done ? C.green : C.muted,
                    backgroundColor: done ? C.green : "transparent",
                    alignItems:"center", justifyContent:"center" }}>
                    {done && <Text style={{ color:"#fff", fontSize:14, fontWeight:"900" }}>✓</Text>}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        {/* ── Dhikr ── */}
        {subTab==="dhikr" && (
          <View style={{ alignItems:"center" }}>
            <View style={[styles.card, { width:"100%", alignItems:"center", paddingVertical:24, marginBottom:20 }]}>
              <Text style={{ fontSize:22, color:C.gold, marginBottom:12, textAlign:"center" }}>{d.ar}</Text>
              <Text style={{ color:C.white, fontSize:18, fontWeight:"700" }}>{d.fr}</Text>
              <Text style={{ color:C.muted, fontSize:13, marginTop:4 }}>{d.trad}</Text>
              <Text style={{ color:C.gold, fontSize:12, marginTop:8 }}>x {d.count}</Text>
            </View>
            <TouchableOpacity onPress={() => setDhikrCount(c => c >= d.count ? 0 : c+1)}
              style={{ width:140, height:140, borderRadius:70, backgroundColor:C.card, borderWidth:3, borderColor:dhikrCount >= d.count ? C.green : C.gold, alignItems:"center", justifyContent:"center", marginVertical:10 }}>
              <Text style={{ color:dhikrCount >= d.count ? C.green : C.gold, fontSize:44, fontWeight:"900" }}>{dhikrCount}</Text>
              <Text style={{ color:C.muted, fontSize:12 }}>sur {d.count}</Text>
            </TouchableOpacity>
            <View style={{ width:"100%", height:6, backgroundColor:"rgba(255,255,255,.06)", borderRadius:99, overflow:"hidden", marginTop:10 }}>
              <View style={{ width:`${Math.min((dhikrCount/d.count)*100,100)}%`, height:"100%", backgroundColor:C.gold, borderRadius:99 }} />
            </View>
            <View style={{ flexDirection:"row", flexWrap:"wrap", gap:8, marginTop:20, width:"100%" }}>
              {DHIKR.map((dh,i) => (
                <TouchableOpacity key={i} onPress={() => { setDhikrIdx(i); setDhikrCount(0) }}
                  style={[styles.card, { width:"48%", padding:10, borderColor:dhikrIdx===i ? C.gold : C.border }]}>
                  <Text style={{ color:dhikrIdx===i ? C.gold : C.white, fontSize:12, fontWeight:"700" }}>{dh.fr}</Text>
                  <Text style={{ color:C.muted, fontSize:10 }}>x {dh.count}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

// ─── Écran Carte ──────────────────────────────────────────────────────────────
function EcranCarte() {
  const [cat, setCat] = useState("Tous")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState(null)
  const filtered = COMMERCES.filter(c =>
    (cat==="Tous" || c.type===cat) &&
    (c.nom.toLowerCase().includes(search.toLowerCase()) || c.spec.toLowerCase().includes(search.toLowerCase()))
  )
  return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <Text style={styles.sectionLabel}>CARTE HALAL BRUXELLES</Text>
        <TextInput value={search} onChangeText={setSearch} placeholder="Chercher un commerce halal..."
          placeholderTextColor={C.muted}
          style={{ backgroundColor:C.card, borderWidth:1, borderColor:C.border, borderRadius:10, padding:11, color:C.white, fontSize:13, marginTop:8 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop:10 }}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c} onPress={() => setCat(c)}
              style={{ paddingHorizontal:14, paddingVertical:6, borderRadius:99, borderWidth:1, borderColor:cat===c ? C.gold : C.border, backgroundColor:cat===c ? "rgba(201,168,76,.15)" : C.card, marginRight:6 }}>
              <Text style={{ color:cat===c ? C.gold : C.muted, fontSize:12, fontWeight:cat===c?"700":"400" }}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <FlatList data={filtered} keyExtractor={c => String(c.id)} contentContainerStyle={{ padding:16 }} showsVerticalScrollIndicator={false}
        renderItem={({ item:c }) => (
          <TouchableOpacity onPress={() => setSelected(selected?.id===c.id ? null : c)}
            style={[styles.card, { marginBottom:10, borderColor:selected?.id===c.id ? c.color : C.border, backgroundColor:selected?.id===c.id ? "#1C1C35" : C.card }]}>
            <View style={{ flexDirection:"row", alignItems:"flex-start", gap:14 }}>
              <View style={{ width:52, height:52, borderRadius:12, backgroundColor:c.color+"18", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Text style={{ fontSize:24 }}>{c.emoji}</Text>
              </View>
              <View style={{ flex:1 }}>
                <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:4 }}>
                  <Text style={{ color:selected?.id===c.id ? c.color : C.white, fontSize:15, fontWeight:"700", flex:1 }}>{c.nom}</Text>
                  <Text style={{ color:C.muted, fontSize:11, marginLeft:8 }}>{c.distance}</Text>
                </View>
                <Text style={{ color:C.gold, fontSize:11 }}>{"★".repeat(Math.floor(c.note))} {c.note}</Text>
                <Text style={{ color:C.muted, fontSize:11, marginTop:3 }}>{c.adresse}</Text>
                <View style={{ flexDirection:"row", gap:6, marginTop:6 }}>
                  <View style={{ backgroundColor:c.color+"18", borderRadius:99, paddingHorizontal:8, paddingVertical:2, borderWidth:1, borderColor:c.color+"40" }}>
                    <Text style={{ color:c.color, fontSize:10, fontWeight:"700" }}>{c.certif}</Text>
                  </View>
                  <Text style={{ color:c.ouvert ? C.green : C.red, fontSize:10, fontWeight:"700" }}>{c.ouvert ? "Ouvert" : "Ferme"}</Text>
                </View>
                {selected?.id===c.id && (
                  <View style={{ marginTop:12, paddingTop:12, borderTopWidth:1, borderTopColor:C.border }}>
                    <Text style={{ color:C.white, fontSize:12, marginBottom:10 }}>{c.spec}</Text>
                    <View style={{ flexDirection:"row", gap:8 }}>
                      {[["Appeler",c.color],["Y aller",C.blue],["Favori",C.gold]].map(([label,col]) => (
                        <TouchableOpacity key={label} style={{ flex:1, padding:8, borderRadius:8, borderWidth:1, borderColor:col, alignItems:"center" }}>
                          <Text style={{ color:col, fontSize:11, fontWeight:"700" }}>{label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )} />
    </View>
  )
}

// ─── Données Culture ──────────────────────────────────────────────────────────
const HADITHS_NAWAWI = [
  { num:1, ar:"إنما الأعمال بالنيات", fr:"Les actes ne valent que par les intentions", source:"Bukhari & Muslim" },
  { num:2, ar:"أن تعبد الله كأنك تراه", fr:"Adore Allah comme si tu Le voyais", source:"Muslim" },
  { num:3, ar:"بني الإسلام على خمس", fr:"L'Islam est bati sur cinq piliers", source:"Bukhari & Muslim" },
  { num:5, ar:"من أحدث في أمرنا هذا ما ليس منه فهو رد", fr:"Toute innovation dans notre religion est rejetee", source:"Bukhari & Muslim" },
  { num:6, ar:"إن الحلال بيّن وإن الحرام بيّن", fr:"Le licite est clair et l'illicite est clair", source:"Bukhari & Muslim" },
  { num:7, ar:"الدين النصيحة", fr:"La religion, c'est le bon conseil", source:"Muslim" },
  { num:9, ar:"ما نهيتكم عنه فاجتنبوه", fr:"Ce que je vous ai interdit, evitez-le", source:"Bukhari & Muslim" },
  { num:10, ar:"إن الله طيب لا يقبل إلا طيبا", fr:"Allah est bon et n'accepte que ce qui est bon", source:"Muslim" },
  { num:12, ar:"من حسن إسلام المرء تركه ما لا يعنيه", fr:"Delaisser ce qui ne nous concerne pas", source:"Tirmidhi" },
  { num:13, ar:"لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه", fr:"Nul ne croit tant qu'il n'aime pas pour son frere ce qu'il aime pour lui-meme", source:"Bukhari & Muslim" },
  { num:15, ar:"من كان يؤمن بالله واليوم الآخر فليقل خيرا أو ليصمت", fr:"Que celui qui croit en Allah dise du bien ou se taise", source:"Bukhari & Muslim" },
  { num:16, ar:"لا تغضب", fr:"Ne te mets pas en colere", source:"Bukhari" },
  { num:17, ar:"إن الله كتب الإحسان على كل شيء", fr:"Allah a prescrit la bienfaisance en toute chose", source:"Muslim" },
  { num:18, ar:"اتق الله حيثما كنت", fr:"Crains Allah ou que tu sois", source:"Tirmidhi" },
  { num:19, ar:"احفظ الله يحفظك", fr:"Preserve Allah, Il te preservera", source:"Tirmidhi" },
  { num:22, ar:"إن الله تجاوز لي عن أمتي ما وسوست به صدورها", fr:"Allah a pardonne les mauvaises pensees non mises en pratique", source:"Bukhari & Muslim" },
  { num:25, ar:"كل سلامى من الناس عليه صدقة", fr:"Chaque articulation doit s'acquitter d'une aumone", source:"Muslim" },
  { num:27, ar:"البر حسن الخلق", fr:"La piete c'est le bon comportement", source:"Muslim" },
  { num:34, ar:"من رأى منكم منكرا فليغيره بيده", fr:"Que celui qui voit un mal le change de sa main", source:"Muslim" },
  { num:36, ar:"من نفس عن مؤمن كربة نفس الله عنه كربة يوم القيامة", fr:"Celui qui soulage un croyant, Allah le soulagera", source:"Muslim" },
  { num:40, ar:"كن في الدنيا كأنك غريب أو عابر سبيل", fr:"Sois dans ce monde comme un etranger ou un voyageur", source:"Bukhari" },
]
const HADITHS_BUKHARI = [
  { num:1, ar:"إنما الأعمال بالنيات وإنما لكل امرئ ما نوى", fr:"Les actes ne valent que par les intentions et chacun n'aura que ce qu'il a eu reellement l'intention de faire", source:"Sahih Bukhari" },
  { num:6, ar:"المسلم من سلم المسلمون من لسانه ويده", fr:"Le musulman est celui dont les gens sont a l'abri de sa langue et de sa main", source:"Sahih Bukhari" },
  { num:10, ar:"أحب الأعمال إلى الله أدومها وإن قل", fr:"Les actes les plus aimes d'Allah sont les plus reguliers, meme s'ils sont peu", source:"Sahih Bukhari" },
  { num:13, ar:"لا يؤمن أحدكم حتى أكون أحب إليه من والده وولده والناس أجمعين", fr:"Nul ne croit tant que je ne suis pas plus cher a ses yeux que son pere, son fils et tous les gens", source:"Sahih Bukhari" },
  { num:15, ar:"من كان يؤمن بالله واليوم الآخر فليكرم جاره", fr:"Que celui qui croit en Allah honore son voisin", source:"Sahih Bukhari" },
  { num:16, ar:"تبسمك في وجه أخيك لك صدقة", fr:"Sourire a ton frere est une aumone", source:"Sahih Bukhari" },
  { num:52, ar:"الصلوات الخمس والجمعة إلى الجمعة كفارة لما بينهن", fr:"Les 5 prieres et le vendredi au vendredi expient les peches entre eux", source:"Sahih Bukhari" },
  { num:97, ar:"خيركم من تعلم القرآن وعلمه", fr:"Le meilleur d'entre vous est celui qui apprend le Coran et l'enseigne", source:"Sahih Bukhari" },
  { num:100, ar:"الدنيا ملعونة ملعون ما فيها إلا ذكر الله", fr:"Le bas-monde est maudit sauf le rappel d'Allah", source:"Sahih Bukhari" },
  { num:112, ar:"من سلك طريقا يلتمس فيه علما سهل الله له به طريقا إلى الجنة", fr:"Celui qui emprunte un chemin vers le savoir, Allah lui facilite un chemin vers le Paradis", source:"Sahih Bukhari" },
]
const HADITHS_MUSLIM = [
  { num:1, ar:"إن الله لا ينظر إلى صوركم وأموالكم ولكن ينظر إلى قلوبكم وأعمالكم", fr:"Allah ne regarde pas vos apparences ni vos biens, mais Il regarde vos coeurs et vos actes", source:"Sahih Muslim" },
  { num:2, ar:"الطهور شطر الإيمان", fr:"La purete est la moitie de la foi", source:"Sahih Muslim" },
  { num:3, ar:"المؤمن القوي خير وأحب إلى الله من المؤمن الضعيف", fr:"Le croyant fort est meilleur et plus aime d'Allah que le croyant faible", source:"Sahih Muslim" },
  { num:4, ar:"لا يدخل الجنة من كان في قلبه مثقال ذرة من كبر", fr:"N'entrera pas au Paradis celui qui a un atome d'orgueil dans le coeur", source:"Sahih Muslim" },
  { num:5, ar:"الدعاء هو العبادة", fr:"L'invocation est l'adoration elle-meme", source:"Sahih Muslim" },
  { num:6, ar:"إن الله رفيق يحب الرفق في الأمر كله", fr:"Allah est doux et Il aime la douceur en toute chose", source:"Sahih Muslim" },
  { num:7, ar:"ما نقصت صدقة من مال", fr:"L'aumone ne diminue en rien la richesse", source:"Sahih Muslim" },
  { num:8, ar:"اتقوا الظلم فإن الظلم ظلمات يوم القيامة", fr:"Gardez-vous de l'injustice car elle sera tenebres au Jour Dernier", source:"Sahih Muslim" },
  { num:9, ar:"المسلم أخو المسلم لا يظلمه ولا يسلمه", fr:"Le musulman est le frere du musulman, il ne l'opprime pas et ne l'abandonne pas", source:"Sahih Muslim" },
  { num:10, ar:"كل معروف صدقة", fr:"Tout acte de bien est une aumone", source:"Sahih Muslim" },
]
const QURAN_RECITERS = [
  { id:"ar.alafasy", name:"Mishary Al-Afasy", flag:"🇰🇼" },
  { id:"ar.abdulbasit", name:"Abdul Basit", flag:"🇪🇬" },
  { id:"ar.husary", name:"Mahmoud Al-Husary", flag:"🇪🇬" },
  { id:"ar.minshawi", name:"Al-Minshawi", flag:"🇪🇬" },
  { id:"ar.abdulsamad", name:"Abdul Samad", flag:"🇪🇬" },
]
const TAJWID_REGLES = [
  { titre:"Noon Sakinah", desc:"Les 4 regles : Izhar, Idgham, Iqlab, Ikhfa", emoji:"🔤" },
  { titre:"Meem Sakinah", desc:"Idgham Shafawi, Ikhfa Shafawi, Izhar Shafawi", emoji:"📝" },
  { titre:"Madd (prolongation)", desc:"Madd Tabii (2), Muttasil (4-5), Munfasil (4-5), Lazim (6)", emoji:"📏" },
  { titre:"Qalqalah", desc:"Vibration sur ق ط ب ج د quand sukun", emoji:"🔊" },
  { titre:"Lam de Allah", desc:"Tafkheem (fatha/damma) et Tarqeeq (kasra)", emoji:"🌟" },
  { titre:"Ghunnah", desc:"Nasalisation 2 temps sur Noon et Meem mushaddadah", emoji:"🎵" },
  { titre:"Waqf (arret)", desc:"Signes d'arret : obligatoire, permis, interdit", emoji:"⏸️" },
  { titre:"Lettres solaires/lunaires", desc:"Assimilation du Lam avec les lettres solaires", emoji:"☀️" },
]
const SIRA_EVENTS = [
  { annee:"570", titre:"Naissance du Prophete ﷺ", desc:"Annee de l'Elephant, a La Mecque", emoji:"👶" },
  { annee:"610", titre:"Premiere revelation", desc:"Grotte de Hira — Sourate Al-Alaq", emoji:"📖" },
  { annee:"613", titre:"Predication publique", desc:"Le Prophete ﷺ invite les Quraysh", emoji:"📢" },
  { annee:"615", titre:"Emigration en Abyssinie", desc:"Les premiers refugies chez le Negus", emoji:"🚢" },
  { annee:"619", titre:"Annee de la tristesse", desc:"Deces de Khadija et Abu Talib", emoji:"💔" },
  { annee:"620", titre:"Isra & Miraj", desc:"Voyage nocturne aux cieux", emoji:"🌙" },
  { annee:"622", titre:"Hijra vers Medine", desc:"Debut du calendrier islamique", emoji:"🐪" },
  { annee:"624", titre:"Bataille de Badr", desc:"313 contre 1000 — victoire", emoji:"⚔️" },
  { annee:"628", titre:"Traite de Hudaybiyya", desc:"Accord de paix avec Quraysh", emoji:"🤝" },
  { annee:"630", titre:"Conquete de La Mecque", desc:"Purification de la Kaaba", emoji:"🕋" },
  { annee:"632", titre:"Sermon d'adieu", desc:"Derniers enseignements", emoji:"🏔️" },
  { annee:"632", titre:"Deces du Prophete ﷺ", desc:"12 Rabi Al-Awal, Medine", emoji:"🤲" },
]
const FIQH_BASES = [
  { titre:"La priere (Salat)", desc:"Conditions, piliers, obligations et sunnahs", emoji:"🕌" },
  { titre:"Les ablutions (Wudu)", desc:"Obligations, sunnahs et annulants", emoji:"💧" },
  { titre:"Le jeune (Siyam)", desc:"Ramadan, excuses valables, rattrapage", emoji:"🌙" },
  { titre:"La zakat", desc:"Nisab, taux, beneficiaires, calcul", emoji:"💰" },
  { titre:"Le Hajj", desc:"Piliers, obligations, rites Omra et Hajj", emoji:"🕋" },
  { titre:"Alimentation halal", desc:"Interdits, regles d'abattage", emoji:"🍖" },
  { titre:"Le mariage (Nikah)", desc:"Conditions, droits des epoux", emoji:"💍" },
  { titre:"Transactions (Muamalat)", desc:"Interdiction du riba, vente licite", emoji:"📜" },
]
const ARABE_LECONS = [
  { titre:"Alphabet", items:[{ar:"أ",rom:"Alif"},{ar:"ب",rom:"Ba"},{ar:"ت",rom:"Ta"},{ar:"ث",rom:"Tha"},{ar:"ج",rom:"Jim"},{ar:"ح",rom:"Ha"},{ar:"خ",rom:"Kha"},{ar:"د",rom:"Dal"},{ar:"ذ",rom:"Dhal"},{ar:"ر",rom:"Ra"},{ar:"ز",rom:"Zay"},{ar:"س",rom:"Sin"},{ar:"ش",rom:"Shin"},{ar:"ص",rom:"Sad"},{ar:"ض",rom:"Dad"},{ar:"ط",rom:"Ta"},{ar:"ظ",rom:"Dha"},{ar:"ع",rom:"Ayn"},{ar:"غ",rom:"Ghayn"},{ar:"ف",rom:"Fa"},{ar:"ق",rom:"Qaf"},{ar:"ك",rom:"Kaf"},{ar:"ل",rom:"Lam"},{ar:"م",rom:"Mim"},{ar:"ن",rom:"Nun"},{ar:"ه",rom:"Ha"},{ar:"و",rom:"Waw"},{ar:"ي",rom:"Ya"}], emoji:"أ", color:C.gold },
  { titre:"Salutations", items:[{ar:"السلام عليكم",rom:"As-salamu alaykum",fr:"Paix sur vous"},{ar:"وعليكم السلام",rom:"Wa alaykum as-salam",fr:"Et sur vous la paix"},{ar:"كيف حالك",rom:"Kayfa haluk",fr:"Comment vas-tu?"},{ar:"الحمد لله",rom:"Al-hamdulillah",fr:"Louange a Allah"},{ar:"بارك الله فيك",rom:"Barak Allahu fik",fr:"Qu'Allah te benisse"},{ar:"جزاك الله خيرا",rom:"Jazak Allahu khayran",fr:"Qu'Allah te recompense"}], emoji:"👋", color:C.green },
  { titre:"Chiffres", items:[{ar:"واحد",rom:"Wahid",fr:"1"},{ar:"اثنان",rom:"Ithnan",fr:"2"},{ar:"ثلاثة",rom:"Thalatha",fr:"3"},{ar:"أربعة",rom:"Arba'a",fr:"4"},{ar:"خمسة",rom:"Khamsa",fr:"5"},{ar:"ستة",rom:"Sitta",fr:"6"},{ar:"سبعة",rom:"Sab'a",fr:"7"},{ar:"ثمانية",rom:"Thamaniya",fr:"8"},{ar:"تسعة",rom:"Tis'a",fr:"9"},{ar:"عشرة",rom:"Ashara",fr:"10"}], emoji:"🔢", color:C.blue },
  { titre:"Famille", items:[{ar:"أب",rom:"Ab",fr:"Pere"},{ar:"أم",rom:"Umm",fr:"Mere"},{ar:"ابن",rom:"Ibn",fr:"Fils"},{ar:"بنت",rom:"Bint",fr:"Fille"},{ar:"أخ",rom:"Akh",fr:"Frere"},{ar:"أخت",rom:"Ukht",fr:"Soeur"},{ar:"جد",rom:"Jadd",fr:"Grand-pere"},{ar:"جدة",rom:"Jadda",fr:"Grand-mere"}], emoji:"👨‍👩‍👧‍👦", color:C.purple },
  { titre:"Mosquee", items:[{ar:"مسجد",rom:"Masjid",fr:"Mosquee"},{ar:"محراب",rom:"Mihrab",fr:"Niche de priere"},{ar:"منبر",rom:"Minbar",fr:"Chaire"},{ar:"إمام",rom:"Imam",fr:"Guide de priere"},{ar:"مؤذن",rom:"Muadhin",fr:"Appeleur"},{ar:"أذان",rom:"Adhan",fr:"Appel a la priere"},{ar:"قبلة",rom:"Qibla",fr:"Direction de priere"}], emoji:"🕌", color:C.teal },
  { titre:"Corps", items:[{ar:"رأس",rom:"Ra's",fr:"Tete"},{ar:"يد",rom:"Yad",fr:"Main"},{ar:"عين",rom:"Ayn",fr:"Oeil"},{ar:"قلب",rom:"Qalb",fr:"Coeur"},{ar:"رجل",rom:"Rijl",fr:"Pied"},{ar:"أذن",rom:"Udhun",fr:"Oreille"},{ar:"فم",rom:"Fam",fr:"Bouche"}], emoji:"🫀", color:C.red },
]
const HIJRI_MONTHS = ["Muharram","Safar","Rabi Al-Awal","Rabi Al-Thani","Jumada Al-Ula","Jumada Al-Thani","Rajab","Sha'ban","Ramadan","Shawwal","Dhul Qi'dah","Dhul Hijjah"]
const ISLAMIC_EVENTS = [
  { mois:1, jour:1, nom:"Nouvel An Islamique", desc:"1er Muharram", emoji:"🌙", color:C.gold },
  { mois:1, jour:10, nom:"Achoura", desc:"Jeune recommande — 10 Muharram", emoji:"📿", color:C.green },
  { mois:3, jour:12, nom:"Mawlid An-Nabawi", desc:"Naissance du Prophete ﷺ", emoji:"🌟", color:C.gold },
  { mois:7, jour:27, nom:"Isra & Miraj", desc:"Voyage nocturne — 27 Rajab", emoji:"✨", color:C.purple },
  { mois:8, jour:15, nom:"Nuit du Pardon", desc:"15 Sha'ban — nuit de misericorde", emoji:"🤲", color:C.blue },
  { mois:9, jour:1, nom:"Debut du Ramadan", desc:"Mois du jeune et du Coran", emoji:"🌙", color:C.gold },
  { mois:9, jour:27, nom:"Laylat Al-Qadr", desc:"La nuit du Destin — meilleure que 1000 mois", emoji:"⭐", color:C.gold },
  { mois:10, jour:1, nom:"Aid Al-Fitr", desc:"Fete de la rupture du jeune", emoji:"🎉", color:C.green },
  { mois:12, jour:8, nom:"Debut du Hajj", desc:"Pelerinage a La Mecque", emoji:"🕋", color:C.brown },
  { mois:12, jour:9, nom:"Jour d'Arafat", desc:"Jeune recommande — meilleur jour", emoji:"🏔️", color:C.blue },
  { mois:12, jour:10, nom:"Aid Al-Adha", desc:"Fete du sacrifice", emoji:"🐑", color:C.gold },
]

// ─── Écran Culture ────────────────────────────────────────────────────────────
function EcranCulture() {
  const [section, setSection] = useState(null)
  const [sourates, setSourates] = useState([])
  const [selectedSourate, setSelectedSourate] = useState(null)
  const [ayahs, setAyahs] = useState([])
  const [loadingQuran, setLoadingQuran] = useState(false)
  const [reciter, setReciter] = useState(QURAN_RECITERS[0])
  const [playingAyah, setPlayingAyah] = useState(null)
  const [sound, setSound] = useState(null)
  const [hadithCollection, setHadithCollection] = useState("nawawi")
  const [arabeLecon, setArabeLecon] = useState(null)
  const [revealedItems, setRevealedItems] = useState({})
  const [hijriDate, setHijriDate] = useState(null)

  // Fetch sourates list
  useEffect(() => {
    if (section === "coran" && sourates.length === 0) {
      fetch("https://api.alquran.cloud/v1/surah")
        .then(r => r.json())
        .then(d => { if (d.data) setSourates(d.data) })
        .catch(() => {})
    }
  }, [section])

  // Fetch hijri date
  useEffect(() => {
    if (section === "calendrier" && !hijriDate) {
      const today = new Date()
      const dd = String(today.getDate()).padStart(2,"0")
      const mm = String(today.getMonth()+1).padStart(2,"0")
      const yyyy = today.getFullYear()
      fetch(`https://api.aladhan.com/v1/gpianoToHijri/${dd}-${mm}-${yyyy}`)
        .then(r => r.json())
        .then(d => { if (d.data && d.data.hijri) setHijriDate(d.data.hijri) })
        .catch(() => {})
    }
  }, [section])

  // Fetch ayahs for selected sourate
  useEffect(() => {
    if (selectedSourate) {
      setLoadingQuran(true)
      fetch(`https://api.alquran.cloud/v1/surah/${selectedSourate.number}/editions/ar.alafasy,fr.hamidullah`)
        .then(r => r.json())
        .then(d => {
          if (d.data && d.data.length === 2) {
            const ar = d.data[0].ayahs
            const fr = d.data[1].ayahs
            setAyahs(ar.map((a,i) => ({ num:a.numberInSurah, ar:a.text, fr:fr[i]?.text||"", audio:a.audio })))
          }
          setLoadingQuran(false)
        })
        .catch(() => setLoadingQuran(false))
    }
  }, [selectedSourate])

  // Audio playback
  const playAyah = async (audioUrl, ayahNum) => {
    try {
      if (sound) { await sound.unloadAsync(); setSound(null) }
      if (playingAyah === ayahNum) { setPlayingAyah(null); return }
      const { sound: s } = await Audio.Sound.createAsync({ uri: audioUrl })
      setSound(s)
      setPlayingAyah(ayahNum)
      s.setOnPlaybackStatusUpdate(status => { if (status.didJustFinish) { setPlayingAyah(null) } })
      await s.playAsync()
    } catch(e) { setPlayingAyah(null) }
  }

  // Cleanup audio
  useEffect(() => { return () => { if (sound) sound.unloadAsync() } }, [sound])

  const ITEMS = [
    { id:"coran", emoji:"📖", titre:"Coran", desc:"114 sourates + audio recitateurs", color:C.gold },
    { id:"hadith", emoji:"📚", titre:"Hadith", desc:"Nawawi, Bukhari, Muslim", color:C.brown },
    { id:"tajwid", emoji:"🎓", titre:"Tajwid", desc:"Regles de recitation", color:C.green },
    { id:"sira", emoji:"🌟", titre:"Sira", desc:"Vie du Prophete ﷺ", color:C.purple },
    { id:"fiqh", emoji:"🕌", titre:"Fiqh", desc:"Jurisprudence pratique", color:C.blue },
    { id:"arabe", emoji:"🖋️", titre:"Arabe", desc:"Cours interactifs", color:C.teal },
    { id:"calendrier", emoji:"📅", titre:"Calendrier", desc:"Date hijri + evenements", color:C.red },
  ]

  // ── CORAN ──
  if (section === "coran" && selectedSourate) return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => { setSelectedSourate(null); setAyahs([]) }} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>Retour</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:6 }}>{selectedSourate.number}. {selectedSourate.englishName}</Text>
        <Text style={{ color:C.muted, fontSize:12 }}>{selectedSourate.englishNameTranslation} — {selectedSourate.numberOfAyahs} versets</Text>
      </View>
      {loadingQuran ? <ActivityIndicator size="large" color={C.gold} style={{ marginTop:40 }} /> : (
        <FlatList data={ayahs} keyExtractor={a => String(a.num)}
          contentContainerStyle={{ padding:16, gap:8 }}
          renderItem={({ item }) => (
            <View style={[styles.card, { padding:12 }]}>
              <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <View style={{ backgroundColor:C.gold+"25", borderRadius:99, width:26, height:26, alignItems:"center", justifyContent:"center" }}>
                  <Text style={{ color:C.gold, fontSize:10, fontWeight:"900" }}>{item.num}</Text>
                </View>
                {item.audio && (
                  <TouchableOpacity onPress={() => playAyah(item.audio, item.num)}
                    style={{ backgroundColor: playingAyah===item.num ? C.gold+"30" : C.card2, borderRadius:99, width:32, height:32, alignItems:"center", justifyContent:"center" }}>
                    <Text style={{ fontSize:14 }}>{playingAyah===item.num ? "⏸" : "▶️"}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={{ color:C.goldL, fontSize:20, textAlign:"right", lineHeight:36, marginBottom:8 }}>{item.ar}</Text>
              <Text style={{ color:C.muted, fontSize:12, lineHeight:18 }}>{item.fr}</Text>
            </View>
          )} />
      )}
    </View>
  )

  if (section === "coran") return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>Retour</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:6 }}>📖 Le Saint Coran</Text>
        <Text style={{ color:C.muted, fontSize:12 }}>{sourates.length} sourates</Text>
      </View>
      {sourates.length === 0 ? <ActivityIndicator size="large" color={C.gold} style={{ marginTop:40 }} /> : (
        <FlatList data={sourates} keyExtractor={s => String(s.number)}
          contentContainerStyle={{ padding:16, gap:6 }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setSelectedSourate(item)}
              style={[styles.card, { flexDirection:"row", alignItems:"center", gap:12, padding:12 }]}>
              <View style={{ backgroundColor:C.gold+"20", borderRadius:99, width:36, height:36, alignItems:"center", justifyContent:"center" }}>
                <Text style={{ color:C.gold, fontSize:12, fontWeight:"900" }}>{item.number}</Text>
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ color:C.white, fontSize:14, fontWeight:"700" }}>{item.englishName}</Text>
                <Text style={{ color:C.muted, fontSize:11 }}>{item.englishNameTranslation} — {item.numberOfAyahs} versets</Text>
              </View>
              <Text style={{ color:C.goldL, fontSize:16 }}>{item.name}</Text>
            </TouchableOpacity>
          )} />
      )}
    </View>
  )

  // ── HADITH ──
  if (section === "hadith") {
    const collections = { nawawi: { data:HADITHS_NAWAWI, label:"40 Nawawi", count:HADITHS_NAWAWI.length }, bukhari: { data:HADITHS_BUKHARI, label:"Sahih Bukhari", count:HADITHS_BUKHARI.length }, muslim: { data:HADITHS_MUSLIM, label:"Sahih Muslim", count:HADITHS_MUSLIM.length } }
    const current = collections[hadithCollection]
    return (
      <View style={{ flex:1 }}>
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
            <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
            <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>Retour</Text>
          </TouchableOpacity>
          <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:6 }}>📚 Hadiths</Text>
          <View style={{ flexDirection:"row", gap:6, marginTop:8 }}>
            {Object.entries(collections).map(([key, val]) => (
              <TouchableOpacity key={key} onPress={() => setHadithCollection(key)}
                style={{ backgroundColor: hadithCollection===key ? C.gold+"30" : C.card2, borderRadius:99, paddingHorizontal:12, paddingVertical:5 }}>
                <Text style={{ color: hadithCollection===key ? C.gold : C.muted, fontSize:11, fontWeight:"700" }}>{val.label} ({val.count})</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <FlatList data={current.data} keyExtractor={h => hadithCollection+h.num}
          contentContainerStyle={{ padding:16, gap:10 }}
          renderItem={({ item }) => (
            <View style={[styles.card, { padding:14 }]}>
              <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:8 }}>
                <View style={{ backgroundColor:C.gold+"25", borderRadius:99, width:28, height:28, alignItems:"center", justifyContent:"center" }}>
                  <Text style={{ color:C.gold, fontSize:12, fontWeight:"900" }}>{item.num}</Text>
                </View>
                <Text style={{ color:C.muted, fontSize:10 }}>{item.source}</Text>
              </View>
              <Text style={{ color:C.goldL, fontSize:16, textAlign:"right", lineHeight:26, marginBottom:8 }}>{item.ar}</Text>
              <Text style={{ color:C.white, fontSize:13, lineHeight:20 }}>{item.fr}</Text>
            </View>
          )} />
      </View>
    )
  }

  // ── TAJWID ──
  if (section === "tajwid") return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>Retour</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>🎓 Regles de Tajwid</Text>
      </View>
      <FlatList data={TAJWID_REGLES} keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding:16, gap:10 }}
        renderItem={({ item }) => (
          <View style={[styles.card, { padding:14, flexDirection:"row", gap:12, alignItems:"center" }]}>
            <View style={{ width:44, height:44, borderRadius:12, backgroundColor:C.green+"20", alignItems:"center", justifyContent:"center" }}>
              <Text style={{ fontSize:20 }}>{item.emoji}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ color:C.white, fontSize:14, fontWeight:"700" }}>{item.titre}</Text>
              <Text style={{ color:C.muted, fontSize:12, marginTop:4, lineHeight:18 }}>{item.desc}</Text>
            </View>
          </View>
        )} />
    </View>
  )

  // ── SIRA ──
  if (section === "sira") return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>Retour</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>🌟 La Sira du Prophete ﷺ</Text>
      </View>
      <FlatList data={SIRA_EVENTS} keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding:16, gap:10 }}
        renderItem={({ item }) => (
          <View style={[styles.card, { padding:14, flexDirection:"row", gap:12, alignItems:"center" }]}>
            <View style={{ alignItems:"center", width:50 }}>
              <Text style={{ fontSize:22 }}>{item.emoji}</Text>
              <Text style={{ color:C.gold, fontSize:11, fontWeight:"900", marginTop:4 }}>{item.annee}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ color:C.white, fontSize:14, fontWeight:"700" }}>{item.titre}</Text>
              <Text style={{ color:C.muted, fontSize:12, marginTop:4, lineHeight:18 }}>{item.desc}</Text>
            </View>
          </View>
        )} />
    </View>
  )

  // ── FIQH ──
  if (section === "fiqh") return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>Retour</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>🕌 Fiqh — Les bases</Text>
      </View>
      <FlatList data={FIQH_BASES} keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding:16, gap:10 }}
        renderItem={({ item }) => (
          <View style={[styles.card, { padding:14, flexDirection:"row", gap:12, alignItems:"center" }]}>
            <View style={{ width:44, height:44, borderRadius:12, backgroundColor:C.blue+"20", alignItems:"center", justifyContent:"center" }}>
              <Text style={{ fontSize:20 }}>{item.emoji}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ color:C.white, fontSize:14, fontWeight:"700" }}>{item.titre}</Text>
              <Text style={{ color:C.muted, fontSize:12, marginTop:4, lineHeight:18 }}>{item.desc}</Text>
            </View>
          </View>
        )} />
    </View>
  )

  // ── ARABE INTERACTIF ──
  if (section === "arabe" && arabeLecon) {
    const lecon = ARABE_LECONS.find(l => l.titre === arabeLecon)
    return (
      <View style={{ flex:1 }}>
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => { setArabeLecon(null); setRevealedItems({}) }} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
            <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
            <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>Retour</Text>
          </TouchableOpacity>
          <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>{lecon.emoji} {lecon.titre}</Text>
          <Text style={{ color:C.muted, fontSize:12, marginTop:4 }}>Tapez sur une carte pour reveler la reponse</Text>
        </View>
        <FlatList data={lecon.items} keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding:16, gap:10 }}
          numColumns={lecon.titre==="Alphabet" ? 4 : 1}
          key={lecon.titre==="Alphabet" ? "grid" : "list"}
          renderItem={({ item, index }) => {
            const revealed = revealedItems[index]
            if (lecon.titre === "Alphabet") return (
              <TouchableOpacity onPress={() => setRevealedItems(p => ({...p, [index]:!p[index]}))}
                style={[styles.card, { width:(W-56)/4, alignItems:"center", padding:10, margin:2, backgroundColor: revealed ? C.gold+"15" : C.card }]}>
                <Text style={{ fontSize:28, color:C.goldL }}>{item.ar}</Text>
                <Text style={{ color: revealed ? C.white : "transparent", fontSize:10, marginTop:4, fontWeight:"700" }}>{item.rom}</Text>
              </TouchableOpacity>
            )
            return (
              <TouchableOpacity onPress={() => setRevealedItems(p => ({...p, [index]:!p[index]}))}
                style={[styles.card, { padding:14, backgroundColor: revealed ? C.gold+"10" : C.card }]}>
                <Text style={{ color:C.goldL, fontSize:22, textAlign:"right", marginBottom:6 }}>{item.ar}</Text>
                <Text style={{ color:C.white, fontSize:13, fontWeight:"600" }}>{item.rom}</Text>
                {revealed && item.fr && <Text style={{ color:C.green, fontSize:12, marginTop:4, fontWeight:"700" }}>→ {item.fr}</Text>}
                {!revealed && <Text style={{ color:C.muted, fontSize:11, marginTop:4 }}>Tapez pour voir la traduction</Text>}
              </TouchableOpacity>
            )
          }} />
      </View>
    )
  }

  if (section === "arabe") return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>Retour</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>🖋️ Apprendre l'arabe</Text>
      </View>
      <FlatList data={ARABE_LECONS} keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding:16, gap:10 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setArabeLecon(item.titre)}
            style={[styles.card, { padding:14, flexDirection:"row", gap:12, alignItems:"center", borderLeftWidth:3, borderLeftColor:item.color }]}>
            <View style={{ width:44, height:44, borderRadius:12, backgroundColor:item.color+"20", alignItems:"center", justifyContent:"center" }}>
              <Text style={{ fontSize:20 }}>{item.emoji}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ color:C.white, fontSize:14, fontWeight:"700" }}>{item.titre}</Text>
              <Text style={{ color:C.muted, fontSize:12, marginTop:4 }}>{item.items.length} elements</Text>
            </View>
            <Text style={{ color:C.muted }}>→</Text>
          </TouchableOpacity>
        )} />
    </View>
  )

  // ── CALENDRIER HIJRI ──
  if (section === "calendrier") return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>Retour</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>📅 Calendrier Islamique</Text>
      </View>
      <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>
        {hijriDate && (
          <View style={[styles.card, { padding:20, alignItems:"center", marginBottom:16, borderWidth:1, borderColor:C.gold+"40" }]}>
            <Text style={{ color:C.gold, fontSize:12, fontWeight:"600", letterSpacing:2 }}>AUJOURD'HUI</Text>
            <Text style={{ color:C.white, fontSize:28, fontWeight:"900", marginTop:8 }}>{hijriDate.day} {hijriDate.month?.en || ""}</Text>
            <Text style={{ color:C.goldL, fontSize:16, marginTop:4 }}>{hijriDate.year} H</Text>
            <Text style={{ color:C.muted, fontSize:12, marginTop:4 }}>{hijriDate.designation?.expanded || "Hijri"}</Text>
          </View>
        )}
        <Text style={{ color:C.white, fontSize:16, fontWeight:"800", marginBottom:12 }}>Evenements islamiques</Text>
        {ISLAMIC_EVENTS.map((ev, i) => (
          <View key={i} style={[styles.card, { padding:14, flexDirection:"row", gap:12, alignItems:"center", marginBottom:8 }]}>
            <View style={{ alignItems:"center", width:44 }}>
              <Text style={{ fontSize:22 }}>{ev.emoji}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ color:C.white, fontSize:14, fontWeight:"700" }}>{ev.nom}</Text>
              <Text style={{ color:C.muted, fontSize:12, marginTop:3 }}>{ev.desc}</Text>
            </View>
            <View style={{ backgroundColor:ev.color+"20", borderRadius:99, paddingHorizontal:8, paddingVertical:3 }}>
              <Text style={{ color:ev.color, fontSize:9, fontWeight:"800" }}>{HIJRI_MONTHS[ev.mois-1]}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  )

  // ── MENU PRINCIPAL ──
  return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <Text style={styles.sectionLabel}>CULTURE ISLAMIQUE</Text>
        <Text style={{ color:C.gold, fontSize:18, fontWeight:"900" }}>📚 Apprendre & Grandir</Text>
      </View>
      <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection:"row", flexWrap:"wrap", gap:10 }}>
          {ITEMS.map((item, i) => (
            <TouchableOpacity key={i} onPress={() => setSection(item.id)} style={[styles.card, { width:(W-42)/2, alignItems:"center", paddingVertical:20, borderTopWidth:3, borderTopColor:item.color }]}>
              <Text style={{ fontSize:32 }}>{item.emoji}</Text>
              <Text style={{ color:C.white, fontSize:14, fontWeight:"800", marginTop:8, textAlign:"center" }}>{item.titre}</Text>
              <Text style={{ color:C.muted, fontSize:11, marginTop:4, textAlign:"center", lineHeight:15 }}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

// ─── Écran Finance ────────────────────────────────────────────────────────────
function EcranFinance() {
  const ITEMS = [
    { emoji:"🏦", titre:"Banque islamique", desc:"Comptes sans interets ribawi", color:C.gold, tag:"Halal" },
    { emoji:"🛡️", titre:"Takaful", desc:"Assurance islamique solidaire", color:C.green, tag:"Halal" },
    { emoji:"📈", titre:"Investissement", desc:"Actions et fonds conformes charia", color:C.blue, tag:"Halal" },
    { emoji:"💰", titre:"Zakat", desc:"Calculer et payer votre zakat", color:C.red, tag:"Obligatoire" },
  ]
  return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <Text style={styles.sectionLabel}>FINANCE ISLAMIQUE</Text>
        <Text style={{ color:C.gold, fontSize:18, fontWeight:"900" }}>🏦 Argent Halal</Text>
      </View>
      <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>
        {ITEMS.map((item, i) => (
          <TouchableOpacity key={i} style={[styles.card, { flexDirection:"row", alignItems:"center", gap:14, marginBottom:10 }]}>
            <View style={{ width:52, height:52, borderRadius:12, backgroundColor:item.color+"18", alignItems:"center", justifyContent:"center" }}>
              <Text style={{ fontSize:24 }}>{item.emoji}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ color:C.white, fontSize:15, fontWeight:"700" }}>{item.titre}</Text>
              <Text style={{ color:C.muted, fontSize:12, marginTop:3 }}>{item.desc}</Text>
            </View>
            <View style={{ backgroundColor:item.color+"25", borderRadius:99, paddingHorizontal:8, paddingVertical:2 }}>
              <Text style={{ color:item.color, fontSize:9, fontWeight:"800" }}>{item.tag}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

// ─── Écran Voyage ─────────────────────────────────────────────────────────────
function EcranVoyage() {
  const DESTINATIONS = [
    { emoji:"🕋", ville:"La Mecque", pays:"Arabie Saoudite", desc:"Omra & Hajj — Terre sacree", color:C.gold },
    { emoji:"🕌", ville:"Medine", pays:"Arabie Saoudite", desc:"La ville du Prophete ﷺ", color:C.green },
    { emoji:"🌙", ville:"Istanbul", pays:"Turquie", desc:"Cite des mosquees et de l'histoire", color:C.blue },
    { emoji:"🌴", ville:"Marrakech", pays:"Maroc", desc:"Joyau de l'Islam africain", color:C.red },
    { emoji:"🏛️", ville:"Jerusalem", pays:"Palestine", desc:"Al-Quds, 3eme lieu saint", color:C.purple },
    { emoji:"🌊", ville:"Dubai", pays:"Emirats", desc:"Modernite et tradition halal", color:C.teal },
  ]
  return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <Text style={styles.sectionLabel}>VOYAGES HALAL</Text>
        <Text style={{ color:C.gold, fontSize:18, fontWeight:"900" }}>✈️ Destinations</Text>
      </View>
      <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>
        {DESTINATIONS.map((dest, i) => (
          <TouchableOpacity key={i} style={[styles.card, { flexDirection:"row", alignItems:"center", gap:14, marginBottom:10, borderLeftWidth:3, borderLeftColor:dest.color }]}>
            <Text style={{ fontSize:32 }}>{dest.emoji}</Text>
            <View style={{ flex:1 }}>
              <Text style={{ color:C.white, fontSize:15, fontWeight:"800" }}>{dest.ville}</Text>
              <Text style={{ color:dest.color, fontSize:11, fontWeight:"600" }}>{dest.pays}</Text>
              <Text style={{ color:C.muted, fontSize:12, marginTop:3 }}>{dest.desc}</Text>
            </View>
            <Text style={{ color:C.muted, fontSize:18 }}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

// ─── Écran Profil ─────────────────────────────────────────────────────────────
function EcranProfil({ prayedToday, notifEnabled, onToggleNotif }) {
  const { user, isAnonymous } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notifCount, setNotifCount] = useState(0)

  const displayName = profile?.display_name || user?.user_metadata?.full_name || (isAnonymous ? "Visiteur" : user?.email?.split("@")[0] || "Utilisateur")
  const displayEmail = isAnonymous ? "Compte invite" : (user?.email || "")
  const prayedCount = Object.values(prayedToday).filter(Boolean).length

  useEffect(() => {
    if (user && !isAnonymous) {
      fetchProfile(user.id).then(p => { if (p) setProfile(p) })
    }
    Notifications.getScheduledNotificationsAsync().then(n => setNotifCount(n.length))
  }, [user])

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    setLoggingOut(false)
  }

  const handleToggleNotif = async (val) => {
    await onToggleNotif(val)
    setTimeout(() => {
      Notifications.getScheduledNotificationsAsync().then(n => setNotifCount(n.length))
    }, 500)
  }

  return (
    <ScrollView style={{ flex:1 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.screenHeader, { alignItems:"center" }]}>
        <View style={{ width:80, height:80, borderRadius:40, backgroundColor:C.gold, alignItems:"center", justifyContent:"center" }}>
          <Text style={{ fontSize:34 }}>{isAnonymous ? "👤" : "☪"}</Text>
        </View>
        <Text style={{ color:C.white, fontSize:20, fontWeight:"900", marginTop:14 }}>{displayName}</Text>
        <Text style={{ color:C.gold, fontSize:13, marginTop:2 }}>{displayEmail}</Text>
        {isAnonymous && (
          <View style={{ marginTop:12, paddingHorizontal:14, paddingVertical:6, backgroundColor:"rgba(201,168,76,.1)", borderRadius:99, borderWidth:1, borderColor:C.border }}>
            <Text style={{ color:C.muted, fontSize:11 }}>Mode invite — creez un compte pour sauvegarder</Text>
          </View>
        )}
        {/* Stats */}
        <View style={{ flexDirection:"row", gap:10, marginTop:20, width:"100%" }}>
          {[
            [String(prayedCount)+"/5", "Prieres", C.gold],
            [notifEnabled ? "ON" : "OFF", "Alertes", notifEnabled ? C.green : C.muted],
            [notifCount > 0 ? String(notifCount) : "—", "Notifs", C.blue],
          ].map(([v,l,col]) => (
            <View key={l} style={[styles.card, { flex:1, alignItems:"center", paddingVertical:14 }]}>
              <Text style={{ color:col, fontSize:20, fontWeight:"900" }}>{v}</Text>
              <Text style={{ color:C.muted, fontSize:10, marginTop:3, textAlign:"center" }}>{l}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ padding:16 }}>

        {/* Notifications toggle */}
        <View style={[styles.card, { marginBottom:12 }]}>
          <Text style={{ color:C.white, fontSize:14, fontWeight:"700", marginBottom:4 }}>🔔 Rappels de priere</Text>
          <Text style={{ color:C.muted, fontSize:12, marginBottom:12 }}>Notification avant chaque priere quotidienne</Text>
          <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
            <Text style={{ color: notifEnabled ? C.green : C.muted, fontSize:13 }}>
              {notifEnabled ? `Actif — ${notifCount} notif${notifCount > 1 ? 's' : ''} planifiee${notifCount > 1 ? 's' : ''}` : "Desactive"}
            </Text>
            <Switch
              value={notifEnabled}
              onValueChange={handleToggleNotif}
              trackColor={{ false: "#2A2A3A", true: "rgba(46,204,113,.4)" }}
              thumbColor={notifEnabled ? C.green : C.muted}
            />
          </View>
        </View>

        {/* Infos compte */}
        {[
          ["Version","FADJR v1.0 Sprint 5"],
          ["Email", displayEmail],
          ["A propos","Super-app halal francophone"],
        ].map(([label,desc],i) => (
          <View key={i} style={{ flexDirection:"row", alignItems:"center", gap:14, paddingVertical:14, borderBottomWidth:1, borderBottomColor:C.border }}>
            <View style={{ flex:1 }}>
              <Text style={{ color:C.white, fontSize:14, fontWeight:"600" }}>{label}</Text>
              <Text style={{ color:C.muted, fontSize:12, marginTop:2 }}>{desc}</Text>
            </View>
          </View>
        ))}

        {isAnonymous && (
          <TouchableOpacity onPress={() => supabase.auth.signOut()}
            style={{ marginTop:20, borderWidth:1, borderColor:C.gold, borderRadius:12, paddingVertical:13, alignItems:"center" }}>
            <Text style={{ color:C.gold, fontSize:14, fontWeight:"700" }}>Creer un compte →</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={handleLogout} disabled={loggingOut}
          style={{ marginTop:isAnonymous ? 12 : 24, backgroundColor:"rgba(231,76,60,.1)", borderWidth:1, borderColor:"rgba(231,76,60,.3)", borderRadius:12, paddingVertical:13, alignItems:"center" }}>
          {loggingOut
            ? <ActivityIndicator color={C.red} size="small" />
            : <Text style={{ color:C.red, fontSize:14, fontWeight:"700" }}>Se deconnecter</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(undefined)
  const [tab, setTab] = useState("accueil")
  const [prayers, setPrayers] = useState([])
  const [city] = useState("Bruxelles")
  const [loading, setLoading] = useState(true)
  const [nextPrayer, setNextPrayer] = useState(null)
  const [timeToNext, setTimeToNext] = useState("")
  const [hijriDate, setHijriDate] = useState("")
  // Tracker prières
  const [prayedToday, setPrayedToday] = useState({})
  // Notifications
  const [notifEnabled, setNotifEnabled] = useState(false)
  const notifListener = useRef()
  const responseListener = useRef()

  // ── Auth ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s ?? null))
    return () => subscription.unsubscribe()
  }, [])

  // ── Charger tracker prières depuis Supabase ou AsyncStorage ──
  useEffect(() => {
    const loadTracked = async () => {
      const user = session?.user
      if (user && !user.is_anonymous) {
        const remote = await fetchPrayerTracked(user.id)
        if (remote && Object.keys(remote).length > 0) { setPrayedToday(remote); return }
      }
      // Fallback local
      const key = `fadjr_prayed_${todayKey()}`
      const local = await AsyncStorage.getItem(key)
      if (local) setPrayedToday(JSON.parse(local))
    }
    if (session !== undefined) loadTracked()
  }, [session])

  // ── Toggle prière accomplie ──
  const onTogglePrayed = useCallback(async (prayerName) => {
    const updated = { ...prayedToday, [prayerName]: !prayedToday[prayerName] }
    setPrayedToday(updated)
    // Persister local
    const key = `fadjr_prayed_${todayKey()}`
    await AsyncStorage.setItem(key, JSON.stringify(updated))
    // Sync Supabase si connecté
    const user = session?.user
    if (user && !user.is_anonymous) {
      await savePrayerTracked(user.id, updated)
    }
  }, [prayedToday, session])

  // ── Prières + next ──
  useEffect(() => {
    const computeNext = (list) => {
      const now = new Date()
      const nowMin = now.getHours()*60 + now.getMinutes()
      for (const p of list) {
        const [h, m] = p.time.split(":").map(Number)
        if (h*60+m > nowMin) {
          const diff = h*60+m - nowMin
          setNextPrayer(p)
          setTimeToNext(`${Math.floor(diff/60)}h${String(diff%60).padStart(2,"0")}`)
          return
        }
      }
      setNextPrayer(list[0]); setTimeToNext("demain")
    }
    const fetchPrayers = async () => {
      try {
        const today = new Date()
        const res = await fetch(`https://api.aladhan.com/v1/timings/${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}?latitude=50.8503&longitude=4.3517&method=3`)
        const data = await res.json()
        if (data.code === 200) {
          const t = data.data.timings
          const h = data.data.date?.hijri
          if (h) setHijriDate(`${h.day} ${h.month?.en} ${h.year} H`)
          const list = [
            { name:"Fajr", ar:PRAYER_AR[0], time:t.Fajr, emoji:PRAYER_EMOJI[0] },
            { name:"Sunrise", ar:PRAYER_AR[1], time:t.Sunrise, emoji:PRAYER_EMOJI[1] },
            { name:"Dhuhr", ar:PRAYER_AR[2], time:t.Dhuhr, emoji:PRAYER_EMOJI[2] },
            { name:"Asr", ar:PRAYER_AR[3], time:t.Asr, emoji:PRAYER_EMOJI[3] },
            { name:"Maghrib", ar:PRAYER_AR[4], time:t.Maghrib, emoji:PRAYER_EMOJI[4] },
            { name:"Isha", ar:PRAYER_AR[5], time:t.Isha, emoji:PRAYER_EMOJI[5] },
          ]
          setPrayers(list); computeNext(list)
        }
      } catch {
        const fallback = [
          { name:"Fajr", ar:PRAYER_AR[0], time:"05:42", emoji:PRAYER_EMOJI[0] },
          { name:"Sunrise", ar:PRAYER_AR[1], time:"07:18", emoji:PRAYER_EMOJI[1] },
          { name:"Dhuhr", ar:PRAYER_AR[2], time:"13:12", emoji:PRAYER_EMOJI[2] },
          { name:"Asr", ar:PRAYER_AR[3], time:"16:35", emoji:PRAYER_EMOJI[3] },
          { name:"Maghrib", ar:PRAYER_AR[4], time:"19:48", emoji:PRAYER_EMOJI[4] },
          { name:"Isha", ar:PRAYER_AR[5], time:"21:22", emoji:PRAYER_EMOJI[5] },
        ]
        setPrayers(fallback); computeNext(fallback)
      } finally { setLoading(false) }
    }
    fetchPrayers()
  }, [])

  // ── Notifications setup ──
  useEffect(() => {
    // Charger préférence notifs
    AsyncStorage.getItem('fadjr_notif_enabled').then(val => {
      if (val === 'true') setNotifEnabled(true)
    })
    // Listeners
    notifListener.current = Notifications.addNotificationReceivedListener(notif => {
      console.log('Notification reçue:', notif.request.content.title)
    })
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const prayer = response.notification.request.content.data?.prayer
      if (prayer) setTab('priere')
    })
    // Android channel
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('prayers', {
        name: 'Rappels de prière',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#C9A84C',
        sound: 'default',
      })
    }
    return () => {
      notifListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [])

  // ── Planifier notifs quand prayers chargées ──
  useEffect(() => {
    if (prayers.length > 0 && notifEnabled) {
      schedulePrayerNotifications(prayers)
    }
  }, [prayers, notifEnabled])

  // ── Toggle notifications ──
  const onToggleNotif = async (val) => {
    setNotifEnabled(val)
    await AsyncStorage.setItem('fadjr_notif_enabled', val ? 'true' : 'false')
    if (val) {
      const count = await schedulePrayerNotifications(prayers)
      if (count === false) {
        Alert.alert(
          "Permission requise",
          "Autorisez les notifications dans les réglages de votre téléphone pour recevoir les rappels de prière.",
          [{ text: "OK" }]
        )
        setNotifEnabled(false)
        await AsyncStorage.setItem('fadjr_notif_enabled', 'false')
      }
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync()
    }
  }

  // ── Splash ──
  if (session === undefined) {
    return (
      <View style={{ flex:1, backgroundColor:C.bg, alignItems:"center", justifyContent:"center" }}>
        <Text style={{ color:C.gold, fontSize:36, fontWeight:"900", letterSpacing:6 }}>FADJR</Text>
        <ActivityIndicator color={C.gold} style={{ marginTop:24 }} />
      </View>
    )
  }

  const isAnonymous = session?.user?.is_anonymous === true
  const authValue = { user: session?.user ?? null, isAnonymous }

  if (!session) {
    return <AuthContext.Provider value={authValue}><EcranAuth /></AuthContext.Provider>
  }

  const NAV = [
    { id:"accueil", icon:"🏠", label:"Accueil" },
    { id:"priere", icon:"🕌", label:"Priere" },
    { id:"carte", icon:"🗺️", label:"Halal" },
    { id:"culture", icon:"📚", label:"Culture" },
    { id:"profil", icon:"👤", label:"Profil" },
  ]

  return (
    <AuthContext.Provider value={authValue}>
      <View style={{ flex:1, backgroundColor:C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <View style={{ flex:1 }}>
          {tab==="accueil" && <EcranAccueil prayers={prayers} city={city} nextPrayer={nextPrayer} timeToNext={timeToNext} setTab={setTab} hijriDate={hijriDate} />}
          {tab==="priere" && <EcranPriere prayers={prayers} city={city} loading={loading} nextPrayer={nextPrayer} prayedToday={prayedToday} onTogglePrayed={onTogglePrayed} />}
          {tab==="carte" && <EcranCarte />}
          {tab==="culture" && <EcranCulture />}
          {tab==="finance" && <EcranFinance />}
          {tab==="voyage" && <EcranVoyage />}
          {tab==="profil" && <EcranProfil prayedToday={prayedToday} notifEnabled={notifEnabled} onToggleNotif={onToggleNotif} />}
        </View>
        <View style={styles.tabBar}>
          {NAV.map(n => {
            const isCurrent = tab === n.id
            const badge = n.id === "priere" ? Object.values(prayedToday).filter(Boolean).length : null
            return (
              <TouchableOpacity key={n.id} onPress={() => setTab(n.id)} style={styles.tabItem}>
                {isCurrent && <View style={{ position:"absolute", top:-1, left:"25%", right:"25%", height:2, backgroundColor:C.gold, borderRadius:99 }} />}
                <View>
                  <Text style={{ fontSize:22, opacity:isCurrent ? 1 : 0.4 }}>{n.icon}</Text>
                  {badge !== null && badge > 0 && (
                    <View style={{ position:"absolute", top:-2, right:-4, width:14, height:14, borderRadius:7, backgroundColor:C.green, alignItems:"center", justifyContent:"center" }}>
                      <Text style={{ color:"#fff", fontSize:8, fontWeight:"900" }}>{badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={{ color:isCurrent ? C.gold : C.muted, fontSize:9, marginTop:2, fontWeight:isCurrent?"700":"400" }}>{n.label.toUpperCase()}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </AuthContext.Provider>
  )
}

const styles = StyleSheet.create({
  input: { backgroundColor:C.card, borderWidth:1, borderColor:"rgba(201,168,76,0.15)", borderRadius:12, padding:14, color:"#F0EAD8", fontSize:14 },
  heroHeader: { backgroundColor:"#0D0D20", padding:20, paddingTop:50, borderBottomWidth:1, borderBottomColor:"rgba(201,168,76,0.15)" },
  nextPrayerCard: { backgroundColor:"#1A1A35", borderWidth:1, borderColor:"rgba(201,168,76,.3)", borderLeftWidth:4, borderLeftColor:"#C9A84C", borderRadius:14, padding:16, flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  screenHeader: { backgroundColor:"#0D0D20", padding:20, paddingTop:50, borderBottomWidth:1, borderBottomColor:"rgba(201,168,76,0.15)" },
  sectionLabel: { color:"#5A5A7A", fontSize:10, letterSpacing:2, marginBottom:8, fontWeight:"600" },
  card: { backgroundColor:"#12121E", borderWidth:1, borderColor:"rgba(201,168,76,0.15)", borderRadius:14, padding:16 },
  pilierBtn: { backgroundColor:"#12121E", borderWidth:1, borderColor:"rgba(201,168,76,0.15)", borderRadius:12, padding:14, alignItems:"center" },
  subTabBtn: { flex:1, paddingVertical:8, alignItems:"center", borderRadius:9, backgroundColor:"rgba(255,255,255,.05)", borderBottomWidth:2, borderBottomColor:"transparent" },
  subTabActive: { backgroundColor:"rgba(201,168,76,.15)", borderBottomColor:"#C9A84C" },
  tabBar: { flexDirection:"row", backgroundColor:"rgba(10,10,20,.97)", borderTopWidth:1, borderTopColor:"rgba(201,168,76,0.15)", paddingBottom:8, paddingTop:8 },
  tabItem: { flex:1, alignItems:"center", position:"relative" },
})
