// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet'); // For basic security headers

// const DbConnect = require('./database');
// const router = require('./routes');

// const app = express();
// const PORT = process.env.PORT || 5500;

// // -------------------------
// // Middleware
// // -------------------------
// app.use(helmet());
// app.use(express.json());

// const corsOptions = {
//   origin: ['http://localhost:3000'],
//   credentials: true, // needed if using cookies
// };
// app.use(cors(corsOptions));

// // -------------------------
// // DB Connection
// // -------------------------
// DbConnect();

// // -------------------------
// // Routes
// // -------------------------
// app.use('/api', router);

// // Root Route
// app.get('/', (req, res) => {
//   res.send('Welcome to the Express Server!');
// });

// // -------------------------
// // Global Error Handler (Optional)
// // -------------------------
// app.use((err, req, res, next) => {
//   console.error('Server Error:', err);
//   res.status(500).json({ message: 'Something went wrong on the server.' });
// });

// // -------------------------
// // Start Server
// // -------------------------
// app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));


// require('dotenv').config();
// const express = require('express');
// const app = express();
// const DbConnect = require('./database');
// const router = require('./routes');
// const cors = require('cors');

// const corsOption = {
//     credentials: true,
//     origin: ['http://localhost:3000'],
// };
// app.use(cors(corsOption));

// const PORT = process.env.PORT || 5500;
// DbConnect();
// app.use(express.json());
// app.use(router);

// app.get('/', (req, res) => {
//     res.send('Hello from express Js');
// });

// app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const DbConnect = require('./database');
const router = require('./routes');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { METHODS } = require('http');
const ACTIONS = require('./actions');
const roomModel = require('./models/room-model');
const roomService = require('./services/room-service');
const followService = require('./services/follow-service');
const server = require('http').createServer(app);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = ['http://localhost:3000'];
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

const io = require('socket.io')(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
    },
});

const socketStorage = require('./socket-storage');
socketStorage.setIO(io);
const { globalSocketUserMapping, socketUserMapping } = socketStorage;

app.use(cookieParser());
const corsOption = {
    credentials: true,
    origin: allowedOrigins,
};
app.use(cors(corsOption));
app.use('/storage', express.static('storage'));

const PORT = process.env.PORT || 5500;
DbConnect();
app.use(express.json({ limit: '8mb' }));
app.use(router);

app.get('/', (req, res) => {
    res.send('Hello from express Js');
});

//Sockets

// Sockets initialized via socket-storage

const roomRoles = {};      // { roomId: { userId: 'speaker'|'listener' } }
const roomOwners = {};     // { roomId: ownerId }

// Feature Maps
const roomMessages = new Map(); // { roomId: [{ user, text, time }] }
const roomHands = new Map();    // { roomId: Set<userId> }

