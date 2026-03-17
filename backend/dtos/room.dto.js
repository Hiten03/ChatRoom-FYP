class RoomDto {
    id;
    topic;
    roomType;
    speakers;
    ownerId;
    createdAt;
    hasPassword;
    maxMembers;
    totalPeople;

    constructor(room) {
        this.id = room._id;
        this.topic = room.topic;
        this.roomType = room.roomType;
        this.ownerId = room.ownerId;
        this.speakers = room.speakers;
        this.createdAt = room.createdAt;
        this.hasPassword = !!room.password;
        this.maxMembers = room.maxMembers || null;
        this.totalPeople = room.speakers ? room.speakers.length : 0; // Default count
    }
}
module.exports = RoomDto;