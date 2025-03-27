const configurationRouter = require("./configuration.routes");

function route(app) {
    app.use("/configuration", configurationRouter);
}

module.exports = route;