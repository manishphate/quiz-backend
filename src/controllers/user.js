import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import nodemailer from 'nodemailer';
import jwt, { decode } from "jsonwebtoken"
import bcrypt from "bcrypt"


const generateAccessAndRefreshTokens = async (userId) => {

    try {

        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()


        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res, next) => {

    const { fullName, email, password } = req.body

    // For each field, it checks if the trimmed value (removing leading and trailing whitespace) is an empty string (""). 
    // If any of the fields are empty, it throws an ApiError
    if (
        [fullName, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }


    // After querying the database, this code checks if existedUser is truthy. 
    // If a user document was found (i.e., if existedUser is not null, undefined, or false), it throws an ApiError
    const existedUser = await User.findOne({ email })

    if (existedUser) {
        throw new ApiError(409, "User with email")
    }

    // insert a new user document into the database.
    const user = await User.create(
        {
            fullName,
            email,
            password
        }
    )

    // hide password and refreshToken
    const createdUser = await User.findById(user._id).select(
        " -password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }


    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        sameSite: 'none',
        secure: true,  
        path: '/',       
        domain: '.main--quiz-619.netlify.app', 
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken

                },
                "User logged in Successfully"
            )
        )


    // // Construct the response
    // const responseData = new ApiResponse(200, createdUser, "User registered successfully");

    // // Send the response
    // return res.status(200).json(responseData);

})

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    // find the user
    //  check password
    //  access and refresh token
    // send cookie
    const { email, password } = req.body;

    const user = await User.findOne({ email })

    // if user does not exist
    if (!user) {
        throw new ApiError(404, "user does not exist")
    }

    // if user find then check password was correct or not (bcrypt compare)
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Password not correct")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
         httpOnly: true,
        sameSite: 'none',
        secure: true,  
        path: '/',       
        domain: '.main--quiz-619.netlify.app', 
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken

                },
                "User logged in Successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        sameSite: 'none',
        secure: true,  
        path: '/',       
        domain: '.main--quiz-619.netlify.app', 
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")

        }

        const options = {
        httpOnly: true,
        sameSite: 'none',
        secure: true,  
        path: '/',       
        domain: '.main--quiz-619.netlify.app', 
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "User fetched successfully"
        ))
})

const forgotPassword = asyncHandler(async (req, res) => {

    const { email } = req.body;

    const user = await User.findOne({ email: email })

    if (!user) {
        throw new ApiError(409, "User with email or username")
    }

    const token = jwt.sign({ id: user._id }, "jwt_secret_key", { expiresIn: "1d" })


    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.ADMIN_EMAIL,
            pass: process.env.APP_PASS
        }
    });

    const mailOptions = {
        from: process.env.ADMIN_EMAIL,
        to: email,
        subject: 'Reset your password',
        text: `https://main--quiz-619.netlify.app/reset-password/${user._id}/${token}`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            return res
                .status(200)
                .json(new ApiResponse(
                    200,
                    { status: "Success" }
                ))
        }
    });


})


const resetPassword = asyncHandler(async (req, res) => {
    const { id, token } = req.params;
    const { password } = req.body;

    try {
        // Verify JWT token
        const decoded = jwt.verify(token, "jwt_secret_key");

        // Hash the new password
        const hash = await bcrypt.hash(password, 10);

        // Update user's password in the database
        const updatedUser = await User.findByIdAndUpdate(id, { password: hash });

        // If user is not found
        if (!updatedUser) {
            throw new ApiError(404, "User not found");
        }

        // Send success response
        res.status(200).json({ Status: "Success" });
    } catch (error) {
        // Handle errors
        if (error.name === "JsonWebTokenError") {
            return res.status(400).json({ Status: "Error with token" });
        } else if (error.name === "MongoError" && error.code === 11000) {
            // Handle MongoDB duplicate key error
            return res.status(400).json({ Status: "Duplicate key error" });
        } else {
            // Handle other errors
            return res.status(500).json({ Status: "Internal server error" });
        }
    }
});


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    forgotPassword,
    resetPassword
} 
