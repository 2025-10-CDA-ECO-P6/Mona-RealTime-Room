# RealTime Room

## Brief projet
Réaliser une application web React + Express + Socket.IO permettant de rejoindre des rooms avec un pseudo et discuter en temps réel, sans base de données. Le projet met l’accent sur : architecture, intégration CSS avancée (Grid/order), industrialisation (Docker + Render dès J1), documentation (Swagger + docs), qualité (CI ESLint), sécurité light (helmet + rate limit).

## Fonctionnalité 
### Temps réel
- rejoindre une room
- quitter une room
- pseudo utilisateur
- messages instantanés

### Limites connues
- pas de persistance
- pas d’authentification
- perte des messages au reload

Ces choix sont assumés dans le cadre d’une V1.

## Monorepo PNPM
Ce projet utilise PNPM afin de :
- mutualiser les dépendances
- standardiser les scripts
- améliorer les performances d’installation
- garantir la reproductibilité

### Workspace
Le fichier pnpm-workspace.yaml définit les packages :
- api
- web

## Stack Technique 
### Frontend 
- React  
- SCSS  
- BEM  
- Mobile-first  
- CSS Grid et order  
### Backend 
- Node.js
- Express  
- Socket.IO
- Helmet
- express-rate-limit
### Industrialisation
- Docker (2 services)  
- Nginx (reverse proxy + WebSocket)
- Render
- CI GitHub Actions  
- ESLint monorepo  

## Installation 
### Prérequis
- Node.js
- PNPM
- Docker
- Git

### Cloner le projet
```bash
git clone <github.com:2025-10-CDA-ECO-P6/Mona-RealTime-Room.git>
cd mona-realtime-room
```
### Installer les dépendances
```bash
pnpm install
```

## Développement
### Lancer tous les services
```bash
pnpm -r dev
```
### Lancer individuellement
```bash
pnpm --filter api dev 
pnpm --filter web dev
```

## Docker
Deux conteneurs sont utilisés :
- API
- WEB
Chaque service possède son propre Dockerfile.

## Build local
### Image API
```bash
docker build -f api/Dockerfile -t realtime-api .
```
### Lancer le conteneur API 
```bash
docker run --rm -p 3000:3000 realtime-api
```
### Image WEB 
```bash
docker build -f web/Dockerfile -t realtime-web .
```
### Lancer le conteneur WEB 
```bash
docker run --rm -p 8080:80 realtime-web
```
### Docker Compose
```bash
docker compose up --build
```
## Sécurité (niveau light)
- Helmet activé (middleware Express headers HTTP de sécurité.)
- Rate limiting (limite le nombre de requêtes qu’un utilisateur peut envoyer en un temps donné.)
- validation longueur pseudo / room / message 
- gestion des erreurs

## Déploiement
Le projet est déployé via Render Blueprint.
[Déploiement WEB](https://realtime-web.onrender.com/)
[Déploiement API](https://realtime-api-nykk.onrender.com/health)

### Caractéristiques
- 2 services indépendants
- health check API
- reverse proxy Nginx
- support WebSocket

### SCSS 
Pour build le css : 
```bash 
pnpm -F web build
```

## Aperçu Intégration 
<div align="center">
  <img src="./docs/Homepage-Desktop.png" width="60%" alt="Homepage Desktop">
  <img src="./docs/Homepage-Mobile.png" width="14%" alt="Homepage Mobile">
</div>
