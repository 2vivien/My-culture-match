import { describe, expect, it } from 'vitest';
import { applyVoteToPages } from '../../../../myculturematch-web/src/lib/commentVote';

const c = (id: string, score = 0, myVote = 0) => ({ id, score, myVote });

describe('applyVoteToPages', () => {
  it('met à jour score et vote du seul commentaire visé, sans changer l’ordre', () => {
    const pages = [{ comments: [c('a', 1), c('b', 5)], nextCursor: '2' }, { comments: [c('c', 0)], nextCursor: null }];
    const out = applyVoteToPages(pages, 'b', { myVote: 1, score: 6 });
    expect(out[0].comments.map((x) => x.id)).toEqual(['a', 'b']);
    expect(out[0].comments[1]).toEqual({ id: 'b', score: 6, myVote: 1 });
    expect(out[0].comments[0]).toBe(pages[0].comments[0]);
    expect(out[0].nextCursor).toBe('2');
  });

  it('garde l’identité des pages non concernées', () => {
    const pages = [{ comments: [c('a')] }, { comments: [c('b')] }];
    const out = applyVoteToPages(pages, 'a', { myVote: -1, score: -1 });
    expect(out[1]).toBe(pages[1]);
    expect(out[0]).not.toBe(pages[0]);
  });

  it('retrait de vote : myVote 0', () => {
    const out = applyVoteToPages([{ comments: [c('a', 3, 1)] }], 'a', { myVote: 0, score: 2 });
    expect(out[0].comments[0]).toEqual({ id: 'a', score: 2, myVote: 0 });
  });

  it('commentaire inconnu : rien ne change', () => {
    const pages = [{ comments: [c('a')] }];
    expect(applyVoteToPages(pages, 'zzz', { myVote: 1, score: 1 })[0]).toBe(pages[0]);
  });
});
