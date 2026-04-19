require('dotenv').config();
const twilio = require('twilio');
// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = '+918264451744';
const client = twilio(accountSid, authToken);
// console.log("Account SID:", accountSid);
// console.log("Auth Token:", authToken);

const sendOtp = async (phoneNumber, otp) => {
    try {
        const message = await client.messages.create({
            body: `Your OTP code is: ${otp}`,
            from: twilioPhoneNumber, 
            to: phoneNumber  
        });
        console.log("OTP sent successfully!", message.sid);
        return message;
    } catch (error) {
        console.error("Error sending OTP:", error.message);
        throw error;
    }
};

module.exports = sendOtp;
