import { supabase } from './supabase.js';

// DOM Elements
const contactList = document.getElementById('dynamic-contact-list');
const chatStream = document.getElementById('chat-stream');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const chatHeader = document.getElementById('chat-header');
const inputArea = document.getElementById('input-area');
const nexusWindow = document.getElementById('nexus-window'); 
const closeChatBtn = document.getElementById('close-chat');

let currentUser = null;
let activeReceiverId = null;

async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    currentUser = user;

    // UI: Set your own avatar
    const avatarChar = user.email ? user.email[0].toUpperCase() : '?';
    document.getElementById('my-avatar-display').innerText = avatarChar;
    
    fetchContacts();
    setupRealtime();
}

/** * UPDATED: Fetches ONLY accepted friends.
 * Uses a double-join to get the profile of the person who ISN'T you.
 */
async function fetchContacts() {
    const { data: friendships, error } = await supabase
        .from('friendships')
        .select(`
            sender_id,
            receiver_id,
            sender_profile:profiles!friendships_sender_id_fkey(id, username),
            receiver_profile:profiles!friendships_receiver_id_fkey(id, username)
        `)
        .eq('status', 'accepted')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

    if (error) {
        console.error("Link Error:", error.message);
        return;
    }

    contactList.innerHTML = '';

    if (friendships.length === 0) {
        contactList.innerHTML = `<div class="empty-state" style="padding:20px; font-size:0.8rem;">No connections found. Search in Discovery.</div>`;
        return;
    }

    friendships.forEach(f => {
        // Identify which profile belongs to the friend (the one that isn't the currentUser)
        const isSender = f.sender_id === currentUser.id;
        const friendProfile = isSender ? f.receiver_profile : f.sender_profile;

        const card = document.createElement('div');
        card.className = 'contact-card';
        card.innerHTML = `
            <div class="c-avatar">${friendProfile.username ? friendProfile.username[0].toUpperCase() : '?'}</div>
            <div class="c-info">
                <div class="c-name">${friendProfile.username || 'Anonymous'}</div>
                <div class="c-status">Uplink Stable</div>
            </div>
        `;
        card.onclick = () => openChat(friendProfile);
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
    // Listen for new messages
    supabase.channel('messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
            const msg = payload.new;
            if ((msg.sender_id === activeReceiverId && msg.receiver_id === currentUser.id) || 
                (msg.sender_id === currentUser.id && msg.receiver_id === activeReceiverId)) {
                renderMessage(msg);
            }
        }).subscribe();

    // Listen for friendship changes (in case someone accepts a request while you're on this page)
    supabase.channel('friendships')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
            fetchContacts();
        }).subscribe();
}

// Events
sendBtn.onclick = sendMessage;
messageInput.onkeypress = (e) => e.key === 'Enter' && sendMessage();
closeChatBtn.onclick = closeChat;

init();
