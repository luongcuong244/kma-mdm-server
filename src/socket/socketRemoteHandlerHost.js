const logger = require('../logger.js');

const SOCKET_TIMEOUT = 15000; // Untill Android app updates

const socketRemoteHostHandler = (io, socket) => {

    // [STREAM:CREATE] ========================================================================================================

    const createStream = async (payload, callback) => {
        const event = '[STREAM:CREATE]';

        console.log('createStr--------------ds-ds-ds-d-------------------------------------------');

        if (socket.data.handshakeInProgress) {
            console.log('createStream--------------HANDSHAKE_IN_PROGRESS-------------------------------------------');
            return callback({ status: 'ERROR:HANDSHAKE_IN_PROGRESS' });
        }

        try {
            socket.data.handshakeInProgress = true;

            if (!payload || !payload.requestedStreamId) {
                console.log('createStream--------------NO_RequestedStreamId-------------------------------------------');
                callback({ status: 'ERROR:NO_JWT_SET' });
                return;
            }

            if (socket.data.streamId) {
                console.log('createStream--------------STREAM_ID_ALREADY_SET-------------------------------------------');
                callback({ status: 'ERROR:STREAM_ID_ALREADY_SET' });
                return;
            }

            let streamId = payload.requestedStreamId.trim();
            
            if (!socket.connected) {
                console.log('createStream--------------SOCKET_NOT_CONNECTED-------------------------------------------');
                return;
            }

            console.log('createStream--------------Set as host for stream-------------------------------------------');

            socket.removeAllListeners('STREAM:REMOVE');
            socket.on('STREAM:REMOVE', removeStream);

            socket.removeAllListeners('STREAM:START');
            socket.on('STREAM:START', startStream);

            socket.removeAllListeners('STREAM:STOP');
            socket.on('STREAM:STOP', stopStream);

            socket.removeAllListeners('HOST:OFFER');
            socket.on('HOST:OFFER', hostOffer);

            socket.removeAllListeners('HOST:CANDIDATE');
            socket.on('HOST:CANDIDATE', hostCandidate);

            socket.removeAllListeners('REMOVE:CLIENT');
            socket.on('REMOVE:CLIENT', removeClient);

            socket.data.streamId = streamId;
            // socket.data.pubKey = pubKey;
            socket.join(streamId);

            callback({ status: 'OK', streamId });
        } finally {
            socket.data.handshakeInProgress = false;
        }
    }

    socket.removeAllListeners('STREAM:CREATE');
    socket.on('STREAM:CREATE', createStream);

    // [STREAM:REMOVE] ========================================================================================================

    const removeStream = (callback) => {
        const event = '[STREAM:REMOVE]';

        logger.debug(JSON.stringify({ socket_event: event, socket: socket.id, message: 'New stream remove request' }));

        if (!socket.data.streamId) { //its ok, just ignore and notify host
            logger.warn(JSON.stringify({ socket_event: event, socket: socket.id, error: 'STREAM_ID_NOT_SET', message: 'Bad stream state' }));
            callback({ status: 'ERROR:STREAM_ID_NOT_SET' });
            return;
        }

        logger.debug(JSON.stringify({ socket_event: event, socket: socket.id, streamId: socket.data.streamId, message: `Removing stream Id: ${socket.data.streamId}` }));

        socket.to(socket.data.streamId).emit('REMOVE:STREAM'); //This is client only event, don't mix it with 'STREAM:REMOVE' from host
        io.socketsLeave(socket.data.streamId);

        socket.data.streamId = undefined;
        socket.data.pubKey = undefined;

        socket.removeAllListeners('STREAM:REMOVE');
        socket.removeAllListeners('STREAM:START');
        socket.removeAllListeners('STREAM:STOP');
        socket.removeAllListeners('HOST:OFFER');
        socket.removeAllListeners('HOST:CANDIDATES');
        socket.removeAllListeners('REMOVE:CLIENT');

        callback({ status: 'OK' });
    }

    // [STREAM:START] ========================================================================================================

    const startStream = async (payload, callback) => {
        const event = '[STREAM:START]';

        logger.debug(JSON.stringify({ socket_event: event, socket: socket.id, streamId: socket.data.streamId, payload, message: 'Stream start request' }));

        if (!payload || !payload.clientId) {
            logger.warn(JSON.stringify({ socket_event: event, socket: socket.id, error: 'NO_CLIENT_ID_SET', message: 'Bad stream start request' }));
            callback({ status: 'ERROR:NO_CLIENT_ID_SET' });
            return;
        }

        if (!socket.data.streamId) {
            logger.warn(JSON.stringify({ socket_event: event, socket: socket.id, error: 'NO_STREAM_ID_SET', message: 'Bad stream state' }));
            callback({ status: 'ERROR:NO_STREAM_ID_SET' });
            return;
        }

        if (payload.clientId === 'ALL') {
            socket.to(socket.data.streamId).emit('STREAM:START');
            callback({ status: 'OK' });
        } else {
            const socketsInStream = await io.in(socket.data.streamId).fetchSockets();
            const clientSocket = socketsInStream.find(item => item.data && item.data.clientId === payload.clientId);

            if (!clientSocket) {
                logger.warn(JSON.stringify({ socket_event: event, socket: socket.id, streamId: socket.data.streamId, clientId: payload.clientId, error: 'NO_CLIENT_FOUND', message: 'No client found' }));

                callback({ status: 'ERROR:NO_CLIENT_FOUND' });
                return;
            }

            callback({ status: 'OK' });

            if (!clientSocket.connected) {
                logger.warn(JSON.stringify({ socket_event: event, socket: socket.id, message: 'Client socket not connected. Ignoring.' }));
                return;
            }

            logger.debug(JSON.stringify({ socket_event: event, socket: socket.id, streamId: socket.data.streamId, clientId: payload.clientId, client_socket: clientSocket.id, message: 'Relaying to client' }));

            clientSocket.emit('STREAM:START');
        }
    }

    // [STREAM:STOP] ========================================================================================================

    const stopStream = (callback) => {
        const event = '[STREAM:STOP]';

        if (!socket.data.streamId) {
            logger.warn(JSON.stringify({ socket_event: event, socket: socket.id, error: 'NO_STREAM_ID_SET', message: 'Bad stream state' }));
            callback({ status: 'ERROR:NO_STREAM_ID_SET' });
            return;
        }

        logger.debug(JSON.stringify({ socket_event: event, socket: socket.id, streamId: socket.data.streamId, message: 'Stream stop request' }));

        socket.to(socket.data.streamId).emit('STREAM:STOP');

        callback({ status: 'OK' });
    }

    // [HOST:OFFER] ========================================================================================================

    const hostOffer = async (payload, callback) => {
        const event = '[HOST:OFFER]';

        if (!payload || !payload.clientId || !payload.offer) {
            console.log('hostOffer--------------EMPTY_OR_BAD_DATA-------------------------------------------');
            callback({ status: 'ERROR:EMPTY_OR_BAD_DATA' });
            return;
        }

        if (!socket.data.streamId) {
            logger.warn(JSON.stringify({ socket_event: event, socket: socket.id, error: 'NO_STREAM_ID_SET', message: 'Bad stream state' }));
            callback({ status: 'ERROR:NO_STREAM_ID_SET' });
            return;
        }

        const socketsInStream = await io.in(socket.data.streamId).fetchSockets();
        const clientSocket = socketsInStream.find(item => item.data && item.data.clientId === payload.clientId);

        if (!clientSocket) {
            logger.warn(JSON.stringify({ socket_event: event, socket: socket.id, streamId: socket.data.streamId, clientId: payload.clientId, error: 'NO_CLIENT_FOUND', message: 'No client found' }));
            callback({ status: 'ERROR:NO_CLIENT_FOUND' });
            return;
        }


        if (!clientSocket.connected) {
            logger.warn(JSON.stringify({ socket_event: event, socket: socket.id, message: 'Client socket not connected. Ignoring.' }));
            callback({ status: 'ERROR:NO_CLIENT_FOUND' });
            return;
        }

        logger.debug(JSON.stringify({ socket_event: event, socket: socket.id, streamId: socket.data.streamId, clientId: payload.clientId, client_socket: clientSocket.id, message: 'Relaying to client' }));

        clientSocket.timeout(SOCKET_TIMEOUT).emit('HOST:OFFER', { offer: payload.offer }, (err, response) => {
            if (err) {
                logger.warn(JSON.stringify({ socket_event: event, socket: socket.id, error: 'TIMEOUT_OR_NO_RESPONSE', message: 'Client error for HOST:OFFER => TIMEOUT_OR_NO_RESPONSE' }));
                callback({ status: 'ERROR:TIMEOUT_OR_NO_RESPONSE' });
                return;
            }

            if (!socket.connected) {
                logger.debug(JSON.stringify({ socket_event: event, socket: socket.id, clientId: payload.clientId, client_socket: clientSocket.id, message: 'HOST:OFFER Host socket disconnected. Ignoring' }));
                return;
            }

            logger.debug(JSON.stringify({ socket_event: event, socket: socket.id, streamId: socket.data.streamId, clientId: payload.clientId, client_socket: clientSocket.id, message: `HOST:OFFER Client response: ${response.status}` }));

            callback({ status: response.status });

            if (response.status !== 'OK') {
                logger.warn(JSON.stringify({ socket_event: event, socket: socket.id, streamId: socket.data.streamId, clientId: payload.clientId, client_socket: clientSocket.id, error: response.status, message: `Client error for HOST:OFFER => ${response.status}` }));
            }
        });
    }

    // [HOST:CANDIDATE] ========================================================================================================

    const hostCandidate = async (payload, callback) => {
        const event = '[HOST:CANDIDATE]';

        if (!payload || !payload.clientId || (!payload.candidate && !payload.candidates)) {
            console.log('hostCandidate--------------EMPTY_OR_BAD_DATA-------------------------------------------');
            callback({ status: 'ERROR:EMPTY_OR_BAD_DATA' });
            return;
        }

        if (!socket.data.streamId) {
            logger.warn(JSON.stringify({ socket_event: event, socket: socket.id, error: 'NO_STREAM_ID_SET', message: 'Bad stream state' }));
            callback({ status: 'ERROR:NO_STREAM_ID_SET' });
            return;
        }

        const socketsInStream = await io.in(socket.data.streamId).fetchSockets();
        const clientSocket = socketsInStream.find(item => item.data && item.data.clientId === payload.clientId);

        if (!clientSocket) {
            logger.warn(JSON.stringify({ socket_event: event, socket: socket.id, streamId: socket.data.streamId, clientId: payload.clientId, error: 'NO_CLIENT_FOUND', message: 'No client found' }));
            callback({ status: 'ERROR:NO_CLIENT_FOUND' });
            return;
        }

        if (!clientSocket.connected) {
            logger.warn(JSON.stringify({ socket_event: event, socket: socket.id, message: 'Client socket not connected. Ignoring.' }));
            callback({ status: 'ERROR:NO_CLIENT_FOUND' });
            return;
        }

        logger.debug(JSON.stringify({ socket_event: event, socket: socket.id, streamId: socket.data.streamId, clientId: payload.clientId, client_socket: clientSocket.id, message: 'Relaying to client' }));

        const candidates = payload.candidates ? payload.candidates : [payload.candidate];

        clientSocket.timeout(SOCKET_TIMEOUT).emit('HOST:CANDIDATE', { candidates }, (err, response) => {
            if (err) {
                logger.warn(JSON.stringify({ socket_event: event, socket: socket.id, error: 'TIMEOUT_OR_NO_RESPONSE', message: 'Client error for HOST:CANDIDATE => TIMEOUT_OR_NO_RESPONSE' }));
                callback({ status: 'ERROR:TIMEOUT_OR_NO_RESPONSE' });
                return;
            }

            if (!socket.connected) {
                logger.debug(JSON.stringify({ socket_event: event, socket: socket.id, clientId: payload.clientId, client_socket: clientSocket.id, message: 'HOST:CANDIDATE Host socket disconnected. Ignoring' }));
                return;
            }

            logger.debug(JSON.stringify({ socket_event: event, socket: socket.id, streamId: socket.data.streamId, clientId: payload.clientId, client_socket: clientSocket.id, message: `HOST:CANDIDATE Client response: ${response.status}` }));

            callback({ status: response.status });

            if (response.status !== 'OK') {
                logger.warn(JSON.stringify({ socket_event: event, socket: socket.id, streamId: socket.data.streamId, clientId: payload.clientId, client_socket: clientSocket.id, error: response.status, message: `Client error for HOST:CANDIDATE => ${response.status}` }));
            }
        });
    }

    // [REMOVE:CLIENT] ========================================================================================================

    const removeClient = async (payload, callback) => {
        const event = '[REMOVE:CLIENT]';

        if (!payload || !payload.clientId || !Array.isArray(payload.clientId)) {
            console.log('removeClient--------------EMPTY_OR_BAD_DATA-------------------------------------------');
            callback({ status: 'ERROR:EMPTY_OR_BAD_DATA' });
            return;
        }

        const streamId = socket.data.streamId;
        const allSockets = await io.fetchSockets();
        const clientSockets = allSockets.filter(item => item.data && item.data.isClient === true && payload.clientId.includes(item.data.clientId));

        if (clientSockets.length === 0) {
            logger.debug(JSON.stringify({ socket_event: event, socket: socket.id, streamId, message: 'No client found' }));
            callback({ status: 'OK' });
            return;
        }

        logger.warn(JSON.stringify({ socket_event: event, socket: socket.id, streamId, message: `Disconnecting clients [${payload.reason}]: ${clientSockets.length}` }));

        clientSockets.forEach(clientSocket => {
            if (clientSocket.connected) {
                clientSocket.rooms.forEach(room => { if (room != clientSocket.id) clientSocket.leave(room); });

                clientSocket.timeout(SOCKET_TIMEOUT).emit('REMOVE:CLIENT', (err, response) => {
                    if (err) {
                        logger.info(JSON.stringify({ socket_event: event, socket: clientSocket.id, error: 'TIMEOUT_OR_NO_RESPONSE', message: 'Client error for REMOVE:CLIENT => TIMEOUT_OR_NO_RESPONSE' }));
                        return;
                    }
                    logger.debug(JSON.stringify({ socket_event: event, socket: socket.id, streamId, clientId: clientSocket.data.clientId, client_socket: clientSocket.id, message: `REMOVE:CLIENT Client response: ${response.status}` }));
                });
            }
        });

        callback({ status: 'OK' });
    }
}

module.exports = {
    socketRemoteHostHandler
}