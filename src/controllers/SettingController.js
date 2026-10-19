const Setting = require('../models/SettingModel');
const sendAisensyOtp = require('../Helper/aisensyService');

const SettingController = {
    // Fetch global setting
    getSetting: async (req, res) => {
        try {
            let setting = await Setting.findOne();
            if (!setting) {
                // Initialize default if not present
                setting = new Setting({
                    apiKey: '',
                    amount: 0,
                    whatsapp: {
                        apiKey: process.env.AISENSY_API_KEY || '',
                        campaignName: process.env.AISENSY_CAMPAIGN_NAME || 'lbotp',
                        userName: process.env.AISENSY_USER_NAME || 'Galaxy Traders'
                    }
                });
                await setting.save();
            }
            res.status(200).json(setting);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Save/Update global setting
    saveSetting: async (req, res) => {
        try {
            const { apiKey, amount, whatsapp } = req.body;
            let setting = await Setting.findOne();
            if (!setting) {
                setting = new Setting({
                    apiKey: apiKey || '',
                    amount: Number(amount) || 0,
                    whatsapp: {
                        apiKey: whatsapp?.apiKey || '',
                        campaignName: whatsapp?.campaignName || 'lbotp',
                        userName: whatsapp?.userName || 'Galaxy Traders'
                    }
                });
            } else {
                setting.apiKey = apiKey !== undefined ? apiKey : setting.apiKey;
                setting.amount = amount !== undefined ? Number(amount) : setting.amount;
                if (whatsapp) {
                    setting.whatsapp = {
                        apiKey: whatsapp.apiKey !== undefined ? whatsapp.apiKey : (setting.whatsapp?.apiKey || ''),
                        campaignName: whatsapp.campaignName !== undefined ? whatsapp.campaignName : (setting.whatsapp?.campaignName || 'lbotp'),
                        userName: whatsapp.userName !== undefined ? whatsapp.userName : (setting.whatsapp?.userName || 'Galaxy Traders')
                    };
                }
            }
            await setting.save();
            res.status(200).json({
                message: "Settings saved successfully",
                setting
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Test WhatsApp integration with AiSensy
    testWhatsApp: async (req, res) => {
        try {
            const { destination, apiKey, campaignName, userName, otp } = req.body;
            if (!destination) {
                return res.status(400).json({ error: "Destination phone number is required" });
            }
            const testOtp = otp || Math.floor(1000 + Math.random() * 9000).toString();

            const customConfig = {};
            if (apiKey) customConfig.apiKey = apiKey;
            if (campaignName) customConfig.campaignName = campaignName;
            if (userName) customConfig.userName = userName;

            const response = await sendAisensyOtp(destination, testOtp, customConfig);
            res.status(200).json({
                message: "AiSensy OTP sent successfully",
                otp: testOtp,
                response
            });
        } catch (error) {
            res.status(500).json({ error: error.message || "Failed to send AiSensy test OTP" });
        }
    }
};

module.exports = SettingController;
