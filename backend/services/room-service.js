const roomModel = require("../models/room-model");

class RoomService {
    async create(payload) {
        const { topic, roomType, ownerId, password } = payload;
        const room = await roomModel.create({
            topic,
            roomType,
            ownerId,
            password: password || null,
            speakers: [ownerId],
        });
        return room;
    }

    async getAllRooms(types) {
        const rooms = await roomModel.find({ roomType: { $in: types } }).populate('speakers').populate('ownerId').exec();
        return rooms;
    }

    async getRoom(roomId) {
        const room = await roomModel.findOne({ _id: roomId });
        return room;
    }

    async deleteRoom(roomId) {
        return await roomModel.deleteOne({ _id: roomId });
    }

    async getRoomsHostedCount(userId) {
        return await roomModel.countDocuments({ ownerId: userId });
    }
}

module.exports = new RoomService();