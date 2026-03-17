const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const followSchema = new Schema(
    {
        followerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        followingId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate follows
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

module.exports = mongoose.model('Follow', followSchema, 'follows');
