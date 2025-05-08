const AUTH_TIMEOUT = 5000; // 5 seconds

const socketAuth = (socket, next) => {
    const timeoutId = setTimeout(() => {
        next(new Error('Authentication timeout'));
    }, AUTH_TIMEOUT);

    try {
        const hostToken = socket.handshake.auth.hostToken;
        const clientId = socket.handshake.auth.clientId;

        if (!hostToken && !clientId) throw new Error('NO_TOKEN_FOUND');

        if (clientId) {
            socket.data.isHost = false;
            socket.data.isClient = true;
            socket.data.clientId = clientId;

            clearTimeout(timeoutId);
            next();
            return;
        }

        if (hostToken) {
            socket.data.isHost = true;
            socket.data.isClient = false;
            socket.data.deviceId = hostToken;
            clearTimeout(timeoutId);
            next();
        }

    } catch (cause) {
        console.warn(`ERROR:TOKEN_VERIFICATION_FAILED:${cause.message}`);
        clearTimeout(timeoutId);
        next(new Error(`ERROR:TOKEN_VERIFICATION_FAILED:${cause.message}`));
    }
}

module.exports = {
    socketAuth
}