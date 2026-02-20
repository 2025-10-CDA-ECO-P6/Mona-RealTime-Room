# Contributing

## 1. Objectif

Projet pédagogique simulant un environnement **startup** avec approche **production-ready dès J1**.
But : intégrer un wireframe asymétrique + chat temps réel avec industrialisation.

---

## 2. Règles générales

* Travail individuel
* Comprendre et justifier chaque choix
* Pas de copier-coller de solution complète
* Documentation obligatoire

---

## 3. Workflow Git

* `main` = stable et déployée
* `feat/*` = nouvelles fonctionnalités
* Commits clairs

Exemples :

```
feat(web): responsive layout
fix(api): validate input
```

---

## 4. Frontend

* React
* SCSS modulaire
* BEM obligatoire
* Mobile-first
* Responsive desktop
* Aucun débordement horizontal
---

## 5. Backend

* Express + Socket.IO
* Rooms + pseudo + messages
* Validation basique
* Pas de base de données

---

## 6. Docker & Déploiement

Obligatoire dès J1 :

* 2 services (`/web` et `/api`)
* Dockerfiles fonctionnels
* Nginx proxy (REST + WebSocket)
* Déploiement Render
* Endpoint `/health` accessible

---

## 7. Sécurité (light)

* Helmet
* Rate limit
* Validation des entrées

---

## 8. Documentation

Obligatoire :

* README (install, archi, prod)
* Swagger / OpenAPI
* Events Socket.IO
* VEILLE.md (Pourquoi ? alternatives ? limites ?)

---

## 9. Jalons

J1 : monorepo + Docker + Render + /health  
J2 : UI mobile-first + SCSS/BEM  
J2-3 : temps réel + sécurité + Swagger  
J3 : CI + docs complètes  

---

## 10. Qualité attendue

* Architecture claire
* UI fidèle au wireframe
* Déploiement stable
* Code propre et documenté
