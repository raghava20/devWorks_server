import multer from "multer"
import { v2 as cloudinary } from "cloudinary"
import path from "path"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import dotenv from "dotenv"

dotenv.config()
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "dev works"
    }
})

export const upload = multer({
    storage,
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        var errMsg;
        if (ext !== ".png" && ext !== ".jpg" && ext !== ".gif" && ext !== ".jpeg") {
            errMsg = "Only images are allowed"
            req.fileValidationError = errMsg;
            return callback(null, false, new Error(errMsg))
        }
        callback(null, true)
    }
}).array("images", 5)