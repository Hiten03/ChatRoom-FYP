class UserDto {
    id;
    phone;
    name;
    avatar;
    activated;
    themePreference;
    bio;
    socials;
    followersCount;
    followingCount;
    roomsHosted;
    createdAt;

    constructor(user) {
        this.id = user._id;
        this.phone = user.phone;
        this.name = user.name;
        this.avatar = user.avatar
        this.activated = user.activated;
        this.themePreference = user.themePreference || 'dark';
        this.bio = user.bio || '';
        this.socials = user.socials || { twitter: '', instagram: '', linkedin: '' };
        this.followersCount = user.followersCount || 0;
        this.followingCount = user.followingCount || 0;
        this.roomsHosted = user.roomsHosted || 0;
        this.createdAt = user.createdAt;
    }
}

module.exports = UserDto;