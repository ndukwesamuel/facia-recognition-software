import express from "express";
import fileUpload from "express-fileupload";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

import {
  RekognitionClient,
  CompareFacesCommand,
} from "@aws-sdk/client-rekognition"; // Import the necessary components from v3
dotenv.config();

import connectDB from "./src/config/connectDB.js";
import notFound from "./src/middlewares/notFound.js";
import { errorMiddleware } from "./src/middlewares/error.js";

import authRoutesV1 from "./src/v1/routes/auth.routes.js";
import adminRoutesV1 from "./src/v1/routes/adminAuth.routes.js";
import upload from "./src/middlewares/multer.js";
import cloudinary from "./src/config/cloudinaryConfig.js";
import uploadService from "./src/v1/services/uploadService.js";
import User from "./src/v1/models/user.model.js";

// https://278133535641.signin.aws.amazon.com/console

const app = express();
const port = process.env.PORT || 8080;

// Initialize AWS Rekognition Client
const rekognitionClient = new RekognitionClient({
  region: "us-east-1", // Change to your preferred region
  credentials: {
    accessKeyId: "AKIAUBQQM6OMSWXNMJ27",
    secretAccessKey: "QYbCaIvrGnMmpBa3Y+OrxeNwuvKzFEiJ7kWIvxEO",
  },
});

app.use(express.json());
app.use(cors());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

app.use(morgan("dev"));

app.post("/upload", async (req, res) => {
  const { name } = req.body;

  const files = req.files;

  const { images } = files;

  let mainimages = [];
  if (images) {
    for (const image of images) {
      mainimages.push({
        url: await uploadService.uploadImageToCloudinary(image.tempFilePath),
      });
    }
  }

  const cake = await User.create({
    images: mainimages,
    email: name,
  });

  try {
    res.json({
      message: "Files uploaded successfully",
      data: { cake },
    });
  } catch (error) {
    console.error("Error during image upload:", error);
    res.status(500).json({ error: "An error occurred during file upload." });
  }
});

app.post("/upload2", async (req, res) => {
  const { name } = req.body; // User's name (email in this case)
  const { images } = req.files; // The image uploaded for recognition

  if (!name || !images) {
    return res.status(400).json({ message: "Name and image are required." });
  }

  try {
    // Find the user in the database using the name (email)
    const user = await User.findOne({ email: name });

    if (!user || user.images.length === 0) {
      return res.status(404).json({ message: "User or images not found." });
    }

    let faceMatched = false;

    // Iterate through each image stored for the user
    for (const storedImage of user.images) {
      // Fetch the stored image from Cloudinary using axios
      const targetImageData = await axios
        .get(storedImage.url, { responseType: "arraybuffer" })
        .then((response) => Buffer.from(response.data)); // Convert to buffer

      // Ensure the uploaded image buffer exists
      const compareImage = {
        Bytes: images.data, // The image uploaded by the user
      };

      if (!compareImage.Bytes || compareImage.Bytes.length === 0) {
        return res.status(400).json({ message: "Uploaded image is invalid." });
      }

      // Prepare the target image buffer (fetched from Cloudinary)
      const targetImage = {
        Bytes: targetImageData, // The stored image fetched from Cloudinary
      };

      // Ensure the target image buffer is valid
      if (!targetImage.Bytes || targetImage.Bytes.length === 0) {
        return res
          .status(500)
          .json({ message: "Error with stored image data." });
      }

      // Set parameters for AWS Rekognition CompareFaces
      const params = {
        SourceImage: targetImage,
        TargetImage: compareImage,
        SimilarityThreshold: 90, // Set a threshold for similarity
      };

      // Create the command and send to AWS Rekognition
      const command = new CompareFacesCommand(params);
      const result = await rekognitionClient.send(command);

      // Check if a face match was found
      if (result.FaceMatches && result.FaceMatches.length > 0) {
        faceMatched = true;
        break; // Exit loop if a match is found
      }
    }

    // Return the result based on face match
    if (faceMatched) {
      res.json({ success: true, message: "Face recognized!" });
    } else {
      res.json({ success: false, message: "No matching face found." });
    }
  } catch (error) {
    console.error("Error during face recognition:", error);
    res
      .status(500)
      .json({ error: "An error occurred during face recognition." });
  }
});

// app.post("/upload2", async (req, res) => {
//   const { name } = req.body; // User's name (email in this case)
//   const { images } = req.files; // The image uploaded for recognition

//   if (!name || !images) {
//     return res.status(400).json({ message: "Name and image are required." });
//   }

//   try {
//     // Find the user in the database using the name (email)
//     const user = await User.findOne({ email: name });

//     if (!user || user.images.length === 0) {
//       return res.status(404).json({ message: "User or images not found." });
//     }

//     let faceMatched = false;

//     // Iterate through each image stored for the user
//     for (const storedImage of user.images) {
//       // Fetch the stored image from Cloudinary using axios
//       const targetImageData = await axios
//         .get(storedImage.url, { responseType: "arraybuffer" })
//         .then((response) => Buffer.from(response.data, "binary")); // Convert to buffer

//       // Prepare the images for Rekognition
//       const compareImage = {
//         Bytes: images.data, // The image uploaded by the user
//       };

