const PushMessage = require("../models/push_message.model");
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

    // Push message handler
    socket.on("web:send:get_push_messages", async () => {
        try {
            const pushMessages = await PushMessage.find()
            // sort by createdAt desc
                .sort({ createdAt: -1 })
                .lean();
            socket.emit("web:receive:get_push_messages", {
                status: "success",
                data: pushMessages,
            });
        } catch (error) {
            console.error("Error fetching push messages:", error);
            socket.emit("web:receive:get_push_messages", {
                status: "error",
                message: "Lỗi khi lấy tin nhắn đẩy",
            });
        }
    })

    socket.on("web:send:push_message", async (message) => {
        console.log("web:send:push_message", message);
        const { deviceId, messageType, payload } = message;
        if (!deviceId || !messageType) {
            socket.emit("web:receive:push_message", {
                status: "error",
                message: "Thiếu thông tin bắt buộc",
            });
            return;
        }
        // Save push message to database
        const pushMessage = new PushMessage({
            deviceId,
            messageType,
            payload,
        });
        const savedMessage = await pushMessage.save();
        console.log("pushMessage", pushMessage);

        socket.emit("web:receive:push_message", {
            status: "success",
            data: savedMessage.toObject(),
        });

        let deviceSocket = await getMobileSocketByDeviceId(io, deviceId);
        if (deviceSocket) {
            // Get all messages for this device
            const messsages = await PushMessage.find({ 
                deviceId: deviceId,
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
                console.log("socket-web-handler-uniqueMessages", uniqueMessages);
                deviceSocket.emit("mobile:receive:push_messages", {
                    webSocketId: socket.id,
                    messages: uniqueMessages,
                });
            }
        }
    })
}

module.exports = {
    socketWebHandler
}