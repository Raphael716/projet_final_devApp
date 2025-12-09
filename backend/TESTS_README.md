# Tests Backend - Guide Complet

## Vue d'ensemble

Le projet backend contient **3 types de tests** comme défini dans sprint3:

1. **Tests Unitaires** - Testent les fonctions isolées avec mocks
2. **Tests d'Intégration** - Testent avec une vraie base de données SQLite
3. **Tests End-to-End** - À implémenter (API HTTP complète)

## Structure des tests

```
backend/src/tests/
├── userController.test.js                    # Tests unitaires (avec skips)
├── userController.integration.test.js        # Tests d'intégration (vraie DB)
├── buildController.test.js                   # Tests unitaires (avec skips)
├── buildController.integration.test.js       # Tests d'intégration (vraie DB)
├── middleware.test.js                        # Tests unitaires (avec skips)
├── authMiddleware.integration.test.js        # Tests d'intégration auth
├── example.test.js                           # Test santé
└── setup.js                                  # Configuration globale mocks
```

## Installation & Configuration

### 1. Installer les dépendances

```bash
cd backend
npm install
```

`dotenv` est déjà installé et utilisé pour charger `.env.test`

### 2. Configuration des variables d'environnement

**`.env`** (Production/Développement)

```dotenv
DATABASE_URL="mysql://user:password@82.153.202.148:3306/s13_spl"
JWT_SECRET="super_secret"
PORT=4000
```

