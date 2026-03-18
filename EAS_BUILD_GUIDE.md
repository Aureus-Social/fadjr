# FADJR — Guide Build EAS Sprint 5

## Pré-requis (à faire 1 seule fois)

```bash
# Installer EAS CLI globalement
npm install -g eas-cli

# Se connecter à Expo
eas login
# Email : moussati.nourdin@gmail.com
```

---

## 1. App Store Connect (iOS) — Action requise

1. Aller sur https://appstoreconnect.apple.com
2. Créer une nouvelle app : **Mes apps → +**
   - Bundle ID : `app.fadjr`
   - Nom : `FADJR`
   - SKU : `fadjr-app`
3. Récupérer **l'App ID numérique** (ex: `6738452091`)
4. Dans `eas.json` remplacer :
   ```json
   "ascAppId": "REMPLIR_APRES_CREATION_APP_STORE_CONNECT"
   ```
   Par le vrai ID.

5. Apple Team ID (dans https://developer.apple.com → Membership) :
   ```json
   "appleTeamId": "VOTRE_TEAM_ID"
   ```

---

## 2. Google Play Console (Android) — Service Account

1. Aller sur https://play.google.com/console
2. Setup API → Service Account → Créer
3. Télécharger la clé JSON → renommer en `play-store-key.json`
4. Placer dans `C:\Users\mouss\fadjr\play-store-key.json`
5. **Ne pas committer** (déjà dans .gitignore)

---

## 3. google-services.json (Firebase — Push Android)

Sans Firebase, les notifs push Android fonctionnent via Expo Push Service.
Pour les notifs locales (scheduleNotification) : pas besoin de Firebase.

Si tu veux les push remote plus tard :
1. https://console.firebase.google.com → Nouveau projet
2. Ajouter Android → package : `app.fadjr`
3. Télécharger `google-services.json` → racine du projet

**Pour l'instant** : commenter la ligne dans app.json :
```json
// "googleServicesFile": "./google-services.json"
```

---

## 4. Commandes Build

### iOS — TestFlight (première soumission)
```bash
cd C:\Users\mouss\fadjr

# Build preview (APK, distribution interne)
eas build --platform ios --profile preview

# Build production (App Store)
eas build --platform ios --profile production

# Soumettre à App Store Connect
eas submit --platform ios --profile production
```

### Android — Internal Testing
```bash
# Build APK pour test direct
eas build --platform android --profile preview

# Build AAB pour Play Store
eas build --platform android --profile production

# Soumettre au Play Store
eas submit --platform android --profile production
```

### Les deux en même temps
```bash
eas build --platform all --profile production
```

---

## 5. Avant de builder — Checklist

- [ ] Migration SQL exécutée dans Supabase (SUPABASE_MIGRATION.sql)
- [ ] App Store Connect app créée + ascAppId renseigné dans eas.json
- [ ] Apple Team ID renseigné dans eas.json
- [ ] google-services.json placé OU ligne commentée dans app.json
- [ ] `npm install` fait localement
- [ ] `npx expo doctor` sans erreur critique

---

## 6. Workflow recommandé

```
Dev local (Expo Go)
    ↓
Preview build (APK/IPA interne) → test device réel
    ↓
Production build → TestFlight (iOS) + Internal Testing (Android)
    ↓
Review Apple (7j) + Google (1-3j)
    ↓
Public
```

---

## 7. Résolution problèmes fréquents

| Erreur | Fix |
|--------|-----|
| `Missing Apple Team ID` | Renseigner dans eas.json |
| `google-services.json not found` | Commenter la ligne dans app.json |
| `expo-notifications incompatible` | `npx expo install --fix` |
| Build timeout | Réessayer, serveurs EAS chargés |
| `Invalid bundle identifier` | Vérifier `app.fadjr` dans app.json |

