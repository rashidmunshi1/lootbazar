const VideoController = {
    // Save and register metadata of a video pre-uploaded directly from the client side to Cloudinary
    upload: async (req, res) => {
        try {
            const { url, duration, publicId, size, mimetype, filename } = req.body;

            if (!url) {
                return res.status(400).json({ message: "Cloudinary video URL is required in request body" });
            }

            res.status(200).json({
                message: "Video metadata registered successfully",
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
