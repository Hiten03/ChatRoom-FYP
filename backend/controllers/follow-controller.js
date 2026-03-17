const followService = require('../services/follow-service');
const userService = require('../services/user-service');
const UserDto = require('../dtos/user-dto');

class FollowController {
    // POST /api/follow/:userId
    async followUser(req, res) {
        try {
            const followerId = req.user._id;
            const followingId = req.params.userId;

            // Check if user exists
            const followingUser = await userService.findUser({ _id: followingId });
            if (!followingUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            await followService.followUser(followerId, followingId);

            // Emit real-time notification to the followed user
            try {
                const { globalSocketUserMapping, io } = require('../server');
                const ACTIONS = require('../actions');
                
                if (globalSocketUserMapping.has(followingId)) {
                    const followerProfile = await userService.findUser({ _id: followerId });
                    const followerDto = new UserDto(followerProfile);
                    
                    const targetSocketIds = Array.from(globalSocketUserMapping.get(followingId));
                    io.to(targetSocketIds).emit(ACTIONS.FOLLOWED, {
                        follower: followerDto
                    });
                }
            } catch (err) {
                console.error('Failed to emit follow notification:', err);
            }

            return res.json({ success: true, message: 'Successfully followed user' });
        } catch (error) {
            if (error.message === 'You cannot follow yourself' || error.message === 'You are already following this user') {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    // DELETE /api/follow/:userId
    async unfollowUser(req, res) {
        try {
            const followerId = req.user._id;
            const followingId = req.params.userId;

            const deleted = await followService.unfollowUser(followerId, followingId);
            if (deleted) {
                // If they were in a social room together, the one who just got unfollowed 
                // might need to be kicked if the room belongs to the unfollower, OR
                // if the room belongs to the person who got unfollowed.
                // It's easiest to emit a 'mutual-follow-broken' event to BOTH users' global sockets.
                // Their frontend can check if the current room is social and if the host is the other person.
                try {
                    const { globalSocketUserMapping, io } = require('../server');
                    
                    const notifyIds = [followerId.toString(), followingId.toString()];
                    for (const uId of notifyIds) {
                        if (globalSocketUserMapping.has(uId)) {
                            const socketIds = Array.from(globalSocketUserMapping.get(uId));
                            io.to(socketIds).emit('mutual-follow-broken', {
                                userA: followerId.toString(),
                                userB: followingId.toString()
                            });
                        }
                    }
                } catch(err) {
                    console.error('Failed to emit mutual-follow-broken:', err);
                }

                return res.json({ success: true, message: 'Successfully unfollowed user' });
            } else {
                return res.status(400).json({ message: 'You are not following this user' });
            }
        } catch (error) {
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    // GET /api/follow/:userId/status
    async getFollowStatus(req, res) {
        try {
            const followerId = req.user._id;
            const followingId = req.params.userId;

            const isFollowing = await followService.isFollowing(followerId, followingId);
            return res.json({ isFollowing });
        } catch (error) {
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    // GET /api/follow/:userId/followers
    async getFollowers(req, res) {
        try {
            const userId = req.params.userId;
            const followerIds = await followService.getFollowerIds(userId);
            
            // Get full user profiles
            const followers = await userService.findUsers({ _id: { $in: followerIds }});
            const followersDto = followers.map(user => new UserDto(user));
            
            return res.json({ followers: followersDto });
        } catch (error) {
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    // GET /api/follow/:userId/following
    async getFollowing(req, res) {
        try {
            const userId = req.params.userId;
            const followingIds = await followService.getFollowingIds(userId);
            
            // Get full user profiles
            const following = await userService.findUsers({ _id: { $in: followingIds }});
            const followingDto = following.map(user => new UserDto(user));
            
            return res.json({ following: followingDto });
        } catch (error) {
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    // GET /api/follow/mutual
    async getMutualFollowers(req, res) {
        try {
            const userId = req.user._id; // Must be authenticated user
            const mutualIds = await followService.getMutualFollowerIds(userId);
            
            // Get full user profiles
            const mutuals = await userService.findUsers({ _id: { $in: mutualIds }});
            const mutualsDtos = mutuals.map(user => new UserDto(user));
            
            return res.json({ mutuals: mutualsDtos });
        } catch (error) {
            console.error('Error fetching mutual followers:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}

module.exports = new FollowController();
