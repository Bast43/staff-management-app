# 🚀 Démarrage Rapide - 10 Minutes Chrono

Ce guide vous permet de déployer l'application en 10 minutes.

## ⚡ En 4 étapes

### 1️⃣ Supabase (3 minutes)

1. Allez sur [supabase.com](https://supabase.com) → **Start your project**
2. Créez un projet : "staff-management"
3. Allez dans **SQL Editor** → Collez `supabase-schema.sql` → **Run**
4. Allez dans **Settings** > **API** → Copiez :
   - Project URL
   - anon public key

### 2️⃣ GitHub (2 minutes)

```bash
cd staff-management-app
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/VOTRE-USERNAME/staff-management-app.git
git push -u origin main
```

### 3️⃣ Vercel (3 minutes)

1. [vercel.com](https://vercel.com) → **Add New** > **Project**
2. Importez votre repo GitHub
3. **Environment Variables** :
   ```
   NEXT_PUBLIC_SUPABASE_URL=votre_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle
   JWT_SECRET=genere_avec_openssl_rand_base64_32
   ```
4. **Deploy** !

### 4️⃣ Tester (2 minutes)

1. Ouvrez votre URL Vercel
2. Admin : mot de passe `admin123`
3. Employé : `marie.martin@magasin.fr` / `password123`

## ✅ C'est tout !

Votre app est en ligne et accessible depuis n'importe quel appareil.

## 🔒 En production

**IMPORTANT** : Changez les mots de passe par défaut :

```sql
-- Dans Supabase SQL Editor
UPDATE users 
SET password = '$2a$10$NOUVEAU_HASH_BCRYPT'
WHERE role = 'admin';
```

Générez le hash sur [bcrypt-generator.com](https://bcrypt-generator.com/)

## 📱 Installer sur mobile

**iPhone** : Safari → Partager → Sur l'écran d'accueil  
**Android** : Chrome → Menu → Installer l'application

---

**Besoin d'aide ?** → Consultez [DEPLOYMENT.md](./DEPLOYMENT.md)
