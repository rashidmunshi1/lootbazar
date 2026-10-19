const https = require('https');
const Setting = require('../models/SettingModel');

/**
 * Sends a WhatsApp OTP using the AiSensy Campaign API v2.
 * Credentials are read dynamically from the database Settings collection,
 * with fallback to environment variables and provided defaults.
 *
 * @param {string} phoneNumber - Recipient's phone number (e.g., '917016685053' or '7016685053')
 * @param {string} otp - The OTP code to send (e.g. '1478')
 * @param {object} [customConfig] - Optional override config { apiKey, campaignName, userName }
 * @returns {Promise<object>} - AiSensy API response
 */
const sendAisensyOtp = async (phoneNumber, otp, customConfig = {}) => {
    // Fetch settings from database if not overridden
    let waConfig = {};
    try {
        const setting = await Setting.findOne();
        if (setting && setting.whatsapp) {
            waConfig = setting.whatsapp;
        }
    } catch (dbErr) {
        console.warn("Could not query Setting model for AiSensy config:", dbErr.message);
    }

    const apiKey = customConfig.apiKey || waConfig.apiKey || process.env.AISENSY_API_KEY || '';
    const campaignName = customConfig.campaignName || waConfig.campaignName || process.env.AISENSY_CAMPAIGN_NAME || 'lbotp';
    const userName = customConfig.userName || waConfig.userName || process.env.AISENSY_USER_NAME || 'Galaxy Traders';

    if (!apiKey) {
        console.log(`[AISENSY TEST MODE] (No API Key) OTP ${otp} would be sent to ${phoneNumber}`);
        return { success: false, message: "AiSensy API Key is not configured." };
    }

    // Format destination number:
    // Strip whitespace and leading '+'
    let destination = String(phoneNumber).trim().replace(/^\+/, '');
    // If it's a 10-digit Indian number without country code, prepend '91'
    if (/^\d{10}$/.test(destination)) {
        destination = "91" + destination;
    }

    const payload = JSON.stringify({
        apiKey: apiKey,
        campaignName: campaignName,
        destination: destination,
        userName: userName,
        templateParams: [
            String(otp)
        ],
        buttons: [
            {
                type: "button",
                sub_type: "url",
                index: "0",
                parameters: [
                    {
                        type: "text",
                        text: String(otp)
                    }
                ]
            }
        ]
    });

    return new Promise((resolve, reject) => {
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
                    if (parsed.success === false || parsed.success === "false" || parsed.error) {
                        return reject(new Error(parsed.message || parsed.error || 'AiSensy API returned an error'));
                    }
                    resolve(parsed);
                } catch (e) {
                    console.log("AiSensy API raw response:", body);
                    resolve({ raw: body });
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
