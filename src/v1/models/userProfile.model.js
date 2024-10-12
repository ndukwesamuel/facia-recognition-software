import mongoose from "mongoose";

const { Schema } = mongoose;

const UserProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    profileImage: {
      type: String, // You can store the image URL or file path here
      default: "https://iau.edu.lc/wp-content/uploads/2016/09/dummy-image.jpg",
    },
    address: {
      type: String,
    },
    phone: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("UserProfile", UserProfileSchema);
