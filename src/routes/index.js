const authRouter = require('./auth.routes');
const configurationRouter = require("./configuration.routes");
const userRouter = require('./user.routes');

function route(app) {
    app.use('/auth', authRouter);
    app.use("/configuration", configurationRouter);
    app.use("/user", userRouter);
}

module.exports = route;