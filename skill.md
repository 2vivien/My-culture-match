1️⃣ RÈGLE PRINCIPALE

Si tu copies-colles du code 2 fois → tu dois créer un composant.

Très important.

❌ Mauvais :

<div className="bg-white p-4 rounded-xl shadow">...</div>
<div className="bg-white p-4 rounded-xl shadow">...</div>

✅ Bon :

<Card>...</Card>
2️⃣ DÉCOMPOSER EN COMPOSANTS



components/
  ui/
  layout/
 
Exemple :
components/
  layout/
    Sidebar.tsx
    Header.tsx
    PageContainer.tsx

  
3️⃣ UN COMPOSANT = UNE RESPONSABILITÉ

Très important.

❌ Mauvais :
Un composant qui fait :

sidebar
header
cards
table
chart

✅ Bon :
Un composant = une chose.

Exemples :

Sidebar → navigation
Header → barre du haut
Card → carte
Table → tableau
Chart → graphique
4️⃣ PAS DE CODE TROP LONG

Règle simple :

Taille	Action
0–50 lignes	OK
50–100 lignes	Réfléchir
100+ lignes	Découper en composants

👉 Un fichier ne doit pas dépasser ~120 lignes

5️⃣ RÉUTILISER LES COMPOSANTS UI

Tu dois créer des composants génériques :

components/ui/
  Card.tsx
  Button.tsx
  Badge.tsx
  Section.tsx
  PageTitle.tsx



Comme ça tu réutilises partout.

6️⃣ PAS DE STYLES RÉPÉTÉS

Si tu vois souvent :

rounded-2xl shadow p-5 bg-white

Alors crée une classe utilitaire ou composant.

7️⃣ STRUCTURE PROJET PROPRE

Structure recommandée :

app/
  dashboard/
    page.tsx

components/
  layout/
  dashboard/
  ui/

lib/
  utils.ts

types/
  index.ts

hooks/
8️⃣ TYPESCRIPT – TRÈS IMPORTANT

Toujours typer tes props.

❌ Mauvais :

export function Card(props) { }

✅ Bon :

type CardProps = {
  title: string
  amount: string
}

export function Card({ title, amount }: CardProps) {
}
9️⃣ GESTION DES ERREURS

Toujours prévoir :

Loading
Error
Empty state

Exemple :

if (loading) return <Loading />
if (error) return <ErrorMessage />
if (!data) return <EmptyState />

Très important dans les vraies apps.

🔟 NOM DES COMPOSANTS

Toujours clair :

Mauvais	Bon
Card1	BalanceCard
Box	WalletCard
TableData	ActivityTable
Layout	DashboardLayout
1️⃣1️⃣ UTILISER DES LAYOUTS

Tu dois avoir :

DashboardLayout

Qui contient :

Sidebar
Header
Content

Très important.

1️⃣2️⃣ PAS DE LOGIQUE DANS LE JSX

❌ Mauvais :

<div>
 {user.balance > 1000 ? ...}
</div>

✅ Bon :

const isRich = user.balance > 1000

Puis dans le JSX :

{isRich && <Premium />}
1️⃣3️⃣ ANIMATIONS PROPRES

Avec Framer Motion :

Fade in cards
Hover scale
Sidebar animation
Page transition

Mais pas trop d’animations → app pro = animations subtiles.