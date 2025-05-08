var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");

const { errorsMiddleware } = require("./src/middlewares/errors.middleware");
const dbConnect = require("./src/config/database");

dbConnect();

var app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "src", "public")));

const route = require("./src/routes/index");
route(app);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(errorsMiddleware);

const PORT = process.env.PORT;
const http = require("http");
const server = http
    .createServer(app)
    .listen(PORT, () => console.log(`Server running on port ${PORT}`));

/* config for socket */
const socketIO = require("socket.io");
const deviceModel = require("./src/models/device.model");

const { socketAuth } = require("./src/socket/socketAuth");
const { socketMobileHandler } = require("./src/socket/socketMobileHandler");

const io = socketIO(server, {
    cors: {
        origin: "*",
    },
});

io.use(socketAuth);

io.on("connection", (socket) => {
    console.log("New client connected: " + socket.id);
    console.log("Socket data: ", JSON.stringify(socket.data));
    
    if (socket.data.isHost && socket.data.deviceId) {
        // update status to active
        deviceModel.findOneAndUpdate(
            { deviceId: socket.data.deviceId },
            { status: "active" }
        )
    }

    socket.on('disconnect', async (reason) => {
        console.log("Client disconnected: " + socket.id, "Reason: " + reason);
        if (socket.data.isHost && socket.data.deviceId) {
            // update status to inactive
            await deviceModel.findOneAndUpdate(
                { deviceId: socket.data.deviceId },
                { status: "inactive" }
            )
        }
        socket.removeAllListeners();
        socket.data = undefined;
    });

    socketMobileHandler(io, socket);
})

// // const driverModel = require("./models/driverModel");

// const booking = require("./controllers/sockets/booking");
// const connectSocket = require("./controllers/sockets/connectSocket");

// booking(io);
// connectSocket(io);

// io.on("connection", (socket) => {
//   console.log("New client connected: " + socket.id);

//   socket.emit("connected", socket.id);

//   // Xử lý khi tài xế đăng nhập thành công
//   // socket.on("driver-login", async (driverData) => {
//   //   // Lưu socket ID vào schema của tài khoản tài xế
//   //   try {
//   //     const { idDriver, socketId } = driverData;
//   //     await driverModel.findOneAndUpdate(
//   //       { _id: idDriver },
//   //       { socketId: socketId },
//   //       { new: true }
//   //     );
//   //     // console.log(respone);
//   //   } catch (err) {
//   //     console.error("Error saving socket ID:", err);
//   //   }
//   // });
// });

module.exports = app;