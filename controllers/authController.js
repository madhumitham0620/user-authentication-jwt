// ==========================================
// USER AUTHENTICATION CONTROLLER
// ==========================================

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const db = require("../models/userModel");

// ==========================================
// EMAIL CONFIGURATION
// ==========================================

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ==========================================
// REGISTER
// ==========================================

const register = async (req, res) => {

    try {

        const { name, email, password } = req.body;

        console.log("");
        console.log("📝 REGISTER REQUEST");
        console.log("👤 Name:", name);
        console.log("📧 Email:", email);

        if (!name || !email || !password) {

            return res.status(400).json({
                message:
                    "Name, email and password are required"
            });
        }

        db.get(
            "SELECT * FROM users WHERE email = ?",
            [email],
            async (err, user) => {

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

                if (user) {

                    console.log(
                        "❌ User already exists"
                    );

                    return res.status(400).json({
                        message:
                            "User already exists"
                    });
                }

                console.log(
                    "🔐 Hashing password..."
                );

                const hashedPassword =
                    await bcrypt.hash(
                        password,
                        10
                    );

                db.run(
                    `INSERT INTO users
                    (name, email, password)
                    VALUES (?, ?, ?)`,
                    [
                        name,
                        email,
                        hashedPassword
                    ],
                    function (err) {

                        if (err) {

                            console.log(
                                "❌ Registration error:",
                                err.message
                            );

                            return res.status(500).json({
                                message:
                                    "Could not create user"
                            });
                        }

                        console.log(
                            "✅ User registered successfully"
                        );

                        res.status(201).json({
                            message:
                                "User registered successfully"
                        });
                    }
                );
            }
        );

    } catch (error) {

        console.log(
            "🔥 Registration error:",
            error.message
        );

        res.status(500).json({
            message:
                "Server error"
        });
    }
};


// ==========================================
// LOGIN
// ==========================================

const login = async (req, res) => {

    try {

        const { email, password } = req.body;

        console.log("");
        console.log("🔑 LOGIN REQUEST");
        console.log("📧 Email:", email);

        db.get(
            "SELECT * FROM users WHERE email = ?",
            [email],
            async (err, user) => {

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

                if (!user) {

                    console.log(
                        "❌ User not found"
                    );

                    return res.status(401).json({
                        message:
                            "Invalid email or password"
                    });
                }

                const passwordMatch =
                    await bcrypt.compare(
                        password,
                        user.password
                    );

                if (!passwordMatch) {

                    console.log(
                        "❌ Incorrect password"
                    );

                    return res.status(401).json({
                        message:
                            "Invalid email or password"
                    });
                }

                console.log(
                    "✅ Password verified"
                );

                const token =
                    jwt.sign(
                        {
                            id: user.id,
                            name: user.name,
                            email: user.email
                        },
                        process.env.JWT_SECRET,
                        {
                            expiresIn: "1h"
                        }
                    );

                res.cookie(
                    "token",
                    token,
                    {
                        httpOnly: true,
                        secure: false,
                        sameSite: "lax",
                        maxAge:
                            60 * 60 * 1000
                    }
                );

                console.log(
                    "🍪 JWT stored in cookie"
                );

                console.log(
                    "✅ Login successful"
                );

                res.json({
                    message:
                        "Login successful"
                });
            }
        );

    } catch (error) {

        console.log(
            "🔥 Login error:",
            error.message
        );

        res.status(500).json({
            message:
                "Server error"
        });
    }
};


// ==========================================
// FORGOT PASSWORD
// ==========================================

