const axios = require('axios');
const fs = require('fs');

async function testUpload() {
    // Red dot base64
    const redDot = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    try {
        // We need an auth cookie. For testing, we'll try to use a local call if possible, or just test the controller logic.
        // Actually, let's just test the UserController logic directly in a script.
        const path = require('path');
        const UserController = require('./controllers/user-controller');
        
        const req = {
            body: { avatar: redDot },
            user: { _id: '67da67890123456789012345' } // Mock user ID
        };
        const res = {
            status: function(code) { this.statusCode = code; return this; },
            json: function(data) { this.data = data; return this; }
        };

        // We need to mock userService.findUser
        const userService = require('./services/user-service');
        const oldFindUser = userService.findUser;
        userService.findUser = async () => ({
            _id: '67da67890123456789012345',
            save: async () => console.log('User saved in mock')
        });

        await UserController.updateAvatar(req, res);
        
        console.log('Status code:', res.statusCode);
        console.log('Response data:', res.data);
        
        const savedPath = res.data.user.avatar.replace('http://localhost:5500', '');
        const fullPath = path.resolve(__dirname, '.' + savedPath);
        console.log('Checking file:', fullPath);
        
        if (fs.existsSync(fullPath)) {
            const stats = fs.statSync(fullPath);
            console.log('File size:', stats.size);
            if (stats.size > 18) {
                console.log('SUCCESS: File is larger than 18 bytes');
            } else {
                console.log('FAILURE: File is still small');
            }
        } else {
            console.log('FAILURE: File not found');
        }

        // Restore mock
        userService.findUser = oldFindUser;

    } catch (err) {
        console.error(err);
    }
}

testUpload();
