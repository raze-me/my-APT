document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('myapt_user') && window.location.pathname === '/login') {
        window.location.href = '/dashboard';
        return;
    }

    const firebaseConfig = window.firebaseConfig || {
        apiKey: "",
        authDomain: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: "",
        measurementId: ""
    };
    
    const loginButton = document.getElementById('google-login-btn');
    const statusMsg = document.getElementById('auth-status-msg');
    
    const isPlaceholderConfig = (config) => {
        return !config || !config.apiKey || config.apiKey === "" || config.apiKey.startsWith("YOUR_");
    };

    const updateStatus = (message, type = 'normal') => {
        if(!statusMsg) return;

        statusMsg.textContent = message;
        statusMsg.className = 'status-message';

        if(type !== 'normal') {
            statusMsg.classList.add(type);
        }
    };

    let firebaseInitialized = false;

    if(typeof firebase !== 'undefined') {
        if(isPlaceholderConfig(firebaseConfig)){
            console.warn("Firebase credentials not configured yet. Running in Demo Mock Mode.");
            updateStatus("Firebase not configured. Running in Demo Mock Mode.", "error");
        } else {
            try {
                firebase.initializeApp(firebaseConfig);
                firebaseInitialized = true;
                updateStatus("Click above to sign in using Google Auth.", "normal");
            } catch(error) {
                console.error("Firebase init failed: ", error);
                updateStatus(`Configuration Error: ${error.message}`, "error");
            }
        }
    } else {
        console.warn("Firebase SDK scripts not loaded");
        updateStatus("Firebase SDK not loaded", "error");
    }

    if(loginButton) {
        loginButton.addEventListener('click', () => {
            if(!firebaseInitialized) {

                updateStatus("Demo Mock Mode: Connecting to Google authentication...", "loading");
                loginButton.disabled = true;

                setTimeout(() => {
                    const mockUser = {
                        email: "demo@myapt.com",
                        displayName: "Demo User"
                    };
                    localStorage.setItem('myapt_user', JSON.stringify(mockUser));
                    
                    updateStatus(`Success! Logged in as ${mockUser.displayName} (Demo Mode)`, "success");

                    loginButton.style.backgroundColor = '#d1fae5';
                    loginButton.style.borderColor = '#10b981';
                    loginButton.style.color = '#065f46';

                    setTimeout(() => {
                        updateStatus("Redirecting to your dashboard...");
                        setTimeout(() => {
                            window.location.href = '/dashboard';
                        }, 1000);
                    }, 1000);
                }, 1200);

            } else {
                
                loginButton.disabled = true;
                const provider = new firebase.auth.GoogleAuthProvider();
                provider.setCustomParameters({
                    prompt: 'select_account'
                });

                updateStatus("Connecting to Google authentication...", "loading");

                firebase.auth().signInWithPopup(provider)
                    .then((result) => {
                        const user = result.user;
                        console.log("Logged in successfully: ", user);

                        localStorage.setItem('myapt_user', JSON.stringify({
                            email: user.email,
                            displayName: user.displayName || user.email.split('@')[0],
                            photoURL: user.photoURL
                        }));

                        updateStatus(`Success! Logged in as ${user.displayName || user.email}`, "success");

                        loginButton.style.backgroundColor = '#d1fae5';
                        loginButton.style.borderColor = '#10b981';
                        loginButton.style.color = '#065f46';

                        setTimeout(() => {
                            updateStatus("Redirecting to your dashboard...");
                            setTimeout(() => {
                                window.location.href = '/dashboard';
                            }, 1000);
                        }, 1000);
                    })
                    .catch((error) => {
                        loginButton.disabled = false;
                        console.error("Auth sign-in error: ", error);
                        let displayMessage = "Authentication failed: " + error.message;

                        if(error.code === 'auth/popup-closed-by-user') {
                            displayMessage = "Popup closed before completing sign-in. Please try again.";
                        } else if(error.code === 'auth/operation-not-allowed') {
                            displayMessage = "Google Auth is disabled. Enable Google provider in Firebase console.";
                        }

                        updateStatus(displayMessage, "error");
                    });
            }
        });
    }
});