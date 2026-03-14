# CONTEXT.md — FADJR
# À lire en début de chaque session Claude. Toujours à jour.
# Dernière mise à jour : Mars 2026

## Identité projet
- **Produit** : FADJR — Halal Super-App (ex-NŪRLY)
- **Domain** : fadjr.app
- **Repo** : Aureus-Social/fadjr
- **Vercel** : projet fadjr → fadjr.app
- **Supabase** : bpvrqphmxrnjrbjtaxuw (Frankfurt)
- **Local PC** : C:\Users\mouss\fadjr

## Stack
- Expo React Native (SDK 54)
- Supabase (auth + DB)
- GitHub Actions CI/CD
- Apple Developer : moussati.nourdin@gmail.com
- Google Play : developer "FADJR", ID 5081224021454358354

## Architecture
```
fadjr/
├── App.js                 ← LIGNE 1 : import 'react-native-url-polyfill/auto'
├── app.json               ← config Expo (permissions, icons, splash)
├── lib/supabase.js        ← client Supabase
├── screens/               ← 5 screens principaux
│   ├── AccueilScreen.jsx  ← prières + tracker + banner Ramadan
│   ├── MapScreen.jsx      ← restaurants + mosquées
│   ├── DhikrScreen.jsx    ← douas + dhikr
│   ├── QuranScreen.jsx    ← Quran
│   └── ProfilScreen.jsx   ← profil
└── components/            ← composants réutilisables
```

## Règle #1 — CRITIQUE
```javascript
// App.js — TOUJOURS ligne 1 absolue
import 'react-native-url-polyfill/auto'
```

## Sprints complétés
- ✅ Sprint 1 : Foundation (structure, Supabase, landing page)
- ✅ Sprint 2 : Core (prières, restaurants, Quran, navigation)
- ✅ Sprint 3 : Polish (onboarding animations, favoris, partage, Adhan audio, tab animations) — commit `1f707d3`
- ✅ Sprint 4 : Contenu (6 mosquées, 74 douas, tracker prières, banner Ramadan 1447)

## Bug connu — NON RÉSOLU (priorité Sprint 5)
**Touch events ne répondent pas sur iOS device réel**
- Cause : overlay onboarding z-index 9999 bloque les touches
- Fix partiel appliqué : `display:none` par défaut + touchend delegator
- Statut : à retester sur device

## Pending Sprint 5 — priorité ordre décroissant
1. 🔴 Fix définitif touch events iOS + test Android
2. 🔴 Auth Supabase (login/signup utilisateur)
3. 🟡 Qibla (direction La Mecque)
4. 🟡 Push notifications prières
5. 🟡 Page restaurant détaillée
6. 🟢 EAS Build iOS → TestFlight
7. 🟢 EAS Build Android → Internal testing

## Tokens & Accès
```
GitHub FADJR : [voir GitHub Settings → Developer settings]
Supabase ID  : bpvrqphmxrnjrbjtaxuw
Supabase URL : https://bpvrqphmxrnjrbjtaxuw.supabase.co
Anon key     : 
```

## Démarrage session
```bash
git clone https://[voir GitHub Settings → Developer settings]@github.com/Aureus-Social/fadjr.git /tmp/fadjr
cd /tmp/fadjr
git config user.email "info@aureus-ia.com"
git config user.name "Aureus IA"
```

## Règles développement
1. Compatibilité iOS + Android obligatoire sur chaque feature
2. Tester touch events sur device réel (pas simulateur)
3. Pas de module natif sans vérifier compat Expo Go
4. ZIPs : noms descriptifs `FADJR-Sprint5-Auth.zip`
5. Permissions : déclarer dans app.json ET demander au runtime

## 5 Piliers app
1. Prières (Aladhan API, method 3 Europe)
2. Restaurants halal (Google Places → Supabase)
3. Quran (Al-Quran Cloud API)
4. Voyages halal
5. Finance islamique

## Comment mettre à jour ce fichier
Après chaque sprint :
1. Cocher ✅ le sprint terminé
2. Mettre à jour le bug connu si résolu
3. Mettre à jour Pending avec nouvelles priorités
4. Mettre à jour la date en haut
