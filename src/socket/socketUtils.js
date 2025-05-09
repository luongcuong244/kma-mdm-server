const MAX_ROOM_FETCH_RETRIES = 3;

const getMobileSocketByDeviceId = async (io, deviceId) => {
    let retries = 0;
    while (retries < MAX_ROOM_FETCH_RETRIES) {
        try {
            const socketsInDeviceId = await io.in(deviceId).fetchSockets();
            return socketsInDeviceId[0];
        } catch (error) {
            retries++;
            if (retries === MAX_ROOM_FETCH_RETRIES) return null;

            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    return null;
}

const getSocketById = async (io, socketId) => {
    let retries = 0;
    while (retries < MAX_ROOM_FETCH_RETRIES) {
        try {
            const socketsInDeviceId = await io.sockets.sockets.get(socketId);
            return socketsInDeviceId;
        } catch (error) {
            retries++;
            if (retries === MAX_ROOM_FETCH_RETRIES) return null;

            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    return null;
}

module.exports = {
    getMobileSocketByDeviceId,
    getSocketById
}