---
name: aureus-brain-wiki
description: >
  Protocole LLM Wiki (pattern Karpathy) pour faire grandir le cerveau evergreen
  partagé (vault aureus-brain). Charger quand on apprend quelque chose de DURABLE
  (architecture, gotcha, décision, « comment marche X »), en fin de session, ou
  avant de re-dériver un sujet déjà compris.
---

# aureus-brain-wiki — faire vivre le cerveau evergreen

## Principe (LLM Wiki de Karpathy)
Compiler le savoir **une fois** dans des pages Markdown interconnectées et les **garder à jour en place**, au lieu de re-demander à l'IA ou de re-fouiller à chaque fois. Vault **partagé** : `aureus-brain` (`OneDrive/Documents/GitHub/aureus-brain`, dépôt git auto-synchronisé). Index : `00 Wiki - Cerveau evergreen.md`. Chaque univers (Aureus Social, **Autopilot**, **FADJR**, **Aureus IA**) a son cockpit + son cerveau ; ce projet écrit dans **sa** section.

## La boucle
1. **Avant** de re-expliquer / re-dériver un sujet durable → chercher sa page evergreen dans le vault. Si elle existe, la lire au lieu de réfléchir à vide.
2. **Après** avoir appris quelque chose de durable → créer/**mettre à jour** la page evergreen (≠ énième note datée), l'inscrire dans `00 Wiki`.
3. **Dédup** : avant de créer, chercher une page existante et l'**étendre**. Une idée = une page.
4. **Lier** systématiquement en `[[wikilink]]` (cible inexistante = à créer plus tard, OK).

## Les couches (ne pas confondre)
| Couche | Nature |
|---|---|
| **Wiki evergreen** | Page mise à jour **en place**, canonique, dédupliquée |
| Journal / notes datées | Log **append-only** (ce qui s'est passé) |
| Mémoire perso Claude | Qui est l'user, feedback, projet (≠ vault) |
| Fiches générées | Miroir **lecture seule** — ne jamais y écrire à la main |

## 🛡️ Garde-fous (absolus)
- **Source de vérité = le CODE/config de CE projet.** Une page wiki **pointe** vers, ne **recopie jamais** une valeur faisant foi (constante, prix, clé de config, taux légal) — sinon elle périme en silence.
- **Jamais de secret** (token, clé, IBAN, NISS…) — le vault est commité. Référence l'emplacement, pas la valeur.
- Dédup + liens `[[ ]]`. Si document structurel → tenir l'index/JDex du vault à jour (skill `johnny-decimal` si présent).

Voir aussi : skill `karpathy-method` (méthode code) · le `CLAUDE.md` du vault (workflow `wiki:`).
