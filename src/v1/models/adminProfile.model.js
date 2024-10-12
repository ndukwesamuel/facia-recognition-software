import mongoose from "mongoose";

const { Schema } = mongoose;

// Create a schema for user profile
const adminProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User", // Match the model name for the user schema
      required: true,
    },

    level: {
      type: String,
    },

    // Add other profile-related fields as needed
  },
  { timestamps: true }
);

export default mongoose.model("AdminProfile", adminProfileSchema);

// level 1 = super admin  the can do anything on the app
// level 2 = admin  they are country admin the can do anything for a particular contry
// level 3 = user  they are country admin cant handle anything with money
