// src/v1/services/uploadService.js

import dotenv from "dotenv";
dotenv.config();
import cloudinary from "cloudinary";

// Cloudinary configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload image to Cloudinary function
const uploadImageToCloudinary = async (tempFilePath) => {
  try {
    const { secure_url } = await cloudinary.v2.uploader.upload(tempFilePath, {
      use_filename: true,
      folder: "Cake-App",
    });

    return secure_url;
  } catch (error) {
    throw error;
  }
};

// Exporting the upload function
export default { uploadImageToCloudinary };
