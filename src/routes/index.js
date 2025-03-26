const configurationRouter = require("./configuration.routes");

function route(app) {
    app.use("/configuation", configurationRouter);
}

module.exports = route;