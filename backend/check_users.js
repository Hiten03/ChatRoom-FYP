const mongoose = require('mongoose');
require('dotenv').config();
const UserModel = require('./models/user-model');

async function checkUsers() {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log('Connected to DB');
        const users = await UserModel.find({});
        console.log('Total users:', users.length);
        users.forEach(u => {
            console.log(`User: ${u.name}, Phone: ${u.phone}, Avatar: ${u.avatar}, Raw Avatar (toObject): ${u.toObject({getters: false}).avatar}`);
        });
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkUsers();
