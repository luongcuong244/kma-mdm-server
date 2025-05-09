const { getSocketById } = require("./socketUtils");

const socketMobileHandler = (io, socket) => {
    socket.join(socket.data.deviceId);
    socket.on("mobile:send:device_status", async (data) => {
        const { webSocketId, deviceStatus } = data;
        if (!webSocketId || !deviceStatus) {
            socket.emit("web:receive:device_status", {
                status: "error",
                message: "Lỗi dữ liệu",
            });
            return;
        }
        console.log("webSocketId", webSocketId);
        const webSocket = await getSocketById(io, webSocketId);
        if (webSocket) {
            webSocket.emit("web:receive:device_status", {
                status: "success",
                data: {
                    deviceStatus: JSON.parse(deviceStatus),
                },
                message: "Trạng thái thiết bị đã được gửi",
            });
        }
    });
}

module.exports = {
    socketMobileHandler
}