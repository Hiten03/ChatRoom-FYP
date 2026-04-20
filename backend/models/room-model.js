const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomSchema = new Schema(
    {
        topic: {type: String, required: true},
        roomType: {type: String, required: true},
        password: {type: String, required: false, default: null},
        ownerId: {type: Schema.Types.ObjectId, ref: 'User'},
        speakers: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'User'
                }
            ],
            required: false,
        },
        maxMembers: {
            type: Number,
            default: null, // null means unlimited
            min: 2,
            max: 100
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Room', roomSchema, 'rooms');