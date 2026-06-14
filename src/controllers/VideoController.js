const cloudinary = require('../Helper/cloudinaryConfig');
const fs = require('fs');

const VideoController = {
    // Upload a video file to Cloudinary and return its public URL and metadata
    upload: async (req, res) => {
        let tempFilePath = null;
        try {
            if (!req.file) {
                return res.status(400).json({ message: "No video file provided" });
            }

            tempFilePath = req.file.path;

            // Upload video file directly from the temporary folder to Cloudinary
            const result = await cloudinary.uploader.upload(tempFilePath, {
                resource_type: "video",
                folder: "lootbazar"
            });

            // Clean up the temporary local file
            try {
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }
            } catch (unlinkError) {
                console.error("Failed to delete temp file:", unlinkError);
            }

            res.status(200).json({
                message: "Video uploaded successfully to Cloudinary",
                video: {
                    filename: req.file.filename,
                    url: result.secure_url,
                    publicId: result.public_id,
                    size: req.file.size,
                    mimetype: req.file.mimetype,
                    duration: result.duration ? parseFloat(result.duration.toFixed(2)) : null
                }
            });
        } catch (error) {
            // Clean up the temporary file on error
            if (tempFilePath) {
                try {
                    if (fs.existsSync(tempFilePath)) {
                        fs.unlinkSync(tempFilePath);
                    }
                } catch (unlinkError) {
                    console.error("Failed to delete temp file during error cleanup:", unlinkError);
                }
            }
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = VideoController;
