const mongoose = require('mongoose');
const DeviceInfo = require('../models/deviceInfo.model');
const Application = require('../models/application.model');
const Configuration = require('../models/configuration.model');
const ApplicationSetting = require('../models/application_setting.model');
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
    // remove all data
    await DeviceInfo.deleteMany();
    await Application.deleteMany();
    await Configuration.deleteMany();
    await ApplicationSetting.deleteMany();
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
        let app3 = await Application.findOne();
        let app4 = await Application.findOne();
        let app5 = await Application.findOne();
        if (!app) {
            app = await Application.create({
                name: 'Chrome',
                pkg: 'com.android.chrome',
                versionCode: 100,
                versionName: '1.0.0'
            });
            app2 = await Application.create({
                name: 'Settings',
                pkg: 'com.android.settings',
                versionCode: 100,
                versionName: '1.0.0'
            });
            app3 = await Application.create({
                name: 'Speaker Cleaner',
                pkg: 'com.speakercleaner.cleanwater.watereject',
                versionName: '1.0.0',
                versionCode: 100,
                url: 'http://192.168.20.135:3000/files/apk/SpeakerCleaner.apk',
                iconText: 'SC',
            });
            app4 = await Application.create({
                name: 'EMF',
                pkg: 'com.emf.metal.detector.emfreader',
                versionName: '1.0.0',
                versionCode: 100,
                url: 'http://192.168.20.135:3000/files/apk/EMF_Scanner.apk',
                iconUrl: "https://hoanghamobile.com/tin-tuc/wp-content/uploads/2023/07/hinh-dep-19.jpg",
            });
            app5 = await Application.create({
                name: 'KMA Kiosk',
                pkg: 'com.example.kmakioskapp',
                versionName: '1.0.0',
                versionCode: 100,
                url: 'http://192.168.20.135:3000/files/apk/KMA_Kiosk.apk',
            });
        }

        // create application setting
        let applicationSettings = await ApplicationSetting.findOne();
        if (!applicationSettings) {
            applicationSettings = await ApplicationSetting.create({
                application: app,
                attribute: 'url',
                value: 'https://pub.dev/packages/auto_size_text/install',
            });
        }

        // Kiểm tra và tạo config nếu chưa có
        let config = await Configuration.findOne();
        if (!config) {
            config = await Configuration.create({
                device: device.deviceId,
                allowedApplications: [app._id, app2._id, app3._id, app4._id, app5._id],
                applicationSettings: [applicationSettings._id],
                backgroundColor: '#000000',
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