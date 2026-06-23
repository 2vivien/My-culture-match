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
- **Fichier initial** : `myculturematch-web/src/pages/SettingsPage.tsx` (488 lignes - NON CONFORME)
- **Actions réalisées** : 
  - Délocalisation des valeurs par défaut dans le mock [settings.json](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/mocks/settings.json).
  - Création du type [settings.ts](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/types/settings.ts) et du service [settingsService.ts](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/services/settingsService.ts).
  - Création du hook personnalisé [useSettings.ts](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/hooks/useSettings.ts) (80 lignes) pour gérer dynamiquement les changements.
  - Création de composants modulaires sous `src/components/settings/` :
    - [SettingsHeader.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/settings/SettingsHeader.tsx) (11 lignes) — Titre et icône.
    - [SettingsTabs.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/settings/SettingsTabs.tsx) (38 lignes) — Barre d'onglets de navigation.
    - Sous `src/components/settings/rows/` :
      - [EmailRow.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/settings/rows/EmailRow.tsx) (49 lignes) — Ligne d'édition de l'email.
      - [GenderRow.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/settings/rows/GenderRow.tsx) (48 lignes) — Sélection du genre.
      - [LocationRow.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/settings/rows/LocationRow.tsx) (48 lignes) — Paramètres de localisation.
      - [ConnectionRow.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/settings/rows/ConnectionRow.tsx) (40 lignes) — Toggles d'intégration Google/Apple.
      - [TwoFactorRow.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/settings/rows/TwoFactorRow.tsx) (38 lignes) — Interrupteur 2FA.
      - [ToggleRow.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/settings/rows/ToggleRow.tsx) (35 lignes) — Interrupteurs de paramètres génériques.
    - Sous `src/components/settings/sections/` :
      - [AccountGeneral.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/settings/sections/AccountGeneral.tsx) (45 lignes) — Section générale de compte.
      - [AccountAuth.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/settings/sections/AccountAuth.tsx) (46 lignes) — Section d'authentification tiers et sécurité.
      - [ProfileSection.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/settings/sections/ProfileSection.tsx) (43 lignes) — Informations de profil public.
      - [PrivacySection.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/settings/sections/PrivacySection.tsx) (40 lignes) — Paramètres de visibilité.
      - [PreferencesSection.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/settings/sections/PreferencesSection.tsx) (46 lignes) — Choix de langue et d'affichage.
      - [NotificationsSection.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/settings/sections/NotificationsSection.tsx) (37 lignes) — Préférences des notifications push.
      - [EmailSection.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/settings/sections/EmailSection.tsx) (29 lignes) — Préférences d'email.
  - Refactorisation de [SettingsPage.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/pages/SettingsPage.tsx) à 36 lignes (CONFORME).
- **Statut final** : **CONFORME** (Design original 100% préservé).

---

## 4. ConnexionPage.tsx (Page des Connexions)
- **Fichier initial** : `myculturematch-web/src/pages/ConnexionPage.tsx` (212 lignes - NON CONFORME)
- **Actions réalisées** :
  - Création de composants modulaires de recherche et d'onglets sous `src/components/connections/` :
    - [ConnectionsSearch.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/connections/ConnectionsSearch.tsx) (54 lignes) — Champ de recherche et bouton de filtres.
    - Sous `src/components/connections/tabs/` :
      - [SuggestionsTab.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/connections/tabs/SuggestionsTab.tsx) (38 lignes) — Liste des suggestions (desktop & mobile).
      - [InterestedTab.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/connections/tabs/InterestedTab.tsx) (29 lignes) — Liste des visites de profils.
      - [DemandesTab.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/connections/tabs/DemandesTab.tsx) (44 lignes) — Liste des demandes reçues (desktop & mobile).
      - [CompagnonsTab.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/connections/tabs/CompagnonsTab.tsx) (29 lignes) — Liste des compagnons actifs.
      - [ConnectionsEmptyState.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/connections/tabs/ConnectionsEmptyState.tsx) (41 lignes) — Écran vide pour les résultats de recherche.
  - Refactorisation de [ConnexionPage.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/pages/ConnexionPage.tsx) à 75 lignes (CONFORME).
- **Statut final** : **CONFORME** (Design 100% préservé).

---

