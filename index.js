import express from 'express';
import dotenv from "dotenv"
import cors from "cors"
import { mongo } from "./mongoConnection.js"

dotenv.config()

let app = express()
let PORT = process.env.PORT || 8000

app.use(express.json())
app.use(cors())

mongo()

app.get('/', (req, res) => {
    res.send("You are listening the dev works api!")
})

app.listen(PORT, () => console.log("App is running on " + PORT))
