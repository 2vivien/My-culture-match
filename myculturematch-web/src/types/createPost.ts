export interface TribeOption {
  id: string;
  name: string;
  avatar: string;
}

export interface PostSubmission {
  title: string;
  body?: string;
  mediaUrl?: string;
  linkUrl?: string;
  tribeId?: string;
  flairId?: string;
  type: 'Text' | 'Images' | 'Link';
  tags?: string[];
}
