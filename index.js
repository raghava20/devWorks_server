import express from 'express';
import dotenv from "dotenv"
import cors from "cors"
import { mongo } from "./mongoConnection.js"
import { authenticationRouter } from "./routers/authenticationRouter.js"
import { postsRouter } from "./routers/postsRouter.js"
import { profilesRouter } from "./routers/profilesRouter.js"

dotenv.config()

let app = express()
let PORT = process.env.PORT || 8000

app.use(express.json())
app.use(cors())

mongo()

app.get('/', (req, res) => {
    res.send("You are listening the dev works api!")
})

app.use("/", authenticationRouter)
app.use("/", postsRouter)
app.use("/", profilesRouter)

app.listen(PORT, () => console.log("App is running on " + PORT))
