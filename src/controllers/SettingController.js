const Setting = require('../models/SettingModel');

const SettingController = {
    // Fetch global setting
    getSetting: async (req, res) => {
        try {
            let setting = await Setting.findOne();
            if (!setting) {
                // Initialize default if not present
                setting = new Setting({
                    apiKey: '',
                    amount: 0
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
                    whatsapp: whatsapp || {}
                });
            } else {
                setting.apiKey = apiKey !== undefined ? apiKey : setting.apiKey;
                setting.amount = amount !== undefined ? Number(amount) : setting.amount;
                if (whatsapp) {
                    if (!setting.whatsapp) setting.whatsapp = {};
                    setting.whatsapp.phoneNumberId = whatsapp.phoneNumberId !== undefined ? whatsapp.phoneNumberId : setting.whatsapp.phoneNumberId;
                    setting.whatsapp.accessToken = whatsapp.accessToken !== undefined ? whatsapp.accessToken : setting.whatsapp.accessToken;
                    setting.whatsapp.templateName = whatsapp.templateName !== undefined ? whatsapp.templateName : setting.whatsapp.templateName;
                    setting.whatsapp.templateLanguage = whatsapp.templateLanguage !== undefined ? whatsapp.templateLanguage : setting.whatsapp.templateLanguage;
                    setting.whatsapp.templateParamsCount = whatsapp.templateParamsCount !== undefined ? Number(whatsapp.templateParamsCount) : setting.whatsapp.templateParamsCount;
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
    }
};

module.exports = SettingController;
