/* DoRest Firebase Authentication
   v17 - Login and logout fixed using Firebase Compat SDK for reliable browser loading.
*/

const firebaseConfig = {
    apiKey: "AIzaSyDFXViUUIyuX8rP2T8kqziGasWmZQr1u6Y",
    authDomain: "dorest-6ec1d.firebaseapp.com",
    projectId: "dorest-6ec1d",
    storageBucket: "dorest-6ec1d.firebasestorage.app",
    messagingSenderId: "377857417432",
    appId: "1:377857417432:web:b5be6af618ce853fbb37ad"
};

const AUTH_STORAGE_KEY = "dorestCustomerAuth";

let dorestAuth = null;
let dorestDb = null;

try {
    if (!window.firebase) throw new Error("Firebase SDK did not load.");
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    dorestAuth = firebase.auth();
    dorestDb = firebase.firestore();

    // Expose both Firebase services globally because app.js uses them
    // during booking confirmation and account operations.
    window.dorestAuth = dorestAuth;
    window.dorestDb = dorestDb;
} catch (error) {
    console.error("DoRest Firebase initialization failed:", error);
}

function normalizePhone(value) {
    return String(value || "").replace(/\D/g, "").slice(-10);
}

function getAuthSnapshot() {
    try {
        return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY)) || null;
    } catch {
        return null;
    }
}

function setAuthSnapshot(user, extra = {}) {
    if (!user) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        window.dorestFirebaseUser = null;
        return;
    }

    const snapshot = {
        uid: user.uid,
        email: user.email || "",
        name: user.displayName || extra.name || "",
        phone: extra.phone || ""
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(snapshot));
    window.dorestFirebaseUser = user;
}

function openAuthModal(mode = "login") {
    const modal = document.getElementById("customerAuthModal");
    if (!modal) return;
    switchAuthMode(mode);
    modal.classList.add("active");
}

function closeAuthModal() {
    document.getElementById("customerAuthModal")?.classList.remove("active");
}

function switchAuthMode(mode) {
    const loginForm = document.getElementById("customerLoginForm");
    const signupForm = document.getElementById("customerSignupForm");
    const loginTab = document.getElementById("customerLoginTab");
    const signupTab = document.getElementById("customerSignupTab");
    const title = document.getElementById("authTitle");
    const subtitle = document.getElementById("authSubtitle");
    const isLogin = mode === "login";

    if (loginForm) loginForm.hidden = !isLogin;
    if (signupForm) signupForm.hidden = isLogin;
    loginTab?.classList.toggle("active", isLogin);
    signupTab?.classList.toggle("active", !isLogin);

    if (title) title.textContent = isLogin ? "Welcome back" : "Create your DoRest account";
    if (subtitle) {
        subtitle.textContent = isLogin
            ? "Login to manage your bookings and profile."
            : "Create your account to book and manage services.";
    }
}

function toggleAuthPassword(id, button) {
    const input = document.getElementById(id);
    if (!input) return;
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    if (button) button.textContent = show ? "Hide" : "Show";
}

function setBusy(buttonId, busy, busyText, idleText) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    button.disabled = busy;
    button.textContent = busy ? busyText : idleText;
}