io.on('connection', (socket) => {
    console.log('new connection', socket.id);

    // Global Registry for out-of-room notifications
    socket.on(ACTIONS.REGISTER_GLOBAL, ({ userId }) => {
        if (!globalSocketUserMapping.has(userId)) {
            globalSocketUserMapping.set(userId, new Set());
        }
        globalSocketUserMapping.get(userId).add(socket.id);
    });

    socket.on(ACTIONS.JOIN, async ({ roomId, user }) => {
        if (!user) return;
        
        // Normalize user object to ensure _id (MongoDB ID) is always present
        const normalizedUser = {
            ...user,
            _id: (user._id || user.id || user.userId)?.toString(),
            id: (user.id || user._id || user.userId)?.toString() // Keep id for backward compatibility
        };
        
        socketUserMapping[socket.id] = normalizedUser;

        // Initialize room roles map if needed
        if (!roomRoles[roomId]) {
            roomRoles[roomId] = {};
        }

        // Determine owner and assign role
        let roomObj = null;
        if (!roomOwners[roomId]) {
            try {
                const room = await roomModel.findById(roomId).exec();
                if (room && room.ownerId) {
                    roomObj = room;
                    roomOwners[roomId] = room.ownerId.toString();
                }
            } catch (e) {
                console.error('Error fetching room owner:', e);
            }
        }

        const ownerId = roomOwners[roomId]?.toString();
        const userId = (user.id || user._id || user.userId)?.toString();

        console.log(`[JOIN] User: ${userId}, Room: ${roomId}, Owner: ${ownerId}`);

        // Security Check: Social Rooms
        // If room is already cached or just fetched, we need its type to verify
        if (!roomObj) {
            try {
                roomObj = await roomModel.findById(roomId).exec();
            } catch (e) {}
        }
        
        // OWNER ALWAYS HAS ACCESS
        const userIsOwner = userId === ownerId;

        if (roomObj && roomObj.roomType === 'social' && !userIsOwner) {
            const isMutual = await followService.areMutualFollows(userId, ownerId);
            if (!isMutual) {
                socket.emit('join-error', { 
                    message: "This is a social room. Only mutual followers of the host can join." 
                });
                socket.disconnect(true);
                return; // Stop the rest of the JOIN flow
            }
        }

        // --- MEMBER LIMIT CHECK ---
        const currentCount = io.sockets.adapter.rooms.get(roomId)?.size || 0;
        if (roomObj && roomObj.maxMembers && currentCount >= roomObj.maxMembers && !userIsOwner) {
            socket.emit(ACTIONS.ROOM_FULL, {
                message: `This room has reached its maximum capacity of ${roomObj.maxMembers} members.`,
                maxMembers: roomObj.maxMembers
            });
            return;
        }

        // Assign role: Owner is ALWAYS speaker
        if (userIsOwner) {
            roomRoles[roomId][userId] = 'speaker';
        } else if (!roomRoles[roomId][userId]) {
            roomRoles[roomId][userId] = 'listener';
        }

        // Emit JOINED_ROOM to the joining user with their role info
        socket.emit(ACTIONS.JOINED_ROOM, {
            role: roomRoles[roomId][userId],
            isModerator: userIsOwner,
            ownerId: ownerId,
            roles: roomRoles[roomId],
            startedAt: roomObj?.createdAt
        });

        //new Map
        const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

        clients.forEach(clientId => {
            io.to(clientId).emit(ACTIONS.ADD_PEER, {
                peerId: socket.id,
                createOffer: false,
                user
            });

            socket.emit(ACTIONS.ADD_PEER, {
                peerId: clientId,
                createOffer: true,
                user: socketUserMapping[clientId],
            });
        });

        socket.join(roomId);

        // Broadcast Member Count Update
        const newCount = io.sockets.adapter.rooms.get(roomId)?.size || 0;
        io.to(roomId).emit(ACTIONS.MEMBER_COUNT_UPDATED, {
            roomId,
            currentCount: newCount,
            maxMembers: roomObj?.maxMembers
        });

        // Broadcast all roles to everyone in the room
        io.to(roomId).emit(ACTIONS.ROLE_CHANGED, {
            roles: roomRoles[roomId],
            ownerId: ownerId,
        });

        // Send existing chat history
        if (roomMessages.has(roomId)) {
            socket.emit(ACTIONS.CHAT_HISTORY, {
                messages: roomMessages.get(roomId)
            });
        }

        // Broadcast existing raised hands
        if (roomHands.has(roomId)) {
            socket.emit(ACTIONS.RAISE_HAND, {
                raisedHands: Array.from(roomHands.get(roomId))
            });
        }
    });


    //handle relay ice
    socket.on(ACTIONS.RELAY_ICE, ({ peerId, icecandidate }) => {
        io.to(peerId).emit(ACTIONS.ICE_CANDIDATE, {
            peerId: socket.id,
            icecandidate,
        });
    });

    //handle relay sdp (session description)
    socket.on(ACTIONS.RELAY_SDP, ({ peerId, sessionDescription }) => {
        io.to(peerId).emit(ACTIONS.SESSION_DESCRIPTION, {
            peerId: socket.id,
            sessionDescription,
        });
    });

    //Handle mute/unmute
    socket.on(ACTIONS.MUTE, ({ roomId, userId }) => {
        const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

        clients.forEach(clientId => {
            io.to(clientId).emit(ACTIONS.MUTE, {
                peerId: socket.id,
                userId,
            });
        });
    });

    socket.on(ACTIONS.UN_MUTE, ({ roomId, userId }) => {
        const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

        clients.forEach(clientId => {
            io.to(clientId).emit(ACTIONS.UN_MUTE, {
                peerId: socket.id,
                userId,
            });
        });
    });

    // Handle role change (owner only)
    socket.on(ACTIONS.SET_ROLE, ({ roomId, targetUserId, role }) => {
        const senderUser = socketUserMapping[socket.id];
        const senderId = (senderUser?.id || senderUser?._id)?.toString();
        const ownerId = roomOwners[roomId]?.toString();

        // Only owner can change roles
        if (senderId !== ownerId) return;
        // Cannot change owner's role
        if (targetUserId === ownerId) return;
        // Validate role
        if (role !== 'speaker' && role !== 'listener') return;

        if (roomRoles[roomId]) {
            roomRoles[roomId][targetUserId] = role;
        }

        // Broadcast updated roles to all in room
        io.to(roomId).emit(ACTIONS.ROLE_CHANGED, {
            roles: roomRoles[roomId],
            ownerId: ownerId,
        });
    });

    // Handle Member Limit Update (Moderator only)
    socket.on(ACTIONS.UPDATE_ROOM_LIMIT, async ({ roomId, maxMembers }) => {
        const senderUser = socketUserMapping[socket.id];
        const senderId = (senderUser?.id || senderUser?._id)?.toString();
        const ownerId = roomOwners[roomId]?.toString();

        if (senderId !== ownerId) return;

        try {
            await roomService.updateRoomLimit(roomId, maxMembers);
            
            // Broadcast to everyone in the room
            io.to(roomId).emit(ACTIONS.ROOM_LIMIT_UPDATED, {
                maxMembers
            });

            // Also emit count update to refresh UI
            const currentCount = io.sockets.adapter.rooms.get(roomId)?.size || 0;
            io.to(roomId).emit(ACTIONS.MEMBER_COUNT_UPDATED, {
                roomId,
                currentCount,
                maxMembers
            });
        } catch (err) {
            console.error('Failed to update room limit:', err);
        }
    });

    // Handle emoji reactions
    socket.on(ACTIONS.REACTION, ({ roomId, emoji, userName }) => {
        // Broadcast the reaction to everyone else in the room
        socket.to(roomId).emit(ACTIONS.REACTION, {
            emoji,
            userName
        });
    });

    // Handle Text Chat
    socket.on(ACTIONS.ROOM_MESSAGE, ({ roomId, message }) => {
        if (!roomMessages.has(roomId)) {
            roomMessages.set(roomId, []);
        }
        
        // Push the new message into memory
        const msgList = roomMessages.get(roomId);
        msgList.push(message);
        
        // Broadcast to everyone in the room (including sender, or sender handles locally)
        // Here we broadcast to everyone else to follow the emoji pattern
        socket.to(roomId).emit(ACTIONS.ROOM_MESSAGE, message);
    });

    // Handle Hand Raise bounds
    socket.on(ACTIONS.RAISE_HAND, ({ roomId, userId }) => {
        if (!roomHands.has(roomId)) {
            roomHands.set(roomId, new Set());
        }
        const hands = roomHands.get(roomId);
        hands.add(userId);
        
        // Broadcast to whole room
        io.to(roomId).emit(ACTIONS.RAISE_HAND, {
            raisedHands: Array.from(hands),
            justRaisedBy: userId // for the notification
        });
    });

    socket.on(ACTIONS.LOWER_HAND, ({ roomId, userId }) => {
        if (roomHands.has(roomId)) {
            const hands = roomHands.get(roomId);
            hands.delete(userId);
            
            io.to(roomId).emit(ACTIONS.RAISE_HAND, {
                raisedHands: Array.from(hands)
            });
        }
    });

    //leaving the room
    const leaveRoom = ({ roomId }) => {
        const { rooms } = socket;
        const userId = socketUserMapping[socket.id]?.id;

        Array.from(rooms).forEach(roomId => {
            const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

            clients.forEach(clientId => {
                io.to(clientId).emit(ACTIONS.REMOVE_PEER, {
                    peerId: socket.id,
                    userId: socketUserMapping[socket.id]?.id,
                });

                socket.emit(ACTIONS.REMOVE_PEER, {
                    peerId: clientId,
                    userId: socketUserMapping[clientId]?.id,
                });
            });

            // Clean up room data only when room is completely empty
            // (no more connected sockets in this room)
            // Don't delete individual user roles — they persist across refreshes
            const remainingClients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
            // After this socket leaves, check if room will be empty
            // (subtract 1 because this socket is still counted)
            if (remainingClients.length <= 1) {
                delete roomRoles[roomId];
                delete roomOwners[roomId];
                roomMessages.delete(roomId);
                roomHands.delete(roomId);
            } else {
                // Remove leaving user's hand raise if they had one
                if (userId && roomHands.has(roomId)) {
                    const hands = roomHands.get(roomId);
                    if (hands.has(userId)) {
                        hands.delete(userId);
                        io.to(roomId).emit(ACTIONS.RAISE_HAND, {
                            raisedHands: Array.from(hands)
                        });
                    }
                }
            }

            socket.leave(roomId);
            
            // Broadcast Member Count Update
            const remainingCount = io.sockets.adapter.rooms.get(roomId)?.size || 0;
            io.to(roomId).emit(ACTIONS.MEMBER_COUNT_UPDATED, {
                roomId,
                currentCount: remainingCount
            });
        });

        delete socketUserMapping[socket.id];

        // Clean up global mapping
        for (const [userId, socketIds] of globalSocketUserMapping.entries()) {
            if (socketIds.has(socket.id)) {
                socketIds.delete(socket.id);
                if (socketIds.size === 0) {
                    globalSocketUserMapping.delete(userId);
                }
                break;
            }
        }

    };
    socket.on(ACTIONS.LEAVE, leaveRoom);
    socket.on('disconnecting', leaveRoom);
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));