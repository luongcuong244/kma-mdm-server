const PushMessage = require("../models/push_message.model");
const Device = require("../models/device.model");
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

    socket.on("web:send:reboot", async (data) => {
        console.log("web:send:reboot", data);
        const { deviceId } = data;
        if (!deviceId) {
            socket.emit("web:receive:system_command", {
                error: "Thiếu thông tin bắt buộc",
            });
            return;
        }
        const device = await Device.findOne({ deviceId });
        if (!device) {
            socket.emit("web:receive:system_command", {
                error: "Thiết bị không tồn tại",
            });
            return;
        }
        device.reboot = true;
        device.rebootRequested = new Date();
        device.rebootConfirmed = null;
        await device.save();

        socket.emit("web:receive:system_command", {
            status: "success",
            message: "Yêu cầu khởi động lại đã được gửi đến thiết bị",
            device: device,
        })

        let deviceSocket = await getMobileSocketByDeviceId(io, deviceId);
        if (deviceSocket) {
            deviceSocket.emit("mobile:receive:push_messages", {
                webSocketId: "", // dont need to send to web
                messages: [
                    {
                        messageType: "configUpdated",
                    },
                ],
            });
        }
    })

    socket.on("web:send:factory_reset", async (data) => {
        console.log("web:send:factory_reset", data);
        const { deviceId } = data;
        if (!deviceId) {
            socket.emit("web:receive:system_command", {
                error: "Thiếu thông tin bắt buộc",
            });
            return;
        }
        const device = await Device.findOne({ deviceId });
        if (!device) {
            socket.emit("web:receive:system_command", {
                error: "Thiết bị không tồn tại",
            });
            return;
        }
        device.factoryReset = true;
        device.factoryResetRequested = new Date();
        device.factoryResetConfirmed = null;
        await device.save();

        socket.emit("web:receive:system_command", {
            status: "success",
            message: "Yêu cầu khôi phục cài đặt gốc đã được gửi đến thiết bị",
            device: device,
        })

        let deviceSocket = await getMobileSocketByDeviceId(io, deviceId);
        if (deviceSocket) {
            deviceSocket.emit("mobile:receive:push_messages", {
                webSocketId: "", // dont need to send to web
                messages: [
                    {
                        messageType: "configUpdated",
                    },
                ],
            });
        }
    })

    socket.on("web:send:change_device_password", async (data, callback) => {
        console.log("web:send:change_device_password", data);
        const { deviceId, newPassword } = data;
        if (!deviceId) {
            callback({
                status: "error",
                message: "Thiếu thông tin bắt buộc ( deviceId )",
            })
            return;
        }
        const device = await Device.findOne({ deviceId });
        if (!device) {
            callback({
                status: "error",
                message: "Thiết bị không tồn tại",
            });
            return;
        }
        device.passwordReset = newPassword;
        await device.save();

        callback({
            status: "success",
            message: "Mật khẩu thiết bị đã được cập nhật thành công",
        });

        let deviceSocket = await getMobileSocketByDeviceId(io, deviceId);
        if (deviceSocket) {
            deviceSocket.emit("mobile:receive:push_messages", {
                webSocketId: "", // dont need to send to web
                messages: [
                    {
                        messageType: "configUpdated",
                    },
                ],
            });
        }
    })

    socket.on("web:send:request_remote_control", async (data, callback) => {
        console.log("web:send:request_remote_control", data);
        const { deviceId } = data;
        if (!deviceId) {
            callback({
                status: "error",
                message: "Thiếu thông tin bắt buộc ( deviceId )",
            })
            return;
        }
        let deviceSocket = await getMobileSocketByDeviceId(io, deviceId);
        if (!deviceSocket) {
            callback({
                status: "error",
                message: "Thiết bị không trực tuyến",
            });
            return;
        }
        deviceSocket.emit("mobile:receive:request_remote_control", {
            webSocketId: socket.id,
        });
        callback({
            status: "success",
            message: "Yêu cầu điều khiển từ xa đã được gửi đến thiết bị",
        });
    })
}

module.exports = {
    socketWebHandler
}