const forgotPassword = async (req, res) => {

    try {

        const { email } = req.body;

        console.log("");
        console.log(
            "📩 FORGOT PASSWORD REQUEST"
        );

        console.log(
            "📧 Email:",
            email
        );

        if (!email) {

            return res.status(400).json({
                message:
                    "Email is required"
            });
        }

        db.get(
            "SELECT * FROM users WHERE email = ?",
            [email],
            async (err, user) => {

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

                if (!user) {

                    console.log(
                        "❌ Email not found"
                    );

                    return res.status(404).json({
                        message:
                            "No account found with this email"
                    });
                }

                // Generate secure reset token
                const resetToken =
                    crypto
                        .randomBytes(32)
                        .toString("hex");

                // Token expires after 15 minutes
                const resetTokenExpiry =
                    Date.now() +
                    15 * 60 * 1000;

                // Save token in database
                db.run(
                    `UPDATE users
                     SET resetToken = ?,
                         resetTokenExpiry = ?
                     WHERE email = ?`,
                    [
                        resetToken,
                        resetTokenExpiry,
                        email
                    ],
                    async (err) => {

                        if (err) {

                            console.log(
                                "❌ Reset token error:",
                                err.message
                            );

                            return res.status(500).json({
                                message:
                                    "Could not generate reset token"
                            });
                        }

                        console.log(
                            "🔐 Reset token generated"
                        );

                        // Create reset link
                        const resetLink =
                            `${req.protocol}://${req.get("host")}/reset-password.html?token=${resetToken}`;

                        console.log(
                            "🔗 Reset link:",
                            resetLink
                        );

                        // ==================================
                        // SEND EMAIL
                        // ==================================

                        try {

                            await transporter.sendMail({

                                from:
                                    `"SecureAuth" <${process.env.EMAIL_USER}>`,

                                to:
                                    email,

                                subject:
                                    "SecureAuth - Password Reset",

                                html: `

                                    <div style="
                                        font-family: Arial, sans-serif;
                                        max-width: 600px;
                                        margin: auto;
                                        padding: 30px;
                                        border: 1px solid #ddd;
                                        border-radius: 10px;
                                    ">

                                        <h2>
                                            🔐 SecureAuth
                                        </h2>

                                        <h3>
                                            Password Reset Request
                                        </h3>

                                        <p>
                                            Hello ${user.name},
                                        </p>

                                        <p>
                                            We received a request
                                            to reset your password.
                                        </p>

                                        <p>
                                            Click the button below
                                            to create a new password:
                                        </p>

                                        <div style="
                                            text-align: center;
                                            margin: 30px 0;
                                        ">

                                            <a
                                                href="${resetLink}"
                                                style="
                                                    background: #2563eb;
                                                    color: white;
                                                    padding: 12px 25px;
                                                    text-decoration: none;
                                                    border-radius: 6px;
                                                    display: inline-block;
                                                "
                                            >
                                                Reset Password
                                            </a>

                                        </div>

                                        <p>
                                            This link will expire
                                            in <strong>15 minutes</strong>.
                                        </p>

                                        <p>
                                            If you did not request
                                            a password reset, you can
                                            safely ignore this email.
                                        </p>

                                        <hr>

                                        <p style="
                                            color: #777;
                                            font-size: 12px;
                                        ">
                                            SecureAuth Authentication System
                                        </p>

                                    </div>

                                `
                            });

                            console.log(
                                "📨 Password reset email sent!"
                            );

                            res.json({
                                message:
                                    "Password reset link has been sent to your email"
                            });

                        } catch (emailError) {

                            console.log(
                                "❌ Email sending failed:",
                                emailError.message
                            );

                            return res.status(500).json({
                                message:
                                    "Could not send password reset email"
                            });
                        }
                    }
                );
            }
        );

    } catch (error) {

        console.log(
            "🔥 Forgot password error:",
            error.message
        );

        res.status(500).json({
            message:
                "Server error"
        });
    }
};


// ==========================================
// RESET PASSWORD
// ==========================================

const resetPassword = async (req, res) => {

    try {

        const { token } = req.params;
        const { password } = req.body;

        console.log("");
        console.log(
            "🔄 RESET PASSWORD REQUEST"
        );

        if (!token) {

            return res.status(400).json({
                message:
                    "Reset token is required"
            });
        }

        if (!password) {

            return res.status(400).json({
                message:
                    "New password is required"
            });
        }

        db.get(
            `SELECT * FROM users
             WHERE resetToken = ?`,
            [token],
            async (err, user) => {

                if (err) {

                    return res.status(500).json({
                        message:
                            "Database error"
                    });
                }

                if (!user) {

                    return res.status(400).json({
                        message:
                            "Invalid or expired reset token"
                    });
                }

                if (
                    !user.resetTokenExpiry ||
                    Date.now() >
                    user.resetTokenExpiry
                ) {

                    return res.status(400).json({
                        message:
                            "Reset token has expired"
                    });
                }

                const hashedPassword =
                    await bcrypt.hash(
                        password,
                        10
                    );

                db.run(
                    `UPDATE users
                     SET password = ?,
                         resetToken = NULL,
                         resetTokenExpiry = NULL
                     WHERE id = ?`,
                    [
                        hashedPassword,
                        user.id
                    ],
                    (err) => {

                        if (err) {

                            return res.status(500).json({
                                message:
                                    "Could not reset password"
                            });
                        }

                        console.log(
                            "✅ Password reset successfully"
                        );

                        res.json({
                            message:
                                "Password reset successfully"
                        });
                    }
                );
            }
        );

    } catch (error) {

        console.log(
            "🔥 Reset password error:",
            error.message
        );

        res.status(500).json({
            message:
                "Server error"
        });
    }
};


// ==========================================
// LOGOUT
// ==========================================

const logout = (req, res) => {

    console.log("");
    console.log(
        "🚪 LOGOUT REQUEST"
    );

    res.clearCookie("token");

    console.log(
        "🍪 JWT cookie cleared"
    );

    res.json({
        message:
            "Logout successful"
    });
};


// ==========================================
// EXPORT
// ==========================================

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
    logout
};