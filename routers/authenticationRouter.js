import express from 'express';
import { body, validationResult } from "express-validator"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { User } from "../models/Users.js"
import gravatar from "gravatar"
import { auth } from "../middleware/auth.js"

let router = express.Router()

//auth to get user details after success login
router.get("/auth", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user);
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
});

// Login router
router.post("/login", [
    body("email").isEmail(),                 //checking provided inputs are valid using express validator
    body("password").not().isEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    try {
        const { email, password } = req.body;
        //checking user on DB
        const existUser = await User.findOne({ email: email });
        if (!existUser) return res.status(400).json({ message: "User does not exist!" })

        //comparing the password
        const isMatch = await bcrypt.compare(password, existUser.password)
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials!" })

        //generating token
        let payload = {
            user: { id: existUser._id }
        }
        const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "8hr" })
        res.status(200).json({ token })
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

// signup router
router.post("/signup", [
    body("name").not().isEmpty(),
    body("email").isEmail(),                            //checking provided inputs are valid using express validator
    body("password").isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    try {
        const { name, email, password } = req.body;
        const user = await User.findOne({ email: email });

        if (user) return res.status(400).json({ message: "User already exists!" })

        // to generate avatar
        const avatar = gravatar.url(email, {
            size: "200",
            rating: "PG",
            default: "mm"
        })

        // to create hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // adding user to DB
        let newUser = new User({
            name: name,
            email: email,
            password: hashedPassword,
            avatar: avatar
        })
        // saving user in DB
        const result = await newUser.save()

        // generating token for signup also
        let payload = {
            user: { id: result._id }
        }
        const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "8hr" })
        res.status(200).json({ token })
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }

})


export const authenticationRouter = router;