const express = require("express");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

const authRoutes = require("./routes/authRoutes");
const protect = require("./middleware/authMiddleware");

dotenv.config();

const app = express();


// Middleware
app.use(express.json());
app.use(cookieParser());


// Home
app.get("/", (req, res) => {

    console.log("🏠 HOME API ACCESSED");

    res.json({
        message: "User Authentication & JWT API is running"
    });
});


// Authentication routes
app.use("/api/auth", authRoutes);


// Protected route
app.get("/api/protected", protect, (req, res) => {

    console.log("🔒 PROTECTED API ACCESSED");

    res.json({
        message: "You have accessed a protected route!",
        user: req.user
    });
});


// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log("");
    console.log("======================================");
    console.log("🚀 SERVER STARTED SUCCESSFULLY");
    console.log("======================================");
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log("📝 Register: POST /api/auth/register");
    console.log("🔑 Login: POST /api/auth/login");
    console.log("🔒 Protected: GET /api/protected");
    console.log("======================================");
    console.log("👀 WAITING FOR REQUESTS...");
    console.log("");
});