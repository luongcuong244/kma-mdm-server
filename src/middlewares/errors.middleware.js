const errorsMiddleware = (err, req, res, next) => {
    res.status(res.statusCode);
    res.json({
        message: err.message,
        data: null
    });
}
module.exports = {
    errorsMiddleware
}