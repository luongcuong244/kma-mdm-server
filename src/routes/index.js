const commonRouter = require('./common.routes');
const authRouter = require('./auth.routes');
const configurationRouter = require("./configuration.routes");
const userRouter = require('./user.routes');
const applicationRouter = require('./application.routes');
const fileRouter = require('./file.routes');
const deviceRouter = require('./device.routes');

function route(app) {
    app.use("/common", commonRouter);
    app.use('/auth', authRouter);
    app.use("/configuration", configurationRouter);
    app.use("/user", userRouter);
    app.use("/application", applicationRouter);
    app.use("/file", fileRouter);
    app.use("/device", deviceRouter);
}

module.exports = route;