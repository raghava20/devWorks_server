import express from 'express';
import dotenv from "dotenv"
import cors from "cors"
import { mongo } from "./mongoConnection.js"
import { authenticationRouter } from "./routers/authenticationRouter.js"
import { postsRouter } from "./routers/postsRouter.js"
import { profilesRouter } from "./routers/profilesRouter.js"

dotenv.config()

const app = express()
let PORT = process.env.PORT || 8000

// middleware
app.use(express.json())
app.use(cors())

// mongodb connection
mongo()

app.get('/', (req, res) => {
    res.send("You are listening the dev works api!")
})

app.use("/", authenticationRouter)
app.use("/posts", postsRouter)
app.use("/profile", profilesRouter)

app.listen(PORT, () => console.log("App is running on " + PORT))
