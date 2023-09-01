// for a full working demo check https://express-via-functions.netlify.com/.netlify/functions/serverless-http
var serverless = require('serverless-http')

var expressApp = require('../../../dist/contstructor-with-isr/server/main')

module.exports = server.app();

// We need to define our function name for express routes to set the correct base path
var functionName = 'serverless-http'

// Initialize express app
var app = expressApp(functionName)

// Export lambda handler
var handler = serverless(app);

module.exports = { handler: handler };
