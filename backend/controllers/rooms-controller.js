const RoomDto = require('../dtos/room.dto');
const roomService = require("../services/room-service");
const followService = require("../services/follow-service");
const userService = require("../services/user-service");
const UserDto = require('../dtos/user-dto');

// We use relative required resolution carefully since server.js exports this.
// To avoid circular dependencies, require inside the method when needed.

class RoomsController {
    async create(req, res) {
        //room
        const { topic, roomType, password } = req.body;

        if (!topic || !roomType) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (roomType === 'private' && !password) {
            return res.status(400).json({ message: 'Password is required for private rooms' });
        }

        const room = await roomService.create({
            topic,
            roomType,
            ownerId: req.user._id,
            password: roomType === 'private' ? password : null,
        });

        const roomDto = new RoomDto(room);

        // Notify followers
        if (roomType !== 'private') {
            try {
                const { globalSocketUserMapping, io } = require('../server');
                const ACTIONS = require('../actions');

                // If open, broadcast to everyone
                if (roomType === 'open') {
                    io.emit(ACTIONS.ROOM_CREATED, roomDto);
                }

                // If social, only broadcast to active mutual followers
                if (roomType === 'social') {
                    const mutualIds = await followService.getMutualFollowerIds(req.user._id);
                    if (mutualIds.length > 0) {
                        const hostProfile = await userService.findUser({ _id: req.user._id });
                        const hostDto = new UserDto(hostProfile);

                        const activeMutualSocketIds = [];
                        for (const mId of mutualIds) {
                            if (globalSocketUserMapping.has(mId.toString())) {
                                const socketSet = globalSocketUserMapping.get(mId.toString());
                                activeMutualSocketIds.push(...Array.from(socketSet));
                            }
                        }

                        if (activeMutualSocketIds.length > 0) {
                            io.to(activeMutualSocketIds).emit('room-started', {
                                room: roomDto,
                                host: hostDto
                            });
                        }
                    }
                } 
                // If open, notify ALL active followers (not just mutuals)
                else if (roomType === 'open') {
                    const followerIds = await followService.getFollowerIds(req.user._id);
                    if (followerIds.length > 0) {
                        const hostProfile = await userService.findUser({ _id: req.user._id });
                        const hostDto = new UserDto(hostProfile);

                        const activeFollowerSocketIds = [];
                        for (const fId of followerIds) {
                            if (globalSocketUserMapping.has(fId.toString())) {
                                const socketSet = globalSocketUserMapping.get(fId.toString());
                                activeFollowerSocketIds.push(...Array.from(socketSet));
                            }
                        }

                        if (activeFollowerSocketIds.length > 0) {
                            io.to(activeFollowerSocketIds).emit('room-started', {
                                room: roomDto,
                                host: hostDto
                            });
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to dispatch room notifications:', err);
            }
        }

        return res.json(roomDto);
    }


    async index(req, res) {
        const rooms = await roomService.getAllRooms(['open', 'social', 'private']);
        
        // Filter social rooms for mutual followers only
        const userId = req.user ? req.user._id.toString() : null;
        const visibleRooms = [];
        
        for (const room of rooms) {
            if (room.roomType === 'social') {
                if (!userId) continue; // Unauthenticated cannot see social rooms
                if (room.ownerId._id.toString() === userId) {
                    visibleRooms.push(room);
                    continue;
                }
                const isMutual = await followService.areMutualFollows(userId, room.ownerId._id.toString());
                if (isMutual) {
                    visibleRooms.push(room);
                }
            } else {
                visibleRooms.push(room);
            }
        }

        const allRooms = visibleRooms.map(room => new RoomDto(room));
        return res.json(allRooms);
    }

    async show(req, res) {
        const room = await roomService.getRoom(req.params.roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (room.roomType === 'social') {
            const userId = req.user._id.toString();
            if (room.ownerId.toString() !== userId) {
                const isMutual = await followService.areMutualFollows(userId, room.ownerId.toString());
                if (!isMutual) {
                    return res.status(403).json({ error: "This is a social room. Only mutual followers of the host can join." });
                }
            }
        }

        return res.json(room);
    }

    async destroy(req, res) {
        const { roomId } = req.params;
        const room = await roomService.getRoom(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (room.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only official owner can delete the room!' });
        }

        await roomService.deleteRoom(roomId);
        return res.json({ message: 'Room deleted successfully' });
    }

    async verifyPassword(req, res) {
        const { roomId } = req.params;
        const { password } = req.body;

        const room = await roomService.getRoom(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (!room.password) {
            return res.json({ success: true });
        }

        if (room.password !== password) {
            return res.status(403).json({ message: 'Incorrect password' });
        }

        return res.json({ success: true });
    }
}

module.exports = new RoomsController();