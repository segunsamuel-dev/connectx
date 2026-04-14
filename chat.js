
import { supabase } from './supabase.js';

// DOM Elements
const contactList = document.getElementById('dynamic-contact-list');
const chatStream = document.getElementById('chat-stream');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const chatHeader = document.getElementById('chat-header');
const inputArea = document.getElementById('input-area');

let currentUser = null;
let activeReceiverId = null;

async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    currentUser = user;

    document.getElementById('my-avatar-display').innerText = user.email[0].toUpperCase();
    
    fetchContacts();
    setupRealtime();
}

// 1. Fetch Real People (Profiles)
async function fetchContacts() {
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .not('id', 'eq', currentUser.id);

    if (error) return console.error(error);

    contactList.innerHTML = '';
    profiles.forEach(profile => {
        const card = document.createElement('div');
        card.className = 'contact-card';
        card.innerHTML = `
            <div class="c-avatar">${profile.username[0].toUpperCase()}</div>
            <div class="c-info">
                <div class="c-name">${profile.username}</div>
                <div class="c-status">Uplink Ready</div>
            </div>
        `;
        card.onclick = () => openChat(profile);
        contactList.appendChild(card);
    });
}

// 2. Open Chat for Specific User
async function openChat(profile) {
    activeReceiverId = profile.id;
    
    // UI Updates
    chatHeader.style.display = 'flex';
    inputArea.style.display = 'block';
    document.getElementById('active-username').innerText = profile.username;
    document.getElementById('active-orb').innerText = profile.username[0].toUpperCase();
    
    document.querySelectorAll('.contact-card').forEach(c => c.classList.remove('active'));
    // Set active class logic here if needed

    loadMessageHistory();
}

// 3. Load Real Message History
async function loadMessageHistory() {
    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeReceiverId}),and(sender_id.eq.${activeReceiverId},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

    chatStream.innerHTML = '';
    messages?.forEach(msg => renderMessage(msg));
}

// 4. Send Logic
async function sendMessage() {
    const content = messageInput.value.trim();
    if (!content || !activeReceiverId) return;

    const { error } = await supabase.from('messages').insert([{
        sender_id: currentUser.id,
        receiver_id: activeReceiverId,
        content: content
    }]);

    if (!error) messageInput.value = '';
}

function renderMessage(msg) {
    const isMe = msg.sender_id === currentUser.id;
    const group = document.createElement('div');
    group.className = `msg-group ${isMe ? 'outgoing' : 'incoming'}`;
    group.innerHTML = `<div class="msg-bubble">${msg.content}</div>`;
    chatStream.appendChild(group);
    chatStream.scrollTop = chatStream.scrollHeight;
}

// 5. Global Realtime Listener
function setupRealtime() {
    supabase.channel('messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
            const msg = payload.new;
            // Only render if it's the current open chat
            if ((msg.sender_id === activeReceiverId && msg.receiver_id === currentUser.id) || 
                (msg.sender_id === currentUser.id && msg.receiver_id === activeReceiverId)) {
                renderMessage(msg);
            }
        }).subscribe();
}

sendBtn.onclick = sendMessage;
messageInput.onkeypress = (e) => e.key === 'Enter' && sendMessage();

init();
