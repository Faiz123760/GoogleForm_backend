import User from "../models/User.js";

export const findByEmail = async (email) => {
  return await User.findOne({ email });
};

export const findById = async (id) => {
  return await User.findById(id);
};

export const findByIdWithoutPassword = async (id) => {
  return await User.findById(id).select("-password");
};

export const createUser = async (userData) => {
  return await User.create(userData);
};
