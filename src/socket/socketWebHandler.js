const { getMobileSocketByDeviceId } = require("./socketUtils");

const socketWebHandler = (io, socket) => {
    socket.on("web:send:view_device_status", async (data) => {
        console.log("web:send:view_device_status", data);
        const { deviceId } = data;
        if (!deviceId) {
            socket.emit("web:receive:device_status", {
                status: "error",
                message: "Device ID là bắt buộc",
            });
            return;
        }
        let deviceSocket = await getMobileSocketByDeviceId(io, deviceId);
        if (!deviceSocket) {
            socket.emit("web:receive:device_status", {
                status: "error",
                message: "Thiết bị không trực tuyến",
            });
            return;
        }
        deviceSocket.emit("mobile:receive:view_device_status", {
            webSocketId: socket.id,
        });
    })
}

module.exports = {
    socketWebHandler
}