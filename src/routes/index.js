const authRouter = require('./auth.routes');
const configurationRouter = require("./configuration.routes");

function route(app) {
    app.use('/auth', authRouter);
    app.use("/configuration", configurationRouter);
}

module.exports = route;