# Veille 

## PNPM et Monorepo
Le premier point qui m’a intéressée est la gestion du monorepo. Avec PNPM, il est simple de centraliser les projets grâce au fichier pnpm-workspace.yaml. Cela permet de lancer tout le système avec une seule commande (pnpm dev).Le fichier pnpm-workspace.yaml permet de déclarer les différents packages (api et web). Cela permet de centraliser les dépendances et d’exécuter des scripts sur l’ensemble du projet, par exemple avec pnpm -r dev.

### Avantages :
PNPM installe les dépendances plus rapidement et évite de dupliquer les fichiers. Cela prend moins de place et rend les installations plus rapides.

### Fonctionnement technique : 
Contrairement à npm, PNPM n’installe pas les dépendances en les copiant dans chaque projet. Il utilise un système de store global et de liens symboliques.
Cela réduit la duplication et améliore les performances d’installation.

### Monorepo 
Dans ce projet, cela apporte plusieurs avantages :
- lancer le frontend et le backend avec une seule commande
- partager certaines configurations (ESLint, scripts, Docker)
- simplifier la CI (intégration continue)
- garder une cohérence entre les services

Cela prépare aussi le projet à une V2, par exemple avec un dossier packages pour partager les types Socket.IO entre le front et le back.

..........................................................................
## Docker 
### DockerIgnore
Sans ce fichier, Docker envoie tous les fichiers du projet, y compris les node_modules, les logs ou les fichiers sensibles comme .env. Cela ralentit les builds et peut poser des problèmes de sécurité. Il sert surtout à optimiser le contexte de build et l’environnement de production.

### Corepack
Corepack est un outil intégré dans Node.js qui permet de gérer les gestionnaires de paquets comme :
- PNPM
- Yarn

Sans devoir les installer globalement.

Corepack permet :
- d’activer PNPM ou Yarn automatiquement
- d’utiliser la bonne version
- d’éviter les installations globales.

### Multi-Stage
- Plusieurs étapes pour fabriquer le conteneur docker 
- Image finale : seulement le build   
- Multi - stage = plusieurs FROM --> chaque from = nouvelle image

**Multi-stage = fabriquer avec plein d'outils et livrer sans les outils**