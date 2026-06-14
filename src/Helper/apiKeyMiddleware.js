/**
 * Middleware to validate the API key sent in the headers.
 * Looks for 'x-api-key' or 'apikey' header.
 */
const apiKeyMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.headers['apikey'];
    const expectedApiKey = process.env.API_KEY || 'lootbazar_secret_api_key';

    console.log(`[API Key Validation] Path: ${req.path}, Method: ${req.method}`);
    console.log(`[API Key Validation] Received: "${apiKey}", Expected: "${expectedApiKey}"`);

    if (!apiKey || apiKey !== expectedApiKey) {
        return res.status(401).json({
            error: "Unauthorized",
            message: "Invalid or missing API Key in request headers ('x-api-key' or 'apikey')"
        });
    }
    next();
};

module.exports = apiKeyMiddleware;
