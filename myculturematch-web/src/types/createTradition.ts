export interface TribeOption {
  id: string;
  name: string;
  avatar: string;
}

export interface TraditionSubmission {
  title: string;
  body?: string;
  mediaUrl?: string;
  linkUrl?: string;
  tribeId?: string;
  type: 'Text' | 'Images' | 'Link';
}
