import bcrypt from "bcrypt";
import mongoose from "mongoose";
import ApiError from "./apiError.js";

// Hash password
async function hashPassword(password) {
  if (!password) {
    throw ApiError.badRequest("Please provide a password");
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

// Compares password
async function validatePassword(incomingPassword, existingPassword) {
  console.log("Incoming Password: ", incomingPassword);
  console.log("Existing Hashed Password: ", existingPassword);
  if (!incomingPassword || !existingPassword) {
    throw ApiError.badRequest("Please provide a password");
  }
  const isMatch = await bcrypt.compare(incomingPassword, existingPassword);
  if (!isMatch) {
    console.log("Password Mismatch");
    throw ApiError.unauthorized("Unauthorized");
  }
}

// Checks if an id is a valid mongoose Id
function validateMongoId(id) {
  const isValid = mongoose.isValidObjectId(id);
  if (!isValid) {
    throw ApiError.badRequest("Invalid Id");
  }
}

export { hashPassword, validatePassword, validateMongoId };
