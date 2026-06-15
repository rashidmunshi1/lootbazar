const Status = require('../models/StatusModel');
const fs = require('fs');
const path = require('path');

// Create a new status with a video
const store = async (req, res) => {
    try {
        const { userId, productId } = req.body;
        const video = req.file.path; // Using multer to get the uploaded file

        const newStatus = new Status({
            userId,
            productId,
            video
        });

        const savedStatus = await newStatus.save();
        res.status(201).json(savedStatus);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Fetch all active statuses
const index = async (req, res) => {
    try {
        const statuses = await Status.find().populate('userId');
        res.status(200).json(statuses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a status (User deletes manually)
const deleteStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const status = await Status.findById(id);
        if (!status) {
            return res.status(404).json({ message: "Status not found" });
        }

        // Delete from Cloudinary if stored there
        if (status.publicId) {
            try {
                const cloudinary = require('../Helper/cloudinaryConfig');
                await cloudinary.uploader.destroy(status.publicId, { resource_type: 'video' });
            } catch (cloudinaryError) {
                console.error("Failed to delete video from Cloudinary:", cloudinaryError);
            }
        } else if (status.video && status.video.includes('cloudinary.com')) {
            // Extract publicId fallback
            const extractPublicId = (url) => {
                try {
                    const parts = url.split('/video/upload/');
                    if (parts.length > 1) {
                        const pathAfterUpload = parts[1].replace(/^v\d+\//, '');
                        const extensionIndex = pathAfterUpload.lastIndexOf('.');
                        return extensionIndex !== -1 ? pathAfterUpload.substring(0, extensionIndex) : pathAfterUpload;
                    }
                } catch (e) {
                    console.error(e);
                }
                return null;
            };
            const publicId = extractPublicId(status.video);
            if (publicId) {
                try {
                    const cloudinary = require('../Helper/cloudinaryConfig');
                    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
                } catch (clError) {
                    console.error("Failed to delete video from Cloudinary:", clError);
                }
            }
        } else if (status.video) {
            // Local file deletion
            try {
                if (fs.existsSync(status.video)) {
                    fs.unlinkSync(status.video);
                }
            } catch (fileError) {
                console.error("Failed to delete local video file:", fileError);
            }
        }

        await Status.findByIdAndDelete(id);
        res.status(200).json({ message: "Status deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { store, index, deleteStatus };
