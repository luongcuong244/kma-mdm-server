const crypto = require('crypto');

function getSHA1String(value) {
    return crypto
        .createHash('sha1')
        .update(value, 'utf8')
        .digest('hex')
        .toUpperCase();
}

module.exports = {
    getSHA1String,
}