## 5. ChatPage (Dossier Messagerie)
- **Fichier principal** : `myculturematch-web/src/pages/ChatPage/index.tsx` (120 lignes - CONFORME)
- **Statut final** : **CONFORME**.

---

## 6. ExploreColumn.tsx (Onglet Explore)
- **Fichier initial** : `myculturematch-web/src/components/explore/ExploreColumn.tsx` (785 lignes - NON CONFORME)
- **Actions réalisées** :
  - Création du mock [explore.json](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/mocks/explore.json) pour délocaliser les données.
  - Création du type [explore.ts](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/types/explore.ts) et du hook [useExplore.ts](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/hooks/useExplore.ts).
  - Création de composants modulaires sous `src/components/explore/` :
    - [ExploreHeader.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/explore/ExploreHeader.tsx) (33 lignes)
    - [ExploreTabs.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/explore/ExploreTabs.tsx) (44 lignes)
    - [ExploreCategories.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/explore/ExploreCategories.tsx) (48 lignes)
    - [TribeCard.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/explore/TribeCard.tsx) (56 lignes)
    - [ExploreTribesTab.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/explore/ExploreTribesTab.tsx) (63 lignes)
    - [ExploreConnectionsTab.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/explore/ExploreConnectionsTab.tsx) (45 lignes)
    - [ExploreImagesTab.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/explore/ExploreImagesTab.tsx) (53 lignes)
    - [ExploreVideosTab.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/explore/ExploreVideosTab.tsx) (56 lignes)
    - [ExploreLightbox.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/explore/ExploreLightbox.tsx) (56 lignes)
  - Refactorisation de [ExploreColumn.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/explore/ExploreColumn.tsx) à 80 lignes (CONFORME).
- **Statut final** : **CONFORME**.

---

## 7. LoveColumn.tsx (Matchmaker Love)
- **Fichier initial** : `myculturematch-web/src/components/explore/LoveColumn.tsx` (568 lignes - NON CONFORME)
- **Actions réalisées** :
  - Délocalisation des données dans [love.json](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/mocks/love.json).
  - Création du type [love.ts](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/types/love.ts) et du service [loveService.ts](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/services/loveService.ts).
  - Création du hook [useLove.ts](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/hooks/useLove.ts).
  - Création de composants modulaires de présentation :
    - [LoveHeader.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/love/LoveHeader.tsx) (42 lignes)
    - [LoveActiveMatches.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/love/LoveActiveMatches.tsx) (36 lignes)
    - [LoveCard.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/love/LoveCard.tsx) (112 lignes)
    - [LoveMatchCelebrate.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/love/LoveMatchCelebrate.tsx) (58 lignes)
    - [LoveDetailModal.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/explore/LoveDetailModal.tsx) (90 lignes)
  - Refactorisation de [LoveColumn.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/explore/LoveColumn.tsx) à 110 lignes (CONFORME).
- **Statut final** : **CONFORME**.

---

## 8. TotemProfile.tsx (Profil Totem)
- **Fichier initial** : `myculturematch-web/src/components/totem/TotemProfile.tsx` (479 lignes - NON CONFORME)
- **Actions réalisées** :
  - Ajout des statistiques dynamiques des compagnons, intéressés et traditions de l'utilisateur à partir du mock [users.json](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/mocks/users.json).
  - Correction de l'affichage de l'avatar [TotemAvatar.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/ui/TotemAvatar.tsx) en mode `glow="none"` pour remplir la forme sans bordure ni contour.
  - Création du hook personnalisé [useTotemProfile.ts](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/hooks/useTotemProfile.ts).
  - Découpage en composants modulaires de présentation sous `src/components/totem/` :
    - [ProfileHeader.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/totem/ProfileHeader.tsx) (90 lignes)
    - [ProfileTabs.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/totem/ProfileTabs.tsx) (41 lignes)
    - Sous-onglets de profil sous `src/components/totem/tabs/` :
      - [AboutTab.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/totem/tabs/AboutTab.tsx) (60 lignes)
      - [TraditionsTab.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/totem/tabs/TraditionsTab.tsx) (60 lignes)
      - [PhotosTab.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/totem/tabs/PhotosTab.tsx) (41 lignes)
      - [VideosTab.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/totem/tabs/VideosTab.tsx) (35 lignes)
      - [SavesTab.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/totem/tabs/SavesTab.tsx) (29 lignes)
      - [PostsTab.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/totem/tabs/PostsTab.tsx) (35 lignes)
  - Refactorisation de [TotemProfile.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/totem/TotemProfile.tsx) à 90 lignes (CONFORME).
