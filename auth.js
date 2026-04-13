import { supabase } from './config.js';

// Wrap everything in an Event Listener to ensure the HTML is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("ConnectX Auth Script Initialized");

    const tabs = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');
    const indicator = document.querySelector('.tab-indicator');

    // --- 1. INITIAL STATE CHECK ---
    // Force show the login form on first load
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.style.display = 'block';
        loginForm.classList.add('active');
    }

    // --- 2. TAB SWITCHING LOGIC ---
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            const targetName = tab.getAttribute('data-tab'); 
            console.log('Switching to:', targetName);

            // Update Tabs & Indicator
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            if(indicator) indicator.style.left = `${index * 50}%`;

            // Hide ALL forms using display: none directly
            forms.forEach(form => {
                form.classList.remove('active');
                form.style.display = 'none';
            });

            // Show the target form
            const targetForm = document.getElementById(`${targetName}-form`);
            if (targetForm) {
                targetForm.classList.add('active');
                targetForm.style.display = 'block';
            } else {
                console.error(`Form not found: ${targetName}-form`);
            }
        });
    });

    // --- 3. AUTH SUBMISSION LOGIC ---
    const errorToast = document.getElementById('error-message');

    function showFeedback(message, isError = true) {
        if (!errorToast) return;
        errorToast.innerText = message;
        errorToast.style.display = "block";
        errorToast.style.color = isError ? "#ef4444" : "#22c55e";
    }

    // Sign Up Submission
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = signupForm.querySelector('.btn-submit');
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-pass').value;
            const username = document.getElementById('reg-user').value;
            const confirmPass = document.getElementById('reg-confirm').value;

            if (password !== confirmPass) return showFeedback("Passwords do not match!");

            btn.innerText = "Creating Account...";
            btn.disabled = true;

            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { display_name: username } }
            });

            btn.innerText = "Create Account";
            btn.disabled = false;

            if (error) showFeedback(error.message);
            else showFeedback("Success! Check your email.", false);
        });
    }

    // Login Submission
    const loginFormSubmit = document.getElementById('login-form');
    if (loginFormSubmit) {
        loginFormSubmit.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginFormSubmit.querySelector('.btn-submit');
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            btn.innerText = "Authenticating...";
            btn.disabled = true;

            const { error } = await supabase.auth.signInWithPassword({ email, password });

            btn.innerText = "Login";
            btn.disabled = false;

            if (error) showFeedback(error.message);
            else {
                showFeedback("Redirecting...", false);
                setTimeout(() => { window.location.href = 'index.html'; }, 1500);
            }
        });
    }
});

// KEEP THIS OUTSIDE THE DOM LOAD - Eye Icon Toggle
window.togglePassword = function(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
};