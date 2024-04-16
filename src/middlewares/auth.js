import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.js";


// export const verifyJWT = asyncHandler(async (req, res, next) => {

//     try {


      //  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

//         if (!token) {
//             // throw new ApiError(401, "Unauthorized request")
//             return res.status(401).json( new ApiError({
//                 error: "Unauthorized",
//                 message: "Access token is missing or expired",
//                 success: false
//             }));
//         }
//         const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

//         const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

//         if (!user) {
//             // throw new ApiError(401, "Invalid Access Token")
//             return res.status(401).json( new ApiError({
//                 error: "Unauthorized",
//                 message: "Access token is missing or expired",
//                 success: false
//             }));
//         }

//         req.user = user;
//         next()
//     } catch (error) {
//         throw new ApiError(401, error?.message || "Invalid access token")
//     }
// });


export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
               const cookieString = req.headers?.cookie || req.header("Authorization")?.replace("Bearer ", "") // Get the cookie string from the request headers
        const cookies = cookieString.split(';'); // Split the cookie string into an array based on the separator ';'
        let accessToken, refreshToken;
    
        cookies.forEach(cookie => {
            const trimmedCookie = cookie.trim(); // Remove any leading/trailing whitespace
            if (trimmedCookie.startsWith('accessToken=')) {
                accessToken = trimmedCookie.substring('accessToken='.length); // Extract the accessToken value
            } else if (trimmedCookie.startsWith('refreshToken=')) {
                refreshToken = trimmedCookie.substring('refreshToken='.length); // Extract the refreshToken value
            }
        });
    
        console.log(accessToken);
        const token = accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            return res.status(403).json(new ApiError({
                error: "Unauthorized",
                message: "Access token is missing",
                success: false
            }));
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {
            return res.status(403).json(new ApiError({
                error: "Unauthorized",
                message: "User not found",
                success: false
            }));
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json(new ApiError({
                error: "Unauthorized",
                message: "Access token has expired",
                success: false
            }));
        }
        throw new ApiError(403, error?.message || "Invalid access token");
    }
});
