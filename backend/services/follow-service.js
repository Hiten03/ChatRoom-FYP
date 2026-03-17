const FollowModel = require('../models/follow-model');
const mongoose = require('mongoose');

class FollowService {
    async followUser(followerId, followingId) {
        if (String(followerId) === String(followingId)) {
            throw new Error('You cannot follow yourself');
        }
        
        try {
            await FollowModel.create({
                followerId: new mongoose.Types.ObjectId(followerId),
                followingId: new mongoose.Types.ObjectId(followingId)
            });
            // Return updated count
            return await this.getFollowerCount(followingId);
        } catch (error) {
            // MongoDB duplicate key error code is 11000
            if (error.code === 11000) {
                throw new Error('You are already following this user');
            }
            throw error;
        }
    }

    async getFollowerCount(userId) {
        return await FollowModel.countDocuments({ 
            followingId: new mongoose.Types.ObjectId(userId) 
        });
    }

    async unfollowUser(followerId, followingId) {
        const result = await FollowModel.deleteOne({ 
            followerId: new mongoose.Types.ObjectId(followerId), 
            followingId: new mongoose.Types.ObjectId(followingId) 
        });
        
        // Return updated count and whether it was deleted
        const count = await this.getFollowerCount(followingId);
        return { deleted: result.deletedCount > 0, count };
    }

    async getFollowerIds(userId) {
        const follows = await FollowModel.find({ 
            followingId: new mongoose.Types.ObjectId(userId) 
        }).select('followerId');
        return follows.map(f => f.followerId);
    }

    async getFollowingIds(userId) {
        const follows = await FollowModel.find({ 
            followerId: new mongoose.Types.ObjectId(userId) 
        }).select('followingId');
        return follows.map(f => f.followingId);
    }

    async isFollowing(followerId, followingId) {
        if (!followerId || !followingId) return false;
        try {
            const follow = await FollowModel.findOne({ 
                followerId: new mongoose.Types.ObjectId(followerId), 
                followingId: new mongoose.Types.ObjectId(followingId) 
            });
            return !!follow;
        } catch (err) {
            return false;
        }
    }

    async areMutualFollows(userAId, userBId) {
        if (!userAId || !userBId) return false;
        try {
            const aFollowsB = await FollowModel.findOne({ 
                followerId: new mongoose.Types.ObjectId(userAId), 
                followingId: new mongoose.Types.ObjectId(userBId) 
            });
            const bFollowsA = await FollowModel.findOne({ 
                followerId: new mongoose.Types.ObjectId(userBId), 
                followingId: new mongoose.Types.ObjectId(userAId) 
            });
            return !!(aFollowsB && bFollowsA);
        } catch (err) {
            return false;
        }
    }

    async getMutualFollowerIds(userId) {
        if (!userId) return [];
        try {
            // Find users that this user follows
            const following = await this.getFollowingIds(userId);
            
            // Find users that follow this user
            const followers = await this.getFollowerIds(userId);
            
            // Convert to strings for intersection
            const followingStr = following.map(id => id.toString());
            const followersStr = followers.map(id => id.toString());
            
            // Intersect to find mutuals
            const mutualStr = followingStr.filter(id => followersStr.includes(id));
            
            // Convert back to ObjectIds
            return mutualStr.map(id => new mongoose.Types.ObjectId(id));
        } catch (err) {
            return [];
        }
    }
}

module.exports = new FollowService();
