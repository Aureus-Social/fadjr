# CONTEXT.md — FADJR
# À lire en début de chaque session Claude. Toujours à jour.
# Dernière mise à jour : 22 Mars 2026

## Identité projet
- **Produit** : FADJR — Halal Super-App
- **Domain** : fadjr.app
- **Repo** : Aureus-Social/fadjr
- **Vercel** : projet fadjr → fadjr.app
- **Supabase** : bpvrqphmxrnjrbjtaxuw (Frankfurt)
- **Local PC** : C:\Users\mouss\fadjr

## Stack
- Expo React Native (SDK 52, React 18.3.1, RN 0.76.3)
- Supabase (auth + DB + profiles)
- GitHub Actions CI/CD
- EAS Build configuré (iOS + Android production)
- expo-updates (OTA updates via EAS Update)
- Apple Developer : moussati.nourdin@gmail.com
- Google Play : developer "FADJR", ID 5081224021454358354

## Architecture
```
fadjr/
├── App.js                 ← TOUT-EN-UN : 969 lignes, tous les écrans
├── app.json               ← config Expo (permissions, icons, splash, EAS)
├── eas.json               ← profiles EAS Build (dev, preview, production)
├── lib/supabase.js        ← client Supabase
├── hooks/useRestaurants.js
├── assets/                ← icons, splash, adaptive-icon
├── screenshots/           ← 5 screenshots App Store (1290x2796)
├── SUPABASE_MIGRATION.sql ← schéma DB
├── APPSTORE_METADATA.md   ← métadonnées stores
└── EAS_BUILD_GUIDE.md     ← guide build
```

## Règle #1 — CRITIQUE
```javascript
// App.js — TOUJOURS ligne 1 absolue
import 'react-native-url-polyfill/auto'
```

## Écrans dans App.js
1. **EcranAuth** — login/signup/guest anonyme (Supabase Auth)
2. **EcranAccueil** — prières du jour + next prayer + banner Ramadan + piliers
3. **EcranPriere** — horaires détaillés + tracker 5 prières + dhikr counter + douas
4. **EcranCarte** — commerces halal + filtre catégories (7 commerces hardcodés)
5. **EcranCulture** — placeholder
6. **EcranFinance** — placeholder
7. **EcranVoyage** — placeholder
8. **EcranProfil** — profil persistant Supabase + notifications toggle + logout

## Sprints complétés
- ✅ Sprint 1 : Foundation (structure, Supabase, landing page, stores accounts)
- ✅ Sprint 2 : Core (prières Aladhan, restaurants Google Places, Quran, navigation 5 tabs)
- ✅ Sprint 3 : Polish (onboarding animations, favoris, partage natif, Adhan audio, tab animations)
- ✅ Sprint 4 : Contenu (6 mosquées, 74 douas Hisnul Muslim, tracker prières, banner Ramadan 1447)
- ✅ Sprint 5 : Production-ready (auth Supabase, Qibla boussole, push notifs, profil persistant, gate system, EAS config, screenshots, expo-updates, fix touch events)

## Features actives
- Auth : login/signup email + guest anonyme
- Prières : Aladhan API method 3 (Europe), 5 prières, next prayer countdown
- Tracker prières : 5 prières/jour, badge count dans tab
- Qibla : boussole GPS + DeviceOrientation + low-pass filter
- Push notifications : rappel avant chaque prière
- Quran : Al-Quran Cloud API, gate 15 sourates gratuites
- Commerces halal : 7 commerces hardcodés, gate 5 résultats gratuits
- Douas : 74 douas Hisnul Muslim, 16 catégories
- Dhikr counter, date hijri dynamique, banner Ramadan 1447
- Profil persistant Supabase (display_name, ville, madhab)
- OTA updates (expo-updates configuré)

## Gate system
- Quran : 15 sourates gratuites → bannière connexion
- Halal : 5 résultats gratuits → bannière connexion

## Ce qui manque pour les stores
1. Lancer eas build + soumettre TestFlight / Play Console
2. Remplir métadonnées stores (voir APPSTORE_METADATA.md)
3. Ajouter vrais commerces halal (actuellement 7 hardcodés)
4. Finaliser écrans Culture/Finance/Voyage (placeholders)

## Navigation (5 tabs)
| Tab | id | Écran |
|---|---|---|
| 🏠 Accueil | accueil | EcranAccueil |
| 🕌 Priere | priere | EcranPriere |
| 🗺️ Halal | carte | EcranCarte |
| 📚 Culture | culture | EcranCulture |
| 👤 Profil | profil | EcranProfil |

## Tokens & Accès
```
GitHub FADJR    : [voir skills Claude / GitHub Settings]
Supabase ID     : bpvrqphmxrnjrbjtaxuw
Supabase URL    : https://bpvrqphmxrnjrbjtaxuw.supabase.co
EAS Project ID  : cec4b75a-6131-4e4a-9cd3-ac64b91bb67f
```

## Démarrage session
```bash
# Token GitHub : voir aureus-session-protocol skill
git clone https://[GITHUB_TOKEN]@github.com/Aureus-Social/fadjr.git /tmp/fadjr
cd /tmp/fadjr
git config user.email "info@aureus-ia.com"
git config user.name "Aureus IA"
```

## Règles développement
1. Compatibilité iOS + Android obligatoire
2. Tester touch events sur device réel
3. Pas de module natif sans vérifier compat Expo Go
4. ZIPs : noms descriptifs FADJR-Sprint6-XXX.zip
5. Permissions : déclarer dans app.json ET demander au runtime
6. Push sur staging d'abord, jamais main direct
