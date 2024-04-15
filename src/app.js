import express from 'express'
import cors from "cors"
import cookieParser from 'cookie-parser'

const app = express()

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests from any origin
        callback(null, true);
    },
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// routes import

import userRouter from './routes/user.js'

// routes declaration
app.use(userRouter)


// app.post("/register",(registerUser))
export {app}