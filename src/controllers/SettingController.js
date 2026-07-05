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
            const { apiKey, amount } = req.body;
            let setting = await Setting.findOne();
            if (!setting) {
                setting = new Setting({
                    apiKey: apiKey || '',
                    amount: Number(amount) || 0
                });
            } else {
                setting.apiKey = apiKey !== undefined ? apiKey : setting.apiKey;
                setting.amount = amount !== undefined ? Number(amount) : setting.amount;
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
