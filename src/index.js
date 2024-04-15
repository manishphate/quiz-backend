// require('dotenv').config({path: './.env'})

import dotenv from 'dotenv'
import connectDB from "./db/index.js"
// import { app } from '../app.js';
import {app} from './app.js'


dotenv.config({
    path: './.env'
})

connectDB()
    .then(() => {
        console.log("call...");
        const PORT = process.env.PORT || 8000;
        app.listen(PORT, () => {
            console.log(`Server is running at port: ${PORT}`);
        });
    })
    .catch((err) => {
        console.log("MongoDB connection failed:", err);
    });

// First approach
/*

import express from "express"
const app = express()

(async ()=>{
    try{

        mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error", (error) =>{
            console.log("Error: ", error);
            throw error
        })

        app.listen(process.env.PORT),()=>{
            console.log(`App id listening on port ${process.env.PORT}`);
        }
    }catch(error){
        console.error("Error: ",error)
        throw err
    }
})()

*/