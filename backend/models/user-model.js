const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        phone: { type: String, required: true },
        name: { type: String, required: false },
        avatar: {
            type: String,
            required: false,
            get: (avatar) => {
                if (avatar) {
                    const baseUrl = process.env.BASE_URL || 'http://localhost:5500';
                    return `${baseUrl}${avatar}`;
                }
                return avatar;
            },
        },
        activated: { type: Boolean, required: false, default: false },
        themePreference: { type: String, enum: ['light', 'dark'], default: 'dark', required: false },
        bio: { type: String, required: false, maxlength: 160 },
        socials: {
            twitter: { type: String, required: false },
            instagram: { type: String, required: false },
            linkedin: { type: String, required: false },
        },
    },
    {
        timestamps: true,
        toJSON: { getters: true, virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual field for followers count
userSchema.virtual('followersCount', {
    ref: 'Follow',
    localField: '_id',
    foreignField: 'followingId',
    count: true,
});

// Virtual field for following count
userSchema.virtual('followingCount', {
    ref: 'Follow',
    localField: '_id',
    foreignField: 'followerId',
    count: true,
});

module.exports = mongoose.model('User', userSchema, 'users');