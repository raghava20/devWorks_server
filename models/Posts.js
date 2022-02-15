import mongoose from "mongoose"

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        required: true
    },
    images: {
        type: [String],
        required: true
    },
    techTags: {
        type: [String],
        required: true
    },
    liveUrl: {
        type: String,
        required: true
    },
    codeUrl: {
        type: String,
        required: true
    },
    likes: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        },
        {
            comments: [
                {
                    name: {
                        type: String,
                        required: true
                    },
                    userId: {
                        type: mongoose.Schema.Types.ObjectId,
                        required: true
                    },
                    avatar: {
                        type: String,
                        required: true
                    },
                    date: {
                        type: Date,
                        default: Date.now()
                    },
                    text: {
                        type: String,
                        required: true
                    }
                }
            ]
        }
    ],
    date: {
        type: Date,
        default: Date.now()
    }
})

export const Posts = module.model("Posts", postSchema, "posts")