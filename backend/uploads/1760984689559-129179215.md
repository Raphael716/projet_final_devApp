# 🚀 Projet Final - Développement d’Applications

Ce projet est une base complète pour un pipeline logiciel comprenant :
- **Backend** (Node.js / Express / Prisma / MySQL)
- **Frontend SPL** (React + Vite + React Router DOM v7)
- Gestion de l’authentification (login / signup) avec context global
- Interface moderne avec un thème violet/bleu

---

## 📦 Installation

Clonez le projet depuis GitHub :

```bash
git clone https://github.com/Raphael716/projet_final_devApp.git
cd projet_final_devApp
```

Ensuite, installez toutes les dépendances (racine, frontend et backend) en une seule commande :

```bash
npm run install:all
```

---

## ⚙️ Commandes disponibles

### Lancer le projet en mode développement
```bash
npm run dev
```
➡️ Lance **en parallèle** le backend et le frontend (avec `concurrently`).  
- **Backend** : exécuté dans `./backend`  
- **Frontend SPL** : exécuté dans `./SPL`

Les processus sont colorés en **vert** (BACKEND) et **bleu** (SPL) dans la console.

---

### Installer toutes les dépendances
```bash
npm run install:all
```
➡️ Installe automatiquement :
- les dépendances du projet racine  
- les dépendances du frontend `SPL` (et ajoute `@types/react-router-dom`)  
- les dépendances du backend  

---

### Lancer le projet
```bash
npm run dev
```
Lancez le projet en une seule commande.

---

## 📂 Structure du projet

```
projet_final_devapp/
│── backend/       # API Node.js (Express + Prisma + MySQL)
│── SPL/           # Frontend React (Vite + React Router DOM v7)
│── package.json   # Scripts de gestion racine
│── README.md
```

---

## 🛠️ Technologies principales

- **Frontend** : React 18, Vite, React Router DOM v7  
- **Backend** : Node.js, Express, Prisma, MySQL  
- **Outils** : concurrently (lancer plusieurs services en parallèle)  

---

## 🐞 Bugs et issues

Si vous trouvez un bug, merci d’ouvrir une issue sur GitHub :  
👉 [Issues du projet](https://github.com/Raphael716/projet_final_devApp/issues)

---

## 📜 Licence

Projet sous licence **ISC**.
