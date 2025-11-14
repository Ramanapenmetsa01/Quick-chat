import mongoose from "mongoose";

 const ConnectDB = async () => {
  try {
     mongoose.connection.on("connected", () => {
      console.log("MongoDB connected");
    });

    await mongoose.connect(`${process.env.MONGODB_URL}/chat-app`);

   
  } catch (error) {
    console.log("MongoDB Error:", error);
  }
};
export default ConnectDB