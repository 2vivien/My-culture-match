export interface TribeTopic {
  name: string;
  icon: string;
}

export type TribeType = 'public' | 'restricted' | 'private';

export interface TribeSubmission {
  topics: string[];
  type: TribeType;
  name: string;
  description: string;
}
