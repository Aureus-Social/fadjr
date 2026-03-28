import 'react-native-url-polyfill/auto'
import { useState, useEffect, useRef, createContext, useContext, useCallback } from "react"
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  StatusBar, TextInput, ActivityIndicator, Dimensions, FlatList,
  KeyboardAvoidingView, Platform, Alert, Switch, Linking, Share
} from "react-native"
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import * as Location from 'expo-location'
import * as Updates from 'expo-updates'
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio'

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

// ─── i18n — 12 langues ────────────────────────────────────────────────────────
const LangContext = createContext({ lang:"fr", setLang:()=>{}, t:(k)=>k })
const useLang = () => useContext(LangContext)

const LANGS = [
  { code:"fr", label:"Français", flag:"🇫🇷" },
  { code:"en", label:"English", flag:"🇬🇧" },
  { code:"ar", label:"العربية", flag:"🇸🇦" },
  { code:"tr", label:"Türkçe", flag:"🇹🇷" },
  { code:"de", label:"Deutsch", flag:"🇩🇪" },
  { code:"nl", label:"Nederlands", flag:"🇳🇱" },
  { code:"es", label:"Español", flag:"🇪🇸" },
  { code:"id", label:"Bahasa", flag:"🇮🇩" },
  { code:"ur", label:"اردو", flag:"🇵🇰" },
  { code:"ms", label:"Melayu", flag:"🇲🇾" },
  { code:"it", label:"Italiano", flag:"🇮🇹" },
  { code:"pt", label:"Português", flag:"🇧🇷" },
]

const T = {
  // ── Tabs ──
  accueil:{fr:"ACCUEIL",en:"HOME",ar:"الرئيسية",tr:"ANA SAYFA",de:"STARTSEITE",nl:"HOME",es:"INICIO",id:"BERANDA",ur:"ہوم",ms:"UTAMA",it:"HOME",pt:"INÍCIO"},
  priere:{fr:"PRIERE",en:"PRAYER",ar:"الصلاة",tr:"NAMAZ",de:"GEBET",nl:"GEBED",es:"ORACIÓN",id:"SHOLAT",ur:"نماز",ms:"SOLAT",it:"PREGHIERA",pt:"ORAÇÃO"},
  halal:{fr:"HALAL",en:"HALAL",ar:"حلال",tr:"HELAL",de:"HALAL",nl:"HALAL",es:"HALAL",id:"HALAL",ur:"حلال",ms:"HALAL",it:"HALAL",pt:"HALAL"},
  culture:{fr:"CULTURE",en:"CULTURE",ar:"ثقافة",tr:"KÜLTÜR",de:"KULTUR",nl:"CULTUUR",es:"CULTURA",id:"BUDAYA",ur:"ثقافت",ms:"BUDAYA",it:"CULTURA",pt:"CULTURA"},
  profil:{fr:"PROFIL",en:"PROFILE",ar:"الملف",tr:"PROFİL",de:"PROFIL",nl:"PROFIEL",es:"PERFIL",id:"PROFIL",ur:"پروفائل",ms:"PROFIL",it:"PROFILO",pt:"PERFIL"},
  // ── Accueil ──
  explorer:{fr:"EXPLORER",en:"EXPLORE",ar:"استكشاف",tr:"KEŞFET",de:"ENTDECKEN",nl:"ONTDEK",es:"EXPLORAR",id:"JELAJAHI",ur:"دریافت",ms:"TEROKAI",it:"ESPLORA",pt:"EXPLORAR"},
  presDeVous:{fr:"PRES DE VOUS",en:"NEAR YOU",ar:"بالقرب منك",tr:"YAKININIZDA",de:"IN IHRER NÄHE",nl:"BIJ U IN DE BUURT",es:"CERCA DE TI",id:"DEKAT ANDA",ur:"آپ کے قریب",ms:"DEKAT ANDA",it:"VICINO A TE",pt:"PERTO DE VOCÊ"},
  // ── Prière ──
  horaires:{fr:"Horaires",en:"Times",ar:"المواقيت",tr:"Vakitler",de:"Zeiten",nl:"Tijden",es:"Horarios",id:"Jadwal",ur:"اوقات",ms:"Waktu",it:"Orari",pt:"Horários"},
  tracker:{fr:"Tracker",en:"Tracker",ar:"تتبع",tr:"Takip",de:"Tracker",nl:"Tracker",es:"Seguimiento",id:"Pelacak",ur:"ٹریکر",ms:"Penjejak",it:"Tracker",pt:"Rastreador"},
  dhikr:{fr:"Dhikr",en:"Dhikr",ar:"ذكر",tr:"Zikir",de:"Dhikr",nl:"Dhikr",es:"Dhikr",id:"Dzikir",ur:"ذکر",ms:"Zikir",it:"Dhikr",pt:"Dhikr"},
  adhkar:{fr:"Adhkar",en:"Adhkar",ar:"أذكار",tr:"Ezkar",de:"Adhkar",nl:"Adhkar",es:"Adhkar",id:"Adzkar",ur:"اذکار",ms:"Azkar",it:"Adhkar",pt:"Adhkar"},
  prochainePriere:{fr:"Prochaine priere",en:"Next prayer",ar:"الصلاة القادمة",tr:"Sonraki namaz",de:"Nächstes Gebet",nl:"Volgend gebed",es:"Próxima oración",id:"Sholat berikutnya",ur:"اگلی نماز",ms:"Solat seterusnya",it:"Prossima preghiera",pt:"Próxima oração"},
  prieres:{fr:"Prieres",en:"Prayers",ar:"صلوات",tr:"Namazlar",de:"Gebete",nl:"Gebeden",es:"Oraciones",id:"Sholat",ur:"نمازیں",ms:"Solat",it:"Preghiere",pt:"Orações"},
  // ── Culture ──
  cultureIslamique:{fr:"CULTURE ISLAMIQUE",en:"ISLAMIC CULTURE",ar:"الثقافة الإسلامية",tr:"İSLAM KÜLTÜRÜ",de:"ISLAMISCHE KULTUR",nl:"ISLAMITISCHE CULTUUR",es:"CULTURA ISLÁMICA",id:"BUDAYA ISLAM",ur:"اسلامی ثقافت",ms:"BUDAYA ISLAM",it:"CULTURA ISLAMICA",pt:"CULTURA ISLÂMICA"},
  apprendreGrandir:{fr:"Apprendre & Grandir",en:"Learn & Grow",ar:"تعلم وانمو",tr:"Öğren & Büyü",de:"Lernen & Wachsen",nl:"Leren & Groeien",es:"Aprender & Crecer",id:"Belajar & Tumbuh",ur:"سیکھیں اور بڑھیں",ms:"Belajar & Berkembang",it:"Impara & Cresci",pt:"Aprender & Crescer"},
  retour:{fr:"Retour",en:"Back",ar:"رجوع",tr:"Geri",de:"Zurück",nl:"Terug",es:"Volver",id:"Kembali",ur:"واپس",ms:"Kembali",it:"Indietro",pt:"Voltar"},
  coran:{fr:"Coran",en:"Quran",ar:"القرآن",tr:"Kur'an",de:"Koran",nl:"Koran",es:"Corán",id:"Al-Qur'an",ur:"قرآن",ms:"Al-Quran",it:"Corano",pt:"Alcorão"},
  hadiths:{fr:"Hadiths",en:"Hadiths",ar:"أحاديث",tr:"Hadisler",de:"Hadithe",nl:"Hadiths",es:"Hadices",id:"Hadits",ur:"احادیث",ms:"Hadis",it:"Hadith",pt:"Hadiths"},
  noms99:{fr:"99 Noms",en:"99 Names",ar:"الأسماء الحسنى",tr:"99 İsim",de:"99 Namen",nl:"99 Namen",es:"99 Nombres",id:"99 Nama",ur:"99 نام",ms:"99 Nama",it:"99 Nomi",pt:"99 Nomes"},
  tajwid:{fr:"Tajwid",en:"Tajweed",ar:"التجويد",tr:"Tecvid",de:"Tadschid",nl:"Tajwied",es:"Tajwid",id:"Tajwid",ur:"تجوید",ms:"Tajwid",it:"Tajweed",pt:"Tajwid"},
  sira:{fr:"Sira",en:"Sira",ar:"السيرة",tr:"Siyer",de:"Sira",nl:"Sira",es:"Sira",id:"Sirah",ur:"سیرت",ms:"Sirah",it:"Sira",pt:"Sira"},
  fiqh:{fr:"Fiqh",en:"Fiqh",ar:"الفقه",tr:"Fıkıh",de:"Fiqh",nl:"Fiqh",es:"Fiqh",id:"Fiqih",ur:"فقہ",ms:"Fiqh",it:"Fiqh",pt:"Fiqh"},
  arabe:{fr:"Arabe",en:"Arabic",ar:"العربية",tr:"Arapça",de:"Arabisch",nl:"Arabisch",es:"Árabe",id:"Arab",ur:"عربی",ms:"Arab",it:"Arabo",pt:"Árabe"},
  calendrier:{fr:"Calendrier",en:"Calendar",ar:"التقويم",tr:"Takvim",de:"Kalender",nl:"Kalender",es:"Calendario",id:"Kalender",ur:"کیلنڈر",ms:"Kalendar",it:"Calendario",pt:"Calendário"},
  chahada:{fr:"Chahada",en:"Shahada",ar:"الشهادة",tr:"Şehadet",de:"Schahada",nl:"Shahada",es:"Shahada",id:"Syahadat",ur:"شہادت",ms:"Syahadah",it:"Shahada",pt:"Shahada"},
  khatam:{fr:"Khatam",en:"Khatam",ar:"ختم",tr:"Hatim",de:"Khatam",nl:"Khatam",es:"Khatam",id:"Khatam",ur:"ختم",ms:"Khatam",it:"Khatam",pt:"Khatam"},
  liveMecque:{fr:"Live Mecque",en:"Live Mecca",ar:"بث مباشر مكة",tr:"Canlı Mekke",de:"Live Mekka",nl:"Live Mekka",es:"Meca en vivo",id:"Live Mekkah",ur:"مکہ لائیو",ms:"Live Makkah",it:"Mecca Live",pt:"Meca ao vivo"},
  // ── Finance ──
  financeIslamique:{fr:"FINANCE ISLAMIQUE",en:"ISLAMIC FINANCE",ar:"التمويل الإسلامي",tr:"İSLAMİ FİNANS",de:"ISLAMISCHE FINANZEN",nl:"ISLAMITISCHE FINANCIËN",es:"FINANZAS ISLÁMICAS",id:"KEUANGAN ISLAM",ur:"اسلامی مالیات",ms:"KEWANGAN ISLAM",it:"FINANZA ISLAMICA",pt:"FINANÇAS ISLÂMICAS"},
  argentHalal:{fr:"Argent Halal",en:"Halal Money",ar:"المال الحلال",tr:"Helal Para",de:"Halal-Geld",nl:"Halal Geld",es:"Dinero Halal",id:"Uang Halal",ur:"حلال پیسہ",ms:"Wang Halal",it:"Denaro Halal",pt:"Dinheiro Halal"},
  calculerZakat:{fr:"Calculateur de Zakat",en:"Zakat Calculator",ar:"حاسبة الزكاة",tr:"Zekat Hesaplayıcı",de:"Zakat-Rechner",nl:"Zakat Calculator",es:"Calculadora de Zakat",id:"Kalkulator Zakat",ur:"زکوٰۃ کیلکولیٹر",ms:"Kalkulator Zakat",it:"Calcolatore Zakat",pt:"Calculadora de Zakat"},
  // ── Voyage ──
  voyagesHalal:{fr:"VOYAGES HALAL",en:"HALAL TRAVEL",ar:"السفر الحلال",tr:"HELAL SEYAHAT",de:"HALAL-REISEN",nl:"HALAL REIZEN",es:"VIAJES HALAL",id:"WISATA HALAL",ur:"حلال سفر",ms:"PELANCONGAN HALAL",it:"VIAGGI HALAL",pt:"VIAGENS HALAL"},
  destinations:{fr:"Destinations & Guides",en:"Destinations & Guides",ar:"الوجهات والأدلة",tr:"Yerler & Rehberler",de:"Reiseziele & Guides",nl:"Bestemmingen & Gidsen",es:"Destinos & Guías",id:"Tujuan & Panduan",ur:"منزلیں اور گائیڈز",ms:"Destinasi & Panduan",it:"Destinazioni & Guide",pt:"Destinos & Guias"},
  // ── Carte ──
  carteHalal:{fr:"CARTE HALAL",en:"HALAL MAP",ar:"خريطة الحلال",tr:"HELAL HARİTA",de:"HALAL-KARTE",nl:"HALAL KAART",es:"MAPA HALAL",id:"PETA HALAL",ur:"حلال نقشہ",ms:"PETA HALAL",it:"MAPPA HALAL",pt:"MAPA HALAL"},
  chercherCommerce:{fr:"Chercher un commerce halal...",en:"Search halal business...",ar:"ابحث عن محل حلال...",tr:"Helal işletme ara...",de:"Halal-Geschäft suchen...",nl:"Halal bedrijf zoeken...",es:"Buscar negocio halal...",id:"Cari bisnis halal...",ur:"حلال کاروبار تلاش کریں...",ms:"Cari perniagaan halal...",it:"Cerca attività halal...",pt:"Procurar negócio halal..."},
  // ── Profil ──
  monProfil:{fr:"Mon Profil",en:"My Profile",ar:"ملفي",tr:"Profilim",de:"Mein Profil",nl:"Mijn Profiel",es:"Mi Perfil",id:"Profil Saya",ur:"میری پروفائل",ms:"Profil Saya",it:"Il mio Profilo",pt:"Meu Perfil"},
  langue:{fr:"Langue",en:"Language",ar:"اللغة",tr:"Dil",de:"Sprache",nl:"Taal",es:"Idioma",id:"Bahasa",ur:"زبان",ms:"Bahasa",it:"Lingua",pt:"Idioma"},
  deconnexion:{fr:"Deconnexion",en:"Logout",ar:"تسجيل الخروج",tr:"Çıkış",de:"Abmelden",nl:"Uitloggen",es:"Cerrar sesión",id:"Keluar",ur:"لاگ آؤٹ",ms:"Log keluar",it:"Disconnetti",pt:"Sair"},
  connexion:{fr:"Connexion",en:"Login",ar:"تسجيل الدخول",tr:"Giriş",de:"Anmelden",nl:"Inloggen",es:"Iniciar sesión",id:"Masuk",ur:"لاگ ان",ms:"Log masuk",it:"Accedi",pt:"Entrar"},
  inscription:{fr:"Inscription",en:"Sign up",ar:"التسجيل",tr:"Kayıt ol",de:"Registrieren",nl:"Registreren",es:"Registrarse",id:"Daftar",ur:"رجسٹریشن",ms:"Daftar",it:"Registrati",pt:"Cadastrar"},
  continuerInvite:{fr:"Continuer en invite",en:"Continue as guest",ar:"متابعة كضيف",tr:"Misafir olarak devam et",de:"Als Gast fortfahren",nl:"Doorgaan als gast",es:"Continuar como invitado",id:"Lanjut sebagai tamu",ur:"مہمان کے طور پر جاری رکھیں",ms:"Teruskan sebagai tetamu",it:"Continua come ospite",pt:"Continuar como convidado"},
  // ── Adhkar ──
  matin:{fr:"Matin",en:"Morning",ar:"الصباح",tr:"Sabah",de:"Morgen",nl:"Ochtend",es:"Mañana",id:"Pagi",ur:"صبح",ms:"Pagi",it:"Mattina",pt:"Manhã"},
  soir:{fr:"Soir",en:"Evening",ar:"المساء",tr:"Akşam",de:"Abend",nl:"Avond",es:"Noche",id:"Sore",ur:"شام",ms:"Petang",it:"Sera",pt:"Noite"},
  // ── Misc ──
  aujourdhui:{fr:"AUJOURD'HUI",en:"TODAY",ar:"اليوم",tr:"BUGÜN",de:"HEUTE",nl:"VANDAAG",es:"HOY",id:"HARI INI",ur:"آج",ms:"HARI INI",it:"OGGI",pt:"HOJE"},
  evenements:{fr:"Evenements islamiques",en:"Islamic events",ar:"المناسبات الإسلامية",tr:"İslami etkinlikler",de:"Islamische Ereignisse",nl:"Islamitische evenementen",es:"Eventos islámicos",id:"Peristiwa Islam",ur:"اسلامی واقعات",ms:"Peristiwa Islam",it:"Eventi islamici",pt:"Eventos islâmicos"},
  sourates:{fr:"sourates",en:"surahs",ar:"سور",tr:"sure",de:"Suren",nl:"soera's",es:"suras",id:"surah",ur:"سورتیں",ms:"surah",it:"sure",pt:"suratas"},
  versets:{fr:"versets",en:"verses",ar:"آيات",tr:"ayet",de:"Verse",nl:"verzen",es:"versos",id:"ayat",ur:"آیات",ms:"ayat",it:"versetti",pt:"versículos"},
}
const t = (key, lang) => (T[key] && T[key][lang]) || (T[key] && T[key]["fr"]) || key


const ADHAN_RECITERS = [
  { id:"mishary", name:"Mishary Al-Afasy", flag:"🇰🇼", url:"https://cdn.aladhan.com/audio/adhans/1.mp3" },
  { id:"abdulbasit", name:"Abdul Basit", flag:"🇪🇬", url:"https://cdn.aladhan.com/audio/adhans/2.mp3" },
  { id:"nasser", name:"Nasser Al-Qatami", flag:"🇸🇦", url:"https://cdn.aladhan.com/audio/adhans/3.mp3" },
  { id:"makkah", name:"Adhan Makkah", flag:"🕋", url:"https://cdn.aladhan.com/audio/adhans/4.mp3" },
  { id:"madinah", name:"Adhan Madinah", flag:"🕌", url:"https://cdn.aladhan.com/audio/adhans/5.mp3" },
]

// ─── Location Tracking ───────────────────────────────────────────────────────
async function trackUserLocation(userId, email) {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') return
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
    const [geo] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
    if (geo) {
      await supabase.from('user_locations').upsert({
        user_id: userId,
        email: email,
        city: geo.city || geo.subregion || 'Unknown',
        country: geo.country || 'Unknown',
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        last_active: new Date().toISOString()
      }, { onConflict: 'user_id' }).then(() => {})
    }
  } catch(e) { /* silent fail */ }
}


// ─── Daily Inspiration Notifications ──────────────────────────────────────────
const DAILY_VERSES = [
  "Allah ne charge une ame que selon sa capacite (2:286)",
  "Certes, avec la difficulte il y a une facilite (94:6)",
  "Et quiconque craint Allah, Il lui donnera une issue favorable (65:2)",
  "Invoquez-Moi, Je vous repondrai (40:60)",
  "Allah est avec les patients (2:153)",
  "Et ne desesperer pas de la misericorde d'Allah (39:53)",
  "Celui qui place sa confiance en Allah, Il lui suffit (65:3)",
  "O les croyants! Cherchez secours dans la patience et la priere (2:153)",
  "Le rappel d'Allah est certes la plus grande chose (29:45)",
  "Dis: Mon Seigneur, accorde-moi encore plus de science (20:114)",
  "Les meilleurs d'entre vous sont ceux qui apprennent le Coran et l'enseignent (Bukhari)",
  "Le musulman est celui dont les gens sont a l'abri de sa langue et de sa main (Muslim)",
  "La meilleure invocation est celle du jour de Arafat (Tirmidhi)",
  "Celui qui emprunte un chemin pour acquerir un savoir, Allah lui facilite un chemin vers le Paradis (Muslim)",
]

const DAILY_DHIKR = [
  "Subhan Allah (33x) — Gloire a Allah",
  "Alhamdulillah (33x) — Louange a Allah",
  "Allahu Akbar (34x) — Allah est le Plus Grand",
  "Astaghfirullah (100x) — Je demande pardon a Allah",
  "La ilaha illallah (100x) — Nulle divinite sauf Allah",
  "Subhan Allah wa bihamdihi (100x) — Gloire et louange a Allah",
  "La hawla wa la quwwata illa billah — Pas de force sauf en Allah",
]

async function scheduleDailyInspiration() {
  try {
    // Morning verse at 7:00
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🌅 Verset du matin",
        body: DAILY_VERSES[Math.floor(Math.random() * DAILY_VERSES.length)],
        sound: true,
      },
      trigger: { hour: 7, minute: 0, repeats: true },
    })
    // Evening dhikr at 20:00
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🌙 Dhikr du soir",
        body: DAILY_DHIKR[Math.floor(Math.random() * DAILY_DHIKR.length)],
        sound: true,
      },
      trigger: { hour: 20, minute: 0, repeats: true },
    })
  } catch(e) {}
}

