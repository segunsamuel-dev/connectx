import { supabase } from './supabase.js';

// DOM Elements
const searchInput = document.getElementById('user-search-input');
const searchTriggerBtn = document.getElementById('search-trigger-btn');
const resultsGrid = document.getElementById('search-results');
const pendingSection = document.getElementById('pending-section');
const pendingList = document.getElementById('pending-list');

let currentUser = null;

async function init() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return;
    
    currentUser = session.user;
    
    // Initial load of requests
    loadPendingRequests();

    /**
     * REAL-TIME UPGRADE: 
     * This listens for any changes to the 'friendships' table.
     * If someone sends you a request while you're on the page, it pops up instantly.
     */
    supabase
        .channel('friendship-changes')
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'friendships',
            filter: `receiver_id=eq.${currentUser.id}` 
        }, () => {
            loadPendingRequests();
        })
        .subscribe();
}

// --- SEARCH LOGIC ---

const performSearch = async () => {
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

searchTriggerBtn.onclick = performSearch;
searchInput.onkeypress = (e) => { if (e.key === 'Enter') performSearch(); };

async function executeSearch(query) {
    resultsGrid.innerHTML = `<p class="text-muted">Scanning the Verse...</p>`;

    const { data: users, error } = await supabase
        .from('profiles')
        .select('id, username')
        .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
        .not('id', 'eq', currentUser.id) 
        .limit(10);

    if (error) {
        console.error("Search Error:", error.message);
        return;
    }

    renderResults(users || []);
}

function renderResults(users) {
    resultsGrid.innerHTML = '';
    
    if (users.length === 0) {
        resultsGrid.innerHTML = `<p class="empty-msg">No residents found in this sector.</p>`;
        return;
    }

    users.forEach(user => {
        const name = user.username || "Anonymous";
        const card = document.createElement('div');
        card.className = 'user-card';
        card.innerHTML = `
            <div class="card-avatar">${name[0].toUpperCase()}</div>
            <div class="card-name">${name}</div>
            <div class="card-meta">ConnectX Resident</div>
            <button class="add-btn" id="btn-${user.id}">
                <i class="lni lni-plus"></i> Send Request
            </button>
        `;
        
        card.querySelector(`#btn-${user.id}`).onclick = (e) => sendFriendRequest(user.id, e.target);
        resultsGrid.appendChild(card);
    });
}

// --- FRIENDSHIP LOGIC ---

async function sendFriendRequest(targetId, btnElement) {
    const { error } = await supabase
        .from('friendships')
        .insert([{ sender_id: currentUser.id, receiver_id: targetId, status: 'pending' }]);

    if (error) {
        alert("Request already in transmission.");
        return;
    }

    btnElement.innerHTML = `<i class="lni lni-checkmark"></i> Requested`;
    btnElement.classList.add('pending');
    btnElement.disabled = true;
}

async function loadPendingRequests() {
    const { data: incoming, error } = await supabase
        .from('friendships')
        .select(`id, profiles:sender_id (username)`)
        .eq('receiver_id', currentUser.id)
        .eq('status', 'pending');

    if (error || !incoming) return;

    if (incoming.length > 0) {
        pendingSection.style.display = 'block';
        pendingList.innerHTML = '';
        
        incoming.forEach(req => {
            const name = req.profiles?.username || 'Unknown';
            const card = document.createElement('div');
            card.className = 'user-card pending-card';
            card.innerHTML = `
                <div class="card-avatar">${name[0].toUpperCase()}</div>
                <div class="card-name">${name}</div>
                <div class="card-actions" style="display:flex; gap:10px; margin-top:10px;">
                    <button class="add-btn accept" onclick="respond('${req.id}', 'accepted')" style="background:#22c55e; flex:1;">Accept</button>
                    <button class="add-btn decline" onclick="respond('${req.id}', 'declined')" style="background:#ef4444; flex:1;">Decline</button>
                </div>
            `;
            pendingList.appendChild(card);
        });
    } else {
        pendingSection.style.display = 'none';
    }
}

// Attach to window so HTML buttons can find it
window.respond = async (requestId, newStatus) => {
    const { error } = await supabase
        .from('friendships')
        .update({ status: newStatus })
        .eq('id', requestId);

    if (!error) loadPendingRequests();
};

init();
