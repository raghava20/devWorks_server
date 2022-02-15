import express from 'express';
import { body, validationResult } from "express-validator"
import { Post } from "../models/Posts.js"
import { User } from "../models/Users.js"

let router = express.Router()

// creating a post
router.post("/", [
    body("title").not().isEmpty(),
    body("techTags", "Atleast one tag is required").not().isEmpty(),
    body("liveUrl").isURL().not().isEmpty()
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

        if (images) {
            newPost.images = req.files.map(image => image.path)
        }
        if (techTags) {
            // newPost.techTags = techTags.split(',').map(tag => tag.trim())
            newPost.techTags = techTags.map(tag => tag.trim())
        }
        const result = new Post(newPost);
        await result.save();
        res.json(result)

    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: err.message })
    }

})

// get all posts
router.get('/', async (req, res) => {
    try {
        const result = await User.find().sort({ date: -1 }).populate("user", ["name,avatar"])
        return res.status(200).json(result)
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

// get all following users post
router.get("/feed", async (req, res) => {
    try {
        const profile = await User.findOne({ user: req.user.id })

        // to create array of user ID 
        const totalFollowingID = profile.following.map(follow => follow.user._id)

        const result = await Post.find({
            user: { $in: totalFollowingID }
        }).sort({ date: -1 }).populate("user", ["name,avatar"])

        return res.status(200).json(result)
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

// Get posts by the postID
router.get("/:postID", async (req, res) => {
    try {
        const postById = await Post.findById(req.params.postID)
            .populate("user", ["name", "avatar"])
            .populate("likes.user", ["name", "avatar"])
            .populate("comments.user", ["name", "avatar"]);

        if (!posts) return res.status(404).json({ message: "NOt found" })
        return res.status(200).json(postById)
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

// Get all posts by an user
router.get("/user/:userID", async (req, res) => {
    try {
        const userPostsById = await Post.find({ user: req.params.userID })
            .populate("user", ["name", "avatar"])
        if (!userPostsById) return res.status(404).json({ message: "Not found" })

        return res.status(200).json(userPostsById)
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

// delete post by Id
router.delete("/:postID", async (req, res) => {
    try {
        const result = await Post.find(req.params.postID)
        if (!result) return res.status(404).json({ message: "Not found" })
        if (result.user.toString() !== req.user.id) return res.status(404).json({ message: "Unauthorized" })
        await result.save()
        return res.status(200).json({ message: "Deleted Successfully" })
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

// like post by Id
router.put("/like/:id", async (req, res) => {
    try {
        const result = await Post.findById(req.params.id)

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
router.put("/unlike/:id", async (req, res) => {
    try {
        const result = await Post.findById(req.params.id)

        if (result.likes.filter(likes => likes.user.toString() === req.user.id).length > 0) {
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
router.post("/comment/:postID", [
    body("comment", "Add a comment").not().isEmpty()
], async (req, res) => {
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
router.delete("/comment/:postID/:commentID", async (req, res) => {
    try {
        const result = await Post.findById(req.params.postID)

        const comment = result.comments.find(comment => comment.id === req.params.commentID)

        if (!comment) {
            return res.status(404).json({ message: "Comment does not exist" })
        }
        if (comment.userId !== req.user.id) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        // Remove comments on the post by userId
        const removeIndex = comment.map(comment => comment.id).indexOf(req.user.id)

        result.comments.splice(removeIndex, 1)
        await result.save()
        res.status(200).json(result.comments)
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

export const postsRouter = router;