import mongoose from "mongoose";

const ConnectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(
      `${process.env.MONGODB_URL}/chat-app`,
      {
        serverSelectionTimeoutMS: 5000,
      }
    );

    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB Error:", error);
    process.exit(1);
  }
};

export default ConnectDB;
