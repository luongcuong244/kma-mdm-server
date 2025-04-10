const authRouter = require('./auth.routes');
const configurationRouter = require("./configuration.routes");
const userRouter = require('./user.routes');
const applicationRouter = require('./application.routes');
const fileRouter = require('./file.routes');

function route(app) {
    app.use('/auth', authRouter);
    app.use("/configuration", configurationRouter);
    app.use("/user", userRouter);
    app.use("/application", applicationRouter);
    app.use("/file", fileRouter);
}

module.exports = route;