// ─── Journal Spirituel ────────────────────────────────────────────────────────
function JournalSpirituel({ lang="fr" }) {
  const [entries, setEntries] = useState([])
  const [text, setText] = useState("")
  const [mood, setMood] = useState("🤲")

  useEffect(() => {
    AsyncStorage.getItem("fadjr_journal").then(d => { if (d) setEntries(JSON.parse(d)) }).catch(() => {})
  }, [])

  const addEntry = () => {
    if (!text.trim()) return
    const entry = { id: Date.now(), text: text.trim(), mood, date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString().slice(0,5) }
    const updated = [entry, ...entries]
    setEntries(updated)
    AsyncStorage.setItem("fadjr_journal", JSON.stringify(updated)).catch(() => {})
    setText("")
  }

  return (
    <View>
      <View style={[styles.card, { padding:14, marginBottom:12 }]}>
        <Text style={{ color:C.white, fontSize:14, fontWeight:"700", marginBottom:8 }}>{lang==="ar"?"كيف حالك اليوم؟":lang==="en"?"How are you today?":"Comment te sens-tu aujourd'hui?"}</Text>
        <View style={{ flexDirection:"row", gap:8, marginBottom:10 }}>
          {["🤲","😊","😔","🙏","💪","❤️"].map(e => (
            <TouchableOpacity key={e} onPress={() => setMood(e)}
              style={{ padding:8, borderRadius:99, backgroundColor: mood===e ? C.gold+"30" : C.card2, borderWidth:1, borderColor: mood===e ? C.gold : C.border }}>
              <Text style={{ fontSize:20 }}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput value={text} onChangeText={setText} placeholder={lang==="ar"?"اكتب هنا...":lang==="en"?"Write here...":"Ecris ici..."} placeholderTextColor={C.muted}
          multiline numberOfLines={3} style={{ backgroundColor:C.card2, borderWidth:1, borderColor:C.border, borderRadius:10, padding:12, color:C.white, fontSize:13, textAlignVertical:"top", minHeight:80 }} />
        <TouchableOpacity onPress={addEntry} style={{ backgroundColor:C.gold, borderRadius:10, padding:12, alignItems:"center", marginTop:10 }}>
          <Text style={{ color:C.bg, fontSize:14, fontWeight:"900" }}>{lang==="ar"?"احفظ":lang==="en"?"Save":"Enregistrer"}</Text>
        </TouchableOpacity>
      </View>
      {entries.map(e => (
        <View key={e.id} style={[styles.card, { padding:12, marginBottom:6, flexDirection:"row", gap:10 }]}>
          <Text style={{ fontSize:22 }}>{e.mood}</Text>
          <View style={{ flex:1 }}>
            <Text style={{ color:C.white, fontSize:13 }}>{e.text}</Text>
            <Text style={{ color:C.muted, fontSize:10, marginTop:4 }}>{e.date} {e.time}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

// ─── Inspiration Quotidienne ──────────────────────────────────────────────────
function InspirationQuotidienne() {
  const verse = DAILY_VERSES[new Date().getDate() % DAILY_VERSES.length]
  const dhikr = DAILY_DHIKR[new Date().getDate() % DAILY_DHIKR.length]
  return (
    <View>
      <View style={[styles.card, { padding:16, marginBottom:10, borderLeftWidth:3, borderLeftColor:C.gold }]}>
        <Text style={{ color:C.gold, fontSize:12, fontWeight:"700", marginBottom:6 }}>🌅 Verset du jour</Text>
        <Text style={{ color:C.white, fontSize:14, lineHeight:22, fontStyle:"italic" }}>{verse}</Text>
      </View>
      <View style={[styles.card, { padding:16, marginBottom:10, borderLeftWidth:3, borderLeftColor:C.green }]}>
        <Text style={{ color:C.green, fontSize:12, fontWeight:"700", marginBottom:6 }}>🌙 Dhikr du jour</Text>
        <Text style={{ color:C.white, fontSize:14, lineHeight:22 }}>{dhikr}</Text>
      </View>
      <TouchableOpacity onPress={() => {
        const shareText = "📖 " + verse + "\n\n🌙 " + dhikr + "\n\n📲 Telecharge FADJR: https://fadjr.app"
        Share.share({ message: "☪️ FADJR\n\n📖 " + verse + "\n\n🌙 " + dhikr + "\n\n📲 Telecharge FADJR: https://fadjr.app" }).catch(() => {})
      }} style={[styles.card, { padding:14, alignItems:"center", backgroundColor:C.gold+"15", borderWidth:1, borderColor:C.gold+"40" }]}>
        <Text style={{ color:C.gold, fontSize:13, fontWeight:"700" }}>📤 Partager avec QR FADJR</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── Story Share with QR Code ─────────────────────────────────────────────────
function ShareStoryCard({ text, source, lang="fr" }) {
  const shareStory = async () => {
    const shareText = "╔══════════════════╗\n" +
      "   ☪️ FADJR   \n" +
      "╚══════════════════╝\n\n" +
      "📖 " + text + "\n\n" +
      (source ? "— " + source + "\n\n" : "") +
      "━━━━━━━━━━━━━━━━━━\n" +
      "📲 " + (lang==="ar"?"حمّل تطبيق FADJR":lang==="en"?"Download FADJR app":"Telecharge l'app FADJR") + "\n" +
      "🍎 iOS: https://testflight.apple.com/join/FADJR\n" +
      "🤖 Android: https://play.google.com/store/apps/details?id=com.aureus.fadjr\n" +
      "🌐 https://fadjr.app\n" +
      "━━━━━━━━━━━━━━━━━━"
    try {
      await Share.share({ message: shareText })
    } catch(e) {}
  }

  return (
    <TouchableOpacity onPress={shareStory}
      style={{ flexDirection:"row", alignItems:"center", gap:6, paddingVertical:6, paddingHorizontal:10, borderRadius:99, backgroundColor:C.gold+"15", borderWidth:1, borderColor:C.gold+"30", alignSelf:"flex-start" }}>
      <Text style={{ fontSize:12 }}>📤</Text>
      <Text style={{ color:C.gold, fontSize:11, fontWeight:"700" }}>{lang==="ar"?"شارك":lang==="en"?"Share":"Partager"}</Text>
    </TouchableOpacity>
  )
}

// ─── Community Feed ───────────────────────────────────────────────────────────
function CommunityFeed({ lang="fr" }) {
  const [filter, setFilter] = useState("all")
  const FILTERS = [
    { id:"all", label:{fr:"Tout",en:"All",ar:"الكل",tr:"Hepsi"} },
    { id:"quran", label:{fr:"Coran",en:"Quran",ar:"قرآن",tr:"Kur'an"} },
    { id:"dua", label:{fr:"Douas",en:"Duas",ar:"دعاء",tr:"Dua"} },
    { id:"hadith", label:{fr:"Hadiths",en:"Hadiths",ar:"أحاديث",tr:"Hadisler"} },
    { id:"tips", label:{fr:"Conseils",en:"Tips",ar:"نصائح",tr:"İpuçları"} },
  ]

  const POSTS = [
    { type:"quran", emoji:"📖", user:"FADJR", time:"2h", content:{fr:"Sourate Al-Ikhlas (112) — Dis: Il est Allah, Unique. Allah, Le Seul a etre implore pour ce que nous desirons. Il n'a jamais engendre, n'a pas ete engendre non plus. Et nul n'est egal a Lui.",en:"Surah Al-Ikhlas (112) — Say: He is Allah, the One. Allah, the Eternal Refuge. He neither begets nor is born. Nor is there to Him any equivalent.",ar:"سورة الإخلاص — قل هو الله أحد. الله الصمد. لم يلد ولم يولد. ولم يكن له كفوا أحد.",tr:"İhlas Suresi — De ki: O, Allah'tır, tektir. Allah Samed'dir. Doğurmamış ve doğmamıştır. Hiçbir şey O'na denk değildir."}, likes:342 },
    { type:"dua", emoji:"🤲", user:"FADJR", time:"5h", content:{fr:"Doua du voyageur: 'Subhana-lladhi sakhkhara lana hadha wa ma kunna lahu muqrinin' — Gloire a Celui qui a mis ceci a notre service, alors que nous n'etions pas capables de le faire.",en:"Traveler's dua: 'Subhana-lladhi sakhkhara lana hadha wa ma kunna lahu muqrinin' — Glory to Him who has subjected this to us, and we could not have subdued it.",ar:"دعاء السفر: سبحان الذي سخر لنا هذا وما كنا له مقرنين",tr:"Yolcu duası: Bunu bize boyun eğdiren Allah'ın şanı yücedir, yoksa biz bunu yanaştıramazdık."}, likes:189 },
    { type:"hadith", emoji:"📚", user:"FADJR", time:"8h", content:{fr:"Le Prophete ﷺ a dit: 'Le meilleur d'entre vous est celui qui apprend le Coran et l'enseigne.' (Bukhari)",en:"The Prophet ﷺ said: 'The best among you are those who learn the Quran and teach it.' (Bukhari)",ar:"قال النبي ﷺ: خيركم من تعلم القرآن وعلمه. (البخاري)",tr:"Hz. Peygamber ﷺ buyurdu: 'Sizin en hayırlınız Kur'an'ı öğrenen ve öğretendir.' (Buhari)"}, likes:456 },
    { type:"tips", emoji:"💡", user:"FADJR", time:"12h", content:{fr:"Conseil: Lisez Sourate Al-Kahf chaque vendredi. Le Prophete ﷺ a dit que celui qui la lit le vendredi sera illumine d'une lumiere entre les deux vendredis.",en:"Tip: Read Surah Al-Kahf every Friday. The Prophet ﷺ said whoever reads it on Friday will be illuminated by a light between the two Fridays.",ar:"نصيحة: اقرأ سورة الكهف كل جمعة. قال النبي ﷺ من قرأها يوم الجمعة أضاء له من النور ما بين الجمعتين.",tr:"İpucu: Her Cuma Al-Kehf Suresi'ni oku. Hz. Peygamber ﷺ Cuma günü okuyan için iki Cuma arası nur olacağını buyurdu."}, likes:278 },
    { type:"dua", emoji:"🌙", user:"FADJR", time:"1j", content:{fr:"Dhikr du soir: 'Allahumma bika amsayna wa bika asbahna wa bika nahya wa bika namutu wa ilayka al-masir' — O Allah par Toi nous sommes au soir et par Toi nous serons au matin.",en:"Evening dhikr: 'Allahumma bika amsayna...' — O Allah, by You we enter the evening and by You we enter the morning.",ar:"أذكار المساء: اللهم بك أمسينا وبك أصبحنا وبك نحيا وبك نموت وإليك المصير",tr:"Akşam zikri: Allah'ım, Seninle akşamladık, Seninle sabahladık, Seninle yaşar, Seninle ölürüz."}, likes:167 },
    { type:"quran", emoji:"📖", user:"FADJR", time:"1j", content:{fr:"'Et quiconque craint Allah — Il lui donnera une issue favorable et lui accordera Ses dons par des moyens qu'il ne soupconne meme pas.' (65:2-3)",en:"'And whoever fears Allah — He will make for him a way out and will provide for him from where he does not expect.' (65:2-3)",ar:"ومن يتق الله يجعل له مخرجاً ويرزقه من حيث لا يحتسب (65:2-3)",tr:"Kim Allah'tan korkarsa, Allah ona bir çıkış yolu yaratır ve onu ummadığı yerden rızıklandırır. (65:2-3)"}, likes:523 },
    { type:"tips", emoji:"❤️", user:"FADJR", time:"2j", content:{fr:"Le sourire est une Sadaqa! Le Prophete ﷺ a dit: 'Ton sourire a ton frere est une charite.' (Tirmidhi)",en:"Smiling is Sadaqah! The Prophet ﷺ said: 'Your smile to your brother is charity.' (Tirmidhi)",ar:"الابتسامة صدقة! قال النبي ﷺ: تبسمك في وجه أخيك صدقة. (الترمذي)",tr:"Gülümsemek sadakadır! Hz. Peygamber ﷺ: 'Kardeşine gülümsemen sadakadır.' (Tirmizi)"}, likes:891 },
  ]

  const filtered = filter === "all" ? POSTS : POSTS.filter(p => p.type === filter)

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:14 }}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f.id} onPress={() => setFilter(f.id)}
            style={{ paddingHorizontal:14, paddingVertical:7, borderRadius:99, marginRight:6, backgroundColor: filter===f.id ? C.gold+"25" : C.card2, borderWidth:1, borderColor: filter===f.id ? C.gold : C.border }}>
            <Text style={{ color: filter===f.id ? C.gold : C.muted, fontSize:12, fontWeight:"700" }}>{f.label[lang]||f.label.fr}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {filtered.map((post, i) => (
        <View key={i} style={[styles.card, { padding:14, marginBottom:10 }]}>
          <View style={{ flexDirection:"row", alignItems:"center", gap:8, marginBottom:10 }}>
            <View style={{ width:32, height:32, borderRadius:16, backgroundColor:C.gold+"20", alignItems:"center", justifyContent:"center" }}>
              <Text style={{ fontSize:14 }}>{post.emoji}</Text>
            </View>
            <Text style={{ color:C.white, fontSize:13, fontWeight:"700", flex:1 }}>{post.user}</Text>
            <Text style={{ color:C.muted, fontSize:10 }}>{post.time}</Text>
          </View>
          <Text style={{ color:C.white, fontSize:13, lineHeight:22 }}>{post.content[lang]||post.content.fr}</Text>
          <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginTop:10, paddingTop:10, borderTopWidth:1, borderTopColor:C.border }}>
            <View style={{ flexDirection:"row", alignItems:"center", gap:4 }}>
              <Text style={{ fontSize:14 }}>❤️</Text>
              <Text style={{ color:C.muted, fontSize:11 }}>{post.likes}</Text>
            </View>
            <ShareStoryCard text={post.content[lang]||post.content.fr} source="FADJR" lang={lang} />
          </View>
        </View>
      ))}
    </View>
  )
}

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
  { id:1, nom:"Le Sultane", type:"Restaurant", adresse:"Chaussee de Wavre 142, Ixelles", distance:"0.3 km", note:4.8, certif:"HBE", emoji:"🍽️", color:"#C9A84C", ouvert:true, spec:"Cuisine orientale, tagine, couscous", tel:"+3225025050" },
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
  { ar:"سبحان الله", fr:"Subhan Allah", trad:"Gloire a Allah", count:33 },
  { ar:"الحمد لله", fr:"Alhamdulillah", trad:"Louange a Allah", count:33 },
  { ar:"الله أكبر", fr:"Allahu Akbar", trad:"Allah est le Plus Grand", count:34 },
  { ar:"لا إله إلا الله", fr:"La ilaha illallah", trad:"Nulle divinite sauf Allah", count:100 },
  { ar:"أستغفر الله", fr:"Astaghfirullah", trad:"Je demande pardon a Allah", count:100 },
  { ar:"لا حول ولا قوة إلا بالله", fr:"La hawla wa la quwwata illa billah", trad:"Pas de force ni de puissance sauf en Allah", count:33 },
  { ar:"سبحان الله وبحمده", fr:"Subhan Allah wa bihamdihi", trad:"Gloire et louange a Allah", count:100 },
  { ar:"سبحان الله العظيم", fr:"Subhan Allah al-Azim", trad:"Gloire a Allah le Tout-Puissant", count:33 },
  { ar:"اللهم صل على محمد", fr:"Allahumma salli ala Muhammad", trad:"O Allah prie sur Muhammad", count:10 },
  { ar:"حسبي الله ونعم الوكيل", fr:"Hasbunallah wa ni'mal wakil", trad:"Allah nous suffit, quel excellent Protecteur", count:7 },
  { ar:"رب اغفر لي وتب عليّ", fr:"Rabbi ighfir li wa tub alayya", trad:"Seigneur pardonne-moi et accepte mon repentir", count:100 },
  { ar:"يا حي يا قيوم برحمتك أستغيث", fr:"Ya Hayyu ya Qayyum birahmatika astaghith", trad:"O Vivant, O Subsistant, par Ta misericorde je cherche secours", count:3 },
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
function EcranAuth({ lang="fr" }) {
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

  // Guest mode disabled — inscription obligatoire

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
                {mode === "login" ? (lang==="ar"?"تسجيل الدخول":lang==="en"?"SIGN IN":lang==="tr"?"GİRİŞ YAP":"SE CONNECTER") : (lang==="ar"?"إنشاء حساب":lang==="en"?"CREATE ACCOUNT":lang==="tr"?"HESAP OLUŞTUR":"CREER MON COMPTE")}
              </Text>
          }
        </TouchableOpacity>
        <Text style={{ color:C.muted, fontSize:11, textAlign:"center", marginTop:20, lineHeight:16 }}>
          En continuant, vous acceptez nos conditions d'utilisation.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ─── Écran Accueil ────────────────────────────────────────────────────────────
function EcranAccueil({ prayers, city, nextPrayer, timeToNext, setTab, hijriDate, lang="fr", prayedToday={} }) {
  const [commune, setCommune] = useState(city || "")
  const [locLoading, setLocLoading] = useState(false)

  useEffect(() => { if (city) setCommune(city) }, [city])

  const refreshLocation = async () => {
    setLocLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
        const [geo] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
        if (geo) {
          const name = [geo.subLocality, geo.city, geo.district].filter(Boolean).join(", ")
          setCommune(name || geo.city || "")
        }
      }
    } catch(e) {}
    setLocLoading(false)
  }
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
        <StreakBadges prayedToday={prayedToday || {}} />
        {/* Daily Challenge */}
        <View style={[styles.card, { padding:14, marginBottom:16, borderLeftWidth:3, borderLeftColor:C.green }]}>
          <Text style={{ color:C.green, fontSize:12, fontWeight:"700", marginBottom:4 }}>🎯 {lang==="ar"?"تحدي اليوم":lang==="en"?"Today's Challenge":"Defi du jour"}</Text>
          <Text style={{ color:C.white, fontSize:14, fontWeight:"600" }}>
            {["Lire Sourate Al-Kahf","Faire 100 Istighfar","Donner une Sadaqa","Prier 2 rakat Doha","Lire 1 page de Coran","Apprendre 1 nouveau hadith","Faire le dhikr apres chaque priere"][new Date().getDay()]}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>{t("explorer",lang)}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:16 }}>
          {[
            { id:"finance", emoji:"💰", label:lang==="ar"?"مالية":lang==="en"?"Finance":"Finance", color:C.gold },
            { id:"voyage", emoji:"✈️", label:lang==="ar"?"سفر":lang==="en"?"Travel":"Voyage", color:C.blue },
          ].map(item => (
            <TouchableOpacity key={item.id} onPress={() => setTab(item.id)}
              style={[styles.card, { paddingHorizontal:20, paddingVertical:14, marginRight:8, borderTopWidth:2, borderTopColor:item.color, flexDirection:"row", alignItems:"center", gap:8 }]}>
              <Text style={{ fontSize:20 }}>{item.emoji}</Text>
              <Text style={{ color:C.white, fontSize:13, fontWeight:"700" }}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
          
        {/* ── Aureus Social Pro Banner ── */}
        <TouchableOpacity onPress={() => Linking.openURL("https://app.aureussocial.be/vitrine").catch(()=>{})}
          style={[styles.card, { marginBottom:16, padding:16, borderWidth:1, borderColor:C.gold+"40", flexDirection:"row", alignItems:"center", gap:14 }]}>
          <View style={{ width:50, height:50, borderRadius:12, backgroundColor:C.gold+"20", alignItems:"center", justifyContent:"center" }}>
            <Text style={{ fontSize:26 }}>⚡</Text>
          </View>
          <View style={{ flex:1 }}>
            <Text style={{ color:C.gold, fontSize:15, fontWeight:"900" }}>Aureus Social Pro</Text>
            <Text style={{ color:C.muted, fontSize:11, marginTop:3 }}>{lang==="ar"?"إدارة الموارد البشرية والرواتب":lang==="en"?"HR & Payroll Management":"Gestion RH & Paie pour entreprises belges"}</Text>
          </View>
          <Text style={{ color:C.gold, fontSize:18 }}>→</Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>{t("presDeVous",lang)}</Text>
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
function EcranPriere({ prayers, city, loading, nextPrayer, prayedToday, onTogglePrayed, lang="fr" }) {
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
          {[["horaires",t("horaires",lang)],["tracker",t("tracker",lang)],["dhikr",t("dhikr",lang)],["adhkar",t("adhkar",lang)],["tasbih","Tasbih"],["qibla","Qibla"],["mosquees","🕌"],["settings","⚙️"]].map(([key,label]) => (
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
                {isPrayed && <Text style={{ color:C.green, fontSize:10, marginTop:2 }}>{lang==="ar"?"تم":lang==="en"?"done":lang==="tr"?"tamam":"accomplie"}</Text>}
                {!isPrayed && isNext && <Text style={{ color:C.gold, fontSize:10, marginTop:2 }}>{lang==="ar"?"التالية":lang==="en"?"next":lang==="tr"?"sıradaki":"prochaine"}</Text>}
              </View>
              <TouchableOpacity onPress={(e) => { e.stopPropagation && e.stopPropagation(); const k="fadjr_bell_"+p.name; AsyncStorage.getItem(k).then(v => { const nv=v==="off"?"on":"off"; AsyncStorage.setItem(k,nv); Alert.alert(nv==="on"?"🔔":"🔕", p.name+" — "+(nv==="on"?"Activé":"Désactivé")) }).catch(()=>{}) }}
                style={{ paddingLeft:8 }}>
                <Text style={{ fontSize:18 }}>🔔</Text>
              </TouchableOpacity>
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
              const p = (prayers||[]).find(pr => pr.name === name)
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

        {/* ── Adhkar Matin/Soir ── */}
        {subTab==="adhkar" && (
          <AdhkarSection lang={lang} />
        )}

        {/* ── Tasbih Counter ── */}
        {subTab==="tasbih" && (
          <TasbihCounter lang={lang} />
        )}

        {/* ── Adhan Recitateur (dans Horaires) ── */}
        {subTab==="horaires" && (
          <View style={[styles.card, { padding:14, marginTop:10 }]}>
            <Text style={{ color:C.white, fontSize:14, fontWeight:"700", marginBottom:8 }}>🔊 {lang==="ar"?"اختر المؤذن":lang==="en"?"Choose Muezzin":lang==="tr"?"Müezzin Seç":"Choisir le Muezzin"}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {ADHAN_RECITERS.map(r => (
                <TouchableOpacity key={r.id} onPress={async () => {
                  AsyncStorage.setItem("fadjr_adhan", r.id)
                  Alert.alert("Adhan", r.name)
                  try {
                    const player = createAudioPlayer({ uri: r.url })
                    player.play()
                  } catch(e) {}
                }}
                  style={{ paddingHorizontal:12, paddingVertical:10, borderRadius:10, marginRight:6, backgroundColor:C.card2, borderWidth:1, borderColor:C.border, alignItems:"center" }}>
                  <Text style={{ fontSize:20, marginBottom:4 }}>{r.flag}</Text>
                  <Text style={{ color:C.white, fontSize:10, fontWeight:"600" }}>{r.name.split(" ").slice(-1)[0]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Qibla Direction ── */}
        {subTab==="qibla" && (
          <QiblaDirection />
        )}

        {/* ── Mosquees ── */}
        {subTab==="mosquees" && (
          <MosqueesProximite lang={lang} />
        )}

        {/* ── Prayer Settings ── */}
        {subTab==="settings" && (
          <PrayerSettings lang={lang} />
        )}
      </ScrollView>
    </View>
  )
}


// ─── Streak & Badges ──────────────────────────────────────────────────────────
function StreakBadges({ prayedToday }) {
  const [streak, setStreak] = useState(0)
  const [badges, setBadges] = useState([])
  
  useEffect(() => {
    AsyncStorage.getItem("fadjr_streak").then(d => {
      if (d) {
        const data = JSON.parse(d)
        setStreak(data.count || 0)
        setBadges(data.badges || [])
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const count = Object.values(prayedToday || {}).filter(Boolean).length
    if (count === 5) {
      AsyncStorage.getItem("fadjr_streak").then(d => {
        const data = d ? JSON.parse(d) : { count:0, lastDate:"", badges:[] }
        const today = new Date().toISOString().split("T")[0]
        if (data.lastDate !== today) {
          data.count = (data.count || 0) + 1
          data.lastDate = today
          // Check badges
          if (data.count >= 7 && !data.badges.includes("7days")) { data.badges.push("7days") }
          if (data.count >= 30 && !data.badges.includes("30days")) { data.badges.push("30days") }
          if (data.count >= 100 && !data.badges.includes("100days")) { data.badges.push("100days") }
          AsyncStorage.setItem("fadjr_streak", JSON.stringify(data))
          setStreak(data.count)
          setBadges(data.badges)
        }
      }).catch(() => {})
    }
  }, [prayedToday])

  const BADGE_LIST = [
    { id:"7days", emoji:"🔥", label:"7 jours", need:7 },
    { id:"30days", emoji:"⭐", label:"30 jours", need:30 },
    { id:"100days", emoji:"👑", label:"100 jours", need:100 },
  ]

  return (
    <View style={{ marginBottom:16 }}>
      <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"center", gap:12, marginBottom:10 }}>
        <Text style={{ fontSize:28 }}>🔥</Text>
        <Text style={{ color:C.gold, fontSize:32, fontWeight:"900" }}>{streak}</Text>
        <Text style={{ color:C.muted, fontSize:12 }}>jours{String.fromCharCode(10)}consecutifs</Text>
      </View>
      <View style={{ flexDirection:"row", justifyContent:"center", gap:8 }}>
        {BADGE_LIST.map(b => (
          <View key={b.id} style={{ alignItems:"center", opacity: badges.includes(b.id) ? 1 : 0.3 }}>
            <Text style={{ fontSize:24 }}>{b.emoji}</Text>
            <Text style={{ color:C.muted, fontSize:9, marginTop:2 }}>{b.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

// ─── Tasbih Counter ───────────────────────────────────────────────────────────
function TasbihCounter({ lang="fr" }) {
  const [count, setCount] = useState(0)
  const [target, setTarget] = useState(33)
  const [total, setTotal] = useState(0)
  const pct = Math.min(100, Math.round((count / target) * 100))

  useEffect(() => {
    AsyncStorage.getItem("fadjr_tasbih_total").then(d => { if (d) setTotal(parseInt(d)) }).catch(() => {})
  }, [])

  const increment = () => {
    const newCount = count + 1
    const newTotal = total + 1
    setCount(newCount)
    setTotal(newTotal)
    AsyncStorage.setItem("fadjr_tasbih_total", String(newTotal)).catch(() => {})
    if (newCount >= target) {
      Alert.alert("Masha'Allah!", `${target} atteint! Total: ${newTotal}`)
    }
  }

  const reset = () => setCount(0)

  return (
    <View style={{ alignItems:"center", paddingTop:20 }}>
      <Text style={{ color:C.muted, fontSize:12, marginBottom:4 }}>Total: {total}</Text>
      <View style={{ width:200, height:200, borderRadius:100, borderWidth:6, borderColor:C.gold+"40", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
        <TouchableOpacity onPress={increment} style={{ width:180, height:180, borderRadius:90, backgroundColor:C.gold+"15", alignItems:"center", justifyContent:"center" }}>
          <Text style={{ color:C.gold, fontSize:48, fontWeight:"900" }}>{count}</Text>
          <Text style={{ color:C.muted, fontSize:13, marginTop:4 }}>/ {target}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ width:"80%", height:6, backgroundColor:C.card2, borderRadius:99, overflow:"hidden", marginBottom:16 }}>
        <View style={{ width:`${pct}%`, height:"100%", backgroundColor:C.gold, borderRadius:99 }} />
      </View>
      <View style={{ flexDirection:"row", gap:8, marginBottom:16 }}>
        {[33, 34, 99, 100].map(n => (
          <TouchableOpacity key={n} onPress={() => { setTarget(n); setCount(0) }}
            style={{ paddingHorizontal:14, paddingVertical:8, borderRadius:99, backgroundColor: target===n ? C.gold+"30" : C.card2, borderWidth:1, borderColor: target===n ? C.gold : C.border }}>
            <Text style={{ color: target===n ? C.gold : C.muted, fontSize:12, fontWeight:"700" }}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={reset} style={{ padding:10 }}>
        <Text style={{ color:C.muted, fontSize:12 }}>{lang==="ar"?"إعادة تعيين":lang==="en"?"Reset":lang==="tr"?"Sıfırla":"Reinitialiser"}</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── Qibla Direction ──────────────────────────────────────────────────────────
function QiblaDirection() {
  const [qiblaAngle, setQiblaAngle] = useState(null)
  const [heading, setHeading] = useState(0)
  const [error, setError] = useState(null)
  const [city, setCity] = useState("")

  useEffect(() => {
    let headingSub = null;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") { setError("Permission GPS requise pour la Qibla"); return }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
        
        // Get city name
        try {
          const [geo] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
          if (geo) setCity(geo.city || "")
        } catch(e) {}
        
        // Calculate Qibla angle using great circle formula
        const lat1 = loc.coords.latitude * Math.PI / 180
        const lng1 = loc.coords.longitude * Math.PI / 180
        const lat2 = 21.4225 * Math.PI / 180  // Kaaba latitude
        const lng2 = 39.8262 * Math.PI / 180  // Kaaba longitude
        const dLng = lng2 - lng1
        const y = Math.sin(dLng) * Math.cos(lat2)
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
        let bearing = Math.atan2(y, x) * 180 / Math.PI
        bearing = (bearing + 360) % 360
        setQiblaAngle(Math.round(bearing))
        
        // Watch compass heading
        headingSub = await Location.watchHeadingAsync(data => {
          if (data.trueHeading >= 0) setHeading(data.trueHeading)
          else if (data.magHeading >= 0) setHeading(data.magHeading)
        })
      } catch(e) { setError("Activez le GPS et la boussole") }
    })()
    return () => { if (headingSub) headingSub.remove() }
  }, [])

  const rotation = qiblaAngle !== null ? qiblaAngle - heading : 0

  return (
    <View style={{ alignItems:"center", paddingTop:20 }}>
      <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginBottom:6 }}>🕋 Direction de la Qibla</Text>
      {city ? <Text style={{ color:C.muted, fontSize:12, marginBottom:16 }}>{city}</Text> : null}
      {error ? (
        <View style={[styles.card, { padding:16, alignItems:"center" }]}>
          <Text style={{ color:C.red, fontSize:14, textAlign:"center" }}>{error}</Text>
        </View>
      ) : qiblaAngle !== null ? (
        <View style={{ alignItems:"center" }}>
          <View style={{ width:220, height:220, borderRadius:110, borderWidth:4, borderColor:C.gold+"40", alignItems:"center", justifyContent:"center", backgroundColor:C.card }}>
            <View style={{ transform:[{rotate: rotation+"deg"}], alignItems:"center" }}>
              <Text style={{ color:C.gold, fontSize:16, marginBottom:4 }}>▲</Text>
              <Text style={{ fontSize:50 }}>🕋</Text>
            </View>
          </View>
          <Text style={{ color:C.gold, fontSize:28, fontWeight:"900", marginTop:16 }}>{qiblaAngle}°</Text>
          <Text style={{ color:C.muted, fontSize:12, marginTop:4 }}>Bearing depuis le Nord</Text>
          <View style={[styles.card, { padding:12, marginTop:16 }]}>
            <Text style={{ color:C.white, fontSize:12, textAlign:"center", lineHeight:20 }}>
              Tenez votre telephone a plat.{String.fromCharCode(10)}La Kaaba tourne en temps reel.{String.fromCharCode(10)}Quand elle pointe vers le haut → c'est la Qibla.
            </Text>
          </View>
        </View>
      ) : (
        <View style={{ alignItems:"center", gap:10 }}>
          <ActivityIndicator size="large" color={C.gold} />
          <Text style={{ color:C.muted, fontSize:12 }}>Calibration de la boussole...</Text>
        </View>
      )}
    </View>
  )
}



// ─── AI Imam (Claude) ─────────────────────────────────────────────────────────
function AIImam({ lang="fr" }) {
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(() => {
    AsyncStorage.getItem("fadjr_ai_history").then(d => { if (d) setHistory(JSON.parse(d).slice(0,10)) }).catch(() => {})
  }, [])

  const askImam = async () => {
    if (!question.trim() || loading) return
    setLoading(true)
    setAnswer("")
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": "placeholder", "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          system: "Tu es un imam bienveillant et savant. Reponds aux questions islamiques avec sagesse, en citant le Coran et les Hadiths quand c'est pertinent. Reponds dans la langue de la question. Sois concis mais complet.",
          messages: [{ role: "user", content: question }]
        })
      })
      const data = await resp.json()
      const text = data.content?.[0]?.text || "Desole, je ne peux pas repondre pour le moment. Consultez un imam local."
      setAnswer(text)
      const newHistory = [{ q: question, a: text, date: new Date().toLocaleDateString() }, ...history].slice(0, 10)
      setHistory(newHistory)
      AsyncStorage.setItem("fadjr_ai_history", JSON.stringify(newHistory)).catch(() => {})
    } catch(e) {
      setAnswer(lang==="ar"?"آسف، لا يمكنني الرد الآن. استشر إمامك المحلي.":lang==="en"?"Sorry, I cannot answer now. Consult your local imam.":"Desole, je ne peux pas repondre pour le moment. Consultez votre imam local.")
    }
    setLoading(false)
    setQuestion("")
  }

  return (
    <View>
      <View style={[styles.card, { padding:14, marginBottom:12, borderWidth:1, borderColor:C.gold+"40" }]}>
        <Text style={{ color:C.gold, fontSize:13, fontWeight:"700", marginBottom:8 }}>🤖 {lang==="ar"?"اسأل الإمام الذكي":lang==="en"?"Ask AI Imam":"Posez votre question"}</Text>
        <TextInput value={question} onChangeText={setQuestion}
          placeholder={lang==="ar"?"اكتب سؤالك...":lang==="en"?"Type your question...":"Tapez votre question..."}
          placeholderTextColor={C.muted} multiline
          style={{ backgroundColor:C.card2, borderWidth:1, borderColor:C.border, borderRadius:10, padding:12, color:C.white, fontSize:13, minHeight:60, textAlignVertical:"top" }} />
        <TouchableOpacity onPress={askImam} disabled={loading}
          style={{ backgroundColor:C.gold, borderRadius:10, padding:12, alignItems:"center", marginTop:8 }}>
          {loading ? <ActivityIndicator color={C.bg} /> : <Text style={{ color:C.bg, fontSize:14, fontWeight:"900" }}>{lang==="ar"?"اسأل":lang==="en"?"Ask":"Demander"}</Text>}
        </TouchableOpacity>
      </View>
      {answer ? (
        <View style={[styles.card, { padding:14, marginBottom:12, borderLeftWidth:3, borderLeftColor:C.green }]}>
          <Text style={{ color:C.white, fontSize:13, lineHeight:22 }}>{answer}</Text>
        </View>
      ) : null}
      {history.length > 0 && (
        <Text style={{ color:C.muted, fontSize:12, fontWeight:"700", marginBottom:8 }}>{lang==="ar"?"الأسئلة السابقة":lang==="en"?"Previous questions":"Questions precedentes"}</Text>
      )}
      {history.map((h, i) => (
        <TouchableOpacity key={i} onPress={() => setAnswer(h.a)}
          style={[styles.card, { padding:10, marginBottom:6 }]}>
          <Text style={{ color:C.gold, fontSize:12, fontWeight:"600" }}>{h.q}</Text>
          <Text style={{ color:C.muted, fontSize:10, marginTop:2 }}>{h.date}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ─── Articles Islamiques ──────────────────────────────────────────────────────
function ArticlesIslamiques({ lang="fr" }) {
  const ARTICLES = [
    { title:{fr:"La Kaaba: voyage a travers l'histoire sacree",en:"The Kaaba: A Journey Through Sacred History",ar:"الكعبة: رحلة عبر التاريخ المقدس",tr:"Kabe: Kutsal Tarih Yolculuğu"}, cat:"DEEN", emoji:"🕋" },
    { title:{fr:"Les bienfaits de Muharram",en:"Blessings of Muharram",ar:"بركات محرم",tr:"Muharrem'in Faziletleri"}, cat:"DEEN", emoji:"🌙" },
    { title:{fr:"Le repentir (Tawbah) en Islam",en:"Repentance (Tawbah) in Islam",ar:"التوبة في الإسلام",tr:"İslam'da Tövbe"}, cat:"DEEN", emoji:"🤲" },
    { title:{fr:"6 manieres de celebrer l'Aid",en:"6 Meaningful Ways to Celebrate Eid",ar:"6 طرق للاحتفال بالعيد",tr:"Bayramı Kutlamanın 6 Yolu"}, cat:"COMMUNITY", emoji:"🎉" },
    { title:{fr:"Comment l'Islam encourage la croissance",en:"How Islam Encourages Growth",ar:"كيف يشجع الإسلام النمو",tr:"İslam Nasıl Gelişimi Teşvik Eder"}, cat:"LIFESTYLE", emoji:"🌱" },
    { title:{fr:"Surmonter le desespoir par le pardon d'Allah",en:"Overcoming Despair Through Allah's Forgiveness",ar:"التغلب على اليأس من خلال مغفرة الله",tr:"Allah'ın Affıyla Umutsuzluğu Yenmek"}, cat:"DEEN", emoji:"❤️" },
    { title:{fr:"Le coeur de Tawhid: Sourate Al-Ikhlas",en:"The Heart of Tawhid: Surah Al-Ikhlas",ar:"قلب التوحيد: سورة الإخلاص",tr:"Tevhidin Kalbi: İhlas Suresi"}, cat:"QURAN", emoji:"📖" },
    { title:{fr:"Le jour d'Achoura: un spectre d'evenements",en:"The Day of Ashura: A Spectrum of Events",ar:"يوم عاشوراء: طيف من الأحداث",tr:"Aşure Günü: Olayların Yelpazesi"}, cat:"DEEN", emoji:"☪️" },
    { title:{fr:"5 facons d'enseigner le Coran aux enfants",en:"5 Ways to Teach Kids About the Quran",ar:"5 طرق لتعليم الأطفال القرآن",tr:"Çocuklara Kur'an Öğretmenin 5 Yolu"}, cat:"QURAN", emoji:"👶" },
    { title:{fr:"L'importance du Dhikr quotidien",en:"The Importance of Daily Dhikr",ar:"أهمية الذكر اليومي",tr:"Günlük Zikirin Önemi"}, cat:"DEEN", emoji:"📿" },
  ]

  return (
    <View>
      {ARTICLES.map((a, i) => (
        <View key={i} style={[styles.card, { padding:14, marginBottom:8 }]}>
          <View style={{ flexDirection:"row", alignItems:"center", gap:8, marginBottom:6 }}>
            <View style={{ backgroundColor:C.green+"25", borderRadius:99, paddingHorizontal:8, paddingVertical:2 }}>
              <Text style={{ color:C.green, fontSize:9, fontWeight:"800" }}>{a.cat}</Text>
            </View>
          </View>
          <View style={{ flexDirection:"row", gap:10, alignItems:"center" }}>
            <Text style={{ fontSize:28 }}>{a.emoji}</Text>
            <Text style={{ color:C.white, fontSize:14, fontWeight:"700", flex:1, lineHeight:20 }}>{a.title[lang] || a.title.fr}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

// ─── Mode Ramadan ─────────────────────────────────────────────────────────────
function ModeRamadan({ prayers, lang="fr" }) {
  const [checklist, setChecklist] = useState({})
  
  useEffect(() => {
    AsyncStorage.getItem("fadjr_ramadan_checklist").then(d => { if (d) setChecklist(JSON.parse(d)) }).catch(() => {})
  }, [])

  const toggle = (key) => {
    const updated = { ...checklist, [key]: !checklist[key] }
    setChecklist(updated)
    AsyncStorage.setItem("fadjr_ramadan_checklist", JSON.stringify(updated)).catch(() => {})
  }

  const fajr = (prayers||[]).find(p => p.name === "Fajr")
  const maghrib = (prayers||[]).find(p => p.name === "Maghrib")

  const TASKS = [
    { key:"suhoor", emoji:"🌅", label:{fr:"Suhoor pris",en:"Suhoor taken",ar:"تناول السحور",tr:"Sahur yapıldı"} },
    { key:"fasted", emoji:"☪️", label:{fr:"Jeune du jour",en:"Day fasted",ar:"صيام اليوم",tr:"Günlük oruç"} },
    { key:"quran", emoji:"📖", label:{fr:"Lecture Coran (1 juz)",en:"Quran reading (1 juz)",ar:"قراءة القرآن (جزء)",tr:"Kur'an okuma (1 cüz)"} },
    { key:"tarawih", emoji:"🕌", label:{fr:"Priere Tarawih",en:"Tarawih prayer",ar:"صلاة التراويح",tr:"Teravih namazı"} },
    { key:"sadaqa", emoji:"💰", label:{fr:"Sadaqa donnee",en:"Sadaqah given",ar:"صدقة",tr:"Sadaka verildi"} },
    { key:"dhikr", emoji:"📿", label:{fr:"Dhikr apres priere",en:"Dhikr after prayer",ar:"ذكر بعد الصلاة",tr:"Namaz sonrası zikir"} },
    { key:"dua", emoji:"🤲", label:{fr:"Douas a l'Iftar",en:"Dua at Iftar",ar:"دعاء عند الإفطار",tr:"İftar duası"} },
    { key:"gooddeed", emoji:"❤️", label:{fr:"Bonne action du jour",en:"Good deed of the day",ar:"حسنة اليوم",tr:"Günün iyiliği"} },
  ]

  const completed = Object.values(checklist).filter(Boolean).length
  const pct = Math.round((completed / TASKS.length) * 100)

  return (
    <View>
      {/* Iftar / Suhoor times */}
      <View style={{ flexDirection:"row", gap:8, marginBottom:14 }}>
        <View style={[styles.card, { flex:1, padding:14, alignItems:"center", borderTopWidth:3, borderTopColor:C.gold }]}>
          <Text style={{ color:C.gold, fontSize:11, fontWeight:"700" }}>{lang==="ar"?"السحور":"SUHOOR"}</Text>
          <Text style={{ color:C.white, fontSize:24, fontWeight:"900", marginTop:4 }}>{fajr?.time || "--:--"}</Text>
        </View>
        <View style={[styles.card, { flex:1, padding:14, alignItems:"center", borderTopWidth:3, borderTopColor:C.green }]}>
          <Text style={{ color:C.green, fontSize:11, fontWeight:"700" }}>{lang==="ar"?"الإفطار":"IFTAR"}</Text>
          <Text style={{ color:C.white, fontSize:24, fontWeight:"900", marginTop:4 }}>{maghrib?.time || "--:--"}</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={[styles.card, { padding:14, marginBottom:14, alignItems:"center" }]}>
        <Text style={{ color:C.gold, fontSize:28, fontWeight:"900" }}>{pct}%</Text>
        <Text style={{ color:C.muted, fontSize:12, marginTop:4 }}>{completed}/{TASKS.length} {lang==="ar"?"مكتمل":lang==="en"?"completed":"accompli"}</Text>
        <View style={{ width:"100%", height:6, backgroundColor:C.card2, borderRadius:99, marginTop:10, overflow:"hidden" }}>
          <View style={{ width:pct+"%", height:"100%", backgroundColor:C.gold, borderRadius:99 }} />
        </View>
      </View>

      {/* Checklist */}
      {TASKS.map(task => (
        <TouchableOpacity key={task.key} onPress={() => toggle(task.key)}
          style={[styles.card, { padding:12, marginBottom:6, flexDirection:"row", alignItems:"center", gap:10, backgroundColor: checklist[task.key] ? C.green+"12" : C.card }]}>
          <View style={{ width:24, height:24, borderRadius:6, borderWidth:2, borderColor: checklist[task.key] ? C.green : C.gold+"50", backgroundColor: checklist[task.key] ? C.green : "transparent", alignItems:"center", justifyContent:"center" }}>
            {checklist[task.key] && <Text style={{ color:C.white, fontSize:12, fontWeight:"900" }}>✓</Text>}
          </View>
          <Text style={{ fontSize:18 }}>{task.emoji}</Text>
          <Text style={{ color: checklist[task.key] ? C.green : C.white, fontSize:13, fontWeight:"600" }}>{task.label[lang] || task.label.fr}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ─── Memorisation Coran (Hifz) ────────────────────────────────────────────────
function HifzTracker({ lang="fr" }) {
  const [memorized, setMemorized] = useState({})
  const [totalMemo, setTotalMemo] = useState(0)

  useEffect(() => {
    AsyncStorage.getItem("fadjr_hifz").then(d => {
      if (d) { const p = JSON.parse(d); setMemorized(p); setTotalMemo(Object.keys(p).filter(k => p[k]).length) }
    }).catch(() => {})
  }, [])

  const toggleMemo = async (num) => {
    const newM = { ...memorized, [num]: !memorized[num] }
    setMemorized(newM)
    const count = Object.keys(newM).filter(k => newM[k]).length
    setTotalMemo(count)
    await AsyncStorage.setItem("fadjr_hifz", JSON.stringify(newM))
  }

  const pct = Math.round((totalMemo / 114) * 100)
  const SHORT_SURAHS = [112,113,114,111,108,107,106,105,103,102,101,100,99,97,96,95,94,93,92,91]

  return (
    <View>
      <View style={[styles.card, { padding:16, alignItems:"center", marginBottom:14, borderWidth:1, borderColor:C.gold+"40" }]}>
        <Text style={{ color:C.gold, fontSize:12, fontWeight:"700", marginBottom:6 }}>{lang==="ar"?"تقدم الحفظ":lang==="en"?"Memorization Progress":"Progression Hifz"}</Text>
        <Text style={{ color:C.white, fontSize:36, fontWeight:"900" }}>{totalMemo}/114</Text>
        <View style={{ width:"100%", height:8, backgroundColor:C.card2, borderRadius:99, marginTop:10, overflow:"hidden" }}>
          <View style={{ width:pct+"%", height:"100%", backgroundColor:C.green, borderRadius:99 }} />
        </View>
        <Text style={{ color:C.muted, fontSize:11, marginTop:6 }}>{pct}% {lang==="ar"?"مكتمل":lang==="en"?"memorized":"memorise"}</Text>
      </View>

      <Text style={{ color:C.gold, fontSize:13, fontWeight:"700", marginBottom:8 }}>{lang==="ar"?"ابدأ بالسور القصيرة":lang==="en"?"Start with short surahs":"Commence par les courtes sourates"}</Text>
      {SHORT_SURAHS.map(num => (
        <TouchableOpacity key={num} onPress={() => toggleMemo(num)}
          style={[styles.card, { flexDirection:"row", alignItems:"center", gap:10, padding:10, marginBottom:4, backgroundColor: memorized[num] ? C.green+"15" : C.card }]}>
          <View style={{ width:24, height:24, borderRadius:6, borderWidth:2, borderColor: memorized[num] ? C.green : C.gold+"50", backgroundColor: memorized[num] ? C.green : "transparent", alignItems:"center", justifyContent:"center" }}>
            {memorized[num] && <Text style={{ color:C.white, fontSize:12, fontWeight:"900" }}>✓</Text>}
          </View>
          <Text style={{ color:C.gold, fontSize:12, fontWeight:"800", width:28 }}>{num}</Text>
          <Text style={{ color: memorized[num] ? C.green : C.white, fontSize:13, fontWeight:"600", flex:1 }}>Sourate {num}</Text>
          <Text style={{ color:C.muted, fontSize:10 }}>{memorized[num] ? "✅" : "📖"}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ─── Parametres de Priere ─────────────────────────────────────────────────────
function PrayerSettings({ lang="fr" }) {
  const [method, setMethod] = useState(12) // 12 = UOIF (Europe)
  const METHODS = [
    { id:2, name:"ISNA", desc:"Islamic Society of North America" },
    { id:3, name:"MWL", desc:"Muslim World League" },
    { id:4, name:"Makkah", desc:"Umm al-Qura University" },
    { id:5, name:"Egypt", desc:"Egyptian General Authority" },
    { id:12, name:"UOIF", desc:"Union des Organisations Islamiques de France" },
    { id:13, name:"Gulf", desc:"Gulf Region" },
    { id:14, name:"Turkey", desc:"Diyanet Isleri Baskanligi" },
  ]

  useEffect(() => {
    AsyncStorage.getItem("fadjr_prayer_method").then(d => { if (d) setMethod(parseInt(d)) }).catch(() => {})
  }, [])

  const selectMethod = (id) => {
    setMethod(id)
    AsyncStorage.setItem("fadjr_prayer_method", String(id)).catch(() => {})
    Alert.alert(lang==="ar"?"تم التحديث":lang==="en"?"Updated":"Mis a jour", lang==="ar"?"أعد تشغيل التطبيق":lang==="en"?"Restart app to apply":"Relancez l'app pour appliquer")
  }

  return (
    <View>
      <Text style={{ color:C.white, fontSize:14, fontWeight:"700", marginBottom:10 }}>{lang==="ar"?"طريقة الحساب":lang==="en"?"Calculation Method":"Methode de calcul"}</Text>
      {METHODS.map(m => (
        <TouchableOpacity key={m.id} onPress={() => selectMethod(m.id)}
          style={[styles.card, { padding:12, marginBottom:6, flexDirection:"row", alignItems:"center", gap:10, backgroundColor: method===m.id ? C.gold+"15" : C.card, borderWidth:1, borderColor: method===m.id ? C.gold : C.border }]}>
          <View style={{ width:22, height:22, borderRadius:11, borderWidth:2, borderColor: method===m.id ? C.gold : C.muted, backgroundColor: method===m.id ? C.gold : "transparent" }} />
          <View style={{ flex:1 }}>
            <Text style={{ color: method===m.id ? C.gold : C.white, fontSize:13, fontWeight:"700" }}>{m.name}</Text>
            <Text style={{ color:C.muted, fontSize:10 }}>{m.desc}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ─── Son Ambiance ─────────────────────────────────────────────────────────────
function SonAmbiance({ lang="fr" }) {
  const SOUNDS = [
    { id:"rain_quran", emoji:"🌧️📖", label:{fr:"Pluie + Coran",en:"Rain + Quran",ar:"مطر + قرآن",tr:"Yağmur + Kur'an"}, url:"https://www.youtube.com/results?search_query=rain+quran+relaxation" },
    { id:"nature_quran", emoji:"🌿📖", label:{fr:"Nature + Coran",en:"Nature + Quran",ar:"طبيعة + قرآن",tr:"Doğa + Kur'an"}, url:"https://www.youtube.com/results?search_query=nature+sounds+quran+recitation" },
    { id:"ocean_dhikr", emoji:"🌊📿", label:{fr:"Ocean + Dhikr",en:"Ocean + Dhikr",ar:"بحر + ذكر",tr:"Deniz + Zikir"}, url:"https://www.youtube.com/results?search_query=ocean+waves+dhikr+meditation" },
    { id:"night_tahajjud", emoji:"🌙🤲", label:{fr:"Nuit + Tahajjud",en:"Night + Tahajjud",ar:"ليل + تهجد",tr:"Gece + Teheccüd"}, url:"https://www.youtube.com/results?search_query=night+prayer+tahajjud+relaxation" },
    { id:"birds_morning", emoji:"🐦🌅", label:{fr:"Oiseaux + Adhkar matin",en:"Birds + Morning Adhkar",ar:"طيور + أذكار الصباح",tr:"Kuşlar + Sabah Ezkarı"}, url:"https://www.youtube.com/results?search_query=birds+morning+adhkar" },
  ]

  return (
    <View>
      <Text style={{ color:C.muted, fontSize:12, marginBottom:12 }}>{lang==="ar"?"استرخ مع أصوات هادئة وقرآن":lang==="en"?"Relax with calming sounds & Quran":"Detendez-vous avec des sons apaisants et le Coran"}</Text>
      {SOUNDS.map(s => (
        <TouchableOpacity key={s.id} onPress={() => Linking.openURL(s.url).catch(()=>{})}
          style={[styles.card, { padding:14, marginBottom:8, flexDirection:"row", alignItems:"center", gap:12 }]}>
          <Text style={{ fontSize:28 }}>{s.emoji}</Text>
          <View style={{ flex:1 }}>
            <Text style={{ color:C.white, fontSize:14, fontWeight:"700" }}>{s.label[lang] || s.label.fr}</Text>
          </View>
          <Text style={{ color:C.gold, fontSize:14 }}>▶️</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ─── Adhkar Component ─────────────────────────────────────────────────────────
function AdhkarSection({ lang="fr" }) {
  const [period, setPeriod] = useState("matin")
  const ADHKAR_MATIN = [
    { ar:"أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ", fr:"Nous voila au matin et le royaume appartient a Allah", count:1 },
    { ar:"اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ", fr:"O Allah, par Toi nous entrons dans le matin, par Toi nous entrons dans le soir, par Toi nous vivons, par Toi nous mourons et vers Toi est la resurrection", count:1 },
    { ar:"اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ", fr:"O Allah, Tu es mon Seigneur, il n'y a de divinite que Toi, Tu m'as cree et je suis Ton serviteur (Sayyid al-Istighfar)", count:1 },
    { ar:"بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ", fr:"Au nom d'Allah, rien sur terre ni dans le ciel ne peut nuire avec Son nom, et Il est l'Audient, l'Omniscient", count:3 },
    { ar:"اللَّهُمَّ عَافِنِي فِي بَدَنِي اللَّهُمَّ عَافِنِي فِي سَمْعِي اللَّهُمَّ عَافِنِي فِي بَصَرِي", fr:"O Allah, accorde-moi la sante dans mon corps, dans mon ouie et dans ma vue", count:3 },
    { ar:"حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ", fr:"Allah me suffit, il n'y a de divinite que Lui, en Lui je place ma confiance et Il est le Seigneur du Trone immense", count:7 },
    { ar:"سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", fr:"Gloire et louange a Allah", count:100 },
    { ar:"لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", fr:"Nulle divinite sauf Allah, Seul sans associe, a Lui le royaume, a Lui la louange et Il est Omnipotent", count:10 },
    { ar:"أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", fr:"Je cherche refuge dans les paroles parfaites d'Allah contre le mal de ce qu'Il a cree", count:3 },
    { ar:"اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ", fr:"O Allah, prie et accorde le salut sur notre Prophete Muhammad ﷺ", count:10 },
  ]
  const ADHKAR_SOIR = [
    { ar:"أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ", fr:"Nous voila au soir et le royaume appartient a Allah", count:1 },
    { ar:"اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ", fr:"O Allah, par Toi nous entrons dans le soir, par Toi nous entrons dans le matin, par Toi nous vivons, par Toi nous mourons et vers Toi est le retour", count:1 },
    { ar:"اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ", fr:"O Allah, Tu es mon Seigneur, il n'y a de divinite que Toi (Sayyid al-Istighfar)", count:1 },
    { ar:"بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ", fr:"Au nom d'Allah, rien sur terre ni dans le ciel ne peut nuire", count:3 },
    { ar:"أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", fr:"Je cherche refuge dans les paroles parfaites d'Allah", count:3 },
    { ar:"حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ", fr:"Allah me suffit, en Lui je place ma confiance", count:7 },
    { ar:"سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", fr:"Gloire et louange a Allah", count:100 },
    { ar:"أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ", fr:"Je demande pardon a Allah et je me repens a Lui", count:100 },
    { ar:"اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ", fr:"O Allah, prie et accorde le salut sur notre Prophete Muhammad ﷺ", count:10 },
  ]
  const data = period === "matin" ? ADHKAR_MATIN : ADHKAR_SOIR
  return (
    <View>
      <View style={{ flexDirection:"row", gap:8, marginBottom:14 }}>
        {[["matin","🌅 "+t("matin",lang)],["soir","🌙 "+t("soir",lang)]].map(([key,label]) => (
          <TouchableOpacity key={key} onPress={() => setPeriod(key)}
            style={{ flex:1, padding:10, borderRadius:10, backgroundColor: period===key ? C.gold+"25" : C.card2, borderWidth:1, borderColor: period===key ? C.gold : C.border, alignItems:"center" }}>
            <Text style={{ color: period===key ? C.gold : C.muted, fontWeight:"700", fontSize:13 }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {data.map((dhikr, i) => (
        <View key={i} style={[styles.card, { padding:14, marginBottom:8 }]}>
          <Text style={{ color:C.goldL, fontSize:16, textAlign:"right", lineHeight:28, marginBottom:8 }}>{dhikr.ar}</Text>
          <Text style={{ color:C.white, fontSize:12, lineHeight:18 }}>{dhikr.fr}</Text>
          <View style={{ flexDirection:"row", justifyContent:"flex-end", marginTop:8 }}>
            <View style={{ backgroundColor:C.gold+"20", borderRadius:99, paddingHorizontal:10, paddingVertical:3 }}>
              <Text style={{ color:C.gold, fontSize:11, fontWeight:"800" }}>x{dhikr.count}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  )
}

// ─── Mosquees Nearby ──────────────────────────────────────────────────────────
function MosqueesProximite({ lang="fr" }) {
  const [mosques, setMosques] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userCoords, setUserCoords] = useState(null)
  const [cityName, setCityName] = useState("")
  const [manualCity, setManualCity] = useState("")
  const [searchMode, setSearchMode] = useState("gps") // gps or manual

  const calcDist = (lat1, lon1, lat2, lon2) => {
    const R = 6371
    const dLat = (lat2-lat1) * Math.PI/180
    const dLon = (lon2-lon1) * Math.PI/180
    const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2)
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }

  const searchMosques = async (lat, lng, city) => {
    setLoading(true)
    setMosques([])
    try {
      // Search with Overpass API for better results
      const overpassQuery = `[out:json][timeout:15];(node["amenity"="place_of_worship"]["religion"="muslim"](around:25000,${lat},${lng});way["amenity"="place_of_worship"]["religion"="muslim"](around:25000,${lat},${lng}););out center 50;`
      const resp = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`,
        { headers: { "User-Agent": "FADJR-App/1.0" } }
      )
      const data = await resp.json()
      
      if (data && data.elements && data.elements.length > 0) {
        const sorted = data.elements.map(m => {
          const mLat = m.lat || m.center?.lat
          const mLng = m.lon || m.center?.lon
          return {
            name: m.tags?.name || m.tags?.["name:fr"] || m.tags?.["name:ar"] || (lang==="ar"?"مسجد":lang==="en"?"Mosque":"Mosquée"),
            adresse: m.tags?.["addr:street"] ? `${m.tags["addr:housenumber"]||""} ${m.tags["addr:street"]}, ${m.tags["addr:city"]||""}`.trim() : "",
            lat: mLat,
            lng: mLng,
            dist: calcDist(lat, lng, mLat, mLng),
            phone: m.tags?.phone || m.tags?.["contact:phone"] || null
          }
        }).filter(m => m.lat && m.lng && m.dist <= 25).sort((a,b) => a.dist - b.dist)
        setMosques(sorted)
      } else {
        // Fallback Nominatim
        const resp2 = await fetch(
          `https://nominatim.openstreetmap.org/search?q=mosque+${encodeURIComponent(city)}&format=json&limit=50`,
          { headers: { "User-Agent": "FADJR-App/1.0" } }
        )
        const data2 = await resp2.json()
        if (data2 && data2.length > 0) {
          const sorted2 = data2.map(m => ({
            name: m.display_name.split(",")[0],
            adresse: m.display_name.split(",").slice(1,3).join(",").trim(),
            lat: parseFloat(m.lat),
            lng: parseFloat(m.lon),
            dist: calcDist(lat, lng, parseFloat(m.lat), parseFloat(m.lon))
          })).filter(m => m.dist <= 25).sort((a,b) => a.dist - b.dist)
          setMosques(sorted2)
        }
      }
      setCityName(city)
      setLoading(false)
    } catch(e) { setError(lang==="en"?"Error":"Erreur de chargement"); setLoading(false) }
  }

  const searchByCity = async () => {
    if (!manualCity.trim()) return
    setLoading(true)
    try {
      const geoResp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualCity)}&format=json&limit=1`, { headers: { "User-Agent": "FADJR-App/1.0" } })
      const geoData = await geoResp.json()
      if (geoData && geoData.length > 0) {
        const lat = parseFloat(geoData[0].lat)
        const lng = parseFloat(geoData[0].lon)
        setUserCoords({ lat, lng })
        setSearchMode("manual")
        await searchMosques(lat, lng, manualCity.trim())
      } else {
        setError(lang==="en"?"City not found":"Ville non trouvée")
        setLoading(false)
      }
    } catch(e) { setError(lang==="en"?"Error":"Erreur"); setLoading(false) }
  }

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") { setError(lang==="ar"?"يرجى تفعيل GPS":lang==="en"?"Please enable GPS":"Activez le GPS"); setLoading(false); return }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
        const lat = loc.coords.latitude
        const lng = loc.coords.longitude
        setUserCoords({ lat, lng })
        
        let city = ""
        try {
          const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng })
          if (geo?.city) city = geo.city
        } catch(e) {}

        await searchMosques(lat, lng, city)
      } catch(e) { setError(lang==="en"?"Error":"Erreur de chargement"); setLoading(false) }
    })()
  }, [])

  if (loading) return (
    <View style={{ alignItems:"center", paddingTop:40 }}>
      <ActivityIndicator size="large" color={C.gold} />
      <Text style={{ color:C.muted, fontSize:12, marginTop:10 }}>{lang==="ar"?"جاري البحث...":lang==="en"?"Searching...":"Recherche des mosquees..."}</Text>
    </View>
  )
  if (error) return <Text style={{ color:C.red, textAlign:"center", marginTop:40, fontSize:14 }}>{error}</Text>

  return (
    <View>
      <View style={{ flexDirection:"row", gap:8, marginBottom:10 }}>
        <TextInput value={manualCity} onChangeText={setManualCity}
          placeholder={lang==="ar"?"ابحث عن مدينة...":lang==="en"?"Search city...":"Chercher une ville..."}
          placeholderTextColor={C.muted}
          style={{ flex:1, backgroundColor:C.card, borderWidth:1, borderColor:C.border, borderRadius:10, padding:10, color:C.white, fontSize:13 }}
          onSubmitEditing={searchByCity} />
        <TouchableOpacity onPress={searchByCity} style={{ backgroundColor:C.gold, borderRadius:10, paddingHorizontal:14, alignItems:"center", justifyContent:"center" }}>
          <Text style={{ color:C.bg, fontSize:13, fontWeight:"800" }}>🔍</Text>
        </TouchableOpacity>
      </View>
      {searchMode==="manual" && userCoords && (
        <TouchableOpacity onPress={() => { setSearchMode("gps"); setManualCity(""); setLoading(true); Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).then(loc => { setUserCoords({ lat:loc.coords.latitude, lng:loc.coords.longitude }); searchMosques(loc.coords.latitude, loc.coords.longitude, cityName) }).catch(()=>setLoading(false)) }}
          style={{ marginBottom:8 }}>
          <Text style={{ color:C.teal, fontSize:11 }}>📍 {lang==="en"?"Back to my location":"Revenir à ma position"}</Text>
        </TouchableOpacity>
      )}
      <Text style={{ color:C.gold, fontSize:13, fontWeight:"700", marginBottom:4 }}>{cityName} — {mosques.length} {lang==="ar"?"مسجد":lang==="en"?"mosques":"mosquées"} ({lang==="ar"?"ضمن 25 كم":lang==="en"?"within 25km":"dans un rayon de 25km"})</Text>
      <Text style={{ color:C.muted, fontSize:10, marginBottom:12 }}>{lang==="ar"?"اضغط للتوجيه":lang==="en"?"Tap for directions":"Appuyez pour le GPS"}</Text>
      {mosques.map((m, i) => (
        <TouchableOpacity key={i} onPress={() => Linking.openURL("https://maps.google.com/?daddr="+m.lat+","+m.lng).catch(()=>{})}
          style={[styles.card, { padding:12, marginBottom:6, flexDirection:"row", alignItems:"center", gap:10 }]}>
          <Text style={{ fontSize:20 }}>🕌</Text>
          <View style={{ flex:1 }}>
            <Text style={{ color:C.white, fontSize:13, fontWeight:"700" }}>{m.name}</Text>
            <Text style={{ color:C.muted, fontSize:10 }}>{m.adresse}</Text>
          </View>
          <Text style={{ color:C.gold, fontSize:12, fontWeight:"700" }}>{m.dist.toFixed(1)} km</Text>
        </TouchableOpacity>
      ))}
      {mosques.length === 0 && <Text style={{ color:C.muted, fontSize:13, textAlign:"center", marginTop:20 }}>{lang==="ar"?"لم يتم العثور على مساجد":lang==="en"?"No mosques found":"Aucune mosquee trouvee"}</Text>}
    </View>
  )
}

// ─── Khatam Quran Tracker ─────────────────────────────────────────────────────
function KhatamTracker({ onBack, lang="fr" }) {
  const [progress, setProgress] = useState({})
  const [totalRead, setTotalRead] = useState(0)
  useEffect(() => {
    AsyncStorage.getItem("khatam_progress").then(data => {
      if (data) { const p = JSON.parse(data); setProgress(p); setTotalRead(Object.keys(p).filter(k => p[k]).length) }
    }).catch(() => {})
  }, [])
  const toggleSourate = async (num) => {
    const newP = { ...progress, [num]: !progress[num] }
    setProgress(newP)
    const count = Object.keys(newP).filter(k => newP[k]).length
    setTotalRead(count)
    await AsyncStorage.setItem("khatam_progress", JSON.stringify(newP))
  }
  const pct = Math.round((totalRead / 114) * 100)
  const JUZ_SOURATES = [
    [1,2],[2],[2,3],[3,4],[4],[4,5],[5,6],[6,7],[7,8],[8,9,10],
    [9,10,11],[11,12],[12,13,14],[15,16],[17,18],[18,19,20],[21,22],[23,24,25],[25,26,27],[27,28,29],
    [29,30,31,32,33],[33,34,35,36],[36,37,38,39],[39,40,41],[41,42,43,44,45],[46,47,48,49,50,51],[51,52,53,54,55,56,57],[58,59,60,61,62,63,64,65,66],[67,68,69,70,71,72,73,74,75,76,77],[78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114]
  ]
  return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={onBack} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang||"fr")}</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>✅ Khatam — Tracker Coran</Text>
      </View>
      <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { padding:16, alignItems:"center", marginBottom:14, borderWidth:1, borderColor: pct===100 ? C.green : C.gold+"40" }]}>
          <Text style={{ color: pct===100 ? C.green : C.gold, fontSize:36, fontWeight:"900" }}>{pct}%</Text>
          <Text style={{ color:C.white, fontSize:14, fontWeight:"600", marginTop:4 }}>{totalRead} / 114 sourates</Text>
          <View style={{ width:"100%", height:8, backgroundColor:C.card2, borderRadius:99, marginTop:12, overflow:"hidden" }}>
            <View style={{ width:`${pct}%`, height:"100%", backgroundColor: pct===100 ? C.green : C.gold, borderRadius:99 }} />
          </View>
          {pct===100 && <Text style={{ color:C.green, fontSize:14, fontWeight:"800", marginTop:8 }}>Masha'Allah ! Khatam complete !</Text>}
        </View>
        <Text style={{ color:C.muted, fontSize:11, marginBottom:10 }}>Cochez les sourates que vous avez lues</Text>
        {Array.from({length:114}, (_, i) => i+1).map(num => (
          <TouchableOpacity key={num} onPress={() => toggleSourate(num)}
            style={[styles.card, { flexDirection:"row", alignItems:"center", gap:10, padding:10, marginBottom:4, backgroundColor: progress[num] ? C.green+"15" : C.card }]}>
            <View style={{ width:24, height:24, borderRadius:6, borderWidth:2, borderColor: progress[num] ? C.green : C.gold+"50", backgroundColor: progress[num] ? C.green : "transparent", alignItems:"center", justifyContent:"center" }}>
              {progress[num] && <Text style={{ color:C.white, fontSize:12, fontWeight:"900" }}>✓</Text>}
            </View>
            <Text style={{ color:C.gold, fontSize:12, fontWeight:"800", width:28 }}>{num}</Text>
            <Text style={{ color: progress[num] ? C.green : C.white, fontSize:13, fontWeight:"600", flex:1 }}>Sourate {num}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

// ─── Notation Restaurant ─────────────────────────────────────────────────────
function RatingStars({ value=0, onRate=null, size=16 }) {
  return (
    <View style={{ flexDirection:"row", gap:2 }}>
      {[1,2,3,4,5].map(star => (
        <TouchableOpacity key={star} onPress={() => onRate && onRate(star)} disabled={!onRate}>
          <Text style={{ fontSize:size, color: star <= value ? C.gold : "rgba(255,255,255,.15)" }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

function RestaurantDetail({ resto, favs, onToggleFav, onBack, lang="fr" }) {
  const [userRating, setUserRating] = useState(0)
  const [ratings, setRatings] = useState({ viande:0, accueil:0, prix:0 })
  const [reviews, setReviews] = useState([])
  const [reviewText, setReviewText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const auth = useAuth() || {}

  useEffect(() => {
    // Load existing ratings from Supabase
    supabase.from("restaurant_ratings")
      .select("rating,review,user_id,created_at,viande_rating,accueil_rating,prix_rating")
      .eq("restaurant_id", resto.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setReviews(data)
          const avg = (key) => Math.round(data.filter(r=>r[key]>0).reduce((s,r)=>s+(r[key]||0),0) / (data.filter(r=>r[key]>0).length||1))
          setRatings({ viande:avg("viande_rating"), accueil:avg("accueil_rating"), prix:avg("prix_rating") })
        }
      }).catch(() => {})
    // Load user's own rating
    if (auth.user) {
      supabase.from("restaurant_ratings").select("rating").eq("restaurant_id", resto.id).eq("user_id", auth.user.id).single()
        .then(({ data }) => { if (data) setUserRating(data.rating) }).catch(() => {})
    }
  }, [resto.id])

  const submitRating = async (stars) => {
    setUserRating(stars)
    if (!auth.user || auth.isAnonymous) { Alert.alert(lang==="ar"?"تسجيل مطلوب":lang==="en"?"Login required":"Connexion requise", lang==="ar"?"سجّل دخولك لإضافة تقييم":lang==="en"?"Please log in to rate":"Connectez-vous pour noter"); return }
    setSubmitting(true)
    await supabase.from("restaurant_ratings").upsert({ restaurant_id: resto.id, user_id: auth.user.id, rating: stars, review: reviewText.trim()||null, updated_at: new Date().toISOString() }, { onConflict:"restaurant_id,user_id" }).catch(() => {})
    setSubmitting(false)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 2000)
  }

  const isFav = favs.includes(resto.id)
  const overallRating = resto.rating || 0
  const reviewCount = reviews.length

  return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={onBack} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour", lang)}</Text>
        </TouchableOpacity>
        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start", marginTop:8 }}>
          <View style={{ flex:1 }}>
            <Text style={{ color:C.white, fontSize:20, fontWeight:"900" }}>🍽️ {resto.name}</Text>
            {resto.halal_status && (
              <View style={{ backgroundColor:C.green+"18", borderRadius:99, paddingHorizontal:10, paddingVertical:3, alignSelf:"flex-start", marginTop:6 }}>
                <Text style={{ color:C.green, fontSize:10, fontWeight:"800" }}>HALAL {resto.halal_status==="verified" ? "✅ CERTIFIÉ" : ""}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={() => onToggleFav(resto.id)} style={{ padding:8 }}>
            <Text style={{ fontSize:24 }}>{isFav ? "❤️" : "🤍"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex:1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding:16 }}>
        {/* Info principale */}
        <View style={[styles.card, { padding:16, marginBottom:12 }]}>
          {overallRating > 0 && (
            <View style={{ flexDirection:"row", alignItems:"center", gap:8, marginBottom:12 }}>
              <RatingStars value={Math.round(overallRating)} size={18} />
              <Text style={{ color:C.gold, fontSize:16, fontWeight:"900" }}>{overallRating.toFixed(1)}</Text>
              <Text style={{ color:C.muted, fontSize:12 }}>({reviewCount} {lang==="ar"?"تقييم":lang==="en"?"reviews":"avis"})</Text>
            </View>
          )}
          {resto.address && (
            <View style={{ flexDirection:"row", gap:8, marginBottom:8 }}>
              <Text style={{ fontSize:14 }}>📍</Text>
              <Text style={{ color:C.white, fontSize:13, flex:1 }}>{resto.address}</Text>
            </View>
          )}
          {resto.cuisine_type && (
            <View style={{ flexDirection:"row", gap:8, marginBottom:8 }}>
              <Text style={{ fontSize:14 }}>🍴</Text>
              <Text style={{ color:C.teal, fontSize:13 }}>{resto.cuisine_type}</Text>
            </View>
          )}
          {resto.phone && (
            <View style={{ flexDirection:"row", gap:8 }}>
              <Text style={{ fontSize:14 }}>📞</Text>
              <Text style={{ color:C.white, fontSize:13 }}>{resto.phone}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={{ flexDirection:"row", gap:8, marginBottom:12 }}>
          {resto.phone && (
            <TouchableOpacity onPress={() => Linking.openURL("tel:"+resto.phone.replace(/\s/g,"")).catch(()=>{})}
              style={{ flex:1, padding:12, borderRadius:10, borderWidth:1, borderColor:C.gold, alignItems:"center" }}>
              <Text style={{ color:C.gold, fontSize:12, fontWeight:"700" }}>📞 {lang==="ar"?"اتصل":lang==="en"?"Call":"Appeler"}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => Linking.openURL(resto.google_maps_url || "https://maps.google.com/?q="+encodeURIComponent(resto.address||resto.name)).catch(()=>{})}
            style={{ flex:1, padding:12, borderRadius:10, borderWidth:1, borderColor:C.blue, alignItems:"center" }}>
            <Text style={{ color:C.blue, fontSize:12, fontWeight:"700" }}>🗺️ {lang==="ar"?"توجيه":lang==="en"?"Directions":"Itinéraire"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Share.share({ message:"🍽️ "+resto.name+"\n📍 "+(resto.address||"")+"\n\n📲 Trouvé sur FADJR: https://fadjr.app" }).catch(()=>{})}
            style={{ flex:1, padding:12, borderRadius:10, borderWidth:1, borderColor:C.muted, alignItems:"center" }}>
            <Text style={{ color:C.muted, fontSize:12, fontWeight:"700" }}>📤 {lang==="ar"?"شارك":lang==="en"?"Share":"Partager"}</Text>
          </TouchableOpacity>
        </View>

        {/* Évaluations détaillées */}
        {reviewCount > 0 && (
          <View style={[styles.card, { padding:14, marginBottom:12 }]}>
            <Text style={{ color:C.gold, fontSize:13, fontWeight:"700", marginBottom:12 }}>⭐ {lang==="ar"?"التقييمات":lang==="en"?"Ratings":"Évaluations"}</Text>
            {[["viande", lang==="ar"?"اللحم":lang==="en"?"Meat":"Viande halal"], ["accueil", lang==="ar"?"الاستقبال":lang==="en"?"Service":"Accueil"], ["prix", lang==="ar"?"السعر":lang==="en"?"Price":"Prix"]].map(([key, label]) => (
              <View key={key} style={{ flexDirection:"row", alignItems:"center", gap:8, marginBottom:8 }}>
                <Text style={{ color:C.muted, fontSize:11, width:80 }}>{label}</Text>
                <View style={{ flex:1, height:4, backgroundColor:"rgba(255,255,255,.06)", borderRadius:99, overflow:"hidden" }}>
                  <View style={{ width:(ratings[key]/5*100)+"%", height:"100%", backgroundColor:C.gold, borderRadius:99 }} />
                </View>
                <RatingStars value={ratings[key]} size={11} />
              </View>
            ))}
          </View>
        )}

        {/* Donner son avis */}
        <View style={[styles.card, { padding:14, marginBottom:12 }]}>
          <Text style={{ color:C.gold, fontSize:13, fontWeight:"700", marginBottom:10 }}>{lang==="ar"?"قيّم هذا المطعم":lang==="en"?"Rate this restaurant":"Votre avis"}</Text>
          <View style={{ alignItems:"center", marginBottom:12 }}>
            <RatingStars value={userRating} onRate={submitRating} size={32} />
            {userRating > 0 && <Text style={{ color:C.gold, fontSize:11, marginTop:6 }}>{["","😞 Décevant","😐 Passable","🙂 Bien","😊 Très bien","🤩 Excellent!"][userRating]}</Text>}
          </View>
          {userRating > 0 && !submitted && (
            <TextInput value={reviewText} onChangeText={setReviewText} multiline numberOfLines={2}
              placeholder={lang==="ar"?"أضف تعليقاً...":lang==="en"?"Add a comment...":"Ajoutez un commentaire..."}
              placeholderTextColor={C.muted}
              style={{ backgroundColor:C.card2, borderWidth:1, borderColor:C.border, borderRadius:10, padding:10, color:C.white, fontSize:12, textAlignVertical:"top", marginBottom:8 }} />
          )}
          {submitted && <Text style={{ color:C.green, fontSize:12, textAlign:"center" }}>✅ {lang==="ar"?"شكراً!":lang==="en"?"Thank you!":"Merci !"}</Text>}
        </View>

        {/* Derniers avis */}
        {reviews.filter(r=>r.review).length > 0 && (
          <View style={{ marginBottom:12 }}>
            <Text style={{ color:C.white, fontSize:13, fontWeight:"700", marginBottom:8 }}>💬 {lang==="ar"?"آخر التعليقات":lang==="en"?"Recent reviews":"Commentaires"}</Text>
            {reviews.filter(r=>r.review).slice(0,3).map((r, i) => (
              <View key={i} style={[styles.card, { padding:12, marginBottom:6 }]}>
                <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:4 }}>
                  <RatingStars value={r.rating||0} size={12} />
                  <Text style={{ color:C.muted, fontSize:9 }}>{new Date(r.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={{ color:C.white, fontSize:12, lineHeight:18 }}>{r.review}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

// ─── Écran Carte ──────────────────────────────────────────────────────────────
function EcranCarte({ lang="fr" }) {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState(null)
  const [detailView, setDetailView] = useState(null)
  const [userCity, setUserCity] = useState("Brussels")
  const [favs, setFavs] = useState([])
  const auth = useAuth() || {}

  // Load favorites — cross-device si connecté, sinon AsyncStorage
  useEffect(() => {
    const loadFavs = async () => {
      if (auth.user && !auth.isAnonymous) {
        const { data } = await supabase.from("user_favorites").select("restaurant_id").eq("user_id", auth.user.id).catch(() => ({ data:null }))
        if (data && data.length > 0) { setFavs(data.map(f=>f.restaurant_id)); return }
      }
      AsyncStorage.getItem("fadjr_favs").then(d => { if (d) setFavs(JSON.parse(d)) }).catch(() => {})
    }
    loadFavs()
  }, [auth.user])

  // Fetch restaurants from Supabase based on GPS
  useEffect(() => {
    (async () => {
      try {
        // Get user location
        const { status } = await Location.requestForegroundPermissionsAsync()
        let cityName = "Brussels"
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
          const [geo] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
          if (geo?.city) cityName = geo.city
        }
        setUserCity(cityName)
        
        // Load ALL restaurants from all cities
        const { data: restos } = await supabase
          .from("restaurants")
          .select("id,name,address,phone,rating,latitude,longitude,halal_status,cuisine_type,google_maps_url")
          .order("rating", { ascending: false })
          .limit(500)
        
        if (restos) setRestaurants(restos)
        setLoading(false)
      } catch(e) { setLoading(false) }
    })()
  }, [])

  const toggleFav = async (id) => {
    let updated
    if (favs.includes(id)) {
      updated = favs.filter(f => f !== id)
    } else {
      updated = [...favs, id]
    }
    setFavs(updated)
    // Persister local
    await AsyncStorage.setItem("fadjr_favs", JSON.stringify(updated))
    // Sync Supabase cross-device si connecté
    if (auth.user && !auth.isAnonymous) {
      if (updated.includes(id)) {
        await supabase.from("user_favorites").upsert({ user_id:auth.user.id, restaurant_id:id }, { onConflict:"user_id,restaurant_id" }).catch(() => {})
      } else {
        await supabase.from("user_favorites").delete().eq("user_id",auth.user.id).eq("restaurant_id",id).catch(() => {})
      }
    }
  }

  const filtered = restaurants.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.address?.toLowerCase().includes(search.toLowerCase()) ||
    (c.cuisine_type||"").toLowerCase().includes(search.toLowerCase())
  )

  if (detailView) return (
    <RestaurantDetail resto={detailView} favs={favs} onToggleFav={toggleFav} onBack={() => setDetailView(null)} lang={lang} />
  )

  return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <Text style={styles.sectionLabel}>{t("carteHalal",lang)} {userCity}</Text>
        <TextInput value={search} onChangeText={setSearch} placeholder={t("chercherCommerce",lang)}
          placeholderTextColor={C.muted}
          style={{ backgroundColor:C.card, borderWidth:1, borderColor:C.border, borderRadius:10, padding:11, color:C.white, fontSize:13, marginTop:8 }} />
        <Text style={{ color:C.muted, fontSize:11, marginTop:6 }}>{filtered.length} {lang==="ar"?"مطعم حلال":lang==="en"?"halal restaurants":lang==="tr"?"helal restoran":"restaurants halal"}</Text>
      </View>
      {loading ? (
        <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
          <ActivityIndicator size="large" color={C.gold} />
          <Text style={{ color:C.muted, fontSize:12, marginTop:10 }}>{lang==="ar"?"جاري التحميل...":lang==="en"?"Loading...":lang==="tr"?"Yükleniyor...":"Chargement..."}</Text>
        </View>
      ) : (
        <FlatList data={filtered} keyExtractor={c => String(c.id)} contentContainerStyle={{ padding:16 }} showsVerticalScrollIndicator={false}
          renderItem={({ item:c }) => (
            <TouchableOpacity onPress={() => setDetailView(c)}
              style={[styles.card, { marginBottom:10, borderColor:favs.includes(c.id) ? C.gold+"60" : C.border }]}>
              <View style={{ flexDirection:"row", alignItems:"flex-start", gap:14, padding:14 }}>
                <View style={{ width:44, height:44, borderRadius:10, backgroundColor:C.gold+"18", alignItems:"center", justifyContent:"center" }}>
                  <Text style={{ fontSize:22 }}>🍽️</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={{ color:C.white, fontSize:14, fontWeight:"700" }}>{c.name}</Text>
                  {c.rating > 0 && <Text style={{ color:C.gold, fontSize:11, marginTop:2 }}>{"★".repeat(Math.floor(c.rating))} {c.rating}</Text>}
                  <Text style={{ color:C.muted, fontSize:11, marginTop:3 }}>{c.address}</Text>
                  {c.cuisine_type && <Text style={{ color:C.teal, fontSize:10, marginTop:3 }}>{c.cuisine_type}</Text>}
                  {c.halal_status && (
                    <View style={{ backgroundColor:C.green+"18", borderRadius:99, paddingHorizontal:8, paddingVertical:2, alignSelf:"flex-start", marginTop:4 }}>
                      <Text style={{ color:C.green, fontSize:9, fontWeight:"700" }}>HALAL {c.halal_status === "verified" ? "✅" : ""}</Text>
                    </View>
                  )}
                  {selected?.id===c.id && (
                    <View style={{ marginTop:12, paddingTop:12, borderTopWidth:1, borderTopColor:C.border }}>
                      <View style={{ flexDirection:"row", gap:8 }}>
                        <TouchableOpacity onPress={() => { if(c.phone) Linking.openURL("tel:"+c.phone.replace(/\s/g,"")).catch(()=>{}) }}
                          style={{ flex:1, padding:8, borderRadius:8, borderWidth:1, borderColor:C.gold, alignItems:"center" }}>
                          <Text style={{ color:C.gold, fontSize:11, fontWeight:"700" }}>📞 {c.phone || "Appeler"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                          const url = c.google_maps_url || "https://maps.google.com/?q="+encodeURIComponent(c.address||c.name)
                          Linking.openURL(url).catch(()=>{})
                        }}
                          style={{ flex:1, padding:8, borderRadius:8, borderWidth:1, borderColor:C.blue, alignItems:"center" }}>
                          <Text style={{ color:C.blue, fontSize:11, fontWeight:"700" }}>🗺️ Y aller</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => toggleFav(c.id)}
                          style={{ flex:1, padding:8, borderRadius:8, borderWidth:1, borderColor: favs.includes(c.id) ? C.green : C.gold, backgroundColor: favs.includes(c.id) ? C.green+"15" : "transparent", alignItems:"center" }}>
                          <Text style={{ color: favs.includes(c.id) ? C.green : C.gold, fontSize:11, fontWeight:"700" }}>{favs.includes(c.id) ? "✅ Favori" : "⭐ Favori"}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )} />
      )}
    </View>
  )
}

// ─── Données Culture ──────────────────────────────────────────────────────────
const HADITHS_NAWAWI = [
  { num:1, ar:"إنما الأعمال بالنيات", fr:"Les actes ne valent que par les intentions", en:"Actions are judged by intentions", tr:"Ameller niyetlere goredir", source:"Bukhari & Muslim" },
  { num:2, ar:"أن تعبد الله كأنك تراه", fr:"Adore Allah comme si tu Le voyais", en:"Worship Allah as if you see Him", tr:"Allah'a O'nu goruyormus gibi ibadet et", source:"Muslim" },
  { num:3, ar:"بني الإسلام على خمس", fr:"L'Islam est bati sur cinq piliers", en:"Islam is built on five pillars", tr:"Islam bes esas uzerine kurulmustur", source:"Bukhari & Muslim" },
  { num:5, ar:"من أحدث في أمرنا هذا ما ليس منه فهو رد", fr:"Toute innovation dans notre religion est rejetee", en:"Every innovation in religion is rejected", tr:"Dinimizde olmayan her yenilik reddedilir", source:"Bukhari & Muslim" },
  { num:6, ar:"إن الحلال بيّن وإن الحرام بيّن", fr:"Le licite est clair et l'illicite est clair", en:"The lawful is clear and the unlawful is clear", tr:"Helal bellidir haram bellidir", source:"Bukhari & Muslim" },
  { num:7, ar:"الدين النصيحة", fr:"La religion, c'est le bon conseil", source:"Muslim" },
  { num:9, ar:"ما نهيتكم عنه فاجتنبوه", fr:"Ce que je vous ai interdit, evitez-le", source:"Bukhari & Muslim" },
  { num:10, ar:"إن الله طيب لا يقبل إلا طيبا", fr:"Allah est bon et n'accepte que ce qui est bon", en:"Allah is good and accepts only what is good", tr:"Allah temizdir sadece temiz olani kabul eder", source:"Muslim" },
  { num:12, ar:"من حسن إسلام المرء تركه ما لا يعنيه", fr:"Delaisser ce qui ne nous concerne pas", source:"Tirmidhi" },
  { num:13, ar:"لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه", fr:"Nul ne croit tant qu'il n'aime pas pour son frere ce qu'il aime pour lui-meme", source:"Bukhari & Muslim" },
  { num:15, ar:"من كان يؤمن بالله واليوم الآخر فليقل خيرا أو ليصمت", fr:"Que celui qui croit en Allah dise du bien ou se taise", source:"Bukhari & Muslim" },
  { num:16, ar:"لا تغضب", fr:"Ne te mets pas en colere", en:"Do not become angry", tr:"Kizma", source:"Bukhari" },
  { num:17, ar:"إن الله كتب الإحسان على كل شيء", fr:"Allah a prescrit la bienfaisance en toute chose", source:"Muslim" },
  { num:18, ar:"اتق الله حيثما كنت", fr:"Crains Allah ou que tu sois", en:"Fear Allah wherever you are", tr:"Nerede olursan ol Allah'tan kork", source:"Tirmidhi" },
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
  { id:"ar.abdulbasit", name:"Abdul Basit Abdus Samad", flag:"🇪🇬" },
  { id:"ar.husary", name:"Mahmoud Khalil Al-Husary", flag:"🇪🇬" },
  { id:"ar.minshawi", name:"Mohamed Siddiq Al-Minshawi", flag:"🇪🇬" },
  { id:"ar.abdulsamad", name:"Abdul Samad", flag:"🇪🇬" },
  { id:"ar.shaatree", name:"Abu Bakr Al-Shatri", flag:"🇸🇦" },
  { id:"ar.ahmedajamy", name:"Ahmed Al-Ajamy", flag:"🇸🇦" },
  { id:"ar.mahermuaiqly", name:"Maher Al-Muaiqly", flag:"🇸🇦" },
  { id:"ar.hudhaify", name:"Ali Al-Hudhaify", flag:"🇸🇦" },
  { id:"ar.muhammadayyoub", name:"Muhammad Ayyoub", flag:"🇸🇦" },
  { id:"ar.parhizgar", name:"Ibrahim Al-Akhdar", flag:"🇸🇦" },
  { id:"ar.muhammadjibreel", name:"Muhammad Jibreel", flag:"🇪🇬" },
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
  { annee:"570", titre:"Naissance du Prophete ﷺ", desc:"Annee de l'Elephant, a La Mecque", emoji:"👶", detail:"Muhammad ﷺ est ne a La Mecque, dans le clan des Banu Hashim de la tribu des Quraysh. Son pere Abdullah etait deja decede avant sa naissance. Sa mere Amina le confia a Halima Sa'diya pour l'allaitement dans le desert. Cette annee fut marquee par l'attaque de l'elephant d'Abraha contre la Kaaba, repoussee miraculeusement par Allah (Sourate Al-Fil)." },
  { annee:"610", titre:"Premiere revelation", desc:"Grotte de Hira — Sourate Al-Alaq", emoji:"📖", detail:"A 40 ans, Muhammad ﷺ recevait frequemment des visions veridiques. Lors d'une retraite dans la grotte de Hira sur le Mont Nour, l'ange Jibril (Gabriel) lui apparut et lui ordonna: 'Lis!' (Iqra). Les premiers versets reveles furent ceux de Sourate Al-Alaq (96:1-5). Le Prophete ﷺ, tremblant, rentra chez Khadija qui le reconforta et le couvrit." },
  { annee:"613", titre:"Predication publique", desc:"Le Prophete ﷺ invite les Quraysh", emoji:"📢", detail:"Apres 3 ans de predication secrete, Allah ordonna au Prophete ﷺ de precher publiquement. Il monta sur le Mont Safa et appela les clans de Quraysh un par un. Abu Lahab le rejeta violemment (Sourate Al-Masad). Malgre l'opposition, des hommes et femmes de toutes classes se convertirent: Bilal, Sumayyah, Ammar, et bien d'autres." },
  { annee:"615", titre:"Emigration en Abyssinie", desc:"Les premiers refugies chez le Negus", emoji:"🚢", detail:"Face aux persecutions croissantes, le Prophete ﷺ envoya un groupe de musulmans en Abyssinie (Ethiopie actuelle) chez le roi chretien An-Najashi (Negus). Ja'far ibn Abi Talib recita Sourate Maryam devant le roi, qui pleura et refusa de livrer les musulmans aux Quraysh. Ce fut la premiere Hijra de l'Islam." },
  { annee:"619", titre:"Annee de la tristesse", desc:"Deces de Khadija et Abu Talib", emoji:"💔", detail:"En l'espace de quelques jours, le Prophete ﷺ perdit ses deux plus grands soutiens: son epouse Khadija, la premiere croyante et son reconfort, et son oncle Abu Talib, qui le protegeait des Quraysh. Cette annee fut si douloureuse qu'on l'appela Am al-Huzn (l'Annee de la Tristesse). Le Prophete ﷺ tenta alors de precher a Taif, ou il fut lapide." },
  { annee:"620", titre:"Isra & Miraj", desc:"Voyage nocturne aux cieux", emoji:"🌙", detail:"En une seule nuit, le Prophete ﷺ fut transporte de La Mecque a Jerusalem (Al-Isra) sur Al-Buraq, puis eleve a travers les sept cieux (Al-Miraj). Il rencontra les prophetes precedents et recut l'obligation des 5 prieres quotidiennes. Cet evenement miraculeux est commemore le 27 Rajab." },
  { annee:"622", titre:"Hijra vers Medine", desc:"Debut du calendrier islamique", emoji:"🐪", detail:"Le Prophete ﷺ et Abu Bakr quitterent La Mecque de nuit, se cachant dans la grotte de Thawr pendant 3 jours. Guides par Abdullah ibn Urayqit, ils arriverent a Yathrib (Medine) ou les Ansar les accueillirent avec le chant 'Tala'al-Badru Alayna'. Cet evenement marque le debut du calendrier hijri et la fondation du premier Etat islamique." },
  { annee:"624", titre:"Bataille de Badr", desc:"313 contre 1000 — victoire", emoji:"⚔️", detail:"Le 17 Ramadan an 2, 313 musulmans affronterent environ 1000 guerriers Quraysh a Badr. Malgre l'inferiorite numerique, Allah envoya des anges pour soutenir les croyants. Les musulmans remporterent une victoire decisive. 70 Quraysh furent tues dont Abu Jahl, et 70 captures. Cette bataille est appelee Yawm al-Furqan (le Jour du Discernement)." },
  { annee:"628", titre:"Traite de Hudaybiyya", desc:"Accord de paix avec Quraysh", emoji:"🤝", detail:"Le Prophete ﷺ et 1400 compagnons partirent pour la Omra mais furent bloques a Hudaybiyya. Un traite de paix de 10 ans fut signe avec les Quraysh. Bien que les conditions semblaient defavorables, le Coran appela cet accord 'une victoire eclatante' (Fath mubin). La paix permit a l'Islam de se repandre rapidement dans toute l'Arabie." },
  { annee:"630", titre:"Conquete de La Mecque", desc:"Purification de la Kaaba", emoji:"🕋", detail:"Apres la rupture du traite par les Quraysh, le Prophete ﷺ marcha sur La Mecque avec 10 000 hommes. La ville fut conquise presque sans effusion de sang. Le Prophete ﷺ entra dans la Kaaba et detruisit les 360 idoles en recitant: 'La verite est venue et le mensonge a disparu' (17:81). Il pardonna a tous ses anciens persecuteurs." },
  { annee:"632", titre:"Sermon d'adieu", desc:"Derniers enseignements", emoji:"🏔️", detail:"Lors du pelerinage d'adieu au Mont Arafat, le Prophete ﷺ delivra son dernier grand discours devant plus de 100 000 pelerins. Il rappela l'egalite entre les humains, les droits des femmes, l'interdiction de l'usure et du sang. Le verset 'Aujourd'hui J'ai paracheve votre religion' (5:3) fut revele ce jour-la." },
  { annee:"632", titre:"Deces du Prophete ﷺ", desc:"12 Rabi Al-Awal, Medine", emoji:"🤲", detail:"Le Prophete ﷺ tomba malade avec une forte fievre. Il demanda a Abu Bakr de diriger les prieres. Le 12 Rabi Al-Awal an 11, il rendit son dernier souffle, la tete sur les genoux d'Aisha. Ses derniers mots furent: 'Vers le Compagnon Supreme' (Ar-Rafiq al-A'la). Il fut enterre dans la chambre d'Aisha, ou se trouve aujourd'hui la Mosquee du Prophete a Medine." },
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
const ASMA_UL_HUSNA = [
  {num:1,ar:"الرحمن",fr:"Le Tout Misericordieux",rom:"Ar-Rahman"},{num:2,ar:"الرحيم",fr:"Le Tres Misericordieux",rom:"Ar-Rahim"},
  {num:3,ar:"الملك",fr:"Le Souverain",rom:"Al-Malik"},{num:4,ar:"القدوس",fr:"Le Saint",rom:"Al-Quddus"},
  {num:5,ar:"السلام",fr:"La Paix",rom:"As-Salam"},{num:6,ar:"المؤمن",fr:"Le Fidele",rom:"Al-Mu'min"},
  {num:7,ar:"المهيمن",fr:"Le Surveillant",rom:"Al-Muhaymin"},{num:8,ar:"العزيز",fr:"Le Tout Puissant",rom:"Al-Aziz"},
  {num:9,ar:"الجبار",fr:"Le Contraignant",rom:"Al-Jabbar"},{num:10,ar:"المتكبر",fr:"L'Orgueilleux",rom:"Al-Mutakabbir"},
  {num:11,ar:"الخالق",fr:"Le Createur",rom:"Al-Khaliq"},{num:12,ar:"البارئ",fr:"Le Producteur",rom:"Al-Bari'"},
  {num:13,ar:"المصور",fr:"Le Formateur",rom:"Al-Musawwir"},{num:14,ar:"الغفار",fr:"Le Pardonnant",rom:"Al-Ghaffar"},
  {num:15,ar:"القهار",fr:"Le Dominateur",rom:"Al-Qahhar"},{num:16,ar:"الوهاب",fr:"Le Donateur",rom:"Al-Wahhab"},
  {num:17,ar:"الرزاق",fr:"Le Pourvoyeur",rom:"Ar-Razzaq"},{num:18,ar:"الفتاح",fr:"Le Juge Supreme",rom:"Al-Fattah"},
  {num:19,ar:"العليم",fr:"L'Omniscient",rom:"Al-Alim"},{num:20,ar:"القابض",fr:"Celui qui retient",rom:"Al-Qabid"},
  {num:21,ar:"الباسط",fr:"Celui qui etend",rom:"Al-Basit"},{num:22,ar:"الخافض",fr:"Celui qui abaisse",rom:"Al-Khafid"},
  {num:23,ar:"الرافع",fr:"Celui qui eleve",rom:"Ar-Rafi'"},{num:24,ar:"المعز",fr:"Celui qui honore",rom:"Al-Mu'izz"},
  {num:25,ar:"المذل",fr:"Celui qui humilie",rom:"Al-Mudhill"},{num:26,ar:"السميع",fr:"L'Audient",rom:"As-Sami'"},
  {num:27,ar:"البصير",fr:"Le Voyant",rom:"Al-Basir"},{num:28,ar:"الحكم",fr:"Le Juge",rom:"Al-Hakam"},
  {num:29,ar:"العدل",fr:"Le Juste",rom:"Al-Adl"},{num:30,ar:"اللطيف",fr:"Le Subtil",rom:"Al-Latif"},
  {num:31,ar:"الخبير",fr:"L'Informe",rom:"Al-Khabir"},{num:32,ar:"الحليم",fr:"Le Longanime",rom:"Al-Halim"},
  {num:33,ar:"العظيم",fr:"L'Immense",rom:"Al-Azim"},{num:34,ar:"الغفور",fr:"Le Pardonneur",rom:"Al-Ghafur"},
  {num:35,ar:"الشكور",fr:"Le Reconnaissant",rom:"Ash-Shakur"},{num:36,ar:"العلي",fr:"Le Tres Haut",rom:"Al-Ali"},
  {num:37,ar:"الكبير",fr:"Le Grand",rom:"Al-Kabir"},{num:38,ar:"الحفيظ",fr:"Le Gardien",rom:"Al-Hafiz"},
  {num:39,ar:"المقيت",fr:"Le Nourricier",rom:"Al-Muqit"},{num:40,ar:"الحسيب",fr:"Le Compteur",rom:"Al-Hasib"},
  {num:41,ar:"الجليل",fr:"Le Majestueux",rom:"Al-Jalil"},{num:42,ar:"الكريم",fr:"Le Genereux",rom:"Al-Karim"},
  {num:43,ar:"الرقيب",fr:"Le Vigilant",rom:"Ar-Raqib"},{num:44,ar:"المجيب",fr:"Celui qui repond",rom:"Al-Mujib"},
  {num:45,ar:"الواسع",fr:"Le Vaste",rom:"Al-Wasi'"},{num:46,ar:"الحكيم",fr:"Le Sage",rom:"Al-Hakim"},
  {num:47,ar:"الودود",fr:"L'Aimant",rom:"Al-Wadud"},{num:48,ar:"المجيد",fr:"Le Glorieux",rom:"Al-Majid"},
  {num:49,ar:"الباعث",fr:"Le Ressusciteur",rom:"Al-Ba'ith"},{num:50,ar:"الشهيد",fr:"Le Temoin",rom:"Ash-Shahid"},
  {num:51,ar:"الحق",fr:"La Verite",rom:"Al-Haqq"},{num:52,ar:"الوكيل",fr:"Le Protecteur",rom:"Al-Wakil"},
  {num:53,ar:"القوي",fr:"Le Fort",rom:"Al-Qawi"},{num:54,ar:"المتين",fr:"Le Ferme",rom:"Al-Matin"},
  {num:55,ar:"الولي",fr:"L'Ami",rom:"Al-Wali"},{num:56,ar:"الحميد",fr:"Le Louable",rom:"Al-Hamid"},
  {num:57,ar:"المحصي",fr:"Le Denombrant",rom:"Al-Muhsi"},{num:58,ar:"المبدئ",fr:"Le Novateur",rom:"Al-Mubdi'"},
  {num:59,ar:"المعيد",fr:"Le Restaurateur",rom:"Al-Mu'id"},{num:60,ar:"المحيي",fr:"Le Vivificateur",rom:"Al-Muhyi"},
  {num:61,ar:"المميت",fr:"Celui qui fait mourir",rom:"Al-Mumit"},{num:62,ar:"الحي",fr:"Le Vivant",rom:"Al-Hayy"},
  {num:63,ar:"القيوم",fr:"Le Subsistant",rom:"Al-Qayyum"},{num:64,ar:"الواجد",fr:"Le Trouveur",rom:"Al-Wajid"},
  {num:65,ar:"الماجد",fr:"L'Illustre",rom:"Al-Majid"},{num:66,ar:"الواحد",fr:"L'Unique",rom:"Al-Wahid"},
  {num:67,ar:"الصمد",fr:"Le Refuge",rom:"As-Samad"},{num:68,ar:"القادر",fr:"Le Capable",rom:"Al-Qadir"},
  {num:69,ar:"المقتدر",fr:"Le Tout-Puissant",rom:"Al-Muqtadir"},{num:70,ar:"المقدم",fr:"Celui qui avance",rom:"Al-Muqaddim"},
  {num:71,ar:"المؤخر",fr:"Celui qui retarde",rom:"Al-Mu'akhkhir"},{num:72,ar:"الأول",fr:"Le Premier",rom:"Al-Awwal"},
  {num:73,ar:"الآخر",fr:"Le Dernier",rom:"Al-Akhir"},{num:74,ar:"الظاهر",fr:"L'Apparent",rom:"Az-Zahir"},
  {num:75,ar:"الباطن",fr:"Le Cache",rom:"Al-Batin"},{num:76,ar:"الوالي",fr:"Le Gouverneur",rom:"Al-Wali"},
  {num:77,ar:"المتعالي",fr:"Le Tres Eleve",rom:"Al-Muta'ali"},{num:78,ar:"البر",fr:"Le Bienfaisant",rom:"Al-Barr"},
  {num:79,ar:"التواب",fr:"Le Repentant",rom:"At-Tawwab"},{num:80,ar:"المنتقم",fr:"Le Vengeur",rom:"Al-Muntaqim"},
  {num:81,ar:"العفو",fr:"Le Pardonnant",rom:"Al-Afuw"},{num:82,ar:"الرؤوف",fr:"Le Compatissant",rom:"Ar-Ra'uf"},
  {num:83,ar:"مالك الملك",fr:"Le Roi des rois",rom:"Malik Al-Mulk"},{num:84,ar:"ذو الجلال والإكرام",fr:"Le Majestueux",rom:"Dhul Jalal wal Ikram"},
  {num:85,ar:"المقسط",fr:"L'Equitable",rom:"Al-Muqsit"},{num:86,ar:"الجامع",fr:"Le Rassembleur",rom:"Al-Jami'"},
  {num:87,ar:"الغني",fr:"Le Riche",rom:"Al-Ghani"},{num:88,ar:"المغني",fr:"L'Enrichisseur",rom:"Al-Mughni"},
  {num:89,ar:"المانع",fr:"Le Preventeur",rom:"Al-Mani'"},{num:90,ar:"الضار",fr:"Le Nuisible",rom:"Ad-Darr"},
  {num:91,ar:"النافع",fr:"L'Utile",rom:"An-Nafi'"},{num:92,ar:"النور",fr:"La Lumiere",rom:"An-Nur"},
  {num:93,ar:"الهادي",fr:"Le Guide",rom:"Al-Hadi"},{num:94,ar:"البديع",fr:"L'Inventeur",rom:"Al-Badi'"},
  {num:95,ar:"الباقي",fr:"Le Permanent",rom:"Al-Baqi"},{num:96,ar:"الوارث",fr:"L'Heritier",rom:"Al-Warith"},
  {num:97,ar:"الرشيد",fr:"Le Guide Sage",rom:"Ar-Rashid"},{num:98,ar:"الصبور",fr:"Le Patient",rom:"As-Sabur"},
  {num:99,ar:"الله",fr:"Allah — Le Dieu unique",rom:"Allah"},
]


function EcranCulture({ lang="fr" }) {
  const [section, setSection] = useState(null)
  const [sourates, setSourates] = useState([])
  const [surahLoadError, setSurahLoadError] = useState(false)
  const [selectedSourate, setSelectedSourate] = useState(null)
  const [ayahs, setAyahs] = useState([])
  const [loadingQuran, setLoadingQuran] = useState(false)
  const [reciter, setReciter] = useState(QURAN_RECITERS[0])
  const [playingAyah, setPlayingAyah] = useState(null)
  const [hadithCollection, setHadithCollection] = useState("nawawi")
  const [arabeLecon, setArabeLecon] = useState(null)
  const [revealedItems, setRevealedItems] = useState({})
  const [hijriDate, setHijriDate] = useState(null)

  // Fetch sourates list
  useEffect(() => {
    if (section === "coran" && sourates.length === 0) {
      setLoadingQuran(true)
      setSurahLoadError(false)
      fetch("https://api.alquran.cloud/v1/surah")
        .then(r => r.json())
        .then(d => {
          if (d.data && d.data.length > 0) { setSourates(d.data) }
          else { setSurahLoadError(true) }
          setLoadingQuran(false)
        })
        .catch(() => { setSurahLoadError(true); setLoadingQuran(false) })
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
      fetch(`https://api.alquran.cloud/v1/surah/${selectedSourate.number}/editions/${reciter.id},fr.hamidullah`)
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
  }, [selectedSourate, reciter])

  // Audio player — player interne via expo-audio
  const audioPlayerRef = useRef(null)
  const [isPlayingAll, setIsPlayingAll] = useState(false)

  const stopAudio = () => {
    if (audioPlayerRef.current) {
      try { if (audioPlayerRef.current._checkInterval) clearInterval(audioPlayerRef.current._checkInterval) } catch(e) {}
      try { audioPlayerRef.current.pause(); audioPlayerRef.current.remove() } catch(e) {}
      audioPlayerRef.current = null
    }
    setPlayingAyah(null)
    setIsPlayingAll(false)
  }

  const playAyah = async (audioUrl, ayahNum) => {
    if (playingAyah === ayahNum) { stopAudio(); return }
    stopAudio()
    setPlayingAyah(ayahNum)
    try {
      await setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true })
      const player = createAudioPlayer({ uri: audioUrl })
      audioPlayerRef.current = player
      player.play()
      // expo-audio 0.3.5: poll status to detect end
      const checkInterval = setInterval(() => {
        try {
          if (player.currentStatus && !player.currentStatus.isPlaying && player.currentStatus.currentTime > 0) {
            clearInterval(checkInterval)
            if (audioPlayerRef.current === player) {
              setPlayingAyah(null)
              try { player.remove() } catch(e) {}
              audioPlayerRef.current = null
            }
          }
        } catch(e) { clearInterval(checkInterval) }
      }, 500)
      player._checkInterval = checkInterval
    } catch(e) {
      setPlayingAyah(null)
      Linking.openURL(audioUrl).catch(()=>{})
    }
  }

  const playAllSurah = async () => {
    if (isPlayingAll) { stopAudio(); return }
    if (!selectedSourate) return
    const surahUrl = `https://cdn.islamic.network/quran/audio-surah/128/${reciter.id.replace("ar.","")}/${selectedSourate.number}.mp3`
    stopAudio()
    setIsPlayingAll(true)
    try {
      await setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true })
      const player = createAudioPlayer({ uri: surahUrl })
      audioPlayerRef.current = player
      player.play()
      const checkInterval = setInterval(() => {
        try {
          if (player.currentStatus && !player.currentStatus.isPlaying && player.currentStatus.currentTime > 0) {
            clearInterval(checkInterval)
            if (audioPlayerRef.current === player) {
              setIsPlayingAll(false)
              try { player.remove() } catch(e) {}
              audioPlayerRef.current = null
            }
          }
        } catch(e) { clearInterval(checkInterval) }
      }, 500)
      player._checkInterval = checkInterval
    } catch(e) {
      setIsPlayingAll(false)
      Linking.openURL(surahUrl).catch(()=>{})
    }
  }

  useEffect(() => { return () => stopAudio() }, [])

  const ITEMS = [
    { id:"coran", emoji:"📖", titre:t("coran",lang), desc:"114 "+t("sourates",lang)+" + audio", color:C.gold },
    { id:"hadith", emoji:"📚", titre:t("hadiths",lang), desc:"Nawawi, Bukhari, Muslim", color:C.brown },
    { id:"asma", emoji:"☪️", titre:t("noms99",lang), desc:"Asma ul Husna", color:C.gold },
    { id:"tajwid", emoji:"🎓", titre:t("tajwid",lang), desc:lang==="fr"?"Regles de recitation":lang==="en"?"Recitation rules":lang==="ar"?"قواعد التلاوة":lang==="tr"?"Okuma kuralları":"Tajwid", color:C.green },
    { id:"sira", emoji:"🌟", titre:t("sira",lang), desc:lang==="fr"?"Vie du Prophete ﷺ":lang==="en"?"Life of the Prophet ﷺ":lang==="ar"?"حياة النبي ﷺ":lang==="tr"?"Peygamberin Hayatı ﷺ":"Sira", color:C.purple },
    { id:"fiqh", emoji:"🕌", titre:t("fiqh",lang), desc:lang==="fr"?"Jurisprudence pratique":lang==="en"?"Practical jurisprudence":lang==="ar"?"الفقه العملي":lang==="tr"?"Pratik fıkıh":"Fiqh", color:C.blue },
    { id:"arabe", emoji:"🖋️", titre:t("arabe",lang), desc:lang==="fr"?"Cours interactifs":lang==="en"?"Interactive lessons":lang==="ar"?"دروس تفاعلية":lang==="tr"?"İnteraktif dersler":"Cours", color:C.teal },
    { id:"calendrier", emoji:"📅", titre:t("calendrier",lang), desc:lang==="fr"?"Date hijri + evenements":lang==="en"?"Hijri date + events":lang==="ar"?"التاريخ الهجري + الأحداث":"Calendrier", color:C.red },
    { id:"chahada", emoji:"☝️", titre:t("chahada",lang), desc:lang==="fr"?"La profession de foi":lang==="en"?"Declaration of faith":lang==="ar"?"الشهادة":"Chahada", color:C.gold },
    { id:"khatam", emoji:"✅", titre:t("khatam",lang), desc:lang==="fr"?"Tracker lecture Coran":lang==="en"?"Quran reading tracker":lang==="ar"?"متتبع قراءة القرآن":"Khatam", color:C.green },
    { id:"mecca", emoji:"🕋", titre:t("liveMecque",lang), desc:lang==="fr"?"Stream en direct":lang==="en"?"Live stream":lang==="ar"?"بث مباشر":"Live", color:C.brown },
    { id:"journal", emoji:"📓", titre:lang==="ar"?"يوميات":lang==="en"?"Journal":"Journal", desc:lang==="ar"?"يومياتك الروحية":lang==="en"?"Your spiritual diary":"Journal spirituel", color:C.purple },
    { id:"inspiration", emoji:"💡", titre:lang==="ar"?"إلهام":lang==="en"?"Inspiration":"Inspiration", desc:lang==="ar"?"آية وذكر اليوم":lang==="en"?"Daily verse & dhikr":"Verset & dhikr du jour", color:C.green },
    { id:"hifz", emoji:"🧠", titre:lang==="ar"?"حفظ":lang==="en"?"Memorize":"Memorisation", desc:lang==="ar"?"حفظ القرآن":lang==="en"?"Quran memorization":"Memoriser le Coran", color:C.blue },
    { id:"ramadan", emoji:"🌙", titre:lang==="ar"?"رمضان":lang==="en"?"Ramadan":"Ramadan", desc:lang==="ar"?"وضع رمضان":lang==="en"?"Ramadan mode":"Mode Ramadan", color:C.gold },
    { id:"aiimam", emoji:"🤖", titre:lang==="ar"?"اسأل الإمام":lang==="en"?"AI Imam":"AI Imam", desc:lang==="ar"?"اسأل سؤالك":lang==="en"?"Ask your question":"Posez votre question", color:C.green },
    { id:"articles", emoji:"📰", titre:lang==="ar"?"مقالات":lang==="en"?"Articles":"Articles", desc:lang==="ar"?"مقالات إسلامية":lang==="en"?"Islamic articles":"Articles islamiques", color:C.red },
    { id:"community", emoji:"🕌", titre:lang==="ar"?"المجتمع":lang==="en"?"Community":"Communaute", desc:lang==="ar"?"محتوى يومي":lang==="en"?"Daily content":"Contenu quotidien", color:C.teal },
    { id:"ambiance", emoji:"🎵", titre:lang==="ar"?"أصوات":lang==="en"?"Sounds":"Ambiance", desc:lang==="ar"?"استرخاء + قرآن":lang==="en"?"Relaxation + Quran":"Sons apaisants + Coran", color:C.teal },
  ]

  // ── CORAN ──
  if (section === "coran" && selectedSourate) return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => { setSelectedSourate(null); setAyahs([]) }} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang||"fr")}</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:6 }}>{selectedSourate.number}. {selectedSourate.englishName}</Text>
        <Text style={{ color:C.muted, fontSize:12 }}>{selectedSourate.englishNameTranslation} — {selectedSourate.numberOfAyahs} {t("versets",lang)}</Text>
        <View style={{ flexDirection:"row", gap:8, marginTop:10, marginBottom:6 }}>
          <TouchableOpacity onPress={playAllSurah}
            style={{ flex:1, padding:10, borderRadius:10, backgroundColor: isPlayingAll ? C.red+"25" : C.gold+"25", borderWidth:1, borderColor: isPlayingAll ? C.red : C.gold, alignItems:"center" }}>
            <Text style={{ color: isPlayingAll ? C.red : C.gold, fontSize:13, fontWeight:"800" }}>{isPlayingAll ? "⏹ Stop" : "▶️ "+(lang==="ar"?"استمع للسورة":lang==="en"?"Listen to surah":lang==="tr"?"Sureyi dinle":"Ecouter la sourate")}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop:6 }}>
          {QURAN_RECITERS.map(r => (
            <TouchableOpacity key={r.id} onPress={() => setReciter(r)}
              style={{ paddingHorizontal:10, paddingVertical:5, borderRadius:99, marginRight:6, backgroundColor: reciter.id===r.id ? C.gold+"30" : C.card2, borderWidth:1, borderColor: reciter.id===r.id ? C.gold : C.border }}>
              <Text style={{ color: reciter.id===r.id ? C.gold : C.muted, fontSize:10, fontWeight:"700" }}>{r.flag} {r.name.split(" ").slice(-1)[0]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
              <ShareStoryCard text={item.ar} source={"Coran " + (selectedSourate?.englishName||"")} lang={lang} />
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
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang||"fr")}</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:6 }}>📖 Le Saint Coran</Text>
        <Text style={{ color:C.muted, fontSize:12 }}>{sourates.length} sourates</Text>
      </View>
      {surahLoadError ? (
        <View style={{ alignItems:"center", paddingTop:60, padding:20 }}>
          <Text style={{ color:C.red, fontSize:14, textAlign:"center", marginBottom:16 }}>
            ⚠️ Impossible de charger le Coran{"\n"}Vérifiez votre connexion internet
          </Text>
          <TouchableOpacity onPress={() => { setSourates([]); setSurahLoadError(false); setLoadingQuran(true); fetch("https://api.alquran.cloud/v1/surah").then(r=>r.json()).then(d=>{if(d.data)setSourates(d.data);setLoadingQuran(false)}).catch(()=>{setSurahLoadError(true);setLoadingQuran(false)}) }}
            style={{ backgroundColor:C.gold, borderRadius:10, paddingHorizontal:20, paddingVertical:10 }}>
            <Text style={{ color:C.bg, fontWeight:"900" }}>↻ Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : sourates.length === 0 ? <ActivityIndicator size="large" color={C.gold} style={{ marginTop:40 }} /> : (
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
            <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang||"fr")}</Text>
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
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang||"fr")}</Text>
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
              <Text style={{ color:C.white, fontSize:14, fontWeight:"700" }}>{typeof item.titre==="object" ? (item.titre[lang]||item.titre.fr) : item.titre}</Text>
              <Text style={{ color:C.muted, fontSize:12, marginTop:4, lineHeight:18 }}>{typeof item.desc==="object" ? ((item.desc[lang]||item.desc.fr)||"").substring(0,80)+"..." : item.desc}</Text>
            </View>
          </View>
        )} />
    </View>
  )

  // ── SIRA ──
  // Sira detail view
  if (section && section.startsWith("sira_")) {
    const idx = parseInt(section.split("_")[1])
    const ev = SIRA_EVENTS[idx]
    return (
      <View style={{ flex:1 }}>
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => setSection("sira")} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
            <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
            <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang||"fr")}</Text>
          </TouchableOpacity>
          <Text style={{ color:C.white, fontSize:20, fontWeight:"900", marginTop:8 }}>{ev.emoji} {typeof ev.titre==="object" ? (ev.titre[lang]||ev.titre.fr) : ev.titre}</Text>
          <Text style={{ color:C.gold, fontSize:13, marginTop:4 }}>An {ev.annee}</Text>
        </View>
        <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { padding:16 }]}>
            <Text style={{ color:C.white, fontSize:14, lineHeight:24 }}>{typeof ev.desc==="object" ? (ev.desc[lang]||ev.desc.fr) : ev.desc}</Text>
          </View>
        </ScrollView>
      </View>
    )
  }

  if (section === "sira") return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang||"fr")}</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>🌟 {lang==="ar"?"سيرة النبي ﷺ":lang==="en"?"Life of the Prophet ﷺ":lang==="tr"?"Peygamberin Hayatı ﷺ":"La Sira du Prophete ﷺ"}</Text>
        <Text style={{ color:C.muted, fontSize:12, marginTop:4 }}>{lang==="ar"?"انقر على حدث لمعرفة المزيد":lang==="en"?"Click an event to learn more":lang==="tr"?"Daha fazla bilgi için bir olaya tıklayın":"Cliquez sur un evenement pour en savoir plus"}</Text>
      </View>
      <FlatList data={SIRA_EVENTS} keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding:16, gap:10 }}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => setSection("sira_"+index)}
            style={[styles.card, { padding:14, flexDirection:"row", gap:12, alignItems:"center" }]}>
            <View style={{ alignItems:"center", width:50 }}>
              <Text style={{ fontSize:22 }}>{item.emoji}</Text>
              <Text style={{ color:C.gold, fontSize:11, fontWeight:"900", marginTop:4 }}>{item.annee}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ color:C.white, fontSize:14, fontWeight:"700" }}>{typeof item.titre==="object" ? (item.titre[lang]||item.titre.fr) : item.titre}</Text>
              <Text style={{ color:C.muted, fontSize:12, marginTop:4, lineHeight:18 }}>{typeof item.desc==="object" ? ((item.desc[lang]||item.desc.fr)||"").substring(0,80)+"..." : item.desc}</Text>
            </View>
            <Text style={{ color:C.gold, fontSize:16 }}>→</Text>
          </TouchableOpacity>
        )} />
    </View>
  )

  // ── FIQH ──
  if (section === "fiqh") return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang||"fr")}</Text>
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
              <Text style={{ color:C.white, fontSize:14, fontWeight:"700" }}>{typeof item.titre==="object" ? (item.titre[lang]||item.titre.fr) : item.titre}</Text>
              <Text style={{ color:C.muted, fontSize:12, marginTop:4, lineHeight:18 }}>{typeof item.desc==="object" ? ((item.desc[lang]||item.desc.fr)||"").substring(0,80)+"..." : item.desc}</Text>
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
            <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang||"fr")}</Text>
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
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang||"fr")}</Text>
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
  if (section && section.startsWith("cal_")) {
    const idx = parseInt(section.split("_")[1])
    const ev = ISLAMIC_EVENTS[idx]
    const nom = typeof ev.nom === "object" ? (ev.nom[lang]||ev.nom.fr) : ev.nom
    const desc = typeof ev.desc === "object" ? (ev.desc[lang]||ev.desc.fr) : ev.desc
    const quoi = ev.quoiFaire ? (typeof ev.quoiFaire === "object" ? (ev.quoiFaire[lang]||ev.quoiFaire.fr) : ev.quoiFaire) : ""
    return (
      <View style={{ flex:1 }}>
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => setSection("calendrier")} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
            <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
            <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang)}</Text>
          </TouchableOpacity>
          <Text style={{ color:C.white, fontSize:20, fontWeight:"900", marginTop:8 }}>{ev.emoji} {nom}</Text>
          <Text style={{ color:C.gold, fontSize:13, marginTop:4 }}>{HIJRI_MONTHS[ev.mois-1]} — {desc}</Text>
        </View>
        <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { padding:16 }]}>
            <Text style={{ color:C.gold, fontSize:14, fontWeight:"700", marginBottom:10 }}>{lang==="ar"?"ماذا تفعل؟":lang==="en"?"What to do?":lang==="tr"?"Ne yapmalı?":"Quoi faire?"}</Text>
            <Text style={{ color:C.white, fontSize:13, lineHeight:24 }}>{quoi.replace(/\\n/g, "\n")}</Text>
          </View>
        </ScrollView>
      </View>
    )
  }

  if (section === "calendrier") return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang)}</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>📅 {t("calendrier",lang)}</Text>
      </View>
      <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>
        {hijriDate && (
          <View style={[styles.card, { padding:20, alignItems:"center", marginBottom:16, borderWidth:1, borderColor:C.gold+"40" }]}>
            <Text style={{ color:C.gold, fontSize:12, fontWeight:"600", letterSpacing:2 }}>{t("aujourdhui",lang)}</Text>
            <Text style={{ color:C.white, fontSize:28, fontWeight:"900", marginTop:8 }}>{hijriDate.day} {hijriDate.month?.en || ""}</Text>
            <Text style={{ color:C.goldL, fontSize:16, marginTop:4 }}>{hijriDate.year} H</Text>
          </View>
        )}
        <Text style={{ color:C.white, fontSize:16, fontWeight:"800", marginBottom:12 }}>{t("evenements",lang)}</Text>
        {ISLAMIC_EVENTS.map((ev, i) => (
          <TouchableOpacity key={i} onPress={() => setSection("cal_"+i)}
            style={[styles.card, { padding:14, flexDirection:"row", gap:12, alignItems:"center", marginBottom:8 }]}>
            <View style={{ alignItems:"center", width:44 }}>
              <Text style={{ fontSize:22 }}>{ev.emoji}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ color:C.white, fontSize:14, fontWeight:"700" }}>{typeof ev.nom==="object" ? (ev.nom[lang]||ev.nom.fr) : ev.nom}</Text>
              <Text style={{ color:C.muted, fontSize:12, marginTop:3 }}>{typeof ev.desc==="object" ? (ev.desc[lang]||ev.desc.fr) : ev.desc}</Text>
            </View>
            <Text style={{ color:C.gold, fontSize:16 }}>→</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )

  // ── 99 NOMS D'ALLAH ──
  if (section === "asma") return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang||"fr")}</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>☪️ {lang==="ar"?"أسماء الله الحسنى":lang==="en"?"99 Names of Allah":lang==="tr"?"Allah'ın 99 İsmi":"Les 99 Noms d'Allah"}</Text>
        <Text style={{ color:C.muted, fontSize:12, marginTop:4 }}>{lang==="ar"?"الأسماء الأكثر جمالاً":lang==="en"?"The Most Beautiful Names":lang==="tr"?"En Güzel İsimler":"Asma ul Husna — Les plus beaux noms"}</Text>
      </View>
      <FlatList data={ASMA_UL_HUSNA} keyExtractor={n => String(n.num)} numColumns={3}
        contentContainerStyle={{ padding:12, gap:6 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, { flex:1, margin:3, padding:10, alignItems:"center", minWidth:(W-48)/3 }]}>
            <Text style={{ color:C.gold, fontSize:10, fontWeight:"800" }}>{item.num}</Text>
            <Text style={{ color:C.goldL, fontSize:20, marginTop:4 }}>{item.ar}</Text>
            <Text style={{ color:C.white, fontSize:9, fontWeight:"700", marginTop:4, textAlign:"center" }}>{item.rom}</Text>
            <Text style={{ color:C.muted, fontSize:8, marginTop:2, textAlign:"center" }}>{lang==="ar" ? item.ar : item.fr}</Text>
          </TouchableOpacity>
        )} />
    </View>
  )

  // ── CHAHADA ──
  if (section === "chahada") return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang||"fr")}</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>☝️ La Chahada</Text>
      </View>
      <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { padding:20, alignItems:"center", borderWidth:1, borderColor:C.gold+"40" }]}>
          <Text style={{ color:C.goldL, fontSize:28, textAlign:"center", lineHeight:48, marginBottom:16 }}>أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ{"\n"}وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ</Text>
          <Text style={{ color:C.white, fontSize:14, textAlign:"center", lineHeight:22, marginBottom:8 }}>Ash-hadu an la ilaha illa Allah{"\n"}Wa ash-hadu anna Muhammadan rasulu Allah</Text>
          <View style={{ height:1, backgroundColor:C.border, width:"100%", marginVertical:12 }} />
          <Text style={{ color:C.muted, fontSize:13, textAlign:"center", lineHeight:20 }}>J'atteste qu'il n'y a de divinite qu'Allah{"\n"}Et j'atteste que Muhammad est le messager d'Allah</Text>
        </View>
        <View style={[styles.card, { padding:16, marginTop:12 }]}>
          <Text style={{ color:C.gold, fontSize:14, fontWeight:"700", marginBottom:8 }}>📋 Signification</Text>
          <Text style={{ color:C.white, fontSize:13, lineHeight:22 }}>
            La Chahada est le premier pilier de l'Islam. C'est la declaration de foi qui fait entrer une personne dans l'Islam.{"\n\n"}
            Elle se compose de deux parties :{"\n"}
            1. L'unicite d'Allah (Tawhid) — Il n'y a aucune divinite digne d'adoration en dehors d'Allah{"\n"}
            2. La prophetie de Muhammad ﷺ — Il est le dernier messager envoye a l'humanite{"\n\n"}
            Prononcer la Chahada avec sincerite, comprehension et conviction est la condition d'entree dans l'Islam.
          </Text>
        </View>
        <View style={[styles.card, { padding:16, marginTop:12 }]}>
          <Text style={{ color:C.gold, fontSize:14, fontWeight:"700", marginBottom:8 }}>Les 5 Piliers de l'Islam</Text>
          {[["☝️","Chahada","La profession de foi"],["🕌","Salat","Les 5 prieres quotidiennes"],["💰","Zakat","L'aumone obligatoire"],["🌙","Siyam","Le jeune du Ramadan"],["🕋","Hajj","Le pelerinage a La Mecque"]].map(([e,t,d],i) => (
            <View key={i} style={{ flexDirection:"row", gap:10, alignItems:"center", paddingVertical:8, borderBottomWidth: i<4 ? 1 : 0, borderBottomColor:C.border }}>
              <Text style={{ fontSize:20 }}>{e}</Text>
              <View>
                <Text style={{ color:C.white, fontSize:13, fontWeight:"700" }}>{t}</Text>
                <Text style={{ color:C.muted, fontSize:11 }}>{d}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )

  // ── KHATAM QURAN TRACKER ──
  if (section === "khatam") return (
    <KhatamTracker onBack={() => setSection(null)} lang={lang} />
  )

  // ── LIVE MECQUE ──
  if (section === "mecca") return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang||"fr")}</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>🕋 Live Mecque & Medine</Text>
      </View>
      <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>
        {[
          { titre:"🕋 Makkah Live — Al Haram", desc:"Stream en direct de la Mosquee Al-Haram", url:"https://www.youtube.com/@alaboralmakkah/live", color:C.gold },
          { titre:"🕌 Madinah Live — Al-Masjid An-Nabawi", desc:"Stream en direct de la Mosquee du Prophete ﷺ", url:"https://www.youtube.com/@alaboralmadinah/live", color:C.green },
          { titre:"📺 Quran TV — Recitation 24/7", desc:"Recitation du Coran en continu", url:"https://www.youtube.com/@QuranHD/live", color:C.blue },
        ].map((stream, i) => (
          <TouchableOpacity key={i} onPress={() => Linking.openURL(stream.url).catch(() => {})}
            style={[styles.card, { padding:16, marginBottom:10, borderLeftWidth:3, borderLeftColor:stream.color }]}>
            <Text style={{ color:C.white, fontSize:15, fontWeight:"800" }}>{stream.titre}</Text>
            <Text style={{ color:C.muted, fontSize:12, marginTop:6 }}>{stream.desc}</Text>
            <View style={{ flexDirection:"row", alignItems:"center", gap:6, marginTop:10 }}>
              <View style={{ width:8, height:8, borderRadius:4, backgroundColor:C.red }} />
              <Text style={{ color:C.red, fontSize:11, fontWeight:"700" }}>EN DIRECT</Text>
              <Text style={{ color:C.muted, fontSize:11, marginLeft:"auto" }}>Ouvrir YouTube →</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )

  // ── JOURNAL SPIRITUEL ──
  if (section === "journal") return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang)}</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>📓 {lang==="ar"?"يوميات روحية":lang==="en"?"Spiritual Journal":"Journal Spirituel"}</Text>
      </View>
      <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>
        <JournalSpirituel lang={lang} />
      </ScrollView>
    </View>
  )

  // ── INSPIRATION QUOTIDIENNE ──
  if (section === "inspiration") return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang)}</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>💡 {lang==="ar"?"إلهام اليوم":lang==="en"?"Daily Inspiration":"Inspiration du jour"}</Text>
      </View>
      <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>
        <InspirationQuotidienne />
      </ScrollView>
    </View>
  )

  // ── COMMUNAUTE ──
  if (section === "community") return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang)}</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>🕌 {lang==="ar"?"المجتمع":lang==="en"?"Community":"Communaute"}</Text>
      </View>
      <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>
        <CommunityFeed lang={lang} />
      </ScrollView>
    </View>
  )

  // ── AI IMAM ──
  if (section === "aiimam") return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang)}</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>🤖 AI Imam</Text>
        <Text style={{ color:C.muted, fontSize:11, marginTop:4 }}>{lang==="ar"?"اسأل أي سؤال إسلامي":lang==="en"?"Ask any Islamic question":"Posez n'importe quelle question islamique"}</Text>
      </View>
      <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>
        <AIImam lang={lang} />
      </ScrollView>
    </View>
  )

  // ── ARTICLES ISLAMIQUES ──
  if (section === "articles") return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang)}</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>📰 {lang==="ar"?"مقالات إسلامية":lang==="en"?"Islamic Articles":"Articles Islamiques"}</Text>
      </View>
      <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>
        <ArticlesIslamiques lang={lang} />
      </ScrollView>
    </View>
  )

  // ── HIFZ (Memorisation) ──
  if (section === "hifz") return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang)}</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>🧠 {lang==="ar"?"حفظ القرآن":lang==="en"?"Quran Memorization":"Memorisation du Coran"}</Text>
      </View>
      <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>
        <HifzTracker lang={lang} />
      </ScrollView>
    </View>
  )

  // ── MODE RAMADAN ──
  if (section === "ramadan") return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang)}</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>🌙 {lang==="ar"?"وضع رمضان":lang==="en"?"Ramadan Mode":"Mode Ramadan"}</Text>
      </View>
      <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>
        <ModeRamadan prayers={[]} lang={lang} />
      </ScrollView>
    </View>
  )

  // ── SON AMBIANCE ──
  if (section === "ambiance") return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang)}</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>🎵 {lang==="ar"?"أصوات هادئة":lang==="en"?"Calming Sounds":"Sons Apaisants"}</Text>
      </View>
      <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>
        <SonAmbiance lang={lang} />
      </ScrollView>
    </View>
  )

  // ── MENU PRINCIPAL ──
  return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <Text style={styles.sectionLabel}>{t("cultureIslamique",lang)}</Text>
        <Text style={{ color:C.gold, fontSize:18, fontWeight:"900" }}>📚 {t("apprendreGrandir",lang)}</Text>
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
function EcranFinance({ lang="fr" }) {
  const [section, setSection] = useState(null)
  const [zakatType, setZakatType] = useState("argent")
  const [montant, setMontant] = useState("")
  const [zakatResult, setZakatResult] = useState(null)
  const NISAB_OR = 85 * 70 // ~5950€ (85g or x ~70€/g)
  const NISAB_ARGENT = 595 * 0.75 // ~446€ (595g argent x ~0.75€/g)

  const FINANCE_INFO = [
    { emoji:"🏦", titre:"Banque islamique", color:C.gold, content:[
      { q:"Qu'est-ce que la banque islamique?", r:"Un systeme bancaire conforme a la charia, sans interets (riba). Les profits viennent du commerce reel et du partage des risques." },
      { q:"Quels produits sont halal?", r:"Murabaha (vente a marge), Ijara (leasing), Musharaka (partenariat), Mudharaba (investissement), Sukuk (obligations islamiques)." },
      { q:"Banques islamiques en Europe", r:"Al Rayan Bank (UK), KT Bank (Allemagne), Zitouna (Tunisie online), Noor Bank, et certaines fintechs comme Manzil ou Niyah." },
    ]},
    { emoji:"🛡️", titre:"Takaful (assurance)", color:C.green, content:[
      { q:"Qu'est-ce que le Takaful?", r:"Assurance islamique basee sur la solidarite mutuelle. Les participants contribuent a un fonds commun pour s'entraider." },
      { q:"Difference avec l'assurance classique?", r:"Pas de gharar (incertitude excessive), pas de riba, pas d'investissement haram. Le surplus est redistribue aux participants." },
    ]},
    { emoji:"📈", titre:"Investissement halal", color:C.blue, content:[
      { q:"Criteres d'un investissement halal", r:"L'entreprise ne doit pas tirer plus de 5% de ses revenus de l'alcool, porc, armes, jeux, pornographie ou interets." },
      { q:"Comment investir halal?", r:"ETFs islamiques (ISWD, ISDE), fonds Amundi Islamic, actions screenees (screening AAOIFI), immobilier, or physique." },
      { q:"Apps de screening halal", r:"Zoya, Islamicly, Musaffa — ces apps analysent si une action est conforme a la charia." },
    ]},
  ]

  const calculateZakat = () => {
    const m = parseFloat(montant)
    if (isNaN(m) || m <= 0) return
    const nisab = zakatType === "or" ? NISAB_OR : NISAB_ARGENT
    if (m >= nisab) {
      setZakatResult({ montant: m, zakat: (m * 0.025).toFixed(2), nisab, eligible: true })
    } else {
      setZakatResult({ montant: m, zakat: 0, nisab, eligible: false })
    }
  }

  if (section === "zakat") return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => { setSection(null); setZakatResult(null) }} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang||"fr")}</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>💰 Calculateur de Zakat</Text>
      </View>
      <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { padding:16 }]}>
          <Text style={{ color:C.white, fontSize:14, fontWeight:"700", marginBottom:12 }}>Type de Nisab</Text>
          <View style={{ flexDirection:"row", gap:8, marginBottom:16 }}>
            {[["argent","💵 Argent"],["or","🥇 Or"]].map(([key,label]) => (
              <TouchableOpacity key={key} onPress={() => setZakatType(key)}
                style={{ flex:1, padding:10, borderRadius:10, backgroundColor: zakatType===key ? C.gold+"25" : C.card2, borderWidth:1, borderColor: zakatType===key ? C.gold : C.border, alignItems:"center" }}>
                <Text style={{ color: zakatType===key ? C.gold : C.muted, fontWeight:"700", fontSize:13 }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ color:C.muted, fontSize:11, marginBottom:6 }}>Nisab actuel: ~{zakatType==="or" ? NISAB_OR : NISAB_ARGENT}€</Text>
          <Text style={{ color:C.white, fontSize:13, fontWeight:"600", marginBottom:8 }}>Votre patrimoine total (€)</Text>
          <TextInput value={montant} onChangeText={setMontant} placeholder="Ex: 10000" placeholderTextColor={C.muted} keyboardType="numeric"
            style={{ backgroundColor:C.card2, borderWidth:1, borderColor:C.border, borderRadius:10, padding:12, color:C.white, fontSize:16, marginBottom:12 }} />
          <TouchableOpacity onPress={calculateZakat}
            style={{ backgroundColor:C.gold, borderRadius:10, padding:14, alignItems:"center" }}>
            <Text style={{ color:C.bg, fontSize:15, fontWeight:"900" }}>{lang==="ar"?"حساب الزكاة":lang==="en"?"Calculate Zakat":lang==="tr"?"Zekat Hesapla":"Calculer ma Zakat"}</Text>
          </TouchableOpacity>
        </View>
        {zakatResult && (
          <View style={[styles.card, { padding:16, marginTop:12, borderWidth:1, borderColor: zakatResult.eligible ? C.green : C.red }]}>
            {zakatResult.eligible ? (<>
              <Text style={{ color:C.green, fontSize:14, fontWeight:"700" }}>✅ Vous etes redevable de la Zakat</Text>
              <Text style={{ color:C.white, fontSize:28, fontWeight:"900", marginTop:8 }}>{zakatResult.zakat} €</Text>
              <Text style={{ color:C.muted, fontSize:12, marginTop:6 }}>2.5% de {zakatResult.montant}€ (Nisab: {zakatResult.nisab}€)</Text>
            </>) : (<>
              <Text style={{ color:C.red, fontSize:14, fontWeight:"700" }}>❌ Pas de Zakat due</Text>
              <Text style={{ color:C.muted, fontSize:12, marginTop:6 }}>Votre patrimoine ({zakatResult.montant}€) est inferieur au Nisab ({zakatResult.nisab}€)</Text>
            </>)}
          </View>
        )}
        <View style={[styles.card, { padding:14, marginTop:12 }]}>
          <Text style={{ color:C.gold, fontSize:13, fontWeight:"700", marginBottom:8 }}>📋 Regles de la Zakat</Text>
          <Text style={{ color:C.muted, fontSize:12, lineHeight:20 }}>
            • Taux : 2.5% du patrimoine total{"\n"}
            • Condition : posseder le Nisab pendant 1 annee lunaire{"\n"}
            • Sur : argent, or, actions, marchandises, revenus locatifs{"\n"}
            • Pas sur : residence principale, voiture personnelle, vetements{"\n"}
            • Beneficiaires : 8 categories (pauvres, necessiteux, voyageurs, etc.)
          </Text>
        </View>
      </ScrollView>
    </View>
  )

  if (section && section.startsWith("info_")) {
    const idx = parseInt(section.split("_")[1])
    const info = FINANCE_INFO[idx]
    return (
      <View style={{ flex:1 }}>
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
            <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
            <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang||"fr")}</Text>
          </TouchableOpacity>
          <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>{info.emoji} {info.titre}</Text>
        </View>
        <FlatList data={info.content} keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding:16, gap:10 }}
          renderItem={({ item }) => (
            <View style={[styles.card, { padding:14 }]}>
              <Text style={{ color:C.gold, fontSize:13, fontWeight:"700", marginBottom:8 }}>{item.q}</Text>
              <Text style={{ color:C.white, fontSize:13, lineHeight:20 }}>{item.r}</Text>
            </View>
          )} />
      </View>
    )
  }

  return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <Text style={styles.sectionLabel}>{t("financeIslamique",lang)}</Text>
        <Text style={{ color:C.gold, fontSize:18, fontWeight:"900" }}>🏦 {t("argentHalal",lang)}</Text>
      </View>
      <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => setSection("zakat")}
          style={[styles.card, { padding:16, borderWidth:1, borderColor:C.gold+"40", marginBottom:12 }]}>
          <View style={{ flexDirection:"row", alignItems:"center", gap:14 }}>
            <View style={{ width:52, height:52, borderRadius:12, backgroundColor:C.gold+"18", alignItems:"center", justifyContent:"center" }}>
              <Text style={{ fontSize:24 }}>💰</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ color:C.gold, fontSize:16, fontWeight:"800" }}>Calculateur de Zakat</Text>
              <Text style={{ color:C.muted, fontSize:12, marginTop:3 }}>Calculez le montant exact de votre zakat</Text>
            </View>
            <Text style={{ color:C.gold, fontSize:20 }}>→</Text>
          </View>
        </TouchableOpacity>
        {FINANCE_INFO.map((item, i) => (
          <TouchableOpacity key={i} onPress={() => setSection("info_"+i)}
            style={[styles.card, { flexDirection:"row", alignItems:"center", gap:14, marginBottom:10 }]}>
            <View style={{ width:52, height:52, borderRadius:12, backgroundColor:item.color+"18", alignItems:"center", justifyContent:"center" }}>
              <Text style={{ fontSize:24 }}>{item.emoji}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ color:C.white, fontSize:15, fontWeight:"700" }}>{item.titre}</Text>
              <Text style={{ color:C.muted, fontSize:12, marginTop:3 }}>{item.content.length} questions</Text>
            </View>
            <Text style={{ color:C.muted, fontSize:18 }}>→</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

// ─── Écran Voyage ─────────────────────────────────────────────────────────────
function EcranVoyage({ lang="fr" }) {
  const [section, setSection] = useState(null)
  const DESTINATIONS = [
    { emoji:"🕋", ville:"La Mecque", pays:"Arabie Saoudite", desc:"Omra & Hajj — Terre sacree", color:C.gold, tips:["Faire le Tawaf 7 tours autour de la Kaaba","Boire l'eau de Zamzam","Prier a Maqam Ibrahim","Sa'i entre Safa et Marwa","Visiter la grotte de Hira","Mont Arafat — lieu du sermon d'adieu","Mina — lieu de la lapidation","Muzdalifah — nuit sous les etoiles","Jannat al-Mualla — cimetiere historique","Musee de La Mecque","Masjid Al-Khayf a Mina","Masjid Nimrah a Arafat","Abraj Al-Bait (tour de l'horloge)","Souks de La Mecque","Jabal al-Nour (montagne de la lumiere)","Jabal Thawr (grotte de l'Hijra)","Masjid Al-Jinn","Dar Al-Arqam — premiere ecole islamique","Masjid Al-Taneem — Miqat","Bien de Zamzam — source sacree"] },
    { emoji:"🕌", ville:"Medine", pays:"Arabie Saoudite", desc:"La ville du Prophete ﷺ", color:C.green, tips:["Prier a la Mosquee du Prophete ﷺ","Visiter Rawdah Ash-Sharifah (jardin du Paradis)","Saluer le Prophete ﷺ a son tombeau","Cimetiere Al-Baqi — compagnons du Prophete","Mosquee de Quba — premiere mosquee de l'Islam","Mont Uhud — site de la bataille","Cimetiere des martyrs d'Uhud","Mosquee Al-Qiblatain (2 directions)","Marche aux dattes de Medine","Wadi Al-Aqiq","Mosquee Al-Ghamama","Complexe du Roi Fahd pour le Coran","Souks de Medine — artisanat local","Jardin des dattes Ajwa","Mosquee As-Sabq","Masjid Al-Jumua — premiere priere du vendredi","Musee Dar Al-Madinah","Sources et puits historiques","Station Hejaz Railway","Al-Madina Museum"] },
    { emoji:"🌙", ville:"Istanbul", pays:"Turquie", desc:"Cite des mosquees et de l'histoire", color:C.blue, tips:["Mosquee Sultan Ahmed (Mosquee Bleue)","Hagia Sophia — chef d'oeuvre architectural","Mosquee Suleymaniye — vue panoramique","Grand Bazar — 4000 boutiques, shopping halal","Quartier Fatih — coeur islamique d'Istanbul","Palais de Topkapi — reliques du Prophete ﷺ","Mosquee Eyup Sultan — lieu de pelerinage","Pierre d'Abu Ayyub Al-Ansari","Citerne Basilique — merveille souterraine","Tour de Galata — vue 360 sur Istanbul","Bosphore — croisiere entre 2 continents","Quartier Balat — ruelles colorees","Mosquee Camlica — plus grande de Turquie","Musee de l'art islamique","Quartier Uskudar — rive asiatique","Marche aux epices (Bazar Egyptien)","Mosquee Yeni Cami — au bord de l'eau","Palais Dolmabahce","Quartier Sultanahmet — histoire vivante","Hammam historique de Hurrem Sultan"] },
    { emoji:"🌴", ville:"Marrakech", pays:"Maroc", desc:"Joyau de l'Islam africain", color:C.red, tips:["Mosquee Koutoubia — icone de Marrakech","Medersa Ben Youssef — architecture islamique","Place Jemaa el-Fna — spectacle vivant","Jardin Majorelle — oasis de beaute","Palais Bahia — art arabo-andalou","Tombeaux Saadiens — tresor cache","Souks de Marrakech — artisanat local","Mellah — quartier historique","Musee de Marrakech","Palais El-Badi — ruines majestueuses","Tanneries traditionnelles","Riad experience — architecture islamique","Hammam traditionnel","Mosquee de la Kasbah","Jardin Menara — bassin reflectant","Atlas excursion — montagnes a 1h","Vallée de l'Ourika","Cascades d'Ouzoud","Palmeraie de Marrakech","Musee Dar Si Said"] },
    { emoji:"🏛️", ville:"Jerusalem", pays:"Palestine", desc:"Al-Quds, 3eme lieu saint", color:C.purple, tips:["Mosquee Al-Aqsa — 3eme lieu saint de l'Islam","Dome du Rocher — architecture sublime","Mur Al-Buraq — lieu du Miraj","Vieille ville — 4 quartiers millénaires","Mont des Oliviers — vue panoramique","Via Dolorosa — chemin historique","Porte de Damas — entree majestueuse","Souks de la vieille ville","Mosquee d'Omar","Citadelle de Jerusalem","Musee Rockefeller","Jardins de Gethsemane","Quartier musulman — coeur battant","Piscine de Siloe","Mont du Temple — esplanade sacree","Haram ash-Sharif — enceinte sacree","Madrasa Al-Ashrafiyya","Fontaine de Qayt Bay","Porte Doree — eschatologie islamique","Quartier armenien — mosaiques anciennes"] },
    { emoji:"🌊", ville:"Dubai", pays:"Emirats", desc:"Modernite et tradition halal", color:C.teal, tips:["Mosquee Jumeirah — architecture ottomane","Dubai Mall — plus grand centre commercial halal","Desert Safari halal — dunes et chameaux","Souks de l'or — tradition et artisanat","Burj Khalifa — vue a 828m de hauteur","Dubai Creek — traversee en abra","Mosquee Al Farooq Omar — plus grande de Dubai","La Mer Beach — plage halal-friendly","Al Fahidi Historical Neighbourhood","Musee de Dubai — Fort Al-Fahidi","Dubai Frame — vue spectaculaire","Miracle Garden — jardin fleuri","Global Village — cultures du monde","Palm Jumeirah — ile artificielle","Madinat Jumeirah — Venise du Golfe","Spice Souk — epices du monde","Dubai Opera","Quartier JBR — promenade en bord de mer","Mosquee Hassan bin Ahmed","Blue Mosque Dubai — replique d'Istanbul"] },
  ]
  const OMRA_STEPS = [
    { num:1, titre:"Ihram", desc:"Entrer en etat de sacralisation a Miqat. Vetements blancs pour les hommes, tenue modeste pour les femmes. Formuler la Niyyah (intention) et prononcer la Talbiyah.", emoji:"🧕" },
    { num:2, titre:"Tawaf", desc:"Effectuer 7 tours autour de la Kaaba dans le sens inverse des aiguilles d'une montre, en commencant par la Pierre Noire.", emoji:"🕋" },
    { num:3, titre:"Priere 2 Rakat", desc:"Prier 2 rakat derriere Maqam Ibrahim apres le Tawaf.", emoji:"🤲" },
    { num:4, titre:"Boire Zamzam", desc:"Boire l'eau de Zamzam en faisant des douas.", emoji:"💧" },
    { num:5, titre:"Sa'i", desc:"Marcher 7 fois entre Safa et Marwa (3.15 km au total) en commemorant Hajar.", emoji:"🚶" },
    { num:6, titre:"Halq ou Taqsir", desc:"Se raser la tete (Halq) ou couper les cheveux (Taqsir) pour sortir de l'Ihram.", emoji:"💈" },
  ]
  const HAJJ_STEPS = [
    { num:1, titre:"Jour 8 - Yawm al-Tarwiyah", desc:"Ihram a La Mecque puis depart vers Mina. Prier Dhuhr, Asr, Maghrib, Isha et Fajr a Mina.", emoji:"⛺" },
    { num:2, titre:"Jour 9 - Yawm al-Arafat", desc:"Se rendre au Mont Arafat. Rester en priere et invocation du Dhuhr au Maghrib. C'est LE pilier du Hajj.", emoji:"🏔️" },
    { num:3, titre:"Nuit a Muzdalifah", desc:"Apres Arafat, passer la nuit a Muzdalifah. Ramasser 49 cailloux pour la lapidation.", emoji:"🌙" },
    { num:4, titre:"Jour 10 - Yawm al-Nahr", desc:"Lapidation de Jamrat al-Aqaba (7 cailloux), sacrifice, rasage, Tawaf al-Ifadah, Sa'i.", emoji:"🐑" },
    { num:5, titre:"Jours 11-12-13 - Ayyam al-Tashriq", desc:"Lapidation des 3 Jamarat chaque jour (21 cailloux/jour). Rester a Mina.", emoji:"⛰️" },
    { num:6, titre:"Tawaf al-Wada", desc:"Tawaf d'adieu autour de la Kaaba avant de quitter La Mecque.", emoji:"👋" },
  ]
  const CHECKLIST = [
    { cat:"Documents", items:["Passeport valide 6 mois+","Visa Hajj/Omra","Copies documents","Photos d'identite","Assurance voyage","Reservation hotel confirmee"] },
    { cat:"Vetements", items:["2 pieces Ihram (hommes)","Vetements amples modestes","Chaussures confortables (marche)","Ceinture porte-monnaie","Chapeau/parapluie soleil","Vetements de nuit"] },
    { cat:"Sante", items:["Medicaments personnels","Creme solaire","Masque anti-poussiere","Desinfectant mains","Pansements ampoules","Vaccination meningite"] },
    { cat:"Spirituel", items:["Petit Coran","Livre de douas Hajj/Omra","Tapis de priere pliable","Chapelet (misbaha)","Cahier pour noter les douas"] },
  ]

  if (section === "omra") return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang||"fr")}</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>🕋 Guide de la Omra</Text>
        <Text style={{ color:C.muted, fontSize:12, marginTop:4 }}>6 etapes pas a pas</Text>
      </View>
      <FlatList data={OMRA_STEPS} keyExtractor={s => String(s.num)}
        contentContainerStyle={{ padding:16, gap:10 }}
        renderItem={({ item }) => (
          <View style={[styles.card, { padding:14, flexDirection:"row", gap:12 }]}>
            <View style={{ alignItems:"center", width:44 }}>
              <View style={{ backgroundColor:C.gold+"25", borderRadius:99, width:28, height:28, alignItems:"center", justifyContent:"center" }}>
                <Text style={{ color:C.gold, fontSize:13, fontWeight:"900" }}>{item.num}</Text>
              </View>
              <Text style={{ fontSize:20, marginTop:6 }}>{item.emoji}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ color:C.white, fontSize:14, fontWeight:"700" }}>{item.titre}</Text>
              <Text style={{ color:C.muted, fontSize:12, marginTop:6, lineHeight:18 }}>{item.desc}</Text>
            </View>
          </View>
        )} />
    </View>
  )

  if (section === "hajj") return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang||"fr")}</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>🕋 Guide du Hajj</Text>
        <Text style={{ color:C.muted, fontSize:12, marginTop:4 }}>Les 6 jours du pelerinage</Text>
      </View>
      <FlatList data={HAJJ_STEPS} keyExtractor={s => String(s.num)}
        contentContainerStyle={{ padding:16, gap:10 }}
        renderItem={({ item }) => (
          <View style={[styles.card, { padding:14, flexDirection:"row", gap:12 }]}>
            <View style={{ alignItems:"center", width:44 }}>
              <View style={{ backgroundColor:C.green+"25", borderRadius:99, width:28, height:28, alignItems:"center", justifyContent:"center" }}>
                <Text style={{ color:C.green, fontSize:13, fontWeight:"900" }}>{item.num}</Text>
              </View>
              <Text style={{ fontSize:20, marginTop:6 }}>{item.emoji}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ color:C.white, fontSize:14, fontWeight:"700" }}>{item.titre}</Text>
              <Text style={{ color:C.muted, fontSize:12, marginTop:6, lineHeight:18 }}>{item.desc}</Text>
            </View>
          </View>
        )} />
    </View>
  )

  if (section === "checklist") return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
          <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang||"fr")}</Text>
        </TouchableOpacity>
        <Text style={{ color:C.white, fontSize:18, fontWeight:"900", marginTop:8 }}>✅ Check-list Voyage</Text>
      </View>
      <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>
        {CHECKLIST.map((cat, ci) => (
          <View key={ci} style={{ marginBottom:16 }}>
            <Text style={{ color:C.gold, fontSize:14, fontWeight:"800", marginBottom:8 }}>{cat.cat}</Text>
            {cat.items.map((item, ii) => (
              <View key={ii} style={[styles.card, { padding:12, flexDirection:"row", alignItems:"center", gap:10, marginBottom:6 }]}>
                <View style={{ width:22, height:22, borderRadius:6, borderWidth:2, borderColor:C.gold+"50" }} />
                <Text style={{ color:C.white, fontSize:13 }}>{item}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  )

  if (section && section.startsWith("dest_")) {
    const idx = parseInt(section.split("_")[1])
    const dest = DESTINATIONS[idx]
    return (
      <View style={{ flex:1 }}>
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
            <Text style={{ color:C.gold, fontSize:16 }}>←</Text>
            <Text style={{ color:C.gold, fontSize:16, fontWeight:"700" }}>{t("retour",lang||"fr")}</Text>
          </TouchableOpacity>
          <Text style={{ color:C.white, fontSize:22, fontWeight:"900", marginTop:8 }}>{dest.emoji} {dest.ville}</Text>
          <Text style={{ color:dest.color, fontSize:13, fontWeight:"600", marginTop:4 }}>{dest.pays} — {dest.desc}</Text>
        </View>
        <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>
          <Text style={{ color:C.gold, fontSize:14, fontWeight:"800", marginBottom:10 }}>Incontournables</Text>
          {dest.tips.map((tip, i) => (
            <View key={i} style={[styles.card, { padding:12, flexDirection:"row", alignItems:"center", gap:10, marginBottom:8 }]}>
              <View style={{ backgroundColor:dest.color+"20", borderRadius:99, width:28, height:28, alignItems:"center", justifyContent:"center" }}>
                <Text style={{ color:dest.color, fontSize:12, fontWeight:"900" }}>{i+1}</Text>
              </View>
              <Text style={{ color:C.white, fontSize:13, flex:1 }}>{tip}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={{ flex:1 }}>
      <View style={styles.screenHeader}>
        <Text style={styles.sectionLabel}>{t("voyagesHalal",lang)}</Text>
        <Text style={{ color:C.gold, fontSize:18, fontWeight:"900" }}>✈️ Destinations & Guides</Text>
      </View>
      <ScrollView style={{ flex:1, padding:16 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection:"row", gap:8, marginBottom:14 }}>
          {[["omra","🕋 Omra",C.gold],["hajj","🕋 Hajj",C.green],["checklist","✅ Check-list",C.blue]].map(([id,label,col]) => (
            <TouchableOpacity key={id} onPress={() => setSection(id)}
              style={[styles.card, { flex:1, padding:12, alignItems:"center", borderTopWidth:3, borderTopColor:col }]}>
              <Text style={{ color:C.white, fontSize:12, fontWeight:"800", textAlign:"center" }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ color:C.white, fontSize:15, fontWeight:"800", marginBottom:10 }}>Destinations</Text>
        {DESTINATIONS.map((dest, i) => (
          <TouchableOpacity key={i} onPress={() => setSection("dest_"+i)}
            style={[styles.card, { flexDirection:"row", alignItems:"center", gap:14, marginBottom:10, borderLeftWidth:3, borderLeftColor:dest.color }]}>
            <Text style={{ fontSize:32 }}>{dest.emoji}</Text>
            <View style={{ flex:1 }}>
              <Text style={{ color:C.white, fontSize:15, fontWeight:"800" }}>{dest.ville}</Text>
              <Text style={{ color:dest.color, fontSize:11, fontWeight:"600" }}>{dest.pays}</Text>
              <Text style={{ color:C.muted, fontSize:12, marginTop:3 }}>{dest.desc}</Text>
            </View>
            <Text style={{ color:C.muted, fontSize:18 }}>→</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

// ─── Écran Profil ─────────────────────────────────────────────────────────────
function EcranProfil({ prayedToday={}, notifEnabled=false, onToggleNotif=()=>{}, lang="fr", onChangeLang=()=>{} }) {
  const auth = useAuth() || {}
  const user = auth.user || null
  const isAnonymous = auth.isAnonymous || !user
  const [profile, setProfile] = useState(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const [notifCount, setNotifCount] = useState(0)
  const [showLangPicker, setShowLangPicker] = useState(false)

  const displayName = profile?.display_name || user?.user_metadata?.full_name || (isAnonymous ? "Visiteur" : user?.email?.split("@")[0] || "Utilisateur")
  const displayEmail = isAnonymous ? "Compte invite" : (user?.email || "")
  const prayedCount = prayedToday ? Object.values(prayedToday).filter(Boolean).length : 0

  useEffect(() => {
    try {
      if (user && !isAnonymous) {
        fetchProfile(user.id).then(p => { if (p) setProfile(p) }).catch(() => {})
      }
      Notifications.getScheduledNotificationsAsync().then(n => setNotifCount(n.length)).catch(() => {})
    } catch(e) {}
  }, [user])

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    setLoggingOut(false)
  }

  const handleToggleNotif = async (val) => {
    try {
      await onToggleNotif(val)
      setTimeout(() => {
        Notifications.getScheduledNotificationsAsync().then(n => setNotifCount(n.length)).catch(() => {})
      }, 500)
    } catch(e) {}
  }

  return (
    <ScrollView style={{ flex:1 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.screenHeader, { alignItems:"center" }]}>
        <View style={{ width:80, height:80, borderRadius:40, backgroundColor:C.gold, alignItems:"center", justifyContent:"center" }}>
          <Text style={{ fontSize:34 }}>☪</Text>
        </View>
        <Text style={{ color:C.white, fontSize:20, fontWeight:"900", marginTop:14 }}>{displayName}</Text>
        <Text style={{ color:C.gold, fontSize:13, marginTop:2 }}>{displayEmail}</Text>

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
          <Text style={{ color:C.white, fontSize:14, fontWeight:"700", marginBottom:4 }}>🔔 {lang==="ar"?"تذكيرات الصلاة":lang==="en"?"Prayer reminders":lang==="tr"?"Namaz hatırlatıcıları":"Rappels de priere"}</Text>
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

        {/* Langue */}
        <TouchableOpacity onPress={() => setShowLangPicker(!showLangPicker)}
          style={[styles.card, { marginBottom:12, flexDirection:"row", alignItems:"center", justifyContent:"space-between" }]}>
          <View>
            <Text style={{ color:C.white, fontSize:14, fontWeight:"700" }}>🌍 {t("langue",lang)}</Text>
            <Text style={{ color:C.muted, fontSize:12, marginTop:4 }}>{LANGS.find(l => l.code === lang)?.flag} {LANGS.find(l => l.code === lang)?.label}</Text>
          </View>
          <Text style={{ color:C.gold, fontSize:16 }}>{showLangPicker ? "▲" : "▼"}</Text>
        </TouchableOpacity>
        {showLangPicker && (
          <View style={[styles.card, { marginBottom:12, padding:8 }]}>
            <View style={{ flexDirection:"row", flexWrap:"wrap", gap:6 }}>
              {LANGS.map(l => (
                <TouchableOpacity key={l.code} onPress={() => { onChangeLang(l.code); setShowLangPicker(false) }}
                  style={{ paddingHorizontal:10, paddingVertical:8, borderRadius:8, backgroundColor: lang===l.code ? C.gold+"25" : C.card2, borderWidth:1, borderColor: lang===l.code ? C.gold : C.border, minWidth:(W-72)/4 }}>
                  <Text style={{ color: lang===l.code ? C.gold : C.white, fontSize:12, fontWeight:"700", textAlign:"center" }}>{l.flag} {l.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Infos compte */}
        {[
          ["Version","FADJR v2.2"],
          ["Email", displayEmail],
          ["A propos",lang==="ar"?"التطبيق الإسلامي الشامل":lang==="en"?"The complete Islamic app":"Super-app halal"],
        ].map(([label,desc],i) => (
          <View key={i} style={{ flexDirection:"row", alignItems:"center", gap:14, paddingVertical:14, borderBottomWidth:1, borderBottomColor:C.border }}>
            <View style={{ flex:1 }}>
              <Text style={{ color:C.white, fontSize:14, fontWeight:"600" }}>{label}</Text>
              <Text style={{ color:C.muted, fontSize:12, marginTop:2 }}>{desc}</Text>
            </View>
          </View>
        ))}



        <TouchableOpacity onPress={handleLogout} disabled={loggingOut}
          style={{ marginTop:24, backgroundColor:"rgba(231,76,60,.1)", borderWidth:1, borderColor:"rgba(231,76,60,.3)", borderRadius:12, paddingVertical:13, alignItems:"center" }}>
          {loggingOut
            ? <ActivityIndicator color={C.red} size="small" />
            : <Text style={{ color:C.red, fontSize:14, fontWeight:"700" }}>{lang==="ar"?"تسجيل الخروج":lang==="en"?"Sign out":lang==="tr"?"Çıkış":"Se deconnecter"}</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(undefined)
  const [lang, setLang] = useState("fr")
  const [tab, setTab] = useState("accueil")

  // ── OTA update forcé au lancement ──
  useEffect(() => {
    async function checkUpdate() {
      try {
        if (!__DEV__) {
          const update = await Updates.checkForUpdateAsync()
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync()
            await Updates.reloadAsync()
          }
        }
      } catch (e) {}
    }
    checkUpdate()
  }, [])
  const [prayers, setPrayers] = useState([])
  const [city, setCity] = useState("Bruxelles")
  const [userLat, setUserLat] = useState(50.8503)
  const [userLng, setUserLng] = useState(4.3517)
  const [prayerMethod, setPrayerMethod] = useState(12)
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
  // Load saved language
  useEffect(() => {
    AsyncStorage.getItem("fadjr_lang").then(l => { if (l && LANGS.find(x => x.code === l)) setLang(l) }).catch(() => {})
  }, [])
  const changeLang = (l) => { setLang(l); AsyncStorage.setItem("fadjr_lang", l).catch(() => {}) }
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
        // Track location for business analytics
        trackUserLocation(user.id, user.email).catch(() => {})
        // Schedule daily inspiration notifications
        scheduleDailyInspiration().catch(() => {})
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

  // ── Get user GPS for precise prayer times ──
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
          setUserLat(loc.coords.latitude)
          setUserLng(loc.coords.longitude)
          const [geo] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
          if (geo?.city) setCity(geo.city)
        }
        // Load saved prayer method
        const method = await AsyncStorage.getItem("fadjr_prayer_method")
        if (method) setPrayerMethod(parseInt(method))
      } catch(e) {}
    })()
  }, [])

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
        const res = await fetch(`https://api.aladhan.com/v1/timings/${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}?latitude=${userLat}&longitude=${userLng}&method=${prayerMethod}`)
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
  }, [userLat, userLng, prayerMethod])

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
    return <AuthContext.Provider value={authValue}><EcranAuth lang={lang} /></AuthContext.Provider>
  }

  const NAV = [
    { id:"accueil", icon:"🏠", label:t("accueil",lang) },
    { id:"priere", icon:"🕌", label:t("priere",lang) },
    { id:"carte", icon:"🗺️", label:t("halal",lang) },
    { id:"culture", icon:"📚", label:t("culture",lang) },
    { id:"profil", icon:"👤", label:t("profil",lang) },
  ]

  return (
    <AuthContext.Provider value={authValue}>
      <View style={{ flex:1, backgroundColor:C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <View style={{ flex:1 }}>
          {tab==="accueil" && <EcranAccueil prayers={prayers} city={city} nextPrayer={nextPrayer} timeToNext={timeToNext} setTab={setTab} hijriDate={hijriDate} lang={lang} prayedToday={prayedToday} />}
          {tab==="priere" && <EcranPriere prayers={prayers} city={city} loading={loading} nextPrayer={nextPrayer} prayedToday={prayedToday} onTogglePrayed={onTogglePrayed} lang={lang} />}
          {tab==="carte" && <EcranCarte lang={lang} />}
          {tab==="culture" && <EcranCulture lang={lang} />}
          {tab==="finance" && <EcranFinance lang={lang} />}
          {tab==="voyage" && <EcranVoyage lang={lang} />}
          {tab==="profil" && <EcranProfil prayedToday={prayedToday} notifEnabled={notifEnabled} onToggleNotif={onToggleNotif} lang={lang} onChangeLang={changeLang} />}
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
  tabBar: { flexDirection:"row", backgroundColor:"rgba(10,10,20,.97)", borderTopWidth:1, borderTopColor:"rgba(201,168,76,0.15)", paddingBottom: Platform.OS === "android" ? 28 : 8, paddingTop:8 },
  tabItem: { flex:1, alignItems:"center", position:"relative" },
})
