import mongoose from "mongoose"

const profileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    bio: {
        type: String,
        trim: true
    },
    website: {
        type: String,
        trim: true
    },
    skills: {
        type: [String],
        trim: true
    },
    location: {
        type: String,
        trim: true
    },
    followers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    }],
    following: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        }
    ],
    social: {
        twitter: {
            type: String,
            trim: true,
            lowercase: true
        },
        linkedIn: {
            type: String,
            trim: true,
            lowercase: true
        },
        github: {
            type: String,
            trim: true,
            lowercase: true
        },
        codepen: {
            type: String,
            trim: true,
            lowercase: true
        },
    },
    date: {
        type: Date,
        default: Date.now()
    }
})

export const Profile = mongoose.model("Profile", profileSchema, "profile")