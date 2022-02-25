import express from 'express';
import { body, validationResult } from "express-validator"
import { Post } from "../models/Posts.js"
import { User } from "../models/Users.js"
import { auth } from "../middleware/auth.js"
import { upload } from "../middleware/cloudinary.js"
import { Profile } from '../models/Profile.js';

let router = express.Router()


// creating a post 
router.post("/", [auth, upload,                                                     //upload- from cloudinary to store the image files
    [
        body("title").not().isEmpty(),
        body("techTags", "Atleast one tag is required").not().isEmpty(),
        body("liveUrl").isURL().not().isEmpty()
    ]
], async (req, res) => {
    const errors = validationResult(req)
    if (req.fileValidationError) errors.errors.push({ message: req.fileValidationError })
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    try {
        const { title, description, images, techTags, liveUrl, codeUrl } = req.body;
        const newPost = {}
        newPost.user = req.user.id;
        if (title) newPost.title = title;
        if (description) newPost.description = description;
        if (liveUrl) newPost.liveUrl = liveUrl;
        if (codeUrl) newPost.codeUrl = codeUrl;

        if (req.files) {
            console.log(images)
            newPost.images = req.files.map(image => image.path)
        }
        if (techTags) {
            newPost.techTags = techTags.split(',').map(tag => tag.trim())
        }
        const result = new Post(newPost);                               //creating a new post using Post schema
        await result.save();
        res.json(result)

    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }

})

// get all posts
router.get('/', auth, async (req, res) => {
    try {
        const result = await Post.find().sort({ date: -1 }).populate("user", ["name", "avatar"])       //populate to get details from user schema
        return res.status(200).json(result)                                                            //which is stored as ref in Post schema
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

// get all following users post
router.get("/feed", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id })

        // to create array of user ID 
        const totalFollowingID = profile.following.map(follow => follow.user._id)

        const result = await Post.find({
            user: { $in: totalFollowingID }
        }).sort({ date: -1 }).populate("user", ["name", "avatar"])

        return res.status(200).json(result)
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

// Get posts by the postID 
router.get("/:postID", auth, async (req, res) => {
    try {
        const postById = await Post.findById(req.params.postID)                 //populate the user details by using ref in Post schema
            .populate("user", ["name", "avatar"])
            .populate("likes.user", ["name", "avatar"])
            .populate("comments.user", ["name", "avatar"]);
        if (!postById) return res.status(404).json({ message: "Not found" })
        return res.status(200).json(postById)
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

// Get all posts by an user 
router.get("/user/:userID", auth, async (req, res) => {
    try {
        const userPostsById = await Post.find({ user: req.params.userID }).populate("user", ["name", "avatar"])
        if (!userPostsById) return res.status(404).json({ message: "Not found" })
        return res.status(200).json(userPostsById)
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

// delete post by Id
router.delete("/:postID", auth, async (req, res) => {
    try {
        const result = await Post.findById(req.params.postID)
        if (!result) return res.status(404).json({ message: "Not found" })
        if (result.user.toString() !== req.user.id) return res.status(404).json({ message: "Unauthorized" })
        await result.remove()                           //removing the post after comparing it with valid user
        return res.status(200).json({ message: "Deleted Successfully" })
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

// like post by Id
router.put("/like/:id", auth, async (req, res) => {
    try {
        const result = await Post.findById(req.params.id)

        //to check the post is already liked or not
        if (result.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({ message: "Post liked already" })
        }
        result.likes.unshift({ user: req.user.id })
        await result.save()
        return res.status(200).json(result.likes)
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

// unlike post by Id
router.put("/unlike/:id", auth, async (req, res) => {
    try {
        const result = await Post.findById(req.params.id)

        //to check the post is already unliked or not
        if (result.likes.filter(likes => likes.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({ message: "Post has not been liked yet." })
        }

        //Remove userId on likes by their index value
        const removeIndex = result.likes.map(like =>
            like.user.toString()).indexOf(req.user.id)

        result.likes.splice(removeIndex, 1)
        await result.save()
        res.json(result.likes)
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

// add comment by id
router.post("/comment/:postID", [auth,
    [
        body("text", "Add a comment").not().isEmpty()
    ]], async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

        try {
            const post = await Post.findById(req.params.postID)
            const user = await User.findById(req.user.id).select("name avatar")

            const newComment = {
                name: user.name,
                avatar: user.avatar,
                text: req.body.text,
                userId: req.user.id
            }
            post.comments.unshift(newComment)
            await post.save()
            return res.status(200).json(post.comments)

        }
        catch (err) {
            return res.status(500).json({ message: err.message })
        }
    })

// delete comment by Id
router.delete("/comment/:postID/:commentID", auth, async (req, res) => {
    try {
        const result = await Post.findById(req.params.postID)

        //checking the comment is already exists or not
        const comment = result.comments.find(comment => comment.id === req.params.commentID)

        if (!comment) {
            return res.status(404).json({ message: "Comment does not exist" })
        }
        if (comment.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        // Remove comments on the post by userId
        const removeIndex = result.comments.map(comment => comment.id).indexOf(req.user.id)

        result.comments.splice(removeIndex, 1)
        await result.save()
        res.status(200).json(result.comments)
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

export const postsRouter = router;