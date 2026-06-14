const cloudinary = require('../Helper/cloudinaryConfig');

const CloudinaryController = {
    // Generate secure signature and timestamp for direct client-side uploads to Cloudinary
    getSignature: async (req, res) => {
        try {
            // Verify keys are present
            if (!cloudinary.config().api_secret || !cloudinary.config().api_key || !cloudinary.config().cloud_name) {
                return res.status(500).json({
                    error: "Cloudinary configuration is missing on the server. Please check environment variables."
                });
            }

            const timestamp = Math.round((new Date()).getTime() / 1000);
            
            const params = {
                timestamp: timestamp,
                folder: 'lootbazar'
            };

            // Generate signature using Cloudinary API Secret
            const signature = cloudinary.utils.api_sign_request(params, cloudinary.config().api_secret);

            res.status(200).json({
                signature,
                timestamp,
                apiKey: cloudinary.config().api_key,
                cloudName: cloudinary.config().cloud_name,
                folder: 'lootbazar'
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = CloudinaryController;
