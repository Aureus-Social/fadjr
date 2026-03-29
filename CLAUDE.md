# CLAUDE.md — FADJR

## RÈGLE 1 : LIS CE FICHIER EN ENTIER AVANT DE TOUCHER AU CODE

---

## IDENTITÉ DU PROJET
- **App** : FADJR — Halal super-app pour utilisateurs musulmans
- **Stack** : React Native / Expo SDK 52
- **iOS** : TestFlight (build 17)
- **Android** : Play Store internal testing (v10)

---

## REPOS & TOKENS
- **GitHub repo** : `Aureus-Social/fadjr`
- **GitHub token** : `→ voir Nourdin (GitHub Settings > Tokens > fadjr)`
- **EAS project ID** : `04a40488-0d3b-47c0-a65a-525853e984fa`
- **Expo account** : `aureus_fadjr`

---

## SUPABASE
- **Project** : `bpvrqphmxrnjrbjtaxuw`
- **Service Role Key** : `→ voir Nourdin (Supabase > FADJR > API)`

---

## FONCTIONNALITÉS
- Horaires de prière (GPS + Aladhan API)
- Coran audio (12 récitateurs)
- Restaurants halal (5,286+ dans 75 villes)
- Mosquées (Overpass API, rayon 25km)
- Dhikr/Tasbih
- AI Imam (chatbot)
- Qibla compass

---

## RÈGLES DE CODE STRICTES

1. **BUILD EAS** : `eas build` avant de soumettre. Vérifier les logs Expo.
2. **Après chaque fix** : Donner à Nourdin un test ciblé précis. Ex: "Ouvre l'onglet Mosquées, active GPS, vérifie résultats en <3s".
3. **Plus de 3 push pour le même bug** → recommencer depuis diagnostic complet.
4. **iOS** : Vérifier `NSMicrophoneUsageDescription` dans app.json avant build.
5. **Audio** : Utiliser `expo-audio` (canary), pas `expo-av`.
6. **Navigation** : React Navigation v6, pas de navigation.navigate dans un useEffect sans cleanup.

---

## BUGS CONNUS (à ne pas réintroduire)
- GPS coordinates inversées → fixed (lat/lng swap)
- Quran audio overlap → fixed (stop avant play)
- Mosque results empty → fixed (Overpass query timeout)
- Restaurant loading → fixed (pagination Supabase)
- Navigation bar Android → fixed
- iOS build number conflict → toujours incrémenter buildNumber

---

## ÉTAT ACTUEL (29/03/2026)
- TestFlight build 17 actif
- Android v10 en test interne
- EAS builds en cours

---

## CONTEXTE ENTREPRISE
- Société : Aureus IA SPRL — BCE BE 1028.230.781
- Contact : moussati.nourdin@gmail.com
