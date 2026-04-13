import { supabase } from './supabase.js';

/**
 * ConnectX_User_OS
 * Core Controller for the User Executive Dashboard
 */
class ConnectX_User_OS {
    constructor() {
        this.user = null;
        this.boot();
    }

    async boot() {
        try {
            // 1. Session Verification
            const { data: { user }, error } = await supabase.auth.getUser();
            
            if (error || !user) {
                console.warn("AUTH_REQUIRED: Redirecting to login.");
                return window.location.href = 'login.html';
            }

            this.user = user;

            // 2. Initialize Interface
            this.render();
            this.applySavedTheme();
            this.bindEvents();

        } catch (err) {
            console.error("SYSTEM_BOOT_ERROR:", err);
            window.location.href = 'login.html';
        }
    }

    render() {
        // Extract metadata with fallbacks
        const metadata = this.user.user_metadata || {};
        const name = metadata.display_name || "User";
        const email = this.user.email ? this.user.email.toUpperCase() : "UNKNOWN_AUTH";
        const initial = name.charAt(0).toUpperCase();

        // Batch DOM Updates
        const elements = {
            welcome: document.getElementById('welcome-msg'),
            display: document.getElementById('display-name'),
            email: document.getElementById('display-email'),
            navAvatar: document.getElementById('nav-avatar'),
            pfpInitials: document.getElementById('pfp-initials')
        };

        if (elements.welcome) elements.welcome.innerText = name;
        if (elements.display) elements.display.innerText = name;
        if (elements.email) elements.email.innerText = email;
        
        // Update initials across all identity anchors
        [elements.navAvatar, elements.pfpInitials].forEach(el => {
            if (el) el.innerText = initial;
        });
    }

    applySavedTheme() {
        const savedTheme = localStorage.getItem('cx_theme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    bindEvents() {
        // Theme Toggle Engine
        const themeBtn = document.getElementById('theme-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const isDark = document.body.classList.toggle('dark-mode');
                localStorage.setItem('cx_theme', isDark ? 'dark' : 'light');
                
                // Optional: Update icon dynamically if using LineIcons
                const icon = themeBtn.querySelector('i');
                if (icon) {
                    icon.className = isDark ? 'lni lni-night' : 'lni lni-sun';
                }
            });
        }

        // Identity Modification Trigger
        const editBtn = document.getElementById('edit-profile');
        if (editBtn) {
            editBtn.addEventListener('click', async () => {
                const currentName = this.user.user_metadata.display_name || "User";
                const nextName = prompt("MOD_NAME_REQUEST:", currentName);
                
                if (nextName && nextName !== currentName) {
                    const { error } = await supabase.auth.updateUser({ 
                        data: { display_name: nextName } 
                    });

                    if (error) {
                        alert("SYNC_ERROR: " + error.message);
                    } else {
                        location.reload();
                    }
                }
            });
        }
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    new ConnectX_User_OS();
});