async function saveCustomerProfileToFirestore(uid, profile) {
    if (!dorestDb || !uid) return;
    await dorestDb.collection("customers").doc(uid).set({
        uid,
        name: profile.name || "",
        phone: profile.phone || "",
        email: profile.email || "",
        address: profile.address || "",
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

async function loadCustomerProfileFromFirestore(user) {
    if (!dorestDb || !user) return null;
    try {
        const snap = await dorestDb.collection("customers").doc(user.uid).get();
        return snap.exists ? snap.data() : null;
    } catch (error) {
        console.warn("DoRest profile load failed:", error);
        return null;
    }
}

async function customerSignup() {
    const name = document.getElementById("signupName")?.value.trim();
    const phone = normalizePhone(document.getElementById("signupPhone")?.value);
    const email = document.getElementById("signupEmail")?.value.trim().toLowerCase();
    const password = document.getElementById("signupPassword")?.value || "";

    if (!name) return window.showToast?.("Please enter your full name.");
    if (!/^\d{10}$/.test(phone)) return window.showToast?.("Please enter a valid 10-digit mobile number.");
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return window.showToast?.("Please enter a valid email address.");
    if (password.length < 6) return window.showToast?.("Password must be at least 6 characters.");

    if (!dorestAuth) {
        window.showToast?.("Firebase is not connected. Please run DoRest using Live Server and try again.");
        return;
    }

    setBusy("customerSignupBtn", true, "Creating account...", "Create account");

    try {
        const credential = await dorestAuth.createUserWithEmailAndPassword(email, password);
        await credential.user.updateProfile({ displayName: name });

        const profile = { name, phone, email, address: "" };
        localStorage.setItem("dorestProfile", JSON.stringify(profile));
        setAuthSnapshot(credential.user, { name, phone });
        await saveCustomerProfileToFirestore(credential.user.uid, profile);

        closeAuthModal();
        window.updateAccountHeader?.(profile);
        window.openAccount?.();
        window.showToast?.("Account created successfully.");
    } catch (error) {
        console.error(error);
        window.showToast?.(friendlyAuthError(error));
    } finally {
        setBusy("customerSignupBtn", false, "", "Create account");
    }
}

async function customerLogin() {
    const email = document.getElementById("loginEmail")?.value.trim().toLowerCase();
    const password = document.getElementById("loginPassword")?.value || "";

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return window.showToast?.("Please enter a valid email address.");
    }
    if (!password) return window.showToast?.("Please enter your password.");

    if (!dorestAuth) {
        window.showToast?.("Firebase is not connected. Please run DoRest using Live Server and try again.");
        return;
    }

    setBusy("customerLoginBtn", true, "Logging in...", "Login");

    try {
        const credential = await dorestAuth.signInWithEmailAndPassword(email, password);
        const stored = getAuthSnapshot() || {};
        const oldProfile = JSON.parse(localStorage.getItem("dorestProfile") || "{}");

        const profile = {
            ...oldProfile,
            email: credential.user.email || email,
            name: credential.user.displayName || stored.name || oldProfile.name || "",
            phone: stored.phone || oldProfile.phone || ""
        };

        localStorage.setItem("dorestProfile", JSON.stringify(profile));
        setAuthSnapshot(credential.user, profile);
        const remoteProfile = await loadCustomerProfileFromFirestore(credential.user);
        if (remoteProfile) {
            const mergedProfile = { ...profile, ...remoteProfile, email: credential.user.email || profile.email };
            localStorage.setItem("dorestProfile", JSON.stringify(mergedProfile));
        } else {
            await saveCustomerProfileToFirestore(credential.user.uid, profile);
        }

        closeAuthModal();
        window.updateAccountHeader?.(profile);
        window.openAccount?.();
        window.showToast?.("Login successful.");
    } catch (error) {
        console.error(error);
        window.showToast?.(friendlyAuthError(error));
    } finally {
        setBusy("customerLoginBtn", false, "", "Login");
    }
}

async function customerLogout() {
    try {
        if (dorestAuth) await dorestAuth.signOut();
        setAuthSnapshot(null);
        localStorage.removeItem("dorestSavedAddresses");
        closeAuthModal();
        window.closeAccount?.();
        updateAuthButton(null);
        window.updateAccountHeader?.({});
        window.showToast?.("You have been logged out.");
    } catch (error) {
        console.error(error);
        window.showToast?.(friendlyAuthError(error));
    }
}

async function requestPasswordReset() {
    const email = window.prompt("Enter your DoRest account email:");
    if (!email) return;

    if (!dorestAuth) {
        window.showToast?.("Firebase is not connected. Please run DoRest using Live Server.");
        return;
    }

    try {
        await dorestAuth.sendPasswordResetEmail(email.trim().toLowerCase());
        window.showToast?.("Password reset email sent.");
    } catch (error) {
        console.error(error);
        window.showToast?.(friendlyAuthError(error));
    }
}

function continueAsGuest() {
    closeAuthModal();
    window.showToast?.("Continuing as guest. Login when you are ready to manage your account.");
}

function updateAuthButton(user) {
    const button = document.getElementById("accountHeaderBtn") || document.querySelector(".login-btn");
    const logoutButton = document.getElementById("logoutHeaderBtn");
    const mobileLogoutButton = document.getElementById("mobileLogoutBtn");

    const loggedIn = !!user;

    if (button) {
        button.textContent = loggedIn ? "My Account" : "Login";
        button.style.display = "inline-flex";
    }

    if (logoutButton) {
        logoutButton.hidden = false;
        logoutButton.style.display = loggedIn ? "inline-flex" : "none";
        logoutButton.setAttribute("aria-hidden", loggedIn ? "false" : "true");
    }

    if (mobileLogoutButton) {
        mobileLogoutButton.style.display = loggedIn ? "flex" : "none";
        mobileLogoutButton.setAttribute("aria-hidden", loggedIn ? "false" : "true");
    }

    document.body.classList.toggle("dorest-logged-in", loggedIn);
}

function openCustomerAccount() {
    if (dorestAuth?.currentUser) {
        window.openAccount?.();
        return;
    }
    openAuthModal("login");
}

function friendlyAuthError(error) {
    const code = error?.code || "";
    const messages = {
        "auth/email-already-in-use": "An account already exists with this email.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/invalid-login-credentials": "Incorrect email or password.",
        "auth/user-not-found": "No account was found with this email.",
        "auth/wrong-password": "Incorrect email or password.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
        "auth/network-request-failed": "Network error. Please check your internet connection."
    };
    return messages[code] || error?.message || "Something went wrong. Please try again.";
}

// Expose every UI action globally because the DoRest HTML uses inline onclick handlers.
window.openCustomerAccount = openCustomerAccount;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthMode = switchAuthMode;
window.toggleAuthPassword = toggleAuthPassword;
window.customerSignup = customerSignup;
window.customerLogin = customerLogin;
window.customerLogout = customerLogout;
window.requestPasswordReset = requestPasswordReset;
window.continueAsGuest = continueAsGuest;

if (dorestAuth) {
    dorestAuth.onAuthStateChanged(async user => {
        if (user) {
            const stored = getAuthSnapshot() || {};
            setAuthSnapshot(user, stored);
            updateAuthButton(user);

            const oldProfile = JSON.parse(localStorage.getItem("dorestProfile") || "{}");
            let profile = {
                ...oldProfile,
                name: user.displayName || stored.name || oldProfile.name || "",
                email: user.email || stored.email || oldProfile.email || "",
                phone: stored.phone || oldProfile.phone || ""
            };

            const remoteProfile = await loadCustomerProfileFromFirestore(user);
            if (remoteProfile) {
                profile = { ...profile, ...remoteProfile, email: user.email || profile.email };
            } else {
                await saveCustomerProfileToFirestore(user.uid, profile);
            }

            localStorage.setItem("dorestProfile", JSON.stringify(profile));
            window.updateAccountHeader?.(profile);
            window.loadBookingsFromFirestore?.();
        } else {
            setAuthSnapshot(null);
            updateAuthButton(null);
            window.updateAccountHeader?.(window.getProfile?.() || {});
        }
    });
}
