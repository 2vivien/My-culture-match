/** Statuts d'une connexion entre deux utilisateurs. */
export const CONNECTION_STATUS = {
  SUGGESTION: 'suggestion',
  INTERESTED: 'interested',
  REQUEST: 'request',
  COMPANION: 'companion',
  BLOCKED: 'blocked',
} as const;
export type ConnectionStatus = (typeof CONNECTION_STATUS)[keyof typeof CONNECTION_STATUS];

/** Type de post dans le fil. */
export const POST_TYPE = {
  TEXT: 'Text',
  IMAGES: 'Images',
  LINK: 'Link',
} as const;
export type PostType = (typeof POST_TYPE)[keyof typeof POST_TYPE];

/** Glow (couleur d'aura) d'un profil. */
export const GLOW = {
  TURQUOISE: 'turquoise',
  VIOLET: 'violet',
  AMBER: 'amber',
  EMERALD: 'emerald',
  ORANGE: 'orange',
  RED: 'red',
  BLUE: 'blue',
  NONE: 'none',
} as const;
export type Glow = (typeof GLOW)[keyof typeof GLOW];

/** Actions de swipe en Love. */
export const SWIPE_ACTION = {
  LIKE: 'like',
  PASS: 'pass',
} as const;
export type SwipeAction = (typeof SWIPE_ACTION)[keyof typeof SWIPE_ACTION];

/** Types de notification. */
export const NOTIFICATION_TYPE = {
  COMMENT: 'comment',
  LIKE: 'like',
  INVITE: 'invite',
  REQUEST: 'request',
  MATCH: 'match',
  MESSAGE: 'message',
  SYSTEM: 'system',
} as const;
export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

/** Rôle au sein d'une tribu. */
export const TRIBE_ROLE = {
  MEMBER: 'member',
  MODERATOR: 'moderator',
  OWNER: 'owner',
} as const;
export type TribeRole = (typeof TRIBE_ROLE)[keyof typeof TRIBE_ROLE];

/** Type de story. */
export const STORY_TYPE = {
  IMAGE: 'image',
  VIDEO: 'video',
} as const;
export type StoryType = (typeof STORY_TYPE)[keyof typeof STORY_TYPE];

/** Type de message en chat. */
export const MESSAGE_TYPE = {
  TEXT: 'text',
  IMAGE: 'image',
  VOICE: 'voice',
  FILE: 'file',
} as const;
export type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];

/** Statut d'un signalement de modération. */
export const REPORT_STATUS = {
  OPEN: 'open',
  REVIEWED: 'reviewed',
  DISMISSED: 'dismissed',
  ACTIONED: 'actioned',
} as const;
export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];