- **Statut final** : **CONFORME**.


---

## 9. TribuDetailView.tsx (Vue Détails Tribu)
- **Fichier initial** : `myculturematch-web/src/components/explore/TribuDetailView.tsx` (487 lignes - NON CONFORME)
- **Actions réalisées** :
  - Délocalisation de toutes les données statiques dans [tribu.json](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/mocks/tribu.json).
  - Création du type [tribu.ts](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/types/tribu.ts) et du service [tribuService.ts](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/services/tribuService.ts).
  - Création du hook [useTribu.ts](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/hooks/useTribu.ts) pour centraliser les filtres de tri, upvotes et soumissions de commentaires.
  - Création de composants modulaires de présentation sous `src/components/tribu/` :
    - [TribuHeader.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/tribu/TribuHeader.tsx) (78 lignes)
    - [TribuPostCard.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/tribu/TribuPostCard.tsx) (179 lignes)
    - [TribuAbout.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/tribu/TribuAbout.tsx) (37 lignes)
    - [TribuRules.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/tribu/TribuRules.tsx) (38 lignes)
    - [TribuMods.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/tribu/TribuMods.tsx) (27 lignes)
  - Refactorisation de [TribuDetailView.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/explore/TribuDetailView.tsx) à 115 lignes (CONFORME).
- **Statut final** : **CONFORME**.

---

## 10. CreateTraditionView.tsx (Création de Tradition)
- **Fichier initial** : `myculturematch-web/src/components/feed/CreateTraditionView.tsx` (228 lignes - NON CONFORME)
- **Actions réalisées** :
  - Délocalisation des données et options des tribus dans [createTradition.json](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/mocks/createTradition.json).
  - Création du type [createTradition.ts](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/types/createTradition.ts) et du service [traditionService.ts](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/services/traditionService.ts).
  - Création du hook [useCreateTradition.ts](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/hooks/useCreateTradition.ts).
  - Création de composants modulaires de présentation sous `src/components/create-tradition/` :
    - [CreateTraditionHeader.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/create-tradition/CreateTraditionHeader.tsx) (14 lignes)
    - [TribuSelector.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/create-tradition/TribuSelector.tsx) (63 lignes)
    - [CreateTraditionTabs.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/create-tradition/CreateTraditionTabs.tsx) (41 lignes)
    - [CreateTraditionTextForm.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/create-tradition/CreateTraditionTextForm.tsx) (85 lignes)
    - [CreateTraditionMediaForm.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/create-tradition/CreateTraditionMediaForm.tsx) (53 lignes)
    - [CreateTraditionLinkForm.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/create-tradition/CreateTraditionLinkForm.tsx) (35 lignes)
  - Refactorisation de [CreateTraditionView.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/feed/CreateTraditionView.tsx) à 75 lignes (CONFORME).
- **Statut final** : **CONFORME**.

---

## 11. NotificationDropdown.tsx (Dropdown de notifications)
- **Fichier initial** : `myculturematch-web/src/components/layout/parts/NotificationDropdown.tsx` (255 lignes - NON CONFORME)
- **Actions réalisées** :
  - Délocalisation des notifications dans le mock [notifications.json](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/mocks/notifications.json).
  - Création du type [notification.ts](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/types/notification.ts) et du service [notificationService.ts](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/services/notificationService.ts).
  - Création du hook personnalisé [useNotifications.ts](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/hooks/useNotifications.ts).
  - Découpage en composants modulaires présentations sous `src/components/layout/parts/` :
    - [NotificationHeader.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/layout/parts/NotificationHeader.tsx) (37 lignes)
    - [NotificationItemView.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/layout/parts/NotificationItemView.tsx) (95 lignes)
    - [NotificationFooter.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/layout/parts/NotificationFooter.tsx) (23 lignes)
  - Refactorisation de [NotificationDropdown.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/layout/parts/NotificationDropdown.tsx) à 45 lignes (CONFORME).
- **Statut final** : **CONFORME**.

---

