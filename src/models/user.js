import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new Schema(
    {
        email:{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullName:{
            type: String,
            required: true,
            trim: true,
            index: true
        },
        password:{
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken:{
            type: String
        }
    },{
        timestamps: true
    }
)

userSchema.pre("save", async function (next){
    if(!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 10)
    next()
})



// Inside the method, it uses bcrypt.compare() to compare the provided password with the hashed password stored in the user document (this.password).
// bcrypt.compare() is an asynchronous function that compares the plain text password with the hashed password and returns a boolean value indicating whether the two match.

userSchema.methods.isPasswordCorrect = async function (password){
    
    return await bcrypt.compare(password, this.password)
}



userSchema.methods.generateAccessToken = function(){

    return jwt.sign(
        {
        _id: this._id,
        email: this.email,
        fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }

    )
}


userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
        _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }

    )
}

export const User = mongoose.model("User", userSchema)