import { api } from './api';

export type RelationshipType = 'love' | 'friendship';
export type RecapPeriod = '1m' | '3m' | '6m' | '1y';
export type SharedMemoryKind = 'note' | 'photo' | 'video' | 'audio' | 'event' | 'place' | 'milestone' | 'conversation' | 'memory' | 'custom';

export interface RelationshipMemory {
  id: string; relationship_type: RelationshipType; kind: string; title: string; summary: string; occurred_at: string; actor_user_id: string | null; evidence_message_ids: string[]; metadata: Record<string, unknown>; confidence: number; importance: number; source: string; phase_key?: string; semantic_score?: number;
}
export interface RelationshipCapsule { id: string; relationship_type: RelationshipType; author_user_id: string; updated_by_user_id?: string | null; kind?: SharedMemoryKind; title: string | null; body: string | null; media_urls: string[]; message_ids?: string[]; metadata?: Record<string, unknown>; event_date: string; created_at: string; updated_at?: string; }
export interface RelationshipRecap { id: string; relationship_type: RelationshipType; period_key: RecapPeriod; period_start: string; period_end: string; title: string; narrative: string; evidence_memory_ids: string[]; model: string | null; generated_at: string; }
export interface RelationshipTimelineResponse { relationshipType: RelationshipType; memories: RelationshipMemory[]; capsules: RelationshipCapsule[]; }
export interface SharedMemoryInput { kind?: SharedMemoryKind; title?: string; body?: string; mediaUrls?: string[]; messageIds?: string[]; eventDate?: string; metadata?: Record<string, unknown>; }

export const relationshipMemoryService = {
  getTimeline(conversationId: string) { return api.get<RelationshipTimelineResponse>(`/api/conversations/${conversationId}/relationship-timeline`); },
  rebuild(conversationId: string) { return api.post<{ relationshipType: RelationshipType; memories: RelationshipMemory[]; phases: unknown[]; messageCount: number; embeddingModel: string }>(`/api/conversations/${conversationId}/relationship-memory/rebuild`); },
  getRecaps(conversationId: string) { return api.get<{ recaps: RelationshipRecap[] }>(`/api/conversations/${conversationId}/relationship-recaps`); },
  generateRecap(conversationId: string, period: RecapPeriod) { return api.post<RelationshipRecap>(`/api/conversations/${conversationId}/relationship-recaps`, { period }); },
  createCapsule(conversationId: string, input: { title?: string; body?: string; mediaUrls?: string[]; eventDate?: string }) { return api.post<{ id: string; relationshipType: RelationshipType }>(`/api/conversations/${conversationId}/relationship-capsules`, input); },
  listMemoryBox(conversationId: string) { return api.get<{ memories: RelationshipCapsule[] }>(`/api/conversations/${conversationId}/memory-box`); },
  createMemoryBoxEntry(conversationId: string, input: SharedMemoryInput) { return api.post<{ id: string; relationshipType: RelationshipType }>(`/api/conversations/${conversationId}/memory-box`, input); },
  updateMemoryBoxEntry(conversationId: string, memoryId: string, input: SharedMemoryInput) { return api.patch<{ id: string }>(`/api/conversations/${conversationId}/memory-box/${memoryId}`, input); },
  deleteMemoryBoxEntry(conversationId: string, memoryId: string) { return api.delete<{ id: string; deleted: boolean }>(`/api/conversations/${conversationId}/memory-box/${memoryId}`); },
};