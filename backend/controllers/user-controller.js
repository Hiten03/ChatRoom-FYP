const path = require('path');
const fs = require('fs');
const userService = require('../services/user-service');
const roomService = require('../services/room-service');
const UserDto = require('../dtos/user-dto');

class UserController {
    async updateAvatar(req, res) {
        const { avatar } = req.body;
        
        if (!avatar) {
            return res.status(400).json({ message: 'Avatar is required!' });
        }

        // Image Base64 - Only process if it's a data URL
        let finalAvatarPath = avatar;
        if (avatar && avatar.startsWith('data:image')) {
            const buffer = Buffer.from(
                avatar.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, ''),
                'base64'
            );
            const imagePath = `${Date.now()}-${Math.round(
                Math.random() * 1e9
            )}.png`;

            try {
                const storagePath = path.resolve(__dirname, '../storage');
                if (!fs.existsSync(storagePath)) {
                    fs.mkdirSync(storagePath, { recursive: true });
                }
                fs.writeFileSync(path.resolve(storagePath, imagePath), buffer);
                console.log('New avatar saved for:', imagePath);
                finalAvatarPath = `/storage/${imagePath}`;
            } catch (err) {
                console.error(err);
                return res.status(500).json({ message: 'Could not process the image' });
            }
        } else if (avatar === '/images/monkey-avatar.png') {
            finalAvatarPath = null;
        }

        const userId = req.user._id;
        
        // Update user in DB
        try {
            const user = await userService.findUser({ _id: userId });
            if (!user) {
                return res.status(404).json({ message: 'User not found!' });
            }
            
            user.avatar = finalAvatarPath;
            await user.save();
            
            res.json({ user: new UserDto(user), message: 'Avatar updated successfully' });
        } catch (err) {
            console.error('Avatar update error:', err);
            return res.status(500).json({ message: 'Something went wrong!' });
        }
    }

    async updateThemePreference(req, res) {
        const { theme } = req.body;
        
        if (!theme || !['light', 'dark'].includes(theme)) {
            return res.status(400).json({ message: 'Valid theme is required!' });
        }

        const userId = req.user._id;

        try {
            const user = await userService.findUser({ _id: userId });
            if (!user) {
                return res.status(404).json({ message: 'User not found!' });
            }
            
            user.themePreference = theme;
            await user.save();
            
            res.json({ user: new UserDto(user), message: 'Theme updated successfully' });
        } catch (err) {
            console.error('Theme update error:', err);
            return res.status(500).json({ message: 'Something went wrong!' });
        }
    }

    async updateProfile(req, res) {
        const { name, phone, bio, socials, avatar } = req.body;
        const userId = req.user._id;

        try {
            const user = await userService.findUser({ _id: userId });
            if (!user) {
                return res.status(404).json({ message: 'User not found!' });
            }

            if (name !== undefined) user.name = name;
            if (phone !== undefined) user.phone = phone;
            if (bio !== undefined) user.bio = bio;
            if (socials !== undefined) user.socials = socials;

            // Handle avatar inline if provided as base64
            if (avatar && avatar.startsWith('data:image')) {
                const buffer = Buffer.from(
                    avatar.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, ''),
                    'base64'
                );
                const imagePath = `${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;
                const storagePath = path.resolve(__dirname, '../storage');
                if (!fs.existsSync(storagePath)) {
                    fs.mkdirSync(storagePath, { recursive: true });
                }
                fs.writeFileSync(path.resolve(storagePath, imagePath), buffer);
                user.avatar = `/storage/${imagePath}`;
            } else if (avatar === '/images/monkey-avatar.png') {
                user.avatar = null;
            }

            await user.save();
            
            // Get populated user for DTO (with followers count)
            const populatedUser = await require('../models/user-model')
                .findById(userId)
                .populate('followersCount')
                .populate('followingCount');

            
            // Get rooms hosted
            const { getRoomsHostedCount } = require('../services/room-service');
            let roomsHosted = 0;
            if(getRoomsHostedCount) {
                roomsHosted = await getRoomsHostedCount(userId);
            }
            populatedUser.roomsHosted = roomsHosted;

            res.json({ user: new UserDto(populatedUser), message: 'Profile updated successfully' });
        } catch (err) {
            console.error('Profile update error:', err);
            return res.status(500).json({ message: 'Something went wrong!' });
        }
    }

    async getProfile(req, res) {
        const userId = req.params.userId;
        try {
            const user = await require('../models/user-model')
                .findById(userId)
                .populate('followersCount')
                .populate('followingCount');
            if (!user) {
                return res.status(404).json({ message: 'User not found!' });
            }

            // Get rooms hosted
            const { getRoomsHostedCount } = require('../services/room-service');
            let roomsHosted = 0;
            if (getRoomsHostedCount) {
                roomsHosted = await getRoomsHostedCount(userId);
            }
            user.roomsHosted = roomsHosted;

            res.json({ user: new UserDto(user) });
        } catch (err) {
            console.error('Get profile error:', err);
            return res.status(500).json({ message: 'Something went wrong!' });
        }
    }
}

module.exports = new UserController();
