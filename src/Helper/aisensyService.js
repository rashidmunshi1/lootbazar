const https = require('https');

/**
 * Sends a WhatsApp OTP using the AiSensy Campaign API.
 * @param {string} phoneNumber - Recipient's phone number (e.g., '919876543210')
 * @param {string} otp - The OTP code
 * @returns {Promise<object>}
 */
const sendAisensyOtp = (phoneNumber, otp) => {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.AISENSY_API_KEY;
        const campaignName = process.env.AISENSY_CAMPAIGN_NAME || 'OTP_Campaign';

        // Check if API Key exists, if not run in Test Mode
        if (!apiKey) {
            console.log(`[AISENSY TEST MODE] (No API Key) OTP ${otp} would be sent to ${phoneNumber}`);
            return resolve({ success: true, message: "Test mode: AISENSY_API_KEY not configured" });
        }

        let formattedTo = String(phoneNumber).trim();
        if (!formattedTo.startsWith('+')) {
            formattedTo = '+' + formattedTo;
        }

        const payload = JSON.stringify({
            apiKey: apiKey,
            campaignName: campaignName,
            destination: formattedTo,
            userName: 'User',
            templateParams: [otp],
            source: 'API'
        });

        const options = {
            hostname: 'backend.aisensy.com',
            port: 443,
            path: '/campaign/t1/api/v2',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    console.log("AiSensy API response:", parsed);
                    resolve(parsed);
                } catch (e) {
                    console.log("AiSensy API response (raw):", body);
                    resolve(body);
                }
            });
        });

        req.on('error', (error) => {
            console.error("AiSensy API request failed:", error.message);
            reject(error);
        });

        req.write(payload);
        req.end();
    });
};

module.exports = sendAisensyOtp;
