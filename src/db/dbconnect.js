import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI,
            {
                dbName: DB_NAME,
            });
        console.log(`DB Connected Successfully`);
    } catch (error) {
        console.error(`Error Connecting to the Database:`, error);
        process.exit(1);
    }
};

export default connectDB;
