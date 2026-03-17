import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    withCredentials: true,
    headers: {
        'Content-type': 'application/json',
        Accept: 'application/json',
    },
});

// List of all the endpoints
export const sendOtp = (data) => api.post('/api/send-otp', data);
export const verifyOtp = (data) => api.post('/api/verify-otp', data);
export const activate = (data) => api.post('/api/activate', data);
export const logout = () => api.post('/api/logout');
export const createRoom = (data) => api.post('/api/rooms', data);
export const getAllRooms = () => api.get('/api/rooms');
export const getRoom = (roomId) => api.get(`/api/rooms/${roomId}`);
export const deleteRoom = (roomId) => api.delete(`/api/rooms/${roomId}`);
export const verifyRoomPassword = (roomId, password) => api.post(`/api/rooms/${roomId}/verify`, { password });
export const updateAvatar = (data) => api.post('/api/user/avatar', data);
export const updateThemePreference = (data) => api.put('/api/user/preference', data);
export const updateProfile = (data) => api.put('/api/user/profile', data);
export const getProfile = (userId) => api.get(`/api/user/${userId}/profile`);

// Follow Endpoints
export const followUser = (userId) => api.post(`/api/follow/${userId}`);
export const unfollowUser = (userId) => api.delete(`/api/follow/${userId}`);
export const getFollowStatus = (userId) => api.get(`/api/follow/${userId}/status`);
export const getFollowers = (userId) => api.get(`/api/follow/${userId}/followers`);
export const getFollowing = (userId) => api.get(`/api/follow/${userId}/following`);
export const getMutualFollowers = () => api.get(`/api/follow/mutual`);

//Interceptors
api.interceptors.response.use(
    (config) => {
        return config;
    },
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && originalRequest && !originalRequest._isRetry) {

            originalRequest._isRetry = true;
            try {
                await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/refresh`,
                    {
                        withCredentials: true,
                    }
                );

                return api.request(originalRequest);
            } catch (error) {
                console.log(error.message);
            }
        }
        throw error;
    })



export default api;