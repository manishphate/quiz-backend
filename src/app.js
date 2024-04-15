import express from 'express'
import cors from "cors"
import cookieParser from 'cookie-parser'

const app = express()

const corsOptions = {
  origin: 'https://main--quiz-619.netlify.app',
  credentials: true, // Enable credentials (cookies)
};

app.use(cors(corsOptions));

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
