// ==========================================
// SECUREAUTH
// USER AUTHENTICATION & JWT
// ==========================================


// ==========================================
// REGISTER
// ==========================================

const registerForm =
    document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const name =
                document.getElementById("name")
                    .value
                    .trim();

            const email =
                document.getElementById("email")
                    .value
                    .trim();

            const password =
                document.getElementById("password")
                    .value;

            const confirmPassword =
                document.getElementById("confirmPassword")
                    .value;

            const message =
                document.getElementById("message");


            // Check passwords

            if (
                password !==
                confirmPassword
            ) {

                message.textContent =
                    "❌ Passwords do not match";

                return;
            }


            message.textContent =
                "⏳ Creating your account...";


            try {

                const response =
                    await fetch(
                        "/api/auth/register",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                name: name,
                                email: email,
                                password: password
                            })
                        }
                    );


                const data =
                    await response.json();


                if (response.ok) {

                    message.textContent =
                        "✅ Account created successfully!";


                    registerForm.reset();


                    setTimeout(
                        () => {

                            window.location.href =
                                "login.html";

                        },
                        1500
                    );

                } else {

                    message.textContent =
                        "❌ " +
                        data.message;

                }

            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );

                message.textContent =
                    "❌ Unable to connect to server.";

            }

        }
    );

}


// ==========================================
// LOGIN
// ==========================================

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const email =
                document.getElementById("email")
                    .value
                    .trim();

            const password =
                document.getElementById("password")
                    .value;

            const message =
                document.getElementById(
                    "loginMessage"
                );


            message.textContent =
                "⏳ Logging in...";


            try {

                const response =
                    await fetch(
                        "/api/auth/login",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            credentials:
                                "include",

                            body: JSON.stringify({
                                email: email,
                                password: password
                            })
                        }
                    );


                const data =
                    await response.json();


                if (response.ok) {

                    message.textContent =
                        "✅ Login successful!";


                    loginForm.reset();


                    setTimeout(
                        () => {

                            window.location.href =
                                "dashboard.html";

                        },
                        1000
                    );

                } else {

                    message.textContent =
                        "❌ " +
                        data.message;

                }

            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                message.textContent =
                    "❌ Unable to connect to server.";

            }

        }
    );

}


// ==========================================
// DASHBOARD
// ==========================================

const dashboard =
    document.querySelector(
        ".dashboard-container"
    );


if (dashboard) {

    loadDashboard();

}


async function loadDashboard() {

    const message =
        document.getElementById(
            "dashboardMessage"
        );


    try {

        console.log(
            "🛡️ Checking JWT authentication..."
        );


        const response =
            await fetch(
                "/api/protected",
                {
                    method: "GET",

                    credentials:
                        "include"
                }
            );


        const data =
            await response.json();


        if (response.ok) {

            console.log(
                "✅ JWT authentication successful"
            );


            const nameElement =
                document.getElementById(
                    "userName"
                );

            const emailElement =
                document.getElementById(
                    "userEmail"
                );

            const idElement =
                document.getElementById(
                    "userId"
                );


            if (nameElement) {

                nameElement.textContent =
                    data.user.name ||
                    "Authenticated User";

            }


            if (emailElement) {

                emailElement.textContent =
                    data.user.email;

            }


            if (idElement) {

                idElement.textContent =
                    data.user.id;

            }


        } else {

            console.log(
                "❌ Authentication failed"
            );


            if (message) {

                message.textContent =
                    "❌ " +
                    data.message;

            }


            setTimeout(
                () => {

                    window.location.href =
                        "login.html";

                },
                1500
            );

        }

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );


        if (message) {

            message.textContent =
                "❌ Unable to connect to server.";

        }

    }

}


// ==========================================
// FORGOT PASSWORD
// ==========================================

const forgotPasswordForm =
    document.getElementById(
        "forgotPasswordForm"
    );


if (forgotPasswordForm) {

    forgotPasswordForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const email =
                document.getElementById(
                    "forgotEmail"
                )
                .value
                .trim();


            const message =
                document.getElementById(
                    "forgotMessage"
                );


            const emailSentMessage =
                document.getElementById(
                    "emailSentMessage"
                );


            // Hide old success message

            if (emailSentMessage) {

                emailSentMessage.style.display =
                    "none";

            }


            message.textContent =
                "⏳ Sending reset link...";


            try {

                console.log(
                    "📩 Sending forgot password request..."
                );


                const response =
                    await fetch(
                        "/api/auth/forgot-password",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email: email
                            })
                        }
                    );


                const data =
                    await response.json();


                // ==================================
                // EMAIL SENT
                // ==================================

                if (response.ok) {

                    console.log(
                        "📨 Password reset email sent successfully"
                    );


                    /*
                        IMPORTANT:

                        We intentionally DO NOT display:

                        data.resetLink

                        The reset link is available ONLY
                        inside the email.
                    */


                    message.textContent =
                        "";


                    if (emailSentMessage) {

                        emailSentMessage.style.display =
                            "block";

                    }


                    forgotPasswordForm.reset();


                } else {

                    message.textContent =
                        "❌ " +
                        data.message;

                }


            } catch (error) {

                console.error(
                    "Forgot password error:",
                    error
                );


                message.textContent =
                    "❌ Unable to connect to server.";

            }

        }
    );

}


// ==========================================
// RESET PASSWORD
// ==========================================

const resetPasswordForm =
    document.getElementById(
        "resetPasswordForm"
    );


if (resetPasswordForm) {

    resetPasswordForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const newPassword =
                document.getElementById(
                    "newPassword"
                )
                .value;


            const confirmNewPassword =
                document.getElementById(
                    "confirmNewPassword"
                )
                .value;


            const message =
                document.getElementById(
                    "resetMessage"
                );


            // ==================================
            // CHECK PASSWORDS
            // ==================================

            if (
                newPassword !==
                confirmNewPassword
            ) {

                message.textContent =
                    "❌ Passwords do not match";

                return;

            }


            // ==================================
            // PASSWORD LENGTH
            // ==================================

            if (
                newPassword.length < 6
            ) {

                message.textContent =
                    "❌ Password must be at least 6 characters";

                return;

            }


            // ==================================
            // GET RESET TOKEN
            // ==================================

            const urlParams =
                new URLSearchParams(
                    window.location.search
                );


            const token =
                urlParams.get("token");


            if (!token) {

                message.textContent =
                    "❌ Invalid reset link";

                return;

            }


            message.textContent =
                "⏳ Resetting password...";


            try {

                const response =
                    await fetch(
                        `/api/auth/reset-password/${token}`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                password:
                                    newPassword
                            })
                        }
                    );


                const data =
                    await response.json();


                if (response.ok) {

                    message.textContent =
                        "✅ Password reset successfully!";


                    resetPasswordForm.reset();


                    setTimeout(
                        () => {

                            window.location.href =
                                "login.html";

                        },
                        1500
                    );


                } else {

                    message.textContent =
                        "❌ " +
                        data.message;

                }


            } catch (error) {

                console.error(
                    "Reset password error:",
                    error
                );


                message.textContent =
                    "❌ Unable to connect to server.";

            }

        }
    );

}


// ==========================================
// LOGOUT
// ==========================================

async function logout() {

    console.log(
        "🚪 Logout requested"
    );


    try {

        const response =
            await fetch(
                "/api/auth/logout",
                {
                    method: "POST",

                    credentials:
                        "include"
                }
            );


        const data =
            await response.json();


        console.log(
            data.message
        );


        window.location.href =
            "login.html";


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );


        window.location.href =
            "login.html";

    }

}