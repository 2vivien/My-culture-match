export interface TribeTopic {
  name: string;
  icon: string;
}

export type TribeType = 'public' | 'private';

export interface TribeSubmission {
  topics: string[];
  type: TribeType;
  name: string;
  description: string;
}
