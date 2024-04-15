import { Router } from "express"
import { forgotPassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, resetPassword } from "../controllers/user.js"
import { verifyJWT } from "../middlewares/auth.js"
import { createQuestion, getQuestion } from "../controllers/question.js"

const userRouter = Router()

userRouter.route("/register").post(registerUser)
userRouter.route("/login").post(loginUser)

userRouter.route("/logout").post(verifyJWT, logoutUser)
userRouter.route("/refresh-token").post(refreshAccessToken)
userRouter.route("/current-user").get(verifyJWT, getCurrentUser)
userRouter.route("/forgot-password").post(forgotPassword)
userRouter.route("/reset-password/:id/:token").post(resetPassword)


// Routes for question
userRouter.route("/create-question").post(createQuestion)
userRouter.route("/get-question").get(getQuestion)

export default userRouter