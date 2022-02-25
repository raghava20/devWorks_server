import jwt from "jsonwebtoken"

export const auth = (req, res, next) => {
    const token = req.header("x-auth-token");

    if (!token) return res.status(401).send({ message: "Access Denied" });

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded.user;
        next()
    }
    catch (err) {
        console.log(err)
        res.status(401).send({ message: err })
    }
}