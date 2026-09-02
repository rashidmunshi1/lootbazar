const whatsappService = require('../Helper/whatsappSessionService');

const WhatsAppJunctionController = {
    // List all active sessions and their status
    getSessions: async (req, res) => {
        try {
            const list = whatsappService.getAllSessions();
            return res.status(200).json({ success: true, accounts: list });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    // Create a new WhatsApp session slot
    addSession: async (req, res) => {
        try {
            const { sessionName } = req.body;
            const newSessionId = `account-${Date.now()}`;
            const label = sessionName && sessionName.trim() ? sessionName.trim() : `Account ${newSessionId.slice(-4)}`;

            whatsappService.createOrGetSession(newSessionId, label);

            return res.status(201).json({
                success: true,
                message: 'New WhatsApp gateway slot created',
                sessionId: newSessionId
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    // Send dynamic OTP using the static template
    sendOtp: async (req, res) => {
        try {
            const { sessionId, mobileno } = req.body;

            if (!sessionId) {
                return res.status(400).json({ success: false, message: 'Please select a WhatsApp sender account' });
            }

            if (!mobileno) {
                return res.status(400).json({ success: false, message: 'Target mobile number is required' });
            }

            const result = await whatsappService.sendDynamicOtp(sessionId, mobileno);

            return res.status(200).json({
                success: true,
                message: `Dynamic OTP sent to +${result.toPhone}`,
                data: result
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    // Delink and remove a WhatsApp account
    delinkAccount: async (req, res) => {
        try {
            const { sessionId } = req.params;
            if (!sessionId) {
                return res.status(400).json({ success: false, message: 'Session ID is required' });
            }

            const result = await whatsappService.delinkSession(sessionId);
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = WhatsAppJunctionController;