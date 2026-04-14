import { supabase } from './supabase.js';
const contactList = document.getElementById('dynamic-contact-list');
const chatStream = document.getElementById('chat-stream');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const chatHeader = document.getElementById('chat-header');
const inputArea = document.getElementById('input-area');
const nexusWindow = document.getElementById('nexus-window'); // Target for sliding
const closeChatBtn = document.getElementById('close-chat');

let currentUser = null;
let activeReceiverId = null;

async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    currentUser = user;

    const avatarChar = user.email ? user.email[0].toUpperCase() : '?';
    document.getElementById('my-avatar-display').innerText = avatarChar;
    
    fetchContacts();
    setupRealtime();
}

async function fetchContacts() {
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .not('id', 'eq', currentUser.id);

    if (error) return;

    contactList.innerHTML = '';
    profiles.forEach(profile => {
        const card = document.createElement('div');
        card.className = 'contact-card';
        card.innerHTML = `
            <div class="c-avatar">${profile.username ? profile.username[0].toUpperCase() : '?'}</div>
            <div class="c-info">
                <div class="c-name">${profile.username || 'Anonymous'}</div>
                <div class="c-status">Uplink Ready</div>
            </div>
        `;
        card.onclick = () => openChat(profile);
        contactList.appendChild(card);
    });
}

function openChat(profile) {
    activeReceiverId = profile.id;
    
    // UI Logic
    chatHeader.style.display = 'flex';
    inputArea.style.display = 'block';
    document.getElementById('active-username').innerText = profile.username;
    document.getElementById('active-orb').innerText = profile.username ? profile.username[0].toUpperCase() : '?';
    
    // Mobile Slide-In
    nexusWindow.classList.add('active');

    loadMessageHistory();
}

// Mobile Back Logic
function closeChat() {
    nexusWindow.classList.remove('active');
    activeReceiverId = null;
}

async function loadMessageHistory() {
    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeReceiverId}),and(sender_id.eq.${activeReceiverId},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

    chatStream.innerHTML = '';
    messages?.forEach(msg => renderMessage(msg));
}

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

function setupRealtime() {
    supabase.channel('messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
            const msg = payload.new;
            if ((msg.sender_id === activeReceiverId && msg.receiver_id === currentUser.id) || 
                (msg.sender_id === currentUser.id && msg.receiver_id === activeReceiverId)) {
                renderMessage(msg);
            }
        }).subscribe();
}

// Events
sendBtn.onclick = sendMessage;
messageInput.onkeypress = (e) => e.key === 'Enter' && sendMessage();
closeChatBtn.onclick = closeChat;

init();
