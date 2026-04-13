import { supabase } from './supabase.js';

class ConnectX_Nexus {
    constructor() {
        this.activeChat = null;
        this.user = null;
        this.boot();
    }

    async boot() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return window.location.href = 'login.html';
        
        this.user = user;
        this.setupUI();
        this.listen();
    }

    setupUI() {
        // Sync the sidebar avatar with the logged-in user
        const navAvatar = document.getElementById('nav-avatar');
        if (navAvatar) {
            const name = this.user.user_metadata.display_name || "U";
            navAvatar.innerText = name.charAt(0).toUpperCase();
        }
    }

    listen() {
        const sendBtn = document.querySelector('.send-btn');
        const input = document.getElementById('message-input');

        // 1. Handle Sending Messages
        if (sendBtn && input) {
            const sendMessage = () => {
                if (input.value.trim() !== "") {
                    this.renderMessage(input.value, 'outgoing');
                    input.value = ""; // Clear input
                    // TODO: Push to Supabase Table 'messages'
                }
            };

            sendBtn.addEventListener('click', sendMessage);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendMessage();
            });
        }

        // 2. Add Friend Trigger
        const addFriendBtn = document.querySelector('.add-friend-btn');
        if (addFriendBtn) {
            addFriendBtn.addEventListener('click', () => {
                const friendID = prompt("ENTER_FRIEND_ID_OR_EMAIL:");
                if (friendID) {
                    console.log("Initializing Handshake with:", friendID);
                    // TODO: Logic for friend request
                }
            });
        }
    }

    renderMessage(text, type) {
        const stream = document.getElementById('chat-stream');
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const msgHTML = `
            <div class="msg-group ${type}">
                <div class="msg-bubble">${text}</div>
                <span class="msg-time">${time}</span>
            </div>
        `;
        
        stream.insertAdjacentHTML('beforeend', msgHTML);
        stream.scrollTop = stream.scrollHeight; // Auto-scroll to bottom
    }
}

// Initialize the Nexus
document.addEventListener('DOMContentLoaded', () => {
    new ConnectX_Nexus();
});
