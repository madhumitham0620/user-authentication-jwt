const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {

    console.log("");
    console.log("🛡️ JWT MIDDLEWARE CHECK");

    const token = req.cookies.token;

    if (!token) {

        console.log("❌ No JWT token found");

        return res.status(401).json({
            message: "Access denied. Please login."
        });
    }

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        console.log("✅ JWT verified");
        console.log("👤 User:", decoded.email);

        req.user = decoded;

        next();

    } catch (error) {

        console.log("❌ Invalid or expired JWT");

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

module.exports = protect;