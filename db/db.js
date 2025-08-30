// mongodb connection using mongoose conection helper
// mongoose is an ODM(Object Data Modeling) tool for MongoDB in Node.js , making it easier
// define schemas, models, and interact with MongoDB
// async is need because connecting to a DB is asynchornous and returns a promise
// await means Node will waint until the DB connection succeeds or fails
// process.exit(1) stops the app completely, because running without a DB connection usually breaks the backend

import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
}