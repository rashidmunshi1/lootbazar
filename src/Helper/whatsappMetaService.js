const https = require('https');
const Setting = require('../models/SettingModel');

/**
 * Sends a WhatsApp OTP using the Meta (Facebook) Cloud API.
 * Credentials are fetched dynamically from the Settings collection in the database.
 * @param {string} phoneNumber - Recipient's phone number (e.g., '919876543210')
 * @param {string} otp - The OTP code
 * @returns {Promise<object>}
 */
const sendWhatsAppOtp = async (phoneNumber, otp) => {
    // Fetch WhatsApp credentials from the database
    const setting = await Setting.findOne();
    const wa = setting?.whatsapp || {};

    const phoneNumberId = wa.phoneNumberId || '';
    const accessToken = wa.accessToken || '';
    const templateName = wa.templateName || '';
    const templateLanguage = wa.templateLanguage || 'en_US';
    const templateParamsCount = wa.templateParamsCount || 1;

    // If credentials are not configured, run in test mode
    if (!phoneNumberId || !accessToken || !templateName) {
        console.log(`[WHATSAPP META TEST MODE] OTP ${otp} would be sent to ${phoneNumber}`);
        console.log(`[WHATSAPP META TEST MODE] Missing credentials - phoneNumberId: ${phoneNumberId ? 'set' : 'MISSING'}, accessToken: ${accessToken ? 'set' : 'MISSING'}, templateName: ${templateName ? 'set' : 'MISSING'}`);
        return { success: true, message: "Test mode: WhatsApp Meta API credentials not configured in Settings" };
    }

    // Format the phone number (ensure no '+' prefix for Meta API)
    let formattedTo = String(phoneNumber).trim().replace(/^\+/, '');

    // Build template parameters array based on the configured count
    const parameters = [];
    for (let i = 0; i < templateParamsCount; i++) {
        parameters.push({
            type: "text",
            text: otp
        });
    }

    const payload = JSON.stringify({
        messaging_product: "whatsapp",
        to: formattedTo,
        type: "template",
        template: {
            name: templateName,
            language: {
                code: templateLanguage
            },
            components: [
                {
                    type: "body",
                    parameters: parameters
                }
            ]
        }
    });

    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);

        const options = {
            hostname: parsedUrl.hostname,
            port: 443,
            path: parsedUrl.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
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
                    console.log("WhatsApp Meta API response:", parsed);
                    if (parsed.error) {
                        reject(new Error(parsed.error.message || 'WhatsApp Meta API error'));
                    } else {
                        resolve(parsed);
                    }
                } catch (e) {
                    console.log("WhatsApp Meta API response (raw):", body);
                    resolve(body);
                }
            });
        });

        req.on('error', (error) => {
            console.error("WhatsApp Meta API request failed:", error.message);
            reject(error);
        });

        req.write(payload);
        req.end();
    });
};

module.exports = sendWhatsAppOtp;