## 12. CreateTribeModal.tsx (Modal de création de tribu)
- **Fichier initial** : `myculturematch-web/src/components/explore/CreateTribeModal.tsx` (401 lignes - NON CONFORME)
- **Actions réalisées** :
  - Délocalisation de la liste statique des thématiques dans le mock [createTribe.json](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/mocks/createTribe.json).
  - Création du type [createTribe.ts](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/types/createTribe.ts) et du service [createTribeService.ts](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/services/createTribeService.ts).
  - Création du hook [useCreateTribe.ts](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/hooks/useCreateTribe.ts) pour centraliser les états d'étapes (wizard).
  - Découpage en sous-composants modulaires sous `src/components/explore/create-tribe/` :
    - [CreateTribeHeader.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/explore/create-tribe/CreateTribeHeader.tsx) (37 lignes)
    - [CreateTribeTopicsStep.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/explore/create-tribe/CreateTribeTopicsStep.tsx) (41 lignes)
    - [CreateTribeTypeStep.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/explore/create-tribe/CreateTribeTypeStep.tsx) (122 lignes)
    - [CreateTribeDetailsStep.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/explore/create-tribe/CreateTribeDetailsStep.tsx) (105 lignes)
    - [CreateTribeSuccessStep.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/explore/create-tribe/CreateTribeSuccessStep.tsx) (23 lignes)
    - [CreateTribeFooter.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/explore/create-tribe/CreateTribeFooter.tsx) (116 lignes)
  - Refactorisation de [CreateTribeModal.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/explore/CreateTribeModal.tsx) à 75 lignes (CONFORME).
- **Statut final** : **CONFORME**.

---

## 13. FiltersModal.tsx (Modal des filtres)
- **Fichier initial** : `myculturematch-web/src/components/ui/FiltersModal.tsx` (211 lignes - NON CONFORME)
- **Actions réalisées** :
  - Découpage du formulaire en sous-composants atomiques sous `src/components/ui/filters/` :
    - [FiltersHeader.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/ui/filters/FiltersHeader.tsx) (27 lignes)
    - [FiltersInputs.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/ui/filters/FiltersInputs.tsx) (43 lignes)
    - [FiltersRadius.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/ui/filters/FiltersRadius.tsx) (37 lignes)
    - [FiltersAgeRange.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/ui/filters/FiltersAgeRange.tsx) (37 lignes)
    - [FiltersGender.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/ui/filters/FiltersGender.tsx) (35 lignes)
  - Refactorisation de [FiltersModal.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/ui/FiltersModal.tsx) à 78 lignes (CONFORME).
- **Statut final** : **CONFORME**.
---

## 14. Connexion, Glow Modes et Scoring sur les Compagnons (Explore & Connections)
- **Fichiers concernés** :
  - [ExploreColumn.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/explore/ExploreColumn.tsx)
  - [TribeCard.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/explore/TribeCard.tsx)
  - [RequestCard.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/connections/RequestCard.tsx)
  - [RequestRow.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/connections/RequestRow.tsx)
  - [UserCard.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/connections/UserCard.tsx)
  - [UserRow.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/connections/UserRow.tsx)
  - [CompanionCard.tsx](file:///home/vivien/Workspace/My-culture-match/myculturematch-web/src/components/connections/CompanionCard.tsx)
- **Actions réalisées** :
  - Masquage de la barre de catégories (`ExploreCategories` avec les options *All*, *90%+ Matches*, *Shared Totems*, *Active Level*) dans l'onglet Explore quand le sous-onglet actif est `'Connexion'`.
  - Désactivation complète des glow modes et masquage du badge de niveau sur toutes les cartes de tribu (`TribeCard`) en forçant `glow="none"`.
  - Suppression de l'affichage du score de match (`matchScore`) et des styles/drapeaux associés sur toutes les fiches compagnon (comme les cartes et lignes de demandes `RequestCard` / `RequestRow`).
  - Suppression de l'affichage des badges/tags d'intérêts de l'utilisateur (contenant des groupes de mots comme *Runes & Sagas* ou *Woodcarving*) placés juste avant le(s) bouton(s) d'action sur les cartes compagnon (`UserCard` et `RequestCard`).
  - Suppression du code inutilisé relatif à `isHighMatch` dans les composants compagnons.
- **Statut final** : **CONFORME**.
