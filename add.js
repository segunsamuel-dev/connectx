import { supabase } from './supabase.js';

// DOM Elements
const searchInput = document.getElementById('user-search-input');
const searchTriggerBtn = document.getElementById('search-trigger-btn');
const resultsGrid = document.getElementById('search-results');
const pendingSection = document.getElementById('pending-section');
const pendingList = document.getElementById('pending-list');

let currentUser = null;

async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    currentUser = user;
    
    // Load existing requests sent to you
    loadPendingRequests();
}

// --- SEARCH LOGIC ---

const performSearch = () => {
    const query = searchInput.value.trim();
    if (query.length > 0) {
        executeSearch(query);
    } else {
        resultsGrid.innerHTML = `
            <div class="initial-state">
                <i class="lni lni-magnifier"></i>
                <p>Start typing to find connections</p>
            </div>`;
    }
};

// Trigger on Click
searchTriggerBtn.onclick = performSearch;

// Trigger on Enter Key
searchInput.onkeypress = (e) => {
    if (e.key === 'Enter') performSearch();
};

async function executeSearch(query) {
    resultsGrid.innerHTML = `<p class="text-muted">Scanning the Verse...</p>`;

    const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
        .not('id', 'eq', currentUser.id) 
        .limit(10);

    if (error) {
        console.error("Search error:", error.message);
        return;
    }

    renderResults(users || []);
}

function renderResults(users) {
    resultsGrid.innerHTML = '';
    
    if (users.length === 0) {
        resultsGrid.innerHTML = `<p class="text-muted">No users found in this sector.</p>`;
        return;
    }

    users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'user-card';
        card.innerHTML = `
            <div class="card-avatar">${user.username[0].toUpperCase()}</div>
            <div class="card-name">${user.username}</div>
            <div class="card-meta">ConnectX Resident</div>
            <button class="add-btn" id="btn-${user.id}">
                <i class="lni lni-plus"></i> Send Request
            </button>
        `;
        
        const btn = card.querySelector(`#btn-${user.id}`);
        btn.onclick = () => sendFriendRequest(user.id, btn);
        resultsGrid.appendChild(card);
    });
}

// --- FRIENDSHIP LOGIC ---

async function sendFriendRequest(targetId, btnElement) {
    const { error } = await supabase
        .from('friendships')
        .insert([
            { sender_id: currentUser.id, receiver_id: targetId, status: 'pending' }
        ]);

    if (error) {
        console.error("Link Error:", error.message);
        alert("Transmission failed. Request might already exist.");
        return;
    }

    // Professional UI State update
    btnElement.innerHTML = `<i class="lni lni-checkmark"></i> Requested`;
    btnElement.classList.add('pending');
    btnElement.disabled = true;
}

async function loadPendingRequests() {
    const { data: incoming, error } = await supabase
        .from('friendships')
        .select(`
            id,
            sender_id,
            profiles:sender_id (username, email)
        `)
        .eq('receiver_id', currentUser.id)
        .eq('status', 'pending');

    if (error) return;

    if (incoming && incoming.length > 0) {
        pendingSection.style.display = 'block';
        pendingList.innerHTML = '';
        
        incoming.forEach(req => {
            const card = document.createElement('div');
            card.className = 'user-card pending-card';
            card.innerHTML = `
                <div class="card-avatar">${req.profiles.username[0].toUpperCase()}</div>
                <div class="card-name">${req.profiles.username}</div>
                <div class="card-actions" style="display:flex; gap:10px; margin-top:15px; width:100%;">
                    <button class="add-btn accept" onclick="respond('${req.id}', 'accepted')" style="background:#22c55e;">Accept</button>
                    <button class="add-btn decline" onclick="respond('${req.id}', 'declined')" style="background:#ef4444;">Decline</button>
                </div>
            `;
            pendingList.appendChild(card);
        });
    } else {
        pendingSection.style.display = 'none';
    }
}

// Global Response Handler
window.respond = async (requestId, newStatus) => {
    const { error } = await supabase
        .from('friendships')
        .update({ status: newStatus })
        .eq('id', requestId);

    if (!error) {
        // Smoothly refresh the UI
        loadPendingRequests();
        // If accepted, it will now appear in chat.js contacts automatically
    }
};

init();
