import jwt from "jsonwebtoken";
import User from "../models/user.model.js";


export const protectedRoute  = async (req,res, next) =>{
    try{
        const accessToken  = req.cookies.accessToken;

        if (!accessToken){
            return res.status(401).json({
                success: false,
                message: "Unauthorized - No access token  provided"
            });

            try {
                const decoded  = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
                const user  = await  User.findById(decoded.userId).select("-password");

                if (!user){
                    return res.status(401).json({
                        success: false,
                        message: "User not found"
                    });
                };
                req.user = user;
                next()
            } catch (error) {
                if (error.name  === "TokenExpiredError"){
                    return res.status(401).json({
                        success: false,
                        message: "Unauthorized - Access token"
                    });
                };
            }
        }
    }catch(error){
        res.status(401).json({
            success: false,
            message: "Unauthorized  - Invalid access token"
        })
    }
};

export const adminRoute = (res, req, next) =>{
    if(req.user  && req.user.role === "admin"){
        next();
    }else{
        res.status(403).json({
            success: false,
            message: "Access denied - Admin only"
        })
    }
}