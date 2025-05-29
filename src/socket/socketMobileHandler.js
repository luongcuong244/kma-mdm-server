const PushMessage = require("../models/push_message.model");
const { getSocketById } = require("./socketUtils");

const socketMobileHandler = async (io, socket) => {
    if (!socket.data.deviceId) {
        console.log("deviceId not found");
        return;
    }
    
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

    // Push message handler
    // Send push message to mobile
    // Get all messages for this device
    const messsages = await PushMessage.find({
        deviceId: socket.data.deviceId,
        status: "pending",
    })
        .sort({ createdAt: -1 })
        .lean();
    // Get messages that unique by messageType and with createdAt desc
    const uniqueMessages = messsages.reduce((acc, message) => {
        if (!acc.some((msg) => msg.messageType === message.messageType)) {
            acc.push(message);
        }
        return acc;
    }, []);

    if (uniqueMessages.length > 0) {
        console.log("socket-mobile-handler- uniqueMessages", uniqueMessages.length);
        socket.emit("mobile:receive:push_messages", {
            webSocketId: "",
            messages: uniqueMessages,
        });
    }

    socket.on("mobile:send:push_messages", async (data) => {
        let { webSocketId, messages } = data;
        messages = JSON.parse(messages);
        if (!messages) {
            return;
        }

        // Set status to sent
        let promises = messages.map((message) => {
            return PushMessage.findByIdAndUpdate(
                message._id,
                { status: "sent" },
                { new: false }
            );
        });
        await Promise.all(promises);

        const webSocket = await getSocketById(io, webSocketId);
        if (webSocket) {
            webSocket.emit("web:receive:push_messages", {
                status: "success",
                data: messages,
                message: "Tin nhắn đã được gửi",
            });
        }
    })

    socket.on("mobile:send:accept_remote_control", async (data) => {
        const { webSocketId, errorMessage, deviceId } = data;

        if (!webSocketId) {
            return;
        }

        const webSocket = await getSocketById(io, webSocketId);
        if (webSocket) {
            if (errorMessage) {
                webSocket.emit("web:receive:accept_remote_control", {
                    status: "error",
                    message: errorMessage,
                });
                return;
            }
            if (deviceId !== socket.data.deviceId) {
                webSocket.emit("web:receive:accept_remote_control", {
                    status: "error",
                    message: "Mã thiết bị không khớp với mã thiết bị của socket",
                });
                return;
            }
            webSocket.emit("web:receive:accept_remote_control", {
                status: "success",
                deviceId: socket.data.deviceId,
                message: "Yêu cầu điều khiển từ xa đã được xử lý",
            });
        } else {
            console.log("webSocket not found");
        }
    })
}

module.exports = {
    socketMobileHandler
}