//       const targetImage = {
//         Bytes: targetImageData, // The stored image fetched from Cloudinary
//       };

//       // Set parameters for AWS Rekognition CompareFaces
//       const params = {
//         SourceImage: targetImage,
//         TargetImage: compareImage,
//         SimilarityThreshold: 90, // Set a threshold for similarity
//       };

//       const command = new CompareFacesCommand(params); // Create the command
//       const result = await rekognitionClient.send(command); // Send the command

//       // Check if a face match was found
//       if (result.FaceMatches.length > 0) {
//         faceMatched = true;
//         break; // Exit loop if a match is found
//       }
//     }

//     // Return the result
//     if (faceMatched) {
//       res.json({ success: true, message: "Face recognized!" });
//     } else {
//       res.json({ success: false, message: "No matching face found." });
//     }
//   } catch (error) {
//     console.error("Error during face recognition:", error);
//     res
//       .status(500)
//       .json({ error: "An error occurred during face recognition." });
//   }
// });

// Image upload and recognition endpoint
// app.post("/upload2", async (req, res) => {
//   const { name } = req.body; // User's name (email in this case)
//   const { images } = req.files; // The image uploaded for recognition

//   if (!name || !images) {
//     return res.status(400).json({ message: "Name and image are required." });
//   }

//   try {
//     // Find the user in the database using the name (email)
//     const user = await User.findOne({ email: name });

//     if (!user || user.images.length === 0) {
//       return res.status(404).json({ message: "User or images not found." });
//     }

//     let faceMatched = false;

//     // Iterate through each image stored for the user
//     for (const storedImage of user.images) {
//       // Fetch the stored image from Cloudinary
//       const targetImageData = await fetch(storedImage.url).then((res) =>
//         res.buffer()
//       );

//       // Prepare the images for Rekognition
//       const compareImage = {
//         Bytes: imageToCompare.data, // The image uploaded by the user
//       };

//       const targetImage = {
//         Bytes: targetImageData, // The stored image fetched from Cloudinary
//       };

//       // Set parameters for AWS Rekognition CompareFaces
//       const params = {
//         SourceImage: targetImage,
//         TargetImage: compareImage,
//         SimilarityThreshold: 90, // Set a threshold for similarity
//       };

//       const command = new CompareFacesCommand(params); // Create the command
//       const result = await rekognitionClient.send(command); // Send the command

//       // Check if a face match was found
//       if (result.FaceMatches.length > 0) {
//         faceMatched = true;
//         break; // Exit loop if a match is found
//       }
//     }

//     // Return the result
//     if (faceMatched) {
//       res.json({ success: true, message: "Face recognized!" });
//     } else {
//       res.json({ success: false, message: "No matching face found." });
//     }
//   } catch (error) {
//     console.error("Error during face recognition:", error);
//     res
//       .status(500)
//       .json({ error: "An error occurred during face recognition." });
//   }
// });

// app.post("/upload2", async (req, res) => {
//   const { name } = req.body;

//   const { images } = req.files;

//   if (!name || !images) {
//     return res.status(400).json({ message: "Name and image are required." });
//   }

//       const user = await User.findOne({ email: name });

//     if (!user || user.images.length === 0) {
//       return res.status(404).json({ message: "User or images not found." });
//     }

//   try {
//     res.json({
//       message: "Files uploaded successfully",
//       data: { name, images },
//     });
//   } catch (error) {
//     console.error("Error during image upload:", error);
//     res.status(500).json({ error: "An error occurred during file upload." });
//   }
// });

// Image upload and recognition endpoint
// app.post("/api/v1/recognize", async (req, res) => {
//   const { imageToCompare } = req.files; // The image uploaded for recognition
//   const { targetImage } = req.files; // The image to compare against

//   if (!imageToCompare || !targetImage) {
//     return res.status(400).json({ message: "Both images are required." });
//   }

//   try {
//     // Prepare the images for Rekognition
//     const compareImage = {
//       Bytes: imageToCompare.data, // The image to compare
//     };

//     const target = {
//       Bytes: targetImage.data, // The target image (existing image)
//     };

//     // Call AWS Rekognition's CompareFaces command
//     const params = {
//       SourceImage: target,
//       TargetImage: compareImage,
//       SimilarityThreshold: 90, // Set a threshold for similarity
//     };

//     const command = new CompareFacesCommand(params); // Create the command
//     const result = await rekognitionClient.send(command); // Send the command

//     if (result.FaceMatches.length > 0) {
//       res.json({ success: true, message: "Face recognized!", data: result });
//     } else {
//       res.json({ success: false, message: "No matching face found." });
//     }
//   } catch (error) {
//     console.error("Error during face recognition:", error);
//     res
//       .status(500)
//       .json({ error: "An error occurred during face recognition." });
//   }
// });

// Existing routes
app.use("/api/v1/admin", adminRoutesV1);
app.use("/api/v1/auth", authRoutesV1);
app.use(notFound);
app.use(errorMiddleware);

const startServer = async () => {
  try {
    await connectDB(process.env.DB_URI);
    console.log(`DB Connected!`);
    app.listen(port, () => console.log(`Server is listening on PORT:${port}`));
  } catch (error) {
    console.log(`Couldn't connect because of ${error.message}`);
    process.exit(1);
  }
};

startServer();
