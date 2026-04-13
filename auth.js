import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("ConnectX Auth Script: Operational");

    const tabs = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');
    const indicator = document.querySelector('.tab-indicator');
    const errorToast = document.getElementById('error-message');

    // --- 1. INITIAL STATE ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.style.display = 'block';
        loginForm.classList.add('active');
    }

    // --- 2. UI FEEDBACK ---
    function showFeedback(message, isError = true) {
        if (!errorToast) return;
        errorToast.innerText = message;
        errorToast.style.display = "block";
        errorToast.style.color = isError ? "#ef4444" : "#22c55e";
    }

    // --- 3. TAB SWITCHING ---
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            const targetName = tab.getAttribute('data-tab'); 
            
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            if(indicator) indicator.style.left = `${index * 50}%`;

            forms.forEach(form => {
                form.classList.remove('active');
                form.style.display = 'none';
            });

            const targetForm = document.getElementById(`${targetName}-form`);
            if (targetForm) {
                targetForm.classList.add('active');
                targetForm.style.display = 'block';
            }
        });
    });

    // --- 4. SIGN UP LOGIC (Metadata Sync Enabled) ---
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

            btn.innerText = "CREATING_ID...";
            btn.disabled = true;

            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { 
                    data: { 
                        display_name: username,
                        avatar_url: '' 
                    } 
                }
            });

            btn.innerText = "CREATE ACCOUNT";
            btn.disabled = false;

            if (error) {
                showFeedback(error.message);
            } else {
                showFeedback("SUCCESS. CHECK EMAIL FOR VERIFICATION.", false);
            }
        });
    }

    // --- 5. LOGIN LOGIC (Dashboard Link) ---
    const loginFormSubmit = document.getElementById('login-form');
    if (loginFormSubmit) {
        loginFormSubmit.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginFormSubmit.querySelector('.btn-submit');
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            btn.innerText = "AUTHENTICATING...";
            btn.disabled = true;

            const { error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                showFeedback(error.message);
                btn.innerText = "LOGIN";
                btn.disabled = false;
            } else {
                showFeedback("ACCESS_GRANTED. REDIRECTING...", false);
                // Redirecting to the professional dashboard
                setTimeout(() => { 
                    window.location.href = 'dashboard.html'; 
                }, 1500);
            }
        });
    }
});

// GLOBAL UTILITIES
window.togglePassword = function(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
};
