function getBaseUrl() {
    const HOST = process.env.HOST || 'localhost';
    const PORT = process.env.PORT || 3000;
    return `http://${HOST}:${PORT}`;
}

module.exports = {
    getBaseUrl,
};