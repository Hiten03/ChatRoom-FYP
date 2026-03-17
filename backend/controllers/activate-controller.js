const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');
const userService = require('../services/user-service');
const UserDto = require('../dtos/user-dto');

class ActivateController {
    async activate(req, res) {
        // Activation logic
        const { name, avatar } = req.body;
        if (!name || !avatar) {
            return res.status(400).json({ message: 'All fields are required!' });
        }

        // Image Base64
        const buffer = Buffer.from(
            avatar.replace(/^data:image\/(png|jpg|jpeg);base64,/, ''),
            'base64'
        );
        const imagePath = `${Date.now()}-${Math.round(
            Math.random() * 1e9
        )}.png`;
        // 32478362874-3242342342343432.png

        // try {
        //     const jimResp = await Jimp.read(buffer);
        //     jimResp
        //         .resize(150, Jimp.AUTO)
        //         .write(path.resolve(__dirname, `../storage/${imagePath}`));
        // } catch (err) {
        //     res.status(500).json({ message: 'Could not process the image' });
        // }


        try {
            // 1. Ensure the 'storage' folder actually exists
            const storagePath = path.resolve(__dirname, '../storage');
            if (!fs.existsSync(storagePath)) {
                fs.mkdirSync(storagePath, { recursive: true });
            }

            // 2. Write the raw buffer directly to disk (no Jimp needed)
            fs.writeFileSync(path.resolve(storagePath, imagePath), buffer);
            console.log('Image saved for:', imagePath);

        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Could not process the image' });
        }



        const userId = req.user._id;
        console.log('Activating user with ID:', userId);
        // Update user
        try {
            const user = await userService.findUser({ _id: userId });
            if (!user) {
                console.log('User not found in database');
                return res.status(404).json({ message: 'User not found!' });
            }
            console.log('User found, updating details...');
            user.activated = true;
            user.name = name;
            user.avatar = `/storage/${imagePath}`;
            await user.save();
            console.log('User saved successfully');
            res.json({ user: new UserDto(user), auth: true });
        } catch (err) {
            console.error('Activation error:', err);
            return res.status(500).json({ message: 'Something went wrong!' });
        }
    }
}

module.exports = new ActivateController();