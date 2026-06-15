const User = require("../models/UserModel");
const sendAisensyOtp = require("../Helper/aisensyService");

const UserController = {

    // Fetch all users
    index: async (req, res) => {
        try {
            const users = await User.find();
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Create a new user
    store: async (req, res) => {
        try {
                        const { name, mobileno, address, pincode, profileImage: bodyProfileImage } = req.body;
            
            if (!mobileno) {
                return res.status(400).json({ message: "Mobile number is required" });
            }

            // Normalize mobile number to 12 digits (prepend 91 if it's a 10-digit number)
            let formattedMobile = String(mobileno).trim();
            if (/^\d{10}$/.test(formattedMobile)) {
                formattedMobile = "91" + formattedMobile;
            }

            // Check if user already exists
            let user = await User.findOne({ mobileno: formattedMobile });

            // Capture the profile image (support direct URL or multer file upload to Cloudinary)
            let profileImage = bodyProfileImage;
            if (req.file) {
                try {
                    const cloudinary = require('../Helper/cloudinaryConfig');
                    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                        folder: 'profiles'
                    });
                    profileImage = uploadResult.secure_url;
                    
                    // Clean up temp file
                    const fs = require('fs');
                    if (fs.existsSync(req.file.path)) {
                        fs.unlinkSync(req.file.path);
                    }
                } catch (uploadError) {
                    console.error("Cloudinary upload failed in register:", uploadError);
                }
            }
    
            // Generate a dynamic 4-digit OTP
            const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

            // Send WhatsApp OTP via AiSensy
            await sendAisensyOtp(formattedMobile, generatedOtp);

            let savedUser;
            if (user) {
                // Update existing user with new OTP and other details if provided
                user.otp = generatedOtp;
                if (name) user.name = name;
                if (address) user.address = address;
                if (pincode) user.pincode = pincode;
                if (profileImage) user.profileImage = profileImage;
                savedUser = await user.save();
            } else {
                // Create a new user
                const newUser = new User({
                    name,
                    mobileno: formattedMobile,
                    otp: generatedOtp,
                    address,
                    pincode,
                    profileImage
                });
                savedUser = await newUser.save();
            }
    
            res.status(200).json({
                message: "WhatsApp OTP sent successfully",
                user: savedUser,
                otp: generatedOtp // for testing purposes
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }    
    },

    // Fetch a single user by ID
    edit: async (req, res) => {
        try {
            const { id } = req.params;
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Update a user by ID (Complete Profile)
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, address, pincode, interests, profileImage: bodyProfileImage } = req.body;

            // Address is required unless updating interests only
            if (!interests && !address) {
                return res.status(400).json({ message: "Address is required" });
            }
            
            // Capture the profile image (support direct URL or multer file upload to Cloudinary)
            let profileImage = bodyProfileImage;
            if (req.file) {
                try {
                    const cloudinary = require('../Helper/cloudinaryConfig');
                    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                        folder: 'profiles'
                    });
                    profileImage = uploadResult.secure_url;
                    
                    // Clean up temp file
                    const fs = require('fs');
                    if (fs.existsSync(req.file.path)) {
                        fs.unlinkSync(req.file.path);
                    }
                } catch (uploadError) {
                    console.error("Cloudinary upload failed in profile update:", uploadError);
                }
            }
            
            const updateData = {};
            if (name !== undefined) updateData.name = name;
            if (address !== undefined) updateData.address = address;
            if (pincode !== undefined) updateData.pincode = pincode;
            if (profileImage) updateData.profileImage = profileImage;

            if (interests !== undefined) {
                let parsedInterests;
                if (typeof interests === 'string') {
                    // Try parsing as JSON first
                    try {
                        parsedInterests = JSON.parse(interests);
                    } catch (e) {
                        // If parsing failed, maybe they sent it with single quotes e.g. ['id1', 'id2']
                        // Replace single quotes with double quotes and try again
                        try {
                            const formatted = interests.replace(/'/g, '"');
                            parsedInterests = JSON.parse(formatted);
                        } catch (err) {
                            // If still failed, split by comma and clean brackets and quotes
                            parsedInterests = interests
                                .replace(/[\[\]']/g, '') // remove brackets and single quotes
                                .split(',')
                                .map(item => item.trim())
                                .filter(Boolean);
                        }
                    }
                } else {
                    parsedInterests = interests;
                }
                updateData.interests = parsedInterests;
            }
    
            const updatedUser = await User.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );
    
            if (!updatedUser) {
                return res.status(404).json({ message: "User not found" });
            }
    
            res.status(200).json(updatedUser);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },    

    // Delete a user by ID
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const deletedUser = await User.findByIdAndDelete(id);
            if (!deletedUser) {
                return res.status(404).json({ message: "User not found" });
            }
            res.status(200).json({ message: "User deleted successfully" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Verify user OTP
    verifyOtp: async (req, res) => {
        try {
            const { mobileno, otp } = req.body;

            if (!mobileno || !otp) {
                return res.status(400).json({ message: "Mobile number and OTP are required" });
            }

            // Normalize mobile number
            let formattedMobile = String(mobileno).trim();
            if (/^\d{10}$/.test(formattedMobile)) {
                formattedMobile = "91" + formattedMobile;
            }

            const user = await User.findOne({ mobileno: formattedMobile });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (user.otp !== String(otp).trim()) {
                return res.status(400).json({ message: "Invalid OTP" });
            }

            // Clear OTP after successful verification so it cannot be reused
            user.otp = null;
            await user.save();

            res.status(200).json({
                message: "OTP verified successfully",
                user: user
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Admin Login
    adminLogin: async (req, res) => {
        try {
            const { email, password } = req.body;
            const expectedEmail = process.env.ADMIN_EMAIL || 'admin@lootbaazar.com';
            const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';

            if (!email || !password) {
                return res.status(400).json({ message: "Email and password are required" });
            }

            if (email === expectedEmail && password === expectedPassword) {
                res.status(200).json({
                    message: "Admin login successful",
                    user: {
                        email: expectedEmail,
                        name: 'LootBaazar Admin',
                        role: 'Super Admin'
                    }
                });
            } else {
                res.status(401).json({ error: "Invalid email or password" });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
};

module.exports = UserController;
