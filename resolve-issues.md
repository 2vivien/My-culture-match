# Suivi de la Conformité (SKILL_web.md) - My Culture Match Web

Ce fichier liste l'état de conformité de chaque page du projet par rapport aux règles de production strictes (limites de lignes, découpage modulaire, absence de mocks inline, préservation absolue du design).

---

## 1. AuthPage.tsx (Connexion / Inscription)
- **Fichier initial** : `myculturematch-web/src/pages/AuthPage.tsx` (326 lignes - NON CONFORME)
- **Actions réalisées** : 
  - Création de composants atomiques et modulaires sous `src/components/auth/` :
    - [AuthIllustration.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/auth/AuthIllustration.tsx) (48 lignes) — Panel gauche de branding.
    - [AuthHeader.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/auth/AuthHeader.tsx) (29 lignes) — Logo et titres adaptatifs.
    - [AuthModeSwitcher.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/auth/AuthModeSwitcher.tsx) (35 lignes) — Onglets Connexion / Inscription.
    - [AuthForm.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/auth/AuthForm.tsx) (119 lignes) — Formulaire de saisie d'authentification.
    - [AuthSocialButtons.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/auth/AuthSocialButtons.tsx) (35 lignes) — Boutons de connexion tierces Google/Apple.
    - [AuthFooter.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/auth/AuthFooter.tsx) (16 lignes) — Liens de mentions légales.
  - Refactorisation de [AuthPage.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/pages/AuthPage.tsx) à 90 lignes (CONFORME).
- **Statut final** : **CONFORME** (Design original 100% préservé).

---

## 2. OnboardingPage.tsx (Onboarding utilisateur)
- **Fichier initial** : `myculturematch-web/src/pages/OnboardingPage.tsx` (1126 lignes - NON CONFORME)
- **Actions réalisées** :
  - Création du service de données et d'helpers [onboarding.service.ts](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/services/onboarding.service.ts) (40 lignes).
  - Création du hook personnalisé [useOnboarding.ts](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/hooks/useOnboarding.ts) (90 lignes).
  - Création des composants structurels sous `src/components/onboarding/` :
    - [OnboardingStepTerms.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/onboarding/OnboardingStepTerms.tsx) (87 lignes) — Overlay des conditions d'utilisation.
    - [OnboardingHeader.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/onboarding/OnboardingHeader.tsx) (22 lignes) — En-tête avec barre de progression.
    - [OnboardingFooter.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/onboarding/OnboardingFooter.tsx) (36 lignes) — Pied de page de navigation (Retour / Continuer).
  - Découpage des 15 étapes sous `src/components/onboarding/steps/` :
    - [StepAvatar.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/onboarding/steps/StepAvatar.tsx) (105 lignes) — Saisie nom/username et preview avatar.
    - [StepRoots.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/onboarding/steps/StepRoots.tsx) (90 lignes) — Saisie de l'héritage culturel.
    - [StepRecap.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/onboarding/steps/StepRecap.tsx) (60 lignes) — Récapitulatif final de fin de parcours.
    - [StepsBasicInfo.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/onboarding/steps/StepsBasicInfo.tsx) (100 lignes) — Étapes 1 à 3.
    - [StepsRootsOccupation.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/onboarding/steps/StepsRootsOccupation.tsx) (110 lignes) — Étapes 4 à 6.
    - [StepsPreferences.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/onboarding/steps/StepsPreferences.tsx) (110 lignes) — Étapes 7 à 10.
    - [StepsDetailsRecap.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/onboarding/steps/StepsDetailsRecap.tsx) (110 lignes) — Étapes 11 à 15.
  - Refactorisation de [OnboardingPage.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/pages/OnboardingPage.tsx) à 96 lignes (CONFORME).
- **Statut final** : **CONFORME** (Design original 100% préservé).

---

## 3. SettingsPage.tsx (Paramètres utilisateur)
- **Fichier actuel** : `myculturematch-web/src/pages/SettingsPage.tsx` (500+ lignes - NON CONFORME)
- **Problèmes identifiés** :
  - Fichier trop volumineux.
  - Contient toute la gestion de l'affichage des sections (Profil, Notifications, Sécurité, etc.) ainsi que les formulaires d'édition correspondants.
- **Actions requises** :
  - Découper en sous-sections de paramètres indépendantes sous `src/components/settings/`.
- **Statut final** : **À FAIRE**.

---

## 4. ConnexionPage.tsx (Page des Connexions)
- **Fichier initial** : `myculturematch-web/src/pages/ConnexionPage.tsx` (132 lignes - CONFORME)
- **Actions réalisées** :
  - Retrait du composant StatsHeader inutile.
  - Alignement responsive (Grille de cartes pour le bureau / Liste de lignes pour le mobile).
  - Remplacement de l'ancien bouton de filtres par le style Love.
- **Statut final** : **CONFORME** (Design 100% préservé).

---

## 5. ChatPage (Dossier Messagerie)
- **Fichier principal** : `myculturematch-web/src/pages/ChatPage/index.tsx` (120 lignes - CONFORME)
- **Statut final** : **CONFORME**.
