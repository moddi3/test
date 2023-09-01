const serverless = require('serverless-http');
const server = require('../../../dist/contstructor-with-isr/server/main');

module.exports = server.app;
module.exports.handler = serverless(server.app);