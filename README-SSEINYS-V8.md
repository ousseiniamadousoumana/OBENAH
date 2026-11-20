# SSEINY'S V8 — Site multi-pages + Supabase

Cette version est une restructuration du ZIP V7 fourni. Les sections existantes de `index.html` ont été conservées ; les changements demandés portent sur les liens de navigation, la suppression des éléments caméléon, le bouton « Découvrir ma vision », l'ajout d'annonces, d'indicateurs et les liens vers les pages autonomes.

## Structure

- `index.html` : accueil, sections d'origine conservées, actualités, inscription communauté et indicateurs publics.
- `a-propos.html` : À propos + Biographie (une seule page).
- `services.html` : 5 services et formulaires adaptés.
- `produits.html` : tourteaux de coton, ebooks et produits numériques.
- `projets.html` : 9 projets, fiches individuelles `projet-01.html` à `projet-09.html`.
- `partenariats.html` : AL FOURKONE et SIATECH.NET + formulaire « Devenir partenaire ».
- `partenaire-al-fourkone.html` et `partenaire-siatech.html` : fiches individuelles des partenaires.
- `content_media` : images et descriptions propres à chaque fiche projet ou partenaire, ajoutées depuis l’administration par URL publique.
- `galerie.html` : galerie dynamique connectée à Supabase.
- `projets.html` : catalogue des neuf projets et formulaire de proposition.
- `mentions-legales.html` : base de mentions légales à compléter et valider.
- `404.html` : page d'erreur.
- `admin/index.html` : portail administrateur.
- `assets/css/style.css` et `assets/js/main.js` : styles et scripts séparés.
- `supabase/schema.sql` : tables, RLS, vues statistiques.

## Installation Supabase

1. Créer un projet Supabase.
2. Ouvrir SQL Editor et exécuter `supabase/schema.sql`.
3. Dans Authentication > Users, créer ton compte administrateur avec ton adresse e-mail et un mot de passe fort.
4. Dans SQL Editor, remplacer `ADMIN_USER_UUID` par l'UUID exact de ce compte puis exécuter :

```sql
insert into public.user_roles(user_id, role)
values ('ADMIN_USER_UUID', 'admin')
on conflict (user_id) do update set role='admin';
```

5. Dans Project Settings > API, copier l'URL du projet et la clé anon/publishable.
6. Renseigner ces valeurs dans `assets/js/supabase-config.js` :

```js
window.SSEINYS_SUPABASE_URL = "https://xxxx.supabase.co";
window.SSEINYS_SUPABASE_ANON_KEY = "sb_publishable_..."; // ou clé anon legacy
```

Ne jamais mettre la clé `service_role` dans le site ou GitHub.

7. Déployer le dossier à la racine du dépôt GitHub connecté à Vercel. Projet statique : aucun `npm run build` n'est nécessaire. Dans Vercel, Framework Preset = Other, Build Command vide, Output Directory `.`.

## Commandes et WhatsApp

Les formulaires créent une ligne dans `orders` lorsque Supabase est configuré, puis ouvrent WhatsApp avec un récapitulatif prérempli. Numéro actuellement utilisé : `+229 01 50 22 80 50` (format international sans espaces dans le lien). Le numéro peut être modifié dans `assets/js/supabase-config.js`.

Une demande n'est pas un paiement confirmé. Les statuts de commande sont gérés dans l'administration. La confirmation d'un transfert mobile money est manuelle tant qu'une API officielle de paiement n'est pas intégrée.

## Annonces et membres

Les visiteurs peuvent s'inscrire à la liste communautaire. Les annonces publiées sont affichées sur l'accueil et synchronisées en temps réel pour les personnes qui consultent le site. Les notifications navigateur nécessitent l'autorisation du visiteur. L'envoi de notifications push aux visiteurs hors ligne (site fermé) nécessite une étape supplémentaire : service worker, clés VAPID et fonction Edge / fournisseur push. Cette étape n'est pas activée par défaut.

## Statistiques

Les vues `admin_analytics_daily`, `admin_analytics_monthly` et `admin_analytics_yearly` donnent les volumes réels de visites, commandes et commandes payées/terminées. Le tableau de bord actuel montre les compteurs par période et les commandes récentes. Le chiffre d'affaires monétaire nécessite un champ montant validé et un flux de confirmation de paiement ; aucun revenu n'est inventé. La page d'accueil utilise la fonction RPC `public_home_stats` pour afficher uniquement des totaux agrégés, sans exposer les données des clients.

## Logos des moyens de paiement

Les six moyens sont affichés avec des monogrammes colorés et animés dans les formulaires. Ils ne sont pas présentés comme des fichiers de logos officiels. Pour intégrer les logos officiels exacts, fournir les fichiers SVG/PNG autorisés de Mynita et Amanata, et les logos validés des autres opérateurs.

## Limites / tâches de finalisation

- Vérifier le numéro WhatsApp et les coordonnées avant publication.
- Compléter les tarifs, photos et disponibilités des produits.
- Ajouter les vraies photos de projets et galerie.
- Compléter les présentations AL FOURKONE et SIATECH.NET avec des informations validées.
- Configurer Storage si les images doivent être téléversées directement depuis le portail. Le formulaire admin actuel accepte une URL publique et classe chaque image dans la fiche projet ou partenaire sélectionnée.
- Ajouter un mécanisme de vérification des paiements avant de marquer une commande « payée ».
- Pour les services crypto et fintech, valider la conformité réglementaire et les procédures KYC/AML applicables avant toute opération réelle.

## Sécurité

La clé navigateur est une clé publique anon/publishable. La protection des données dépend des politiques RLS de `schema.sql`. Le rôle admin est attribué côté base de données et vérifié après connexion. Ne jamais exposer la clé service_role, les mots de passe ou les secrets dans les fichiers du dépôt.
