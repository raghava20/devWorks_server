import express from 'express';
import { body, validationResult } from "express-validator"
import { Profile } from '../models/Profile';

let router = express.Router()

// to create or update a profile
router.post("/", [
    body("bio", "Bio field is required").not().isEmpty(),
    body("skills", "Skills field is required").not().isEmpty()
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { user, bio, website, skills, githubUserName, location, twitter, linkedIn, github, codepen } = req.body;
    let profileGroup = {}
    profileGroup.user = req.user.id;
    if (bio) profileGroup.bio = bio;
    if (website) profileGroup.website = website;
    if (githubUserName) profileGroup.githubUserName = githubUserName;
    if (location) profileGroup.location = location;
    if (skills) {
        profileGroup.skills = skills.split(',').map(skill => skill.trim());
    }
    profileGroup.social = {}
    if (twitter) profileGroup.social.twitter = twitter;
    if (github) profileGroup.social.github = github;
    if (linkedIn) profileGroup.social.linkedIn = linkedIn;
    if (codepen) profileGroup.social.codepen = codepen;

    try {
        const result = await Profile.findOne({ user: req.user.id })
        if (result) {
            let existUser = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileGroup }, { new: true })
            return res.status(200).json(existUser)
        }
        let createProfile = new Profile(profileGroup)
        await createProfile.save()
        res.status(200).json(createProfile)
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

// to get the current users profile
router.get("/me", async (req, res) => {
    try {
        const result = await Profile.findOne({ user: req.user.id })
            .populate("user", ["name", "avatar"])
            .populate("followers.user", ["name", "avatar"])
            .populate("following.user", ["name", "avatar"])
        if (!result) {
            return res.status(400).json({ message: "Profile is not available" })
        }
        return res.status(200).json(result)
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

// to get all the user profiles
router.get("/", async (req, res) => {
    try {
        const result = await Profile.find()
            .populate("user", ["name", "avatar"])
            .populate("followers.user", ["name", "avatar"])
            .populate("following.user", ["name", "avatar"])

        return res.status(200).json(result)
    }
    catch (err) { return res.status(500).json({ message: err.message }) }
})

// get user profile by userId
router.get("/user/:userID", async (req, res) => {
    try {
        const result = await Profile.findOne({ user: req.params.userID })
            .populate("user", ["name", "avatar"])
            .populate("followers.user", ["name", "avatar"])
            .populate("following.user", ["name", "avatar"])
        if (!result) {
            return res.status(400).json({ message: "Profile is not available" })
        }
        return res.status(200).json(result)
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

// to get github profile by using githubUserName
router.get("/github/:githubUserName", async (req, res) => {
    try {
        const apiURI = encodeURI(`https://api.github.com/users/${req.params.githubUserName}/repo?per_page=5&sort=created:asc`)
        const response = await axios.get(apiURI, {
            "user-agent": "node.js",
            Authorization: `token ${process.env.CLIENT_ID}`
        })
        return res.json(response)
    }
    catch (err) {
        return res.status(500).json({ message: "No Github profile found" })
    }
})

// to follow another user
router.put("/follow/:userID", async (req, res) => {
    try {
        const existProfile = await Profile.findOne({ user: req.params.userID })
        if (!existProfile) return res.status(404).json({ message: "User not found" })
        if (req.user.id.toString() === req.params.userID) return res.status(400).json("Cannot follow yourself")

        // checking if user already follows
        if (existProfile.follow.filter(user => user.toString() === req.user.id).length > 0) {
            return res.status(403).json("Already following this user")
        }

        // then continue on following and followers func
        // followers
        await Profile.findOneAndUpdate({ user: req.params.userID }, {
            $push: {
                followers: {
                    user: req.user.id
                }
            }
        })
        await Profile.findOneAndUpdate({ user: req.user.id }, {
            $push: {
                following: {
                    user: req.params.userID
                }
            }
        })
        res.json({ message: "Successfully followed" })
    }
    catch (err) { return res.status(500).json({ message: err.message }) }
})

// to unfollow the user 
router.put("/unfollow/:userID", async (req, res) => {
    try {
        const existUser = await Profile.findOne({ user: req.params.userID })
        if (!existUser) return res.status(404).json({ message: "User not found" })
        if (req.user.id.toString() === req.params.userID) return res.status(404).json({ message: "Cannot unfollow yourself" })

        // checking if user is already unfollowed
        if (existUser.followers.filter(user => user.toString() === req.user.id) === 0) {
            return res.status(403).json({ message: "User was unfollowed already" })
        }

        // then continue doing unfollow action on followers and following functions
        await Profile.findOneAndUpdate({ user: req.params.userID }, {
            $pull: {
                followers: {
                    user: req.user.id
                }
            }
        })

        await Profile.findOneAndUpdate({ user: req.user.id }, {
            $pull: {
                following: {
                    user: req.params.userID
                }
            }
        })
        res.json({ message: "Successfully Unfollowed" })
    }
    catch (err) { return res.status(500).json({ message: err.message }) }
})

export const profilesRouter = router;