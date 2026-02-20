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
### Homepage
<div align="center">
  <img src="./docs/Homepage-Desktop.png" width="60%" alt="Homepage Desktop">
  <img src="./docs/Homepage-Mobile.png" width="14%" alt="Homepage Mobile">
</div>

### Chatpage 
<div align="center">
  <img src="./docs/Chatpage-Desktop.png" width="60%" alt="Chatpage Desktop">
  <img src="./docs/Chatpage-Mobile.png" width="14%" alt="Chatpage Mobile">
</div>

## Backend
### Helmet
Le middleware Helmet est utilisé pour renforcer la sécurité de l’API Express en ajoutant automatiquement plusieurs en-têtes HTTP de protection :
- Protection contre certaines attaques XSS  
- Prévention du clickjacking  
- Sécurisation du type de contenu  
- Gestion du referrer et des politiques de navigation  

Pour test :   
```bash
curl -I http://localhost:3000/health
```

```bash
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 15
ETag: W/"f-VaSQ4oDUiZblZNAEkkN+sX+q3Sg"
Date: Fri, 20 Feb 2026 13:35:36 GMT
Connection: keep-alive
Keep-Alive: timeout=5
```

### Rate Limit
Permet de limite le nombre de request (evite spam et attaques DoS): 
``` js
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requêtes
});
```
Pour tester : 
``` bash
for i in {1..200}; do curl http://localhost:3000/health; done
```