const winston = require('winston');

const logger = winston.createLogger({
    level: 'debug',
    exitOnError: false,
    format: winston.format.json(),
});

// logger.add(
//     new DatadogWinston({
//         apiKey: DD_API_KEY,
//         hostname: APP_NAME,
//         service: APP_NAME,
//         ddsource: 'nodejs',
//     })
// );
module.exports = logger;