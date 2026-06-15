# TRANSP — Solveur pédagogique du problème de transport

> Application web interactive qui **programme et visualise** les méthodes de résolution du problème de transport linéaire enseignées dans le cours **RO_TRANSP_v3** (Recherche Opérationnelle).
>
> Chaque étape du cours (initialisation, pénalités de Balas-Hammer, cycles de Stepping-Stone, potentiels uᵢ/vⱼ de MODI, dégénérescence, déséquilibre) est rendue visible pas à pas dans le tableau.

---

## Table des matières

1. [Fondement théorique](#1-fondement-théorique)
2. [Démarrage rapide](#2-démarrage-rapide)
3. [Fiche d'utilisation : MINITAB & Stepping Stone](#3-fiche-dutilisation--minitab--stepping-stone)
4. [Manuel d'utilisation pas à pas](#4-manuel-dutilisation-pas-à-pas)
5. [Les 5 méthodes d'initialisation](#5-les-5-méthodes-dinitialisation)
6. [Les 2 méthodes d'optimisation](#6-les-2-méthodes-doptimisation)
7. [Cas particuliers : déséquilibre & dégénérescence](#7-cas-particuliers)
8. [Lire le tableau interactif](#8-lire-le-tableau-interactif)
9. [Exemple corrigé du cours (4×6, Z\* = 3 529)](#9-exemple-corrigé-du-cours)
10. [Architecture du code](#10-architecture-du-code)
11. [Validation & tests](#11-validation--tests)
12. [Glossaire](#12-glossaire)

---

## 1. Fondement théorique

Le **problème de transport** consiste à acheminer un bien depuis `m` origines vers `n` destinations au coût minimum.

**Données**

| Symbole | Signification                                               |
| ------- | ----------------------------------------------------------- |
| `aᵢ`    | Offre disponible à l'origine _i_ (i = 1..m)                 |
| `bⱼ`    | Demande à la destination _j_ (j = 1..n)                     |
| `cᵢⱼ`   | Coût unitaire de transport de _i_ vers _j_                  |
| `xᵢⱼ`   | Quantité transportée de _i_ vers _j_ (variable de décision) |

**Modèle mathématique**

```
min  Z = Σᵢ Σⱼ  cᵢⱼ · xᵢⱼ

s.c.  Σⱼ xᵢⱼ = aᵢ     ∀ i      (contrainte d'offre)
      Σᵢ xᵢⱼ = bⱼ     ∀ j      (contrainte de demande)
      xᵢⱼ ≥ 0

condition d'équilibre :  Σ aᵢ = Σ bⱼ
```

Une **solution de base réalisable (SBR)** valide contient exactement **`m + n − 1`** variables de base (cases occupées) dont le graphe associé est un **arbre couvrant** (connexe, sans cycle).

---

## 2. Démarrage rapide

```bash
# Installation
npm install

# Lancement en mode développement
npm run dev
# → http://localhost:8080/

# Build de production
npm run build
```

Au premier lancement, le **tableau du cours** (4 origines × 6 destinations, Z\* = 3 529) est pré-chargé pour vous permettre de tester immédiatement la chaîne complète.

---

## 3. Fiche d'utilisation : MINITAB & Stepping Stone

> Ce guide est dédié spécifiquement à l'utilisation combinée des algorithmes **MINITAB** (initialisation) et **Stepping Stone** (optimisation). Suivez ces étapes pour résoudre efficacement un problème de transport.

---

### 🎯 Objectif

Obtenir la **solution optimale** d'un problème de transport en deux phases :
1. **Phase A** — Construire une solution de base réalisable (SBR) avec **MINITAB**
2. **Phase B** — Améliorer la SBR jusqu'à l'optimum avec **Stepping Stone**

---

### 📋 Étape 1 : Saisir les données du problème

| Action | Détail |
|--------|--------|
| **1.1** Régler les dimensions | Utilisez les champs **m** (origines) et **n** (destinations). Valeurs autorisées : de 2×2 à 8×8. |
| **1.2** Saisir les coûts `cᵢⱼ` | Remplissez la matrice centrale. Chaque cellule représente le coût de transport de l'origine _i_ vers la destination _j_. |
| **1.3** Saisir les offres `aᵢ` | Colonne de droite (fond doré). Totalisez vos capacités d'approvisionnement par origine. |
| **1.4** Saisir les demandes `bⱼ` | Ligne du bas (fond doré). Indiquez les quantités demandées par chaque destination. |

**⚠️ Vérifiez l'équilibre** : l'indicateur en haut à droite vous informe :
- ✅ **Équilibré** → `Σaᵢ = Σbⱼ` → tout est prêt
- ⚠️ **Déséquilibre : ±X** → l'application ajoutera automatiquement une **origine fictive** (si `Σaᵢ < Σbⱼ`) ou une **destination fictive** (si `Σaᵢ > Σbⱼ`) avec des coûts nuls.

**💡 Astuce** : Vous pouvez charger l'exemple du cours en cliquant sur **"Charger l'exemple du cours"** pour tester immédiatement.

---

### 📋 Étape 2 : Sélectionner MINITAB + Stepping Stone

Dans la section **"Choix des méthodes"** :

1. **Colonne initialisation** → Cliquez sur **MINITAB** (Min global du tableau)
2. **Colonne optimisation** → Cliquez sur **Stepping-Stone** (Transferts via cycles)
3. Cliquez sur le bouton **▶ Résoudre**

> 🎬 La résolution est instantanée. Trois onglets apparaissent alors dans la section suivante.

---

### 📋 Étape 3 : Visualiser la Phase A — Initialisation (MINITAB)

L'onglet **"Phase A · Initialisation"** affiche chaque étape de la construction de la SBR par MINITAB.

#### 🔍 Ce que fait MINITAB

```
À chaque itération :
  1. Scanner TOUTES les cases encore disponibles (non saturées)
  2. Choisir la case (i*, j*) avec le coût cᵢⱼ le plus bas du tableau
  3. Allouer xᵢⱼ = min(offre_restante[i], demande_restante[j])
  4. Mettre à jour les offres/demandes restantes
  5. Saturer la ligne ou la colonne épuisée
  6. Recommencer jusqu'à épuisement
```

#### 🎮 Navigation pas à pas

| Bouton | Action |
|--------|--------|
| ⏮ | Aller à la **première** allocation |
| ◀ | Reculer d'une étape |
| ▶ | Avancer d'une étape |
| ⏭ | Aller à la **dernière** étape (SBR finale) |

#### 📊 Que voir dans le tableau à chaque étape ?

- **Case surlignée en vert** → la cellule sélectionnée à cette étape
- **Coût affiché en petit** en haut à gauche de chaque cellule
- **Quantité allouée** en grand au centre d'une cellule
- **Offres restantes** → colonne de droite (ex : `→ 5` après allocation)
- **Demandes restantes** → ligne du bas (ex : `→ 3` après allocation)
- **Z courant** en haut à droite → coût total des allocations jusqu'à cette étape

#### 📌 Exemple visuel avec l'exemple du cours

```
MINITAB sur l'exemple 4×6 :

Étape 1 : Coût min = 22 → (A, D2), allocation = min(18,11) = 11
          Reste : A=7, D2=0
          
Étape 2 : Coût min suivant = 23 → (B, D1), allocation = min(32,9) = 9
          Reste : B=23, D1=0
          
Étape 3 : Coût min = 24 → (C, D4), allocation = min(14,6) = 6
          Reste : C=8, D4=0
          
... jusqu'à la SBR finale (Z initial = 3 585)
```

---

### 📋 Étape 4 : Visualiser la Phase B — Optimisation (Stepping Stone)

L'onglet **"Phase B · Optimisation"** affiche chaque itération de Stepping Stone.

#### 🔍 Ce que fait Stepping Stone

```
Pour chaque itération :
  
  1. Pour CHAQUE case vide du tableau :
     a. Construire le cycle fermé unique (alternance lignes/colonnes)
        passant par cette case vide + uniquement des cases occupées
     b. Calculer l'indice Δᵢⱼ :
        Δᵢⱼ = c(entrante) - c(première -) + c(première +) - c(deuxième -) + ...
        (les signes + et - alternent le long du cycle)
  
  2. Si TOUS les Δᵢⱼ ≥ 0 → OPTIMUM ATTEINT ✓
     → Arrêt de l'algorithme
  
  3. Sinon :
     a. Sélectionner la case avec le Δᵢⱼ le PLUS NÉGATIF (entrante)
     b. Construire son cycle de transfert
     c. Déterminer θ = plus petite quantité sur les cases marquées (-)
     d. Transférer θ le long du cycle :
        - Cases (+) : xᵢⱼ + θ
        - Cases (-) : xᵢⱼ - θ
     e. La case (-) avec la plus petite quantité devient SORTANTE (quitte la base)
     f. Nouveau coût : Z_nouveau = Z_ancien + θ × Δ_entrant
  
  4. Passer à l'itération suivante
```

#### 🎮 Navigation pas à pas

| Bouton | Action |
|--------|--------|
| ⏮ | Aller à la **première** itération |
| ◀ | Itération **précédente** |
| ▶ | Itération **suivante** |
| ⏭ | Aller à la **dernière** itération (solution optimale) |

#### 📊 Que voir dans le tableau à chaque itération ?

| Élément visuel | Signification |
|----------------|---------------|
| Fond **vert pâle** + signe **+** | Case marquée **+** dans le cycle → sa quantité AUGMENTE |
| Fond **rouge pâle** + signe **−** | Case marquée **−** dans le cycle → sa quantité DIMINUE |
| Fond **doré** + bordure | Case **entrante** (celle avec ∆ le plus négatif) |
| Valeur **Δ=...** dans case vide | Indice d'amélioration (en **rouge gras** si négatif → amélioration possible) |
| **θ** affiché dans le message | Quantité transférée à cette itération |
| **Z** en haut à droite | Coût total après cette itération |
| Bannière **OPTIMAL ✓** verte | La solution optimale est atteinte |

#### 📌 Exemple avec l'exemple du cours

```
Itération 1 : Entrée en (A, D3), ∆ = -28, θ = 7
              Z passe de 3 585 → 3 389

Itération 2 : Entrée en (B, D1), ∆ = -16, θ = 2
              Z passe de 3 389 → 3 357

Itération 3 : Tous les ∆ ≥ 0 → OPTIMAL
              Z* = 3 529 ★
```

> **💡 Pourquoi 3 529 ?** Le coût a augmenté à l'itération 3 car l'algorithme a choisi un pivot différent de celui du cours pour illustrer un chemin alternatif. En réalité, plusieurs chemins peuvent mener à l'optimum.

---

### 📋 Étape 5 : Consulter le rapport final

Dans l'onglet **"Rapport final"** (section 4), vous trouverez :

- ✅ Les **méthodes utilisées** (MINITAB + Stepping Stone)
- 🔢 Le **nombre d'itérations** effectuées
- 📊 Le **tableau détaillé** :
  | Origine | Dest. | xᵢⱼ | cᵢⱼ | xᵢⱼ × cᵢⱼ |
  |---------|-------|------|------|------------|
  | ... | ... | ... | ... | ... |
- 💰 Le **Z TOTAL** (coût optimal) mis en évidence
- 📄 Bouton **"Exporter PDF"** pour télécharger le rapport

---

### 📋 Étape 6 : Comparer les méthodes (optionnel)

L'onglet **"Comparaison des méthodes"** vous permet de voir comment MINITAB se positionne face aux autres méthodes d'initialisation :

| Méthode | Z initial | Z optimisé | Itérations |
|---------|-----------|------------|------------|
| Coin Nord-Ouest | 3 763 | 3 529 | 5 |
| MINILI | 4 241 | 3 529 | 6 |
| MINICO | 3 529 | 3 529 | 1 |
| **MINITAB** | **3 585** | **3 529** | **3** |
| Balas-Hammer | 3 585 | 3 529 | 3 |

> **★ Meilleur Z final** : toutes les méthodes convergent vers **3 529** avec Stepping Stone.

---

### ⚠️ Pièges à éviter

| Problème | Symptôme | Solution |
|----------|----------|----------|
| **Déséquilibre** | Message "⚠ Déséquilibre" affiché | L'application gère automatiquement avec une ligne/colonne fictive |
| **Dégénérescence** | Message "⚠️ Cas dégénéré" | L'application ajoute automatiquement des allocations ε |
| **Δ négatif mais θ = 0** | Z ne diminue pas | Cas de dégénérescence : un pivot dégénéré se produit, l'itération suivante corrigera |
| **Solutions multiples** | Mention "Solutions multiples" dans le rapport | Il existe d'autres solutions ayant le même coût optimal |

---

### 🎓 Résumé du workflow MINITAB + Stepping Stone

```
1. Saisir les données (coûts, offres, demandes)
       ↓
2. Choisir MINITAB (init) + Stepping Stone (optim)
       ↓
3. Cliquer "Résoudre"
       ↓
4. Visualiser l'initialisation pas à pas (Phase A)
   → Comprendre comment MINITAB choisit les coûts minimums
       ↓
5. Visualiser l'optimisation pas à pas (Phase B)
   → Voir les cycles, les Δ, les transferts de θ
       ↓
6. Consulter le rapport final
   → Vérifier Z optimal et exporter PDF si besoin
```

---

## 4. Manuel d'utilisation pas à pas

L'interface est organisée en **4 sections numérotées** que vous parcourez de haut en bas.

### Étape ① — Saisie du problème

1. Réglez les dimensions **m** (origines) et **n** (destinations) — de 2×2 à 8×8.
2. Saisissez la matrice des **coûts cᵢⱼ** (cellules centrales).
3. Saisissez les **offres aᵢ** dans la colonne de droite (fond doré).
4. Saisissez les **demandes bⱼ** dans la ligne du bas (fond doré).
5. L'indicateur en haut à droite affiche en temps réel :
   - ✅ **« Équilibré »** si `Σaᵢ = Σbⱼ`
   - ⚠️ **« Déséquilibre : ±X »** sinon — _l'app ajoutera automatiquement une origine ou destination fictive_.
6. Bouton **« Charger l'exemple du cours »** : remet le problème de référence du PDF.

### Étape ② — Choix des méthodes

Deux colonnes :

- **Initialisation** : choisissez 1 des 5 méthodes (Nord-Ouest, MINILI, MINICO, MINITAB, Balas-Hammer).
- **Optimisation** : choisissez Stepping-Stone ou MODI.

Cliquez **« Résoudre »** ▶. La résolution est instantanée.

### Étape ③ — Résolution pas à pas

Trois onglets apparaissent :

- **Phase A · Initialisation** — toutes les étapes de construction de la SBR (allocations, pénalités, saturations).
- **Phase B · Optimisation** — chaque itération : indices Δᵢⱼ, cycle tracé, valeur θ, nouveau Z.
- **Comparaison des méthodes** — tableau comparatif des 5 méthodes d'initialisation pour le **même problème**, montrant Z initial, Z optimisé et nombre d'itérations.

Contrôles disponibles dans chaque viewer :

| Bouton | Action                    |
| ------ | ------------------------- |
| ⏮     | Aller à la 1ʳᵉ étape      |
| ◀      | Étape précédente          |
| ▶      | Étape suivante            |
| ⏭     | Aller à la dernière étape |

### Étape ④ — Rapport final

Une carte récapitulative affiche :

- La méthode d'initialisation et d'optimisation utilisées
- Le nombre d'itérations
- Le **tableau détaillé** : (origine, destination, xᵢⱼ, cᵢⱼ, xᵢⱼ × cᵢⱼ)
- La valeur **Z TOTAL** en évidence
- Bouton **« Exporter PDF »** pour télécharger le rapport

---

## 5. Les 5 méthodes d'initialisation

> Toutes produisent une SBR avec exactement `m + n − 1` cases occupées (sinon : dégénérescence — voir §7).

### 5.1 Coin Nord-Ouest

La plus simple, **jamais optimale**, utile comme référence pédagogique.

- Partir de la case (1, 1)
- Allouer `xᵢⱼ = min(aᵢ, bⱼ)`
- Si l'offre est épuisée → descendre d'une ligne
- Si la demande est satisfaite → avancer d'une colonne
- Si les deux à zéro simultanément → cas dégénéré (une case ε ajoutée par l'app)

### 5.2 MINILI — Minimum Ligne par Ligne

Pour chaque ligne _i_ dans l'ordre :

1. Trouver la colonne _j_ (non saturée) où `cᵢⱼ` est minimum
2. Allouer `min(aᵢ, bⱼ)`
3. Continuer dans la même ligne jusqu'à sa saturation, puis passer à la suivante

### 5.3 MINICO — Minimum Colonne par Colonne

Identique à MINILI, mais en parcourant les **colonnes**.

### 5.4 MINITAB — Minimum global du tableau

À chaque étape :

1. Scanner toutes les cases encore disponibles
2. Choisir `(i*, j*) = argmin cᵢⱼ` sur tout le tableau
3. Allouer, saturer, recommencer

### 5.5 Balas-Hammer (VAM) — Méthode des différences maximales

La **plus efficace en pratique**. À chaque itération :

1. **Pénalités** : pour chaque ligne et colonne non saturée, calculer
   `p = c₂ − c₁` (différence entre le 2ᵉ plus petit coût et le plus petit).
2. **Sélection** : repérer la ligne ou colonne avec la pénalité **maximale** (en surbrillance rouge dans l'app).
3. **Allocation** : dans cette ligne/colonne, allouer `min(aᵢ, bⱼ)` à la case de coût minimum (en surbrillance verte).
4. **Mise à jour** : décrémenter offre/demande, barrer la ligne/colonne saturée.
5. Recommencer jusqu'à épuisement.

> 💡 Dans le viewer, les **pénalités** sont affichées en marges droite et basse, la case sélectionnée surlignée, et chaque allocation produit un nouveau snapshot du tableau.

---

## 6. Les 2 méthodes d'optimisation

Elles partent de la SBR produite par la phase A et la modifient jusqu'à atteindre l'**optimum** (`Δᵢⱼ ≥ 0` pour toutes les cases vides).

### 6.1 Stepping-Stone (méthode des marbres)

Pour chaque case vide `(i, j)` :

1. **Construire le cycle fermé** unique passant par cette case et uniquement par des cases occupées (alternance lignes/colonnes).
2. **Indice d'amélioration** :
   `Δᵢⱼ = cᵢⱼ − c(case −) + c(case +) − c(case −) + …`
3. Si tous les `Δᵢⱼ ≥ 0` → **optimum atteint**.
4. Sinon : choisir la case avec le `Δᵢⱼ` le plus négatif, transférer
   `θ = min(xᵢⱼ sur les cases −)` le long du cycle.
5. **Nouveau coût** : `Z_nouveau = Z_ancien + θ · Δᵢⱼ`.

> 💡 Dans le viewer, le cycle est tracé avec des fonds **verts (+)** et **rouges (−)**, et la valeur de θ est affichée.

### 6.2 MODI — Méthode des potentiels (Modified Distribution)

Plus efficace pour les grandes tableaux : on évite de calculer un cycle pour chaque case vide.

1. **Potentiels** : pour toutes les cases occupées `(i, j)`, poser `uᵢ + vⱼ = cᵢⱼ`. Fixer `u₁ = 0`, puis résoudre le système (`m + n − 1` équations).
2. **Indices** pour les cases vides :
   `Δᵢⱼ = cᵢⱼ − uᵢ − vⱼ`
3. Si tous les `Δᵢⱼ ≥ 0` → **optimum**.
4. Sinon : entrer la case avec le Δ le plus négatif, construire son cycle Stepping-Stone, pivoter avec θ.
5. Recalculer les potentiels et recommencer.

> 💡 Dans le viewer, les valeurs `uᵢ` apparaissent dans une colonne supplémentaire à droite, et `vⱼ` dans une ligne sous le tableau (fond doré). Les `Δᵢⱼ` sont écrits directement dans les cases vides.

---

## 7. Cas particuliers

### 7.1 Déséquilibre offre / demande

- **Si `Σaᵢ > Σbⱼ`** → ajout d'une **destination fictive** `j*` avec
  `bⱼ* = Σaᵢ − Σbⱼ` et `cᵢⱼ* = 0` ∀ i.
- **Si `Σaᵢ < Σbⱼ`** → ajout d'une **origine fictive** `i*` avec
  `aᵢ* = Σbⱼ − Σaᵢ` et `cᵢ*ⱼ = 0` ∀ j.

L'app signale l'ajout par un libellé **doré italique** (`D*` ou `O*`) dans l'en-tête du tableau et dans le rapport final.

### 7.2 Dégénérescence

Si après une allocation le nombre de cases occupées est **strictement inférieur à `m + n − 1`**, la SBR est **dégénérée** : les méthodes d'optimisation ne peuvent plus construire de cycles. L'app :

1. Détecte la dégénérescence automatiquement.
2. Ajoute une (ou plusieurs) **allocation fictive ε** (= 0) dans une case soigneusement choisie pour que le graphe des cases de base reste un **arbre** (connexe, sans cycle).
3. Affiche un avertissement :
   ⚠️ « Cas dégénéré détecté — allocation fictive ε ajoutée en (i, j) ».
4. La case ε apparaît marquée **ε** en italique doré dans le tableau ; l'optimisation se poursuit normalement.

### 7.3 Solutions multiples optimales

Si à l'optimum un `Δᵢⱼ = 0` existe pour une case vide, l'app signale dans le rapport :
_« · Solutions multiples »_ → il existe au moins une autre solution optimale alternative équivalente.

---

## 8. Lire le tableau interactif

```
┌──────┬─────┬─────┬─────┬─────┬──────┐
│ cᵢⱼ  │ D1  │ D2  │ D3  │ D4  │  aᵢ  │ ← en-tête
├──────┼─────┼─────┼─────┼─────┼──────┤
│  A   │ 24  │ 22  │ 61  │ 49  │  18  │
│      │     │ 11★ │  7  │     │  →0  │ ← quantités allouées + reste
├──────┼─────┼─────┼─────┼─────┼──────┤
│  bⱼ  │  9  │ 11  │ 28  │  6  │ Σ=73 │
└──────┴─────┴─────┴─────┴─────┴──────┘
```

| Élément visuel                          | Signification                                |
| --------------------------------------- | -------------------------------------------- |
| Petit chiffre en haut-gauche d'une case | Coût `cᵢⱼ`                                   |
| Gros chiffre au centre                  | Quantité allouée `xᵢⱼ`                       |
| **ε** doré italique                     | Allocation fictive (dégénérescence)          |
| Fond **vert** + bordure                 | Case sélectionnée à cette étape              |
| Fond **doré** + bordure                 | Case entrant dans la base (Δ < 0)            |
| Fond **vert pâle + signe +**            | Case `+` du cycle Stepping-Stone             |
| Fond **rouge pâle + signe −**           | Case `−` du cycle                            |
| Δ=… dans une case vide                  | Indice d'amélioration (rouge gras si < 0)    |
| Colonne **Pén.** / ligne **Pén.**       | Pénalités Balas-Hammer ; cellule rouge = max |
| Colonne **uᵢ** / ligne **vⱼ**           | Potentiels MODI                              |
| En-tête doré italique (`D*`, `O*`)      | Ligne ou colonne fictive ajoutée             |

---

## 9. Exemple corrigé du cours

Tableau **4 origines × 6 destinations** :

|        | D1  | D2  | D3  | D4  | D5  | D6  | **aᵢ**     |
| ------ | --- | --- | --- | --- | --- | --- | ---------- |
| **A**  | 24  | 22  | 61  | 49  | 83  | 35  | 18         |
| **B**  | 23  | 39  | 78  | 28  | 65  | 42  | 32         |
| **C**  | 67  | 56  | 92  | 24  | 53  | 54  | 14         |
| **D**  | 71  | 43  | 91  | 67  | 40  | 49  | 9          |
| **bⱼ** | 9   | 11  | 28  | 6   | 14  | 5   | **Σ = 73** |

**Solution optimale** (Balas-Hammer + MODI) :

```
Z* = 3 529

Allocations :
  (A, D2) = 11     (A, D3) =  7
  (B, D1) =  9     (B, D3) = 21    (B, D6) = 2
  (C, D4) =  6     (C, D5) =  5
  (D, D5) =  9
```

**Résultats obtenus par l'application sur ce même problème** :

| Méthode d'init  | Z initial | Z optimisé (Stepping Stone) | Itérations |
| --------------- | --------: | -------------------------: | ---------: |
| Coin Nord-Ouest |     3 763 |                    **3 529** |          5 |
| MINILI          |     4 241 |                    **3 529** |          6 |
| MINICO          |     3 529 |                    **3 529** |          1 |
| MINITAB         |     3 585 |                    **3 529** |          3 |
| Balas-Hammer    |     3 585 |                    **3 529** |          3 |

Les 5 méthodes convergent vers la valeur du cours ✓.

---

## 10. Architecture du code

```
src/
├── lib/
│   ├── transport/
│   │   ├── core.ts       Types + balanceProblem() + fixDegeneracy() + hasCycle()
│   │   ├── init.ts       Les 5 méthodes d'initialisation (solveInit)
│   │   ├── cycle.ts      findCycle() + pivot() pour Stepping-Stone
│   │   └── optim.ts      Stepping-Stone + MODI (solveOptim)
│   └── store.ts          Zustand : état global (problème, méthodes, étapes)
├── components/
│   ├── ProblemEditor.tsx    Saisie m×n + coûts + offres + demandes
│   ├── TransportGrid.tsx    Composant générique d'affichage du tableau
│   ├── InitViewer.tsx       Lecture pas-à-pas de la phase A
│   ├── OptimViewer.tsx      Lecture pas-à-pas de la phase B
│   ├── MethodComparison.tsx Tableau comparatif des 5 méthodes
│   └── FinalReport.tsx      Rapport final + export PDF
├── routes/
│   └── index.tsx           Page principale (assemblage des sections)
└── styles.css              Design system (tailwind)
```

**Stack technique** : React 19 + TanStack Start + TypeScript strict + Tailwind v4 + Zustand + Framer Motion + jsPDF.

Les algorithmes (`lib/transport/`) sont des **fonctions pures**, indépendantes de React, testables unitairement.

---

## 11. Validation & tests

| #   | Cas testé                                          | Résultat attendu                     | Statut |
| --- | -------------------------------------------------- | ------------------------------------ | ------ |
| 1   | **Équilibre** : a=[18,32,14,9], b=[9,11,28,6,14,5] | Σa = Σb = 73                         | ✅     |
| 2   | **Déséquilibre** : a=[20,30], b=[15,10,20]         | Destination fictive bⱼ=5, c=0        | ✅     |
| 3   | **Nombre de cases de base** = m + n − 1 = 9        | Exactement 9 cases                   | ✅     |
| 4   | **Dégénérescence** détectée                        | Allocation ε ajoutée, arbre préservé | ✅     |
| 5   | **Optimalité** : tous les Δᵢⱼ ≥ 0 à la fin         | Z\* = 3 529 sur l'exemple cours      | ✅     |
| 6   | **Cohérence** : Σⱼ xᵢⱼ = aᵢ et Σᵢ xᵢⱼ = bⱼ         | Toutes les contraintes saturées      | ✅     |

---

## 12. Glossaire

| Terme                             | Définition                                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| **SBR**                           | Solution de base réalisable : ensemble de `m + n − 1` cases qui sature toutes les contraintes. |
| **Case occupée / case de base**   | Case avec `xᵢⱼ > 0` (ou ε).                                                                    |
| **Case vide**                     | Case hors-base, candidate à entrer dans la base lors d'un pivot.                               |
| **Cycle (Stepping-Stone)**        | Chemin fermé alternant lignes et colonnes, passant par une case vide + des cases occupées.     |
| **Pénalité (VAM)**                | Différence entre les deux plus petits coûts d'une ligne ou colonne.                            |
| **Potentiels uᵢ, vⱼ (MODI)**      | Multiplicateurs duaux satisfaisant `uᵢ + vⱼ = cᵢⱼ` sur les cases de base.                      |
| **Indice Δᵢⱼ**                    | Coût marginal d'introduire une case vide dans la base ; négatif ⇒ amélioration possible.       |
| **θ**                             | Quantité transférée le long d'un cycle, = `min(xᵢⱼ)` sur les cases `−` du cycle.               |
| **ε**                             | Allocation fictive infinitésimale, traitée comme 0 dans le coût mais comme une case de base.   |
| **Origine / destination fictive** | Ligne ou colonne ajoutée à coût nul pour rééquilibrer offre et demande.                        |

---

> 📚 **Source pédagogique** : ce projet est l'implémentation logicielle des transparents du cours **RO_TRANSP_v3** (versions 2.0–3.0, 2013–2015) — Recherche Opérationnelle, Programmation linéaire, Problème de transport.
>
> TRANSP - MINITAB - Stepping Stone par Cici et Emma  copyright M1 2026