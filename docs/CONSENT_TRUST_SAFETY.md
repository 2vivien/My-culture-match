# Consent & Trust & Safety

## Consent matrix

My Culture Match now separates Friendship and Love at the policy level.

- Discovery: nobody / friends / friends of friends / nearby / everyone.
- Friendship requests: same visibility matrix + `friendshipEnabled`.
- Love likes: same visibility matrix + `loveEnabled` on both sides + `loveProposalEnabled` on the recipient.
- Contact: same visibility matrix for starting a new conversation.
- Profile: independent visibility.
- Photos: independent visibility.
- Country: independent visibility.

Blocking always wins over every other permission.

## Love vs Friendship

A Love mutual match is stored in `love_matches` and creates a conversation, but it does not create a `connections` companion record and does not increment Friendship companion counters. Friendship requests use `connections` separately.

## Trust & Safety

The safety module provides:

- block / unblock
- mute / unmute
- user/post/comment/message reports through the existing reporting system
- moderation action history
- moderation appeals
- media moderation queue storage
- outgoing message anti-spam checks for duplicate messages, excessive links, mentions and promotional patterns
- existing message rate limiting

## Enforcement

Consent is enforced server-side in profile discovery, Friendship requests, Love likes, new conversations, and public profile field serialization. The settings UI is only a control surface; it is not the security boundary.
