const sendAisensyOtp = require('./aisensyService');

/**
 * Re-exports AiSensy OTP service to maintain backward compatibility with any
 * existing callers targeting whatsappMetaService.
 */
const sendWhatsAppOtp = async (phoneNumber, otp) => {
    return sendAisensyOtp(phoneNumber, otp);
};

module.exports = sendWhatsAppOtp;
