import { api } from './api';

export type RelationshipType = 'love' | 'friendship';

export interface RelationshipMemory {
  id: string;
  relationship_type: RelationshipType;
  kind: string;
  title: string;
  summary: string;
  occurred_at: string;
  actor_user_id: string | null;
  evidence_message_ids: string[];
  metadata: Record<string, unknown>;
  confidence: number;
  importance: number;
  source: string;
}

export interface RelationshipCapsule {
  id: string;
  relationship_type: RelationshipType;
  author_user_id: string;
  title: string | null;
  body: string | null;
  media_urls: string[];
  event_date: string;
  created_at: string;
}

export interface RelationshipTimelineResponse {
  relationshipType: RelationshipType;
  memories: RelationshipMemory[];
  capsules: RelationshipCapsule[];
}

export const relationshipMemoryService = {
  getTimeline(conversationId: string) {
    return api.get<RelationshipTimelineResponse>(`/api/conversations/${conversationId}/relationship-timeline`);
  },
  rebuild(conversationId: string) {
    return api.post<{ relationshipType: RelationshipType; memories: RelationshipMemory[]; messageCount: number }>(`/api/conversations/${conversationId}/relationship-memory/rebuild`);
  },
  createCapsule(conversationId: string, input: { title?: string; body?: string; mediaUrls?: string[]; eventDate?: string }) {
    return api.post<{ id: string; relationshipType: RelationshipType }>(`/api/conversations/${conversationId}/relationship-capsules`, input);
  },
};
