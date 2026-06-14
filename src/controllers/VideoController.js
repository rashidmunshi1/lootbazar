const Status = require('../models/StatusModel');

const VideoController = {
    // Save and register metadata of a video pre-uploaded directly from the client side to Cloudinary
    upload: async (req, res) => {
        try {
            const { url, duration, publicId, size, mimetype, filename, userId, productId } = req.body;

            if (!url) {
                return res.status(400).json({ message: "Cloudinary video URL is required in request body" });
            }
            if (!userId || !productId) {
                return res.status(400).json({ message: "userId and productId are required in request body" });
            }

            // Create new status entry in database
            const newStatus = new Status({
                userId,
                productId,
                video: url
            });

            const savedStatus = await newStatus.save();

            res.status(200).json({
                message: "Video metadata registered and saved successfully",
                status: savedStatus,
                video: {
                    filename: filename || url.split('/').pop(),
                    url,
                    publicId: publicId || null,
                    size: size || null,
                    mimetype: mimetype || 'video/mp4',
                    duration: duration ? parseFloat(Number(duration).toFixed(2)) : null
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = VideoController;
