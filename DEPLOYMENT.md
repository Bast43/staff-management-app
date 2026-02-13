# Guide de Déploiement - Application Gestion du Personnel

## 📋 Prérequis

- Compte GitHub
- Compte Vercel (gratuit)
- Compte Supabase (gratuit)
- Node.js 18+ installé localement

---

## 🗄️ ÉTAPE 1 : Configuration Supabase

### 1.1 Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Cliquez sur "Start your project"
3. Créez une nouvelle organisation si nécessaire
4. Créez un nouveau projet :
   - **Name**: staff-management
   - **Database Password**: Choisissez un mot de passe fort
   - **Region**: Europe West (London) - le plus proche
5. Attendez que le projet soit créé (~2 minutes)

### 1.2 Créer les tables

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Cliquez sur "New query"
3. Copiez-collez le contenu du fichier `supabase-schema.sql`
4. Cliquez sur "Run" pour exécuter
5. Vérifiez dans **Table Editor** que toutes les tables sont créées :
   - stores
   - users
   - attendance
   - leave_requests

### 1.3 Récupérer les clés API

1. Allez dans **Project Settings** > **API**
2. Notez les valeurs suivantes :
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGci...` (longue clé)

### 1.4 Désactiver RLS temporairement (dev uniquement)

Pour simplifier le développement initial, désactivez RLS :

1. Allez dans **Authentication** > **Policies**
2. Pour chaque table (stores, users, attendance, leave_requests) :
   - Désactivez "Enable RLS"

**⚠️ IMPORTANT** : En production, vous devez activer et configurer RLS !

---

## 🚀 ÉTAPE 2 : Déploiement sur Vercel

### 2.1 Préparer le repository GitHub

```bash
cd staff-management-app
git init
git add .
git commit -m "Initial commit"
gh repo create staff-management-app --public --source=. --remote=origin --push
# Ou utilisez l'interface GitHub pour créer le repo
```

### 2.2 Connecter à Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur "Add New..." > "Project"
3. Importez votre repository GitHub
4. Configuration du projet :
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 2.3 Configurer les variables d'environnement

Dans Vercel, allez dans **Settings** > **Environment Variables** et ajoutez :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
JWT_SECRET=votre_secret_jwt_genere
NEXT_PUBLIC_APP_URL=https://votre-app.vercel.app
```

**Générer un JWT_SECRET** :
```bash
openssl rand -base64 32
```

### 2.4 Déployer

1. Cliquez sur "Deploy"
2. Attendez que le déploiement se termine (~2 minutes)
3. Votre app sera disponible sur `https://votre-app.vercel.app`

---

## 🧪 ÉTAPE 3 : Test de l'application

### 3.1 Connexion Admin

1. Allez sur votre URL Vercel
2. Cliquez sur l'onglet "Admin"
3. Entrez le mot de passe : `admin123`
4. Vous devriez voir le tableau de bord admin

### 3.2 Connexion Employé

1. Retournez à la page de connexion
2. Onglet "Employé"
3. Email: `marie.martin@magasin.fr`
4. Mot de passe: `password123`
5. Vous devriez voir le tableau de bord employé

### 3.3 Tester les fonctionnalités

#### Admin :
- ✅ Voir tous les magasins
- ✅ Voir tous les employés
- ✅ Modifier une présence
- ✅ Valider une demande de congé

#### Employé :
- ✅ Voir son solde de congés
- ✅ Demander un congé
- ✅ Voir le planning de l'équipe

---

## 🔧 ÉTAPE 4 : Configuration avancée

### 4.1 Domaine personnalisé (optionnel)

Dans Vercel :
1. **Settings** > **Domains**
2. Ajoutez votre domaine
3. Suivez les instructions DNS

### 4.2 Activer HTTPS (automatique sur Vercel)

Vercel active automatiquement HTTPS avec Let's Encrypt.

### 4.3 Activer les PWA

Le fichier `manifest.json` est déjà configuré. Pour une vraie PWA :

```bash
npm install next-pwa
```

