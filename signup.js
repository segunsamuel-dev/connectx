import { supabase } from './config.js';

const signupForm = document.getElementById('signup-form');
const errorToast = document.getElementById('error-message');

function showFeedback(message, isError = true) {
    errorToast.innerText = message;
    errorToast.style.display = "block";
    errorToast.style.color = isError ? "#ef4444" : "#22c55e";
    errorToast.style.background = isError ? "#fff5f5" : "#f0fdf4";
}

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('signup-btn');
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-pass').value;
    const username = document.getElementById('reg-user').value;
    const confirmPass = document.getElementById('reg-confirm').value;

    // 1. Validation
    if (password !== confirmPass) {
        return showFeedback("Passwords do not match!");
    }

    if (password.length < 6) {
        return showFeedback("Password must be at least 6 characters.");
    }

    // 2. Loading State
    btn.innerText = "Creating Account...";
    btn.disabled = true;

    // 3. Supabase Sign Up
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                display_name: username,
            }
        }
    });

    // 4. Response Handling
    btn.disabled = false;
    btn.innerText = "Create Account";

    if (error) {
        showFeedback(error.message);
    } else {
        showFeedback("Success! Check your email to confirm your account.", false);
        signupForm.reset();
    }
});