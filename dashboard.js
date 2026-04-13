import { supabase } from './config.js';

const MasterController = {
    async init() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return window.location.href = 'login.html';
        
        this.user = user;
        this.hydrate();
        this.initTheme();
        this.bind();
    },

    hydrate() {
        const meta = this.user.user_metadata;
        const name = meta.display_name || "Logos";
        
        document.getElementById('display-name').innerText = name;
        document.getElementById('display-email').innerText = this.user.email;
        document.getElementById('welcome-text').innerText = `Welcome back, ${name.split(' ')[0]}`;
        
        const initial = name.charAt(0).toUpperCase();
        document.querySelectorAll('#nav-avatar, #pfp-initials').forEach(el => el.innerText = initial);
    },

    initTheme() {
        const theme = localStorage.getItem('cx_theme') || 'light';
        document.body.className = `${theme}-mode`;
        document.getElementById('theme-btn').innerHTML = `<i class="lni lni-${theme === 'light' ? 'sun' : 'night'}"></i>`;
    },

    bind() {
        // Smooth Theme Switch
        document.getElementById('theme-btn').addEventListener('click', () => {
            const current = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
            document.body.className = `${current}-mode`;
            localStorage.setItem('cx_theme', current);
            document.getElementById('theme-btn').innerHTML = `<i class="lni lni-${current === 'light' ? 'sun' : 'night'}"></i>`;
        });

        // Edit Profile
        document.getElementById('edit-profile').addEventListener('click', async () => {
            const next = prompt("Update Username:", this.user.user_metadata.display_name);
            if (next) {
                await supabase.auth.updateUser({ data: { display_name: next } });
                location.reload();
            }
        });
    }
};

MasterController.init();