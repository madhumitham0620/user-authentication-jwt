const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const users = require("../models/userModel");

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        console.log("");
        console.log("📝 REGISTER REQUEST");
        console.log("👤 Name:", name);
        console.log("📧 Email:", email);

        if (!name || !email || !password) {
            console.log("❌ Missing registration fields");

            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const existingUser = users.find(
            user => user.email === email
        );

        if (existingUser) {
            console.log("❌ User already exists");

            return res.status(400).json({
                message: "User already exists"
            });
        }

        console.log("🔐 Hashing password...");

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: Date.now(),
            name,
            email,
            password: hashedPassword
        };

        users.push(newUser);

        console.log("✅ User registered successfully");
        console.log("👥 Total users:", users.length);

        res.status(201).json({
            message: "User registered successfully"
        });

    } catch (error) {
        console.log("🔥 Registration error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("");
        console.log("🔑 LOGIN REQUEST");
        console.log("📧 Email:", email);

        const user = users.find(
            user => user.email === email
        );

        if (!user) {
            console.log("❌ User not found");

            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        console.log("🔍 Checking password...");

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

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        console.log("🎟️ JWT token generated");

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 60 * 60 * 1000
        });

        console.log("🍪 JWT stored in HTTP-only cookie");
        console.log("✅ Login successful");

        res.json({
            message: "Login successful"
        });

    } catch (error) {
        console.log("🔥 Login error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    register,
    login
};