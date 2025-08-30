import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRouter from './routes/auth.route.js';
import productRouter from './routes/product.route.js'
import cors from "cors"

import { connectDB } from "./db/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/product', productRouter);

app.listen(PORT, () => {
    connectDB();
    console.log(`SERVER UP AND RUNNING ON PORT: ${PORT}`);
})