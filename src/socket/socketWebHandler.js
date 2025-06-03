const PushMessage = require("../models/push_message.model");
const Device = require("../models/device.model");
const { getMobileSocketByDeviceId } = require("./socketUtils");

const socketWebHandler = (io, socket) => {
    socket.on("web:send:view_device_status", async (data, callback) => {
        console.log("web:send:view_device_status", data);
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
        console.log("deviceSocket.id", deviceSocket.id);
        deviceSocket.timeout(3000).emit("mobile:receive:view_device_status", {
            webSocketId: socket.id,
        }, (err, response) => {
            if (err) {
                console.error("Error receiving device status:", err);
                callback({
                    status: "error",
                    message: "Thiết bị không phản hồi ( timeout )",
                });
                return;
            }
            if (response && response.status === "success") {
                if (!response.data || !response.data.deviceStatus) {
                    console.error("No data in device status response:", response);
                    callback({
                        status: "error",
                        message: "Không có dữ liệu trạng thái thiết bị",
                    });
                    return;
                }
                console.log("Device status response:", response.data.deviceStatus);
                callback({
                    status: "success",
                    data: JSON.parse(response.data.deviceStatus),
                });
            } else {
                console.error("Error in device status response:", response);
                callback({
                    status: "error",
                    message: response.message || "Lỗi khi nhận trạng thái thiết bị",
                });
                return;
            }
        });
    })

    // Push message handler
    socket.on("web:send:get_push_messages", async (data, callback) => {
        try {
            const pushMessages = await PushMessage.find()
                // sort by createdAt desc
                .sort({ createdAt: -1 })
                .lean();
            callback({
                status: "success",
                message: "Lấy tin nhắn đẩy thành công",
                data: pushMessages,
            })
        } catch (error) {
            console.error("Error fetching push messages:", error);
            callback({
                status: "error",
                message: "Lỗi khi lấy tin nhắn đẩy: " + error.message,
            })
        }
    })

    socket.on("web:send:push_message", async (message, callback) => {
        try {
            console.log("web:send:push_message", message);
            const { deviceId, messageType, payload } = message;
            if (!deviceId || !messageType) {
                callback({
                    status: "error",
                    message: "Thiếu thông tin bắt buộc ( deviceId, messageType )",
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
                    deviceSocket.timeout(3000).emit("mobile:receive:push_messages", {
                        webSocketId: socket.id,
                        messages: uniqueMessages,
                    }, async (err, response) => {
                        if (err) {
                            console.error("Error sending push messages:", err);
                            callback({
                                status: "error",
                                message: "Lỗi khi gửi tin nhắn đẩy: " + err.message + ". Tin nhắn sẽ được gửi khi thiết bị kết nối lại",
                            });
                            return;
                        }
                        if (response && response.status === "success") {
                            console.log("Push messages sent successfully:", response);
                            // set messages status to sent
                            try {
                                let promises = uniqueMessages.map((message) => {
                                    return PushMessage.findByIdAndUpdate(
                                        message._id,
                                        { status: "sent" },
                                        { new: false }
                                    );
                                });
                                await Promise.all(promises);
                                callback({
                                    status: "success",
                                    message: "Tin nhắn đẩy đã được gửi thành công",
                                    data: savedMessage.toObject(),
                                });
                            } catch (updateError) {
                                console.error("Error updating push messages status:", updateError);
                                callback({
                                    status: "error",
                                    message: "Tin nhắn đã được xử lý nhưng lỗi khi cập nhật trạng thái tin nhắn đẩy: " + updateError.message,
                                });
                            }
                        } else {
                            console.error("Error in push messages response:", response);
                            callback({
                                status: "error",
                                message: response.message || "Lỗi khi gửi tin nhắn đẩy",
                            });
                        }
                    });
                } else {
                    console.warn("No unique messages found for deviceId:", deviceId);
                    callback({
                        status: "warning",
                        message: "Không có tin nhắn đẩy nào để gửi ( đây là bug )",
                    })
                }
            } else {
                console.warn("Device socket not found for deviceId:", deviceId);
                callback({
                    status: "warning",
                    message: "Thiết bị không trực tuyến, tin nhắn sẽ được gửi khi thiết bị kết nối lại",
                })
            }
        } catch (error) {
            console.error("Error sending push message:", error);
            callback({
                status: "error",
                message: "Lỗi khi gửi tin nhắn đẩy: " + error.message,
            });
        }
    })

    socket.on("web:send:reboot", async (data, callback) => {
        console.log("web:send:reboot", data);
        try {
            const { deviceId } = data;
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
            device.reboot = true;
            device.rebootRequested = new Date();
            device.rebootConfirmed = null;
            await device.save();

            let deviceSocket = await getMobileSocketByDeviceId(io, deviceId);
            if (deviceSocket) {
                deviceSocket.timeout(3000).emit("mobile:receive:push_messages", {
                    webSocketId: "", // dont need to send to web
                    messages: [
                        {
                            messageType: "configUpdated",
                        },
                    ],
                }, (err, response) => {
                    if (err || response.status === "error") {
                        callback({
                            status: "success",
                            message: "Thiết bị không phản hồi ( timeout ), yêu cầu khởi động lại sẽ được gửi khi thiết bị cập nhật cấu hình",
                            device: device,
                        });
                        return;
                    }
                    console.log("Reboot request response:", response);
                    callback({
                        status: "success",
                        message: "Yêu cầu khởi động lại đã được gửi đến thiết bị",
                        device: device,
                    });
                });
            } else {
                callback({
                    status: "success",
                    message: "Thiết bị không trực tuyến, yêu cầu khởi động lại sẽ được gửi khi thiết bị cập nhật cấu hình",
                    device: device,
                })
            }
        } catch (error) {
            console.error("Error sending reboot command:", error);
            callback({
                status: "error",
                message: "Lỗi khi gửi yêu cầu khởi động lại: " + error.message,
            });
        }
    })

    socket.on("web:send:factory_reset", async (data, callback) => {
        try {
            console.log("web:send:factory_reset", data);
            const { deviceId } = data;
            if (!deviceId) {
                callback({
                    status: "error",
                    message: "Thiếu thông tin bắt buộc ( deviceId )",
                });
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
            device.factoryReset = true;
            device.factoryResetRequested = new Date();
            device.factoryResetConfirmed = null;
            await device.save();

            let deviceSocket = await getMobileSocketByDeviceId(io, deviceId);
            if (deviceSocket) {
                deviceSocket.timeout(3000).emit("mobile:receive:push_messages", {
                    webSocketId: "", // dont need to send to web
                    messages: [
                        {
                            messageType: "configUpdated",
                        },
                    ],
                }, (err, response) => {
                    if (err || response.status === "error") {
                        callback({
                            status: "success",
                            message: "Thiết bị không phản hồi ( timeout ), yêu cầu khôi phục cài đặt gốc sẽ được gửi khi thiết bị cập nhật cấu hình",
                            device: device,
                        });
                        return;
                    }
                    console.log("Factory reset request response:", response);
                    callback({
                        status: "success",
                        message: "Yêu cầu khôi phục cài đặt gốc đã được gửi đến thiết bị",
                        device: device,
                    });
                });
            } else {
                console.warn("Device socket not found for deviceId:", deviceId);
                callback({
                    status: "success",
                    message: "Thiết bị không trực tuyến, yêu cầu khôi phục cài đặt gốc sẽ được gửi khi thiết bị cập nhật cấu hình",
                    device: device,
                })
            }
        } catch (error) {
            console.error("Error sending factory reset command:", error);
            callback({
                status: "error",
                message: "Lỗi khi gửi yêu cầu khôi phục cài đặt gốc: " + error.message,
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

        let deviceSocket = await getMobileSocketByDeviceId(io, deviceId);
        if (deviceSocket) {
            deviceSocket.timeout(3000).emit("mobile:receive:push_messages", {
                webSocketId: "", // dont need to send to web
                messages: [
                    {
                        messageType: "configUpdated",
                    },
                ],
            }, (err, response) => {
                if (err || response.status === "error") {
                    callback({
                        status: "success",
                        message: "Thiết bị không phản hồi ( timeout ), yêu cầu cập nhật mật khẩu sẽ được gửi khi thiết bị cập nhật cấu hình",
                        device: device,
                    });
                    return;
                }
                console.log("Change password request response:", response);
                callback({
                    status: "success",
                    message: "Yêu cầu cập nhật mật khẩu đã được gửi đến thiết bị",
                    device: device,
                });
            });
        } else {
            console.warn("Device socket not found for deviceId:", deviceId);
            callback({
                status: "success",
                message: "Thiết bị không trực tuyến, yêu cầu cập nhật mật khẩu sẽ được gửi khi thiết bị cập nhật cấu hình",
                device: device,
            });
        }
    })

    socket.on("web:send:lock_device", async (data, callback) => {
        try {
            console.log("web:send:lock_device", data);
            const { deviceId, lockMessage } = data;
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
            device.lock = true;
            device.lockMessage = lockMessage || "Thiết bị đã bị khóa";
            await device.save();

            let deviceSocket = await getMobileSocketByDeviceId(io, deviceId);
            if (deviceSocket) {
                deviceSocket.timeout(3000).emit("mobile:receive:push_messages", {
                    webSocketId: "", // dont need to send to web
                    messages: [
                        {
                            messageType: "configUpdated",
                        },
                    ],
                }, (err, response) => {
                    if (err || response.status === "error") {
                        console.error("Error sending lock command:", response.message);
                        callback({
                            status: "success",
                            message: "Thiết bị không phản hồi ( timeout ), yêu cầu khóa sẽ được gửi khi thiết bị cập nhật cấu hình",
                            device: device,
                        });
                        return;
                    }
                    console.log("Lock request response:", response);
                    callback({
                        status: "success",
                        message: "Yêu cầu khóa đã được gửi đến thiết bị",
                        device: device,
                    });
                });
            } else {
                console.warn("Device socket not found for deviceId:", deviceId);
                callback({
                    status: "success",
                    message: "Thiết bị không trực tuyến, yêu cầu khóa sẽ được gửi khi thiết bị cập nhật cấu hình",
                    device: device,
                });
            }
        } catch (error) {
            console.error("Error sending lock command:", error);
            callback({
                status: "error",
                message: "Lỗi khi gửi yêu cầu khóa thiết bị: " + error.message,
            });
        }
    })

    socket.on("web:send:unlock_device", async (data, callback) => {
        try {
            console.log("web:send:unlock_device", data);
            const { deviceId } = data;
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
            device.lock = false;
            device.lockMessage = "";
            await device.save();

            let deviceSocket = await getMobileSocketByDeviceId(io, deviceId);
            if (deviceSocket) {
                deviceSocket.timeout(3000).emit("mobile:receive:push_messages", {
                    webSocketId: "", // dont need to send to web
                    messages: [
                        {
                            messageType: "configUpdated",
                        },
                    ],
                }, (err, response) => {
                    if (err || response.status === "error") {
                        callback({
                            status: "success",
                            message: "Thiết bị không phản hồi ( timeout ), yêu cầu mở khóa sẽ được gửi khi thiết bị cập nhật cấu hình",
                            device: device,
                        });
                        return;
                    }
                    console.log("Unlock request response:", response);
                    callback({
                        status: "success",
                        message: "Yêu cầu mở khóa đã được gửi đến thiết bị",
                        device: device,
                    });
                });
            } else {
                console.warn("Device socket not found for deviceId:", deviceId);
                callback({
                    status: "success",
                    message: "Thiết bị không trực tuyến, yêu cầu mở khóa sẽ được gửi khi thiết bị cập nhật cấu hình",
                    device: device,
                })
            }
        } catch (error) {
            console.error("Error sending unlock command:", error);
            callback({
                status: "error",
                message: "Lỗi khi gửi yêu cầu mở khóa thiết bị: " + error.message,
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
        // we need to wait for the user confirmation ( max 10s )
        deviceSocket.timeout(12000).emit("mobile:receive:request_remote_control", {
            webSocketId: socket.id,
        }, (err, response) => {
            if (err) {
                console.error("Error requesting remote control:", err);
                callback({
                    status: "error",
                    message: "Thiết bị không phản hồi ( timeout )",
                });
                return;
            }
            if (response && response.status === "success") {
                console.log("Remote control request response:", response);
                callback({
                    status: "success",
                    message: "Ứng dụng điều khiển từ xa đã được mở",
                });
            } else {
                console.error("Error in remote control request response:", response);
                callback({
                    status: "error",
                    message: response.message || "Lỗi khi gửi yêu cầu điều khiển từ xa",
                });
                return;
            }
        });
    })
}

module.exports = {
    socketWebHandler
}