Puis configurez dans `next.config.js`.

---

## 🛡️ ÉTAPE 5 : Sécurité Production

### 5.1 Activer RLS sur Supabase

Pour chaque table, créez des politiques :

**Exemple pour `users` :**
```sql
-- Politique : Admin peut tout voir
CREATE POLICY "Admin can view all users"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Politique : Employé peut voir son profil et collègues
CREATE POLICY "Employee can view own store"
ON users FOR SELECT
USING (
  id = auth.uid() OR 
  store_id IN (
    SELECT store_id FROM users WHERE id = auth.uid()
  )
);
```

### 5.2 Changer les mots de passe par défaut

Dans Supabase SQL Editor :

```sql
-- Générer un hash bcrypt pour un nouveau mot de passe
-- Utilisez https://bcrypt-generator.com/

-- Changer le mot de passe admin
UPDATE users 
SET password = '$2a$10$NOUVEAU_HASH'
WHERE role = 'admin';

-- Changer les mots de passe employés
UPDATE users 
SET password = '$2a$10$NOUVEAU_HASH'
WHERE email = 'marie.martin@magasin.fr';
```

### 5.3 Limiter les tentatives de connexion

Ajoutez un rate limiting dans les routes API (à implémenter).

---

## 📱 ÉTAPE 6 : Installation Mobile (PWA)

### Sur iPhone :
1. Ouvrez Safari
2. Allez sur votre URL
3. Appuyez sur le bouton "Partager"
4. Sélectionnez "Sur l'écran d'accueil"

### Sur Android :
1. Ouvrez Chrome
2. Allez sur votre URL
3. Menu (3 points) > "Installer l'application"

---

## 🐛 Dépannage

### Erreur : "Cannot find module"
```bash
npm install
npm run build
```

### Erreur : "Database connection failed"
- Vérifiez les variables d'environnement dans Vercel
- Vérifiez que le projet Supabase est actif

### Erreur : "Invalid JWT token"
- Régénérez un JWT_SECRET
- Redéployez sur Vercel

### Les données ne se chargent pas
- Vérifiez que RLS est désactivé (dev) ou correctement configuré (prod)
- Vérifiez les logs Supabase

---

## 📊 Monitoring

### Logs Vercel
- Allez dans votre projet > **Deployments** > Cliquez sur un déploiement > **Functions**

### Logs Supabase
- Allez dans votre projet > **Database** > **Logs**

### Analytics
Vercel fournit des analytics gratuites :
- **Analytics** > Voir les visiteurs, pages vues, etc.

---

## 🔄 Mises à jour

Pour déployer une nouvelle version :

```bash
git add .
git commit -m "Description des changements"
git push origin main
```

Vercel redéploie automatiquement !

---

## 💰 Coûts

### Gratuit :
- Vercel : 100 GB de bande passante/mois
- Supabase : 500 MB de base de données, 50,000 requêtes/mois

### Si vous dépassez :
- Vercel Pro : 20$/mois
- Supabase Pro : 25$/mois

---

## 📞 Support

En cas de problème :
1. Vérifiez les logs Vercel et Supabase
2. Consultez la documentation :
   - [Vercel Docs](https://vercel.com/docs)
   - [Supabase Docs](https://supabase.com/docs)
3. Vérifiez que toutes les variables d'environnement sont correctes

---

## ✅ Checklist de déploiement

- [ ] Projet Supabase créé
- [ ] Tables créées avec supabase-schema.sql
- [ ] Données de test insérées
- [ ] Clés API Supabase récupérées
- [ ] Repository GitHub créé et pushé
- [ ] Projet Vercel créé et connecté
- [ ] Variables d'environnement configurées
- [ ] Application déployée avec succès
- [ ] Test de connexion admin réussi
- [ ] Test de connexion employé réussi
- [ ] Mots de passe par défaut changés (production)
- [ ] RLS configuré (production)
- [ ] Domaine personnalisé configuré (optionnel)

---

**Félicitations ! Votre application est maintenant en ligne ! 🎉**
