const globalSocketUserMapping = new Map(); // { userId -> Set<socketId> }
const socketUserMapping = {}; // { socketId -> userObject }

let io = null;

const setIO = (ioInstance) => {
    io = ioInstance;
};

const getIO = () => {
    return io;
};

module.exports = {
    globalSocketUserMapping,
    socketUserMapping,
    setIO,
    getIO
};
