// ==========================================
// USER AUTHENTICATION CONTROLLER
// ==========================================

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Resend } = require("resend");

const db = require("../models/userModel");

// ==========================================
// RESEND EMAIL CONFIGURATION
// ==========================================

const resend = new Resend(process.env.RESEND_API_KEY);

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

        // Check required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        // Check if user already exists
        db.get(
            "SELECT * FROM users WHERE email = ?",
            [email],
            async (err, user) => {
                if (err) {
                    console.log("❌ Database error:", err.message);

                    return res.status(500).json({
                        message: "Database error"
                    });
                }

                if (user) {
                    console.log("❌ User already exists");

                    return res.status(400).json({
                        message: "User already exists"
                    });
                }

                // Hash password
                console.log("🔐 Hashing password...");

                const hashedPassword = await bcrypt.hash(
                    password,
                    10
                );

                // Insert user
                db.run(
                    `INSERT INTO users
                    (name, email, password)
                    VALUES (?, ?, ?)`,
                    [name, email, hashedPassword],
                    function (err) {
                        if (err) {
                            console.log(
                                "❌ Registration error:",
                                err.message
                            );

                            return res.status(500).json({
                                message: "Could not create user"
                            });
                        }

                        console.log(
                            "✅ User registered successfully"
                        );

                        res.status(201).json({
                            message: "User registered successfully"
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
            message: "Server error"
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

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
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
                        message: "Database error"
                    });
                }

                if (!user) {
                    console.log("❌ User not found");

                    return res.status(401).json({
                        message: "Invalid email or password"
                    });
                }

                // Compare password
                const passwordMatch = await bcrypt.compare(
                    password,
                    user.password
                );

                if (!passwordMatch) {
                    console.log("❌ Incorrect password");

                    return res.status(401).json({
                        message: "Invalid email or password"
                    });
                }

                console.log("✅ Password verified");

                // Create JWT
                const token = jwt.sign(
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

                // Store JWT in cookie
                res.cookie(
                    "token",
                    token,
                    {
                        httpOnly: true,

                        // Secure cookie on Render/production
                        secure:
                            process.env.NODE_ENV === "production",

                        sameSite: "lax",

                        maxAge:
                            60 * 60 * 1000
                    }
                );

                console.log("🍪 JWT stored in cookie");
                console.log("✅ Login successful");

                res.json({
                    message: "Login successful"
                });
            }
        );
    } catch (error) {
        console.log(
            "🔥 Login error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
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
        console.log("📩 FORGOT PASSWORD REQUEST");
        console.log("📧 Email:", email);

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        // Find user
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
                        message: "Database error"
                    });
                }

                if (!user) {
                    console.log("❌ Email not found");

                    return res.status(404).json({
                        message:
                            "No account found with this email"
                    });
                }

                // ==================================
                // GENERATE RESET TOKEN
                // ==================================

                const resetToken = crypto
                    .randomBytes(32)
                    .toString("hex");

                // Token expires after 15 minutes
                const resetTokenExpiry =
                    Date.now() + 15 * 60 * 1000;

                console.log("🔐 Reset token generated");

                // ==================================
                // SAVE RESET TOKEN
                // ==================================

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

                        // ==================================
                        // CREATE RESET LINK
                        // ==================================

                        const resetLink =
                            `${req.protocol}://${req.get(
                                "host"
                            )}/reset-password.html?token=${resetToken}`;

                        console.log(
                            "🔗 Reset link generated"
                        );

                        // ==================================
                        // SEND EMAIL USING RESEND
                        // ==================================

                        try {
                            const { data, error } =
                                await resend.emails.send({
                                    from:
                                        process.env
                                            .RESEND_FROM_EMAIL,

                                    to: [email],

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

                            // ==================================
                            // CHECK RESEND RESPONSE
                            // ==================================

                            if (error) {
                                console.log(
                                    "❌ Resend email error:",
                                    error
                                );

                                return res.status(500).json({
                                    message:
                                        "Could not send password reset email"
                                });
                            }

                            console.log(
                                "📨 Password reset email sent!"
                            );

                            if (data && data.id) {
                                console.log(
                                    "📨 Resend Email ID:",
                                    data.id
                                );
                            }

                            res.json({
                                message:
                                    "Password reset link has been sent to your email"
                            });
                        } catch (emailError) {
                            console.log(
                                "❌ Resend exception:",
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
            message: "Server error"
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
        console.log("🔄 RESET PASSWORD REQUEST");

        if (!token) {
            return res.status(400).json({
                message: "Reset token is required"
            });
        }

        if (!password) {
            return res.status(400).json({
                message: "New password is required"
            });
        }

        // Find user using reset token
        db.get(
            `SELECT * FROM users
             WHERE resetToken = ?`,
            [token],
            async (err, user) => {
                if (err) {
                    console.log(
                        "❌ Database error:",
                        err.message
                    );

                    return res.status(500).json({
                        message: "Database error"
                    });
                }

                if (!user) {
                    return res.status(400).json({
                        message:
                            "Invalid or expired reset token"
                    });
                }

                // Check expiry
                if (
                    !user.resetTokenExpiry ||
                    Date.now() > user.resetTokenExpiry
                ) {
                    return res.status(400).json({
                        message:
                            "Reset token has expired"
                    });
                }

                // Hash new password
                const hashedPassword =
                    await bcrypt.hash(
                        password,
                        10
                    );

                // Update password and remove token
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
                            console.log(
                                "❌ Password reset error:",
                                err.message
                            );

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
            message: "Server error"
        });
    }
};

// ==========================================
// LOGOUT
// ==========================================

const logout = (req, res) => {
    console.log("");
    console.log("🚪 LOGOUT REQUEST");

    res.clearCookie(
        "token",
        {
            httpOnly: true,
            secure:
                process.env.NODE_ENV === "production",
            sameSite: "lax"
        }
    );

    console.log("🍪 JWT cookie cleared");

    res.json({
        message: "Logout successful"
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