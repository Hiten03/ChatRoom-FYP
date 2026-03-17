const UserModel = require('../models/user-model');
class UserService {
    async findUser(filter) {
        const user = await UserModel.findOne(filter);
        return user;
    }

    async findUsers(filter) {
        const users = await UserModel.find(filter);
        return users;
    }

    async createUser(data) {
        const user = await UserModel.create(data);
        return user;
    }
}

module.exports = new UserService();