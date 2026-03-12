import { useState, useEffect } from "react"
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  StatusBar, TextInput, ActivityIndicator, Dimensions, FlatList
} from "react-native"

const C = {
  bg:"#0A0A14", card:"#12121E", card2:"#1A1A2E",
  gold:"#C9A84C", goldL:"#F0D080", white:"#F0EAD8",
  muted:"#5A5A7A", green:"#2ECC71", blue:"#3498DB",
  red:"#E74C3C", purple:"#9B59B6", teal:"#1ABC9C",
  brown:"#8B5E3C", border:"rgba(201,168,76,0.15)",
}
const { width: W } = Dimensions.get("window")

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
const PRAYER_AR = ["Al-Fajr","Ash-Shurouq","Adh-Dhuhr","Al-Asr","Al-Maghrib","Al-Icha"]
const PRAYER_EMOJI = ["🌙","🌅","☀️","🌤️","🌇","🌃"]

function EcranAccueil({ prayers, city, nextPrayer, timeToNext, setTab }) {
  const now = new Date()
  const h = now.getHours()
  const greeting = h < 12 ? "Sabah al-khayr" : h < 18 ? "Assalamu alaykum" : "Masa al-khayr"
  return (
    <ScrollView style={{ flex:1 }} showsVerticalScrollIndicator={false}>
      <View style={styles.heroHeader}>
        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <View>
            <Text style={{ color:"#5A5A7A", fontSize:13, marginBottom:4 }}>{greeting}</Text>
            <Text style={{ color:"#C9A84C", fontSize:26, fontWeight:"900", letterSpacing:3 }}>FADJR</Text>
            <Text style={{ color:"#C9A84C", fontSize:11, letterSpacing:2, opacity:.7 }}>☪ {city}</Text>
          </View>
          <View style={{ alignItems:"flex-end" }}>
            <Text style={{ color:"#5A5A7A", fontSize:11 }}>{now.toLocaleDateString("fr-BE",{weekday:"long",day:"numeric",month:"long"})}</Text>
            <Text style={{ color:"#C9A84C", fontSize:12, marginTop:3 }}>12 Ramadan 1447 H</Text>
          </View>
        </View>
        {nextPrayer && (
          <View style={styles.nextPrayerCard}>
            <View>
              <Text style={{ color:"#5A5A7A", fontSize:10, letterSpacing:2, marginBottom:4 }}>PROCHAINE PRIERE</Text>
              <Text style={{ color:"#C9A84C", fontSize:24, fontWeight:"900" }}>{nextPrayer.name}</Text>
              <Text style={{ color:"#F0EAD8", fontSize:13, opacity:.6 }}>{nextPrayer.ar}</Text>
            </View>
            <View style={{ alignItems:"flex-end" }}>
              <Text style={{ color:"#F0EAD8", fontSize:30, fontWeight:"900" }}>{nextPrayer.time}</Text>
              <Text style={{ color:"#2ECC71", fontSize:12, marginTop:4 }}>dans {timeToNext}</Text>
              <Text style={{ fontSize:20, marginTop:4 }}>{nextPrayer.emoji}</Text>
            </View>
          </View>
        )}
      </View>
      <View style={{ padding:16 }}>
        <Text style={styles.sectionLabel}>EXPLORER</Text>
        <View style={{ flexDirection:"row", flexWrap:"wrap", gap:10, marginBottom:24 }}>
          {[
            { icon:"🕌", label:"Priere", color:"#C9A84C", tab:"priere" },
            { icon:"🍽️", label:"Halal", color:"#E74C3C", tab:"carte" },
            { icon:"📚", label:"Culture", color:"#8B5E3C", tab:"culture" },
            { icon:"🏦", label:"Finance", color:"#9B59B6", tab:"finance" },
            { icon:"✈️", label:"Voyage", color:"#3498DB", tab:"voyage" },
            { icon:"👥", label:"Communaute", color:"#1ABC9C", tab:"profil" },
          ].map(p => (
            <TouchableOpacity key={p.tab} onPress={() => setTab(p.tab)}
              style={[styles.pilierBtn, { borderTopColor:p.color, borderTopWidth:2, width:(W-48)/3 }]}>
              <Text style={{ fontSize:26 }}>{p.icon}</Text>
              <Text style={{ color:"#F0EAD8", fontSize:10, fontWeight:"700", letterSpacing:1, marginTop:4 }}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <Text style={styles.sectionLabel}>PRES DE VOUS</Text>
          <TouchableOpacity onPress={() => setTab("carte")}>
            <Text style={{ color:"#C9A84C", fontSize:12 }}>Voir tout →</Text>
          </TouchableOpacity>
        </View>
        {COMMERCES.slice(0,3).map(c => (
          <View key={c.id} style={[styles.card, { flexDirection:"row", alignItems:"center", gap:14, marginBottom:10 }]}>
            <View style={{ width:46, height:46, borderRadius:12, backgroundColor:c.color+"18", alignItems:"center", justifyContent:"center" }}>
              <Text style={{ fontSize:22 }}>{c.emoji}</Text>
            </View>
            <View style={{ flex:1 }}>
              <View style={{ flexDirection:"row", justifyContent:"space-between" }}>
                <Text style={{ color:"#F0EAD8", fontSize:14, fontWeight:"700" }}>{c.nom}</Text>
                <Text style={{ color:"#5A5A7A", fontSize:11 }}>{c.distance}</Text>
              </View>
              <Text style={{ color:"#C9A84C", fontSize:11 }}>{"★".repeat(Math.floor(c.note))} {c.note}</Text>
              <Text style={{ color:"#5A5A7A", fontSize:11, marginTop:2 }}>{c.spec.substring(0,38)}...</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

function EcranPriere({ prayers, city, loading, nextPrayer }) {
  const [subTab, setSubTab] = useState("horaires")
  const [dhikrIdx, setDhikrIdx] = useState(0)
  const [dhikrCount, setDhikrCount] = useState(0)
  const d = DHIKR[dhikrIdx]
  return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <Text style={styles.sectionLabel}>PRIERE & SPIRITUALITE</Text>
        <Text style={{ color:"#C9A84C", fontSize:18, fontWeight:"900" }}>☪ {city}</Text>
        <View style={{ flexDirection:"row", gap:8, marginTop:12 }}>
          {[["horaires","Horaires"],["qibla","Qibla"],["dhikr","Dhikr"]].map(([key,label]) => (
            <TouchableOpacity key={key} onPress={() => setSubTab(key)}
              style={[styles.subTabBtn, subTab===key && styles.subTabActive]}>
              <Text style={{ color:subTab===key ? "#C9A84C" : "#5A5A7A", fontSize:12, fontWeight:subTab===key?"700":"400" }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>
        {subTab==="horaires" && (loading ? (
          <View style={{ alignItems:"center", paddingTop:60 }}>
            <ActivityIndicator color="#C9A84C" size="large" />
            <Text style={{ color:"#5A5A7A", marginTop:16 }}>Chargement Aladhan API...</Text>
          </View>
        ) : prayers.map((p,i) => {
          const isNext = nextPrayer && nextPrayer.name === p.name
          return (
            <View key={i} style={[styles.card, { flexDirection:"row", alignItems:"center", gap:14, marginBottom:10,
              borderLeftWidth:4, borderLeftColor:isNext ? "#C9A84C" : "transparent",
              backgroundColor:isNext ? "#1C1C35" : "#12121E" }]}>
              <Text style={{ fontSize:28, width:36, textAlign:"center" }}>{p.emoji}</Text>
              <View style={{ flex:1 }}>
                <Text style={{ color:isNext ? "#C9A84C" : "#F0EAD8", fontSize:16, fontWeight:"700" }}>{p.name}</Text>
                <Text style={{ color:"#5A5A7A", fontSize:13 }}>{p.ar}</Text>
              </View>
              <View style={{ alignItems:"flex-end" }}>
                <Text style={{ color:isNext ? "#C9A84C" : "#F0EAD8", fontSize:22, fontWeight:"900" }}>{p.time}</Text>
                {isNext && <Text style={{ color:"#2ECC71", fontSize:10, marginTop:2 }}>prochaine</Text>}
              </View>
            </View>
          )
        }))}
        {subTab==="qibla" && (
          <View style={{ alignItems:"center", paddingTop:20 }}>
            <View style={{ width:200, height:200, borderRadius:100, borderWidth:2, borderColor:"rgba(201,168,76,.3)", backgroundColor:"#1A1A30", alignItems:"center", justifyContent:"center" }}>
              <Text style={{ fontSize:32 }}>🕋</Text>
            </View>
            <Text style={{ color:"#C9A84C", fontSize:40, fontWeight:"900", marginTop:20 }}>127°</Text>
            <Text style={{ color:"#F0EAD8", fontSize:16 }}>Direction de La Mecque</Text>
            <Text style={{ color:"#5A5A7A", fontSize:13, marginTop:4 }}>depuis Bruxelles, Belgique</Text>
            <View style={[styles.card, { marginTop:20, width:"100%", alignItems:"center" }]}>
              <Text style={{ color:"#C9A84C", fontSize:28, fontWeight:"900" }}>5 248 km</Text>
              <Text style={{ color:"#5A5A7A", fontSize:12 }}>jusqu a la Kaaba</Text>
            </View>
          </View>
        )}
        {subTab==="dhikr" && (
          <View style={{ alignItems:"center" }}>
            <View style={[styles.card, { width:"100%", alignItems:"center", paddingVertical:24, marginBottom:20 }]}>
              <Text style={{ fontSize:22, color:"#C9A84C", marginBottom:12, textAlign:"center" }}>{d.ar}</Text>
              <Text style={{ color:"#F0EAD8", fontSize:18, fontWeight:"700" }}>{d.fr}</Text>
              <Text style={{ color:"#5A5A7A", fontSize:13, marginTop:4 }}>{d.trad}</Text>
              <Text style={{ color:"#C9A84C", fontSize:12, marginTop:8 }}>x {d.count}</Text>
            </View>
            <TouchableOpacity onPress={() => setDhikrCount(c => c >= d.count ? 0 : c+1)}
              style={{ width:140, height:140, borderRadius:70, backgroundColor:"#12121E", borderWidth:3, borderColor:dhikrCount >= d.count ? "#2ECC71" : "#C9A84C", alignItems:"center", justifyContent:"center", marginVertical:10 }}>
              <Text style={{ color:dhikrCount >= d.count ? "#2ECC71" : "#C9A84C", fontSize:44, fontWeight:"900" }}>{dhikrCount}</Text>
              <Text style={{ color:"#5A5A7A", fontSize:12 }}>sur {d.count}</Text>
            </TouchableOpacity>
            <View style={{ width:"100%", height:6, backgroundColor:"rgba(255,255,255,.06)", borderRadius:99, overflow:"hidden", marginTop:10 }}>
              <View style={{ width:`${Math.min((dhikrCount/d.count)*100,100)}%`, height:"100%", backgroundColor:"#C9A84C", borderRadius:99 }} />
            </View>
            <View style={{ flexDirection:"row", flexWrap:"wrap", gap:8, marginTop:20, width:"100%" }}>
              {DHIKR.map((dh,i) => (
                <TouchableOpacity key={i} onPress={() => { setDhikrIdx(i); setDhikrCount(0) }}
                  style={[styles.card, { width:"48%", padding:10, borderColor:dhikrIdx===i ? "#C9A84C" : "rgba(201,168,76,0.15)" }]}>
                  <Text style={{ color:dhikrIdx===i ? "#C9A84C" : "#F0EAD8", fontSize:12, fontWeight:"700" }}>{dh.fr}</Text>
                  <Text style={{ color:"#5A5A7A", fontSize:10 }}>x {dh.count}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

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
          placeholderTextColor="#5A5A7A"
          style={{ backgroundColor:"#12121E", borderWidth:1, borderColor:"rgba(201,168,76,0.15)", borderRadius:10, padding:11, color:"#F0EAD8", fontSize:13, marginTop:8 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop:10 }}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c} onPress={() => setCat(c)}
              style={{ paddingHorizontal:14, paddingVertical:6, borderRadius:99, borderWidth:1, borderColor:cat===c ? "#C9A84C" : "rgba(201,168,76,0.15)", backgroundColor:cat===c ? "rgba(201,168,76,.15)" : "#12121E", marginRight:6 }}>
              <Text style={{ color:cat===c ? "#C9A84C" : "#5A5A7A", fontSize:12, fontWeight:cat===c?"700":"400" }}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <FlatList data={filtered} keyExtractor={c => String(c.id)} contentContainerStyle={{ padding:16 }} showsVerticalScrollIndicator={false}
        renderItem={({ item:c }) => (
          <TouchableOpacity onPress={() => setSelected(selected?.id===c.id ? null : c)}
            style={[styles.card, { marginBottom:10, borderColor:selected?.id===c.id ? c.color : "rgba(201,168,76,0.15)", backgroundColor:selected?.id===c.id ? "#1C1C35" : "#12121E" }]}>
            <View style={{ flexDirection:"row", alignItems:"flex-start", gap:14 }}>
              <View style={{ width:52, height:52, borderRadius:12, backgroundColor:c.color+"18", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Text style={{ fontSize:24 }}>{c.emoji}</Text>
              </View>
              <View style={{ flex:1 }}>
                <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:4 }}>
                  <Text style={{ color:selected?.id===c.id ? c.color : "#F0EAD8", fontSize:15, fontWeight:"700", flex:1 }}>{c.nom}</Text>
                  <Text style={{ color:"#5A5A7A", fontSize:11, marginLeft:8 }}>{c.distance}</Text>
                </View>
                <Text style={{ color:"#C9A84C", fontSize:11 }}>{"★".repeat(Math.floor(c.note))} {c.note}</Text>
                <Text style={{ color:"#5A5A7A", fontSize:11, marginTop:3 }}>{c.adresse}</Text>
                <View style={{ flexDirection:"row", gap:6, marginTop:6 }}>
                  <View style={{ backgroundColor:c.color+"18", borderRadius:99, paddingHorizontal:8, paddingVertical:2, borderWidth:1, borderColor:c.color+"40" }}>
                    <Text style={{ color:c.color, fontSize:10, fontWeight:"700" }}>{c.certif}</Text>
                  </View>
                  <Text style={{ color:c.ouvert ? "#2ECC71" : "#E74C3C", fontSize:10, fontWeight:"700" }}>{c.ouvert ? "Ouvert" : "Ferme"}</Text>
                </View>
                {selected?.id===c.id && (
                  <View style={{ marginTop:12, paddingTop:12, borderTopWidth:1, borderTopColor:"rgba(201,168,76,0.15)" }}>
                    <Text style={{ color:"#F0EAD8", fontSize:12, marginBottom:10 }}>{c.spec}</Text>
                    <View style={{ flexDirection:"row", gap:8 }}>
                      {[["Appeler",c.color],["Y aller","#3498DB"],["Favori","#C9A84C"]].map(([label,col]) => (
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

function EcranProfil() {
  return (
    <ScrollView style={{ flex:1 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.screenHeader, { alignItems:"center" }]}>
        <View style={{ width:80, height:80, borderRadius:40, backgroundColor:"#C9A84C", alignItems:"center", justifyContent:"center" }}>
          <Text style={{ fontSize:34 }}>☪</Text>
        </View>
        <Text style={{ color:"#F0EAD8", fontSize:20, fontWeight:"900", marginTop:14 }}>Nourdin</Text>
        <Text style={{ color:"#C9A84C", fontSize:13, marginTop:2 }}>Bruxelles, Belgique</Text>
        <View style={{ flexDirection:"row", gap:10, marginTop:20, width:"100%" }}>
          {[["3/5","Prieres","#C9A84C"],["7","Favoris","#3498DB"],["12","Avis","#2ECC71"]].map(([v,l,col]) => (
            <View key={l} style={[styles.card, { flex:1, alignItems:"center", paddingVertical:14 }]}>
              <Text style={{ color:col, fontSize:20, fontWeight:"900" }}>{v}</Text>
              <Text style={{ color:"#5A5A7A", fontSize:10, marginTop:3, textAlign:"center" }}>{l}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ padding:16 }}>
        {[["Ville","Bruxelles 50.850N 4.352E"],["Version","FADJR v1.0 Sprint 1 MVP"],["Email","nourdin@fadjr.app"],["A propos","Super-app halal francophone"]].map(([label,desc],i) => (
          <View key={i} style={{ flexDirection:"row", alignItems:"center", gap:14, paddingVertical:14, borderBottomWidth:1, borderBottomColor:"rgba(201,168,76,0.15)" }}>
            <View style={{ flex:1 }}>
              <Text style={{ color:"#F0EAD8", fontSize:14, fontWeight:"600" }}>{label}</Text>
              <Text style={{ color:"#5A5A7A", fontSize:12, marginTop:2 }}>{desc}</Text>
            </View>
            <Text style={{ color:"#5A5A7A", fontSize:18 }}>›</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

export default function App() {
  const [tab, setTab] = useState("accueil")
  const [prayers, setPrayers] = useState([])
  const [city, setCity] = useState("Bruxelles")
  const [loading, setLoading] = useState(true)
  const [nextPrayer, setNextPrayer] = useState(null)
  const [timeToNext, setTimeToNext] = useState("")

  useEffect(() => {
    const fetchPrayers = async (lat = 50.8503, lng = 4.3517) => {
      try {
        const today = new Date()
        const res = await fetch(`https://api.aladhan.com/v1/timings/${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}?latitude=${lat}&longitude=${lng}&method=3`)
        const data = await res.json()
        if (data.code === 200) {
          const t = data.data.timings
          const list = [
            { name:"Fajr",    ar:PRAYER_AR[0], time:t.Fajr,    emoji:PRAYER_EMOJI[0] },
            { name:"Sunrise", ar:PRAYER_AR[1], time:t.Sunrise,  emoji:PRAYER_EMOJI[1] },
            { name:"Dhuhr",   ar:PRAYER_AR[2], time:t.Dhuhr,   emoji:PRAYER_EMOJI[2] },
            { name:"Asr",     ar:PRAYER_AR[3], time:t.Asr,     emoji:PRAYER_EMOJI[3] },
            { name:"Maghrib", ar:PRAYER_AR[4], time:t.Maghrib,  emoji:PRAYER_EMOJI[4] },
            { name:"Isha",    ar:PRAYER_AR[5], time:t.Isha,    emoji:PRAYER_EMOJI[5] },
          ]
          setPrayers(list)
          computeNext(list)
        }
      } catch(e) {
        const fallback = [
          { name:"Fajr", ar:PRAYER_AR[0], time:"05:42", emoji:PRAYER_EMOJI[0] },
          { name:"Sunrise", ar:PRAYER_AR[1], time:"07:18", emoji:PRAYER_EMOJI[1] },
          { name:"Dhuhr", ar:PRAYER_AR[2], time:"13:12", emoji:PRAYER_EMOJI[2] },
          { name:"Asr", ar:PRAYER_AR[3], time:"16:35", emoji:PRAYER_EMOJI[3] },
          { name:"Maghrib", ar:PRAYER_AR[4], time:"19:48", emoji:PRAYER_EMOJI[4] },
          { name:"Isha", ar:PRAYER_AR[5], time:"21:22", emoji:PRAYER_EMOJI[5] },
        ]
        setPrayers(fallback)
        computeNext(fallback)
      } finally { setLoading(false) }
    }
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
      setNextPrayer(list[0])
      setTimeToNext("demain")
    }
    fetchPrayers()
  }, [])

  const NAV = [
    { id:"accueil", icon:"🏠", label:"Accueil" },
    { id:"priere",  icon:"🕌", label:"Priere" },
    { id:"carte",   icon:"🗺️", label:"Halal" },
    { id:"culture", icon:"📚", label:"Culture" },
    { id:"profil",  icon:"👤", label:"Profil" },
  ]

  return (
    <View style={{ flex:1, backgroundColor:"#0A0A14" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A14" />
      <View style={{ flex:1 }}>
        {tab==="accueil" && <EcranAccueil prayers={prayers} city={city} nextPrayer={nextPrayer} timeToNext={timeToNext} setTab={setTab} />}
        {tab==="priere"  && <EcranPriere  prayers={prayers} city={city} loading={loading} nextPrayer={nextPrayer} />}
        {tab==="carte"   && <EcranCarte />}
        {(tab==="culture"||tab==="finance"||tab==="voyage") && <EcranProfil />}
        {tab==="profil"  && <EcranProfil />}
      </View>
      <View style={styles.tabBar}>
        {NAV.map(n => (
          <TouchableOpacity key={n.id} onPress={() => setTab(n.id)} style={styles.tabItem}>
            {tab===n.id && <View style={{ position:"absolute", top:-1, left:"25%", right:"25%", height:2, backgroundColor:"#C9A84C", borderRadius:99 }} />}
            <Text style={{ fontSize:22, opacity:tab===n.id ? 1 : 0.4 }}>{n.icon}</Text>
            <Text style={{ color:tab===n.id ? "#C9A84C" : "#5A5A7A", fontSize:9, marginTop:2, fontWeight:tab===n.id?"700":"400" }}>{n.label.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
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
