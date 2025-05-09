const SOCKET_TIMEOUT = 15000; // Untill Android app updates

const socketMobileHandler = (io, socket) => {
    socket.join(socket.data.deviceId);
}

module.exports = {
    socketMobileHandler
}