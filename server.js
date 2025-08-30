import express from  "express";
import dotenv  from  "dotenv";
import cookieParser from "cookie-parser";

import authRouter from  './routes/auth.route.js'

import { connectDB } from "./db/db.js";

dotenv.config();

const app  = express();
const PORT  = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
// app.use('/api/auth', authRouter);

app.listen(PORT, ()=>{
    connectDB();
    console.log(`SERVER UP AND RUNNING ON PORT: ${PORT}`);
})