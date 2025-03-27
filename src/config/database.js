const mongoose = require('mongoose');
const DeviceInfo = require('../models/deviceInfo.model');
const Application = require('../models/application.model');
const Configuration = require('../models/configuration.model');
require("dotenv").config()

const connectDatabase = async () => {
    try {
        const databaseConfig = "mongodb://127.0.0.1/KmaMdm";
        const connect = await mongoose.connect(databaseConfig);
        console.log(`da ket noi mongodb: ${connect.connection.host}`);

        // Tạo dữ liệu giả
        createFakeData();
    } catch (error) {
        console.log('chua the ket noi toi mongodb');
        console.log(error);
    }
}

const createFakeData = async () => {
    try {
        // Kiểm tra và tạo device nếu chưa có
        let device = await DeviceInfo.findOne();
        if (!device) {
            device = await DeviceInfo.create({
                deviceId: '001',
                deviceName: 'Test Device'
            });
        }

        // Kiểm tra và tạo ứng dụng nếu chưa có
        let app = await Application.findOne();
        let app2 = await Application.findOne();
        if (!app) {
            app = await Application.create({
                name: 'Chrome',
                pkg: 'com.android.chrome',
                version: '1.0.1'
            });
            app2 = await Application.create({
                name: 'Settings',
                pkg: 'com.android.settings',
                version: '1.0.0'
            });
        }

        // Kiểm tra và tạo config nếu chưa có
        let config = await Configuration.findOne();
        if (!config) {
            config = await Configuration.create({
                device: device.deviceId,
                allowedApplications: [app._id, app2._id]
            });
        }

        console.log('Fake data created successfully!');
    } catch (error) {
        console.error('Error creating fake data:', error);
    } finally {
        // mongoose.disconnect();
    }
};

module.exports = connectDatabase;