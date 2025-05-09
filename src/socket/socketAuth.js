const AUTH_TIMEOUT = 5000; // 5 seconds

const socketAuth = (socket, next) => {
    const timeoutId = setTimeout(() => {
        next(new Error('Authentication timeout'));
    }, AUTH_TIMEOUT);

    try {
        const hostToken = socket.handshake.auth.hostToken;
        const clientToken = socket.handshake.auth.clientToken;

        if (!hostToken && !clientToken) throw new Error('NO_TOKEN_FOUND');

        if (clientToken) {
            socket.data.isHost = false;
            socket.data.isClient = true;
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