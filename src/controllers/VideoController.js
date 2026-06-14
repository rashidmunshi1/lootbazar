const { getMp4Duration } = require('../Helper/videoDurationHelper');

const VideoController = {
    // Upload a video file and return its metadata and access URL (including timeline/duration)
    upload: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: "No video file provided" });
            }

            // Build dynamic URL based on request headers
            const host = req.get('host');
            const protocol = req.protocol;
            const videoUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

            // Extract video duration/timeline in seconds (pure JS, zero external dependencies)
            const duration = getMp4Duration(req.file.path);

            res.status(200).json({
                message: "Video uploaded successfully",
                video: {
                    filename: req.file.filename,
                    url: videoUrl,
                    path: req.file.path.replace(/\\/g, '/'),
                    size: req.file.size,
                    mimetype: req.file.mimetype,
                    duration: duration // Duration in seconds (null if parsing failed)
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = VideoController;
