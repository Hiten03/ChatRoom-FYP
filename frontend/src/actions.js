export const ACTIONS = {
    JOIN: 'join',
    LEAVE: 'leave',
    ADD_PEER: 'add-peer',
    RELAY_ICE: 'relay-ice',
    RELAY_SDP: 'relay-sdp',
    ICE_CANDIDATE: 'ice-candidate',
    SESSION_DESCRIPTION: 'session-description',
    REMOVE_PEER: 'remove-peer',
    MUTE: 'mute',
    UN_MUTE: 'un-mute',
    SET_ROLE: 'set-role',
    ROLE_CHANGED: 'role-changed',
    REACTION: 'reaction',
    // Text Chat
    ROOM_MESSAGE: 'room-message',
    CHAT_HISTORY: 'chat-history',
    // Hand Raise
    RAISE_HAND: 'raise-hand',
    LOWER_HAND: 'lower-hand',
    // Room Lifecycle
    ROOM_CREATED: 'room-created',
    // Global User Events
    REGISTER_GLOBAL: 'register-global',
    FOLLOWED: 'followed',
    JOINED_ROOM: 'joined-room',
}