const twilio = require('twilio');

// Retrieve Twilio credentials from process.env
const accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.accountSid;
const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.authToken;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // default Twilio sandbox number

let client;
if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
}

/**
 * Sends an OTP to the given phone number via WhatsApp.
 * @param {string} phoneNumber - Recipient's phone number (must include country code, e.g., '919876543210' or '+919876543210')
 * @param {string} otp - The OTP to send
 * @returns {Promise<object>} - Twilio message response
 */
const sendWhatsAppOtp = async (phoneNumber, otp) => {
    // Commented out Twilio configuration for test mode
    /*
    if (!client) {
        // Fallback initialization in case env variables were loaded after module compilation
        const activeAccountSid = process.env.TWILIO_ACCOUNT_SID || process.env.accountSid;
        const activeAuthToken = process.env.TWILIO_AUTH_TOKEN || process.env.authToken;
        if (!activeAccountSid || !activeAuthToken) {
            throw new Error("Twilio client is not initialized. Please verify that TWILIO_ACCOUNT_SID/accountSid and TWILIO_AUTH_TOKEN/authToken are defined in your environment/dotenv file.");
        }
        client = twilio(activeAccountSid, activeAuthToken);
    }
    */

    try {
        let formattedTo = String(phoneNumber).trim();
 
         // Ensure the recipient number is properly formatted with whatsapp: prefix
         if (!formattedTo.startsWith('whatsapp:')) {
             if (!formattedTo.startsWith('+')) {
                 formattedTo = '+' + formattedTo;
             }
             formattedTo = 'whatsapp:' + formattedTo;
         }
 
         // Ensure the sender number is properly formatted with whatsapp: prefix
         let formattedFrom = String(whatsappFrom).trim();
        if (!formattedFrom.startsWith('whatsapp:')) {
            formattedFrom = 'whatsapp:' + formattedFrom;
        }

        console.log(`[TEST MODE] (Twilio WhatsApp Bypassed) OTP ${otp} would be sent to ${formattedTo} from ${formattedFrom}`);

        /*
        const message = await client.messages.create({
            body: `Your OTP code is: ${otp}`,
            from: formattedFrom,
            to: formattedTo
        });

        console.log("WhatsApp OTP sent successfully! Message SID:", message.sid);
        return message;
        */

        return { sid: "SM_mocked_for_testing_1234" };
    } catch (error) {
        console.error("Error inside sendWhatsAppOtp:", error.message);
        throw error;
    }
};

module.exports = sendWhatsAppOtp;
