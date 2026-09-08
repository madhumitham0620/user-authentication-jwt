// ==========================================
// USER AUTHENTICATION & JWT SERVER
// ==========================================

const express = require("express");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require("./routes/authRoutes");

// Import JWT middleware
const protect = require("./middleware/authMiddleware");

// Import database
const db = require("./models/userModel");


// ==========================================
// CREATE EXPRESS APP
// ==========================================

const app = express();


// ==========================================
// MIDDLEWARE
// ==========================================

// Read JSON data from requests
app.use(express.json());

// Read cookies
app.use(cookieParser());

// Serve frontend files from public folder
app.use(express.static("public"));


// ==========================================
// HOME PAGE
// ==========================================

app.get("/", (req, res) => {

    console.log("🏠 HOME PAGE ACCESSED");

    res.sendFile(
        __dirname + "/public/index.html"
    );
});


// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

app.use(
    "/api/auth",
    authRoutes
);


// ==========================================
// PROTECTED ROUTE
// ==========================================

app.get(
    "/api/protected",
    protect,
    (req, res) => {

        console.log(
            "🔒 PROTECTED API ACCESSED"
        );

        res.json({
            message:
                "You have accessed a protected route!",

            user: req.user
        });
    }
);


// ==========================================
// DATABASE TEST ROUTE
// ==========================================

app.get("/api/users", (req, res) => {

    console.log(
        "👥 USERS DATABASE REQUEST"
    );

    db.all(
        `SELECT id, name, email
         FROM users`,
        [],
        (err, rows) => {

            if (err) {

                console.log(
                    "❌ Database error:",
                    err.message
                );

                return res.status(500).json({
                    message:
                        "Database error"
                });
            }

            res.json({
                users: rows
            });
        }
    );
});


// ==========================================
// 404 ERROR
// ==========================================

app.use((req, res) => {

    console.log(
        "❌ Route not found:",
        req.method,
        req.url
    );

    res.status(404).json({
        message:
            "Route not found"
    });
});


// ==========================================
// START SERVER
// ==========================================

const PORT =
    process.env.PORT || 5000;

app.listen(
    PORT,
    () => {

        console.log("");
        console.log(
            "======================================"
        );

        console.log(
            "🚀 SERVER STARTED SUCCESSFULLY"
        );

        console.log(
            "======================================"
        );

        console.log(
            `🌐 Website: http://localhost:${PORT}`
        );

        console.log(
            "📝 Register: POST /api/auth/register"
        );

        console.log(
            "🔑 Login: POST /api/auth/login"
        );

        console.log(
            "📩 Forgot Password: POST /api/auth/forgot-password"
        );

        console.log(
            "🔄 Reset Password: POST /api/auth/reset-password/:token"
        );

        console.log(
            "🔒 Protected: GET /api/protected"
        );

        console.log(
            "🚪 Logout: POST /api/auth/logout"
        );

        console.log(
            "👥 Users: GET /api/users"
        );

        console.log(
            "======================================"
        );

        console.log(
            "👀 WAITING FOR REQUESTS..."
        );

        console.log("");
    }
);