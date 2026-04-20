const mongoose = require('mongoose');
require('dotenv').config();
const UserModel = require('./models/user-model');
const fs = require('fs');
const path = require('path');

async function fixAvatars() {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log('Connected to DB');
        const users = await UserModel.find({});
        console.log('Checking avatars for', users.length, 'users');
        
        for (const user of users) {
            if (user.avatar) {
                // The getter might make it absolute, so let's get the raw value
                const rawAvatar = user.toObject({getters: false}).avatar;
                if (!rawAvatar) continue;

                const fullPath = path.resolve(__dirname, '.' + rawAvatar);
                if (fs.existsSync(fullPath)) {
                    const stats = fs.statSync(fullPath);
                    if (stats.size === 18) {
                        console.log(`Fixing corrupted avatar for user: ${user.name} (${user.phone}). File size: ${stats.size}`);
                        user.avatar = null;
                        await user.save();
                        // Optionally delete the corrupted file
                        // fs.unlinkSync(fullPath);
                    }
                } else if (rawAvatar.startsWith('/storage/')) {
                    console.log(`Avatar file missing for user: ${user.name} (${user.phone}). Path: ${rawAvatar}`);
                    user.avatar = null;
                    await user.save();
                }
            }
        }
        await mongoose.disconnect();
        console.log('Finished fixing avatars');
    } catch (err) {
        console.error(err);
    }
}

fixAvatars();
