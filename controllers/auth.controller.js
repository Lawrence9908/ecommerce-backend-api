import { redis } from "../db/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

const generateToken = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7d",
    });
    return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
    await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60); //7days
};

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOny: true, // prevent XSS attacks , cross site scripting attack
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict", // prevents CSRS attacks, cross-site request forgery attack
        maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("accessToken", refreshToken, {
        httpOny: true, // prevent XSS attacks , cross site scripting attack
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict", // prevents CSRS attacks, cross-site request forgery attack
        maxAge: 15 * 60 * 1000, // 15 minutes
    });
};


export const signup = async (req, res) => {
    const { email, password, name } = req.body;
    try {
        if (!name || !password || !email) {
            res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const userExist = await User.findOne({ email });
        if (userExist) res.status(400).json({ success: false, message: "User already exists" });

        const user = await User.create({ name: name, email: email, password: password });

        //authenticate
        const { accessToken, refreshToken } = generateToken(user._id);
        await storeRefreshToken(user._id, refreshToken);

        setCookies(res, accessToken, refreshToken);

        res.status(201).json({
            success: true,
            message: "User successfully registered",
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        console.log(`Error in signup controller: ${error.message}`);
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: "All fields are required!"
            });
        };

        const user = await User.findOne({ email });
        if (user && (user.comparePassword(password))) {
            const { accessToken, refreshToken } = generateToken(user._d);
            await storeRefreshToken(user._id, refreshToken);
            setCookies(res, accessToken, refreshToken);

            res.status(200).json({
                success: true,
                message: "User successfully login",
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            });
        } else {
            res.status(400).json({
                success: false,
                message: "Invalid username or password"
            });
        }
    } catch (error) {
        console.error(`Error in login controller: ${error.message}`);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            await redis.del(`refresh_token:${decoded.userId}`);
        };

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.status(200).json({ success: true, message: "Logged out succeffully" });
    } catch (error) {
        console.error(`Error in logout controller: ${error.message}`);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) res.status(401).json({ success: false, message: "No refresh token provided" })

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

        if (storedToken !== refreshToken) {
            res.status(401).json({ success: false, message: "Invalid refresh token" });
        }

        const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "15m",
        });

        res.cookie("accessToken", accessToken, {
            httpOny: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000,
        });

        res.status(201).json({
            success: true,
            message: "Token successfully refreshed"
        });
    } catch (error) {
        console.log(`Error in refreshToken controller: ${error.message}`);
        res.status(500).json({
            success: false,
            message: error.message
        });
    };
};

export const getProfile = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: "User found",
            user: req.user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    };
};