**`.env.test`** (Tests d'intégration avec SQLite)

```dotenv
DATABASE_URL="file:./test.db"
JWT_SECRET="test_secret"
PORT=4001
```

### 3. Préparation de la base de données pour les tests

Pour les tests d'intégration, Prisma génère automatiquement le schéma SQLite:

```bash
# Les tests d'intégration créent/détruisent la DB automatiquement
npm run test:integration
```

## Exécution des tests

### Tous les tests (unitaires + intégration)

```bash
npm test
# ou
npm run test:all
```

### Seulement tests unitaires

```bash
npm run test:unit
```

### Seulement tests d'intégration

```bash
npm run test:integration
```

### Tests unitaires en mode watch

```bash
npx vitest --exclude '**/*.integration.test.js'
```

## Description des tests

### Tests Unitaires (`.test.js`)

**userController.test.js** - SKIPPED (6 tests)

- getAllUsers ⏭️
- registerUser ⏭️
- loginUser ⏭️
- deleteUser ⏭️
- Raison: PrismaClient se connecte à la vraie DB au chargement du module (limitation CommonJS)

**buildController.test.js** - SKIPPED (3 tests)

- getBuilds ⏭️
- createBuild ⏭️
- addVersion ⏭️
- Raison: Même limitation que userController

**middleware.test.js** - SKIPPED (3 tests)

- protect (sans header) ⏭️
- adminOnly (admin) ⏭️
- adminOnly (non-admin) ⏭️
- Raison: Même limitation que les controllers

**example.test.js** - PASSING ✅

- Test sanité simple: `1 + 1 = 2`

**Raison des skips**:
Les controllers utilisent CommonJS et instantient `new PrismaClient()` au niveau du module:

```javascript
// userController.js ligne 5
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient(); // ← Ceci s'exécute AVANT que Vitest puisse intercepter
```

Vitest ne peut pas mocker une instantiation qui s'est déjà produite. La solution proper serait:

- Refactorer vers l'injection de dépendances
- Ou convertir en modules ES avec imports lazy

Pour cette raison, les tests unitaires sont skippés et remplacés par des tests d'intégration.

### Tests d'Intégration (`.integration.test.js`)

Ces tests utilisent une vraie base de données SQLite et testent les fonctionnalités complètes.

**userController.integration.test.js** ✅

- getAllUsers
  - ✓ Retourne liste vide au démarrage
  - ✓ Retourne tous les utilisateurs créés
- registerUser
  - ✓ Enregistre un nouvel utilisateur
  - ✓ Rejette si email existe déjà
  - ✓ Hash le mot de passe avant enregistrement
- loginUser
  - ✓ Connecte un utilisateur avec bonnes identifiants
  - ✓ Rejette avec mauvais mot de passe
  - ✓ Rejette si utilisateur n'existe pas
- deleteUser
  - ✓ Supprime un utilisateur existant
  - ✓ Retourne erreur si utilisateur n'existe pas

**buildController.integration.test.js** ✅

- getBuilds
  - ✓ Retourne liste vide au démarrage
  - ✓ Retourne tous les builds créés
- createBuild
  - ✓ Crée un nouveau build
  - ✓ Valeurs par défaut pour champs non fournis
- getBuildById
  - ✓ Retourne un build par son ID
  - ✓ Retourne 404 si build n'existe pas
- updateBuild
  - ✓ Met à jour les propriétés d'un build
- deleteBuild
  - ✓ Supprime un build existant
  - ✓ Supprime aussi les assets (cascade)
- addVersion
  - ✓ Ajoute une nouvelle version à un build
  - ✓ Retourne 404 si build n'existe pas

**authMiddleware.integration.test.js** ✅

- protect middleware
  - ✓ Bloque sans header Authorization
  - ✓ Bloque avec header mal formé
  - ✓ Bloque avec token invalide
  - ✓ Bloque si utilisateur n'existe pas en DB
  - ✓ Permet accès avec token valide
  - ✓ Charge les données correctes de l'utilisateur
  - ✓ Gère les tokens expirés
- adminOnly middleware
  - ✓ Laisse passer un administrateur
  - ✓ Bloque un utilisateur non-admin
  - ✓ Bloque si req.user est undefined
  - ✓ Accepte admin=1 (nombre) ou admin=true (booléen)
- Combinaison protect + adminOnly
  - ✓ Bloque accès admin sans authentification
  - ✓ Bloque accès admin pour user non-admin
  - ✓ Accepte accès admin pour administrateur authentifié

## Nettoyage automatique

Tous les tests d'intégration:

- **beforeEach**: Nettoient la DB avant chaque test
- **afterAll**: Nettoient complètement à la fin et déconnectent Prisma

Ceci garantit que:

- Les tests sont isolés les uns des autres
- Pas de données résiduelles entre les tests
- Pas de fuites de mémoire Prisma

## Résultats attendus

### npm run test:unit

```
✅ example.test.js - 1 test
⏭️ buildController.test.js - 3 skipped
⏭️ userController.test.js - 6 skipped
⏭️ middleware.test.js - 3 skipped

TOTAL: 1 passed, 12 skipped
```

### npm run test:integration

```
✅ userController.integration.test.js - 8 tests
✅ buildController.integration.test.js - 11 tests
✅ authMiddleware.integration.test.js - 14 tests

TOTAL: 33 tests passed
```

### npm test (tous les tests)

```
✅ example.test.js - 1 test
✅ userController.integration.test.js - 8 tests
✅ buildController.integration.test.js - 11 tests
✅ authMiddleware.integration.test.js - 14 tests
⏭️ buildController.test.js - 3 skipped
⏭️ userController.test.js - 6 skipped
⏭️ middleware.test.js - 3 skipped

TOTAL: 34 passed, 12 skipped
```

## CI/CD Integration

Le fichier `.github/workflows/ci.yml` a été modifié pour:

1. Créer une base SQLite de test
2. Exécuter les migrations Prisma
3. Lancer `npm test` (qui inclut les tests d'intégration)

```yaml
- name: Setup Database (SQLite)
  run: |
    cd backend
    npx prisma migrate dev --name init

- name: Test Backend
  run: |
    cd backend
    npm test
  env:
    DATABASE_URL: "file:./dev.db"
```

## Prochaines étapes

### 1. Tests End-to-End (E2E)

À implémenter avec un framework comme Playwright ou Cypress pour tester les endpoints HTTP complets.

### 2. Refactorisation future

Si vous souhaitez que les tests unitaires fonctionnent:

- Convertir les controllers en ES modules avec imports lazy
- Ou implémenter l'injection de dépendances

### 3. Tests du frontend (SPL)

Les tests frontend utilisent `@testing-library/react` et sont exécutés avec `npm test` dans le dossier SPL.

## Dépannage

### Erreur: "Can't reach database server"

- **Unitaires**: C'est normal, c'est pourquoi ils sont skipped
- **Intégration**: Vérifier que SQLite est disponible et `.env.test` est correct

### Erreur: "Database needs migration"

```bash
cd backend
npx prisma migrate dev
```

### Erreur: "PrismaClient not initialized"

Vérifier que `.env.test` existe et contient `DATABASE_URL`

### Tests très lents

- Les tests d'intégration sont plus lents (connexions DB réelles)
- C'est normal et accepté pour la qualité

## Structure résumée

```
Unitaires (rapides, mocks)
├─ Skipped (CommonJS limitation)
└─ 1 passing (example)

Intégration (plus lents, vraie DB)
├─ userController: 8 tests
├─ buildController: 11 tests
└─ authMiddleware: 14 tests
```

Les tests d'intégration remplacent fonctionnellement les tests unitaires pour les controllers/middleware, en testant contre une vraie base de données SQLite.
