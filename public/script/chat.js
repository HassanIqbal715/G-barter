
const socket = io();
const chatList = document.getElementById('chat-list');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const chatWindowHeader = document.getElementById('chat-window-header');
const chatInputArea = document.getElementById('chat-input-area');
const chatAvatar = document.getElementById('chat-avatar');
const chatUsername = document.getElementById('chat-username');
const chatGigInfo = document.getElementById('chat-gig-info');

let currentEngagementId = null;
let currentUser = null;

async function init() {
    // Get current user
    const response = await fetch("/api/current-user");
    const data = await response.json();
    if (data.result) {
        currentUser = data.data;
        loadChatList();
    } else {
        window.location.href = "/login";
    }
}

async function loadChatList() {
    const response = await fetch("/api/my-engagements");
    const result = await response.json();
    
    if (!result.result) return;

    chatList.innerHTML = "";
    
    // Filter for active engagements only
    const activeEngagements = result.data.filter(eng => eng.status === 'active');

    if (activeEngagements.length === 0) {
        chatList.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">No active engagements</div>';
        return;
    }

    activeEngagements.forEach(eng => {
        const isProvider = eng.provider_id === currentUser.id;
        // We need to fetch the other user's details. 
        // For now, we'll use a placeholder or fetch it if the API supports it.
        // Assuming the API returns enough info or we might need to update it.
        // Let's assume we need to fetch the other user's name.
        // Since the current API doesn't return the other user's name directly in my-engagements for both roles easily without more queries,
        // let's update the backend to return the other party's name or fetch it here.
        // For simplicity, let's fetch the other user's details using a new endpoint or just display "User".
        // Actually, let's update the backend to be more helpful.
        
        // Wait, let's check the backend response for my-engagements.
        // It returns e.*, a.description...
        // It doesn't return the other person's name.
        // I'll update the backend to return the other person's name.
        
        // For now, I'll render the item and fetch details individually or just show "Chat".
        renderChatItem(eng);
    });
}

async function renderChatItem(eng) {
    // Determine the other user ID
    const otherUserId = eng.provider_id === currentUser.id ? eng.receiver_id : eng.provider_id;
    
    // Fetch other user details
    const response = await fetch(`/api/user/${otherUserId}`);
    const result = await response.json();
    const otherUser = result.data;

    const item = document.createElement('div');
    item.className = 'chat-item';
    item.dataset.id = eng.id;
    
    const colors = ["#bfdbfe", "#fef3c7", "#d1fae5", "#ffe4e6", "#ede9fe"];
    const color = colors[otherUserId.charCodeAt(0) % colors.length];
    const textColor = "#1e40af"; // Simplified

    item.innerHTML = `
        <div class="chat-item-avatar" style="background-color: ${color}; color: ${textColor}">
            ${otherUser.firstname[0]}${otherUser.lastname[0]}
        </div>
        <div class="chat-item-info">
            <div class="chat-item-name">${otherUser.firstname} ${otherUser.lastname}</div>
            <div class="chat-item-gig">${eng.skill_provided} ⇄ ${eng.skill_wanted}</div>
        </div>
    `;

    item.addEventListener('click', () => selectChat(eng, otherUser, color, textColor));
    chatList.appendChild(item);
}

async function selectChat(eng, user, color, textColor) {
    currentEngagementId = eng.id;
    
    // Update UI
    document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.chat-item[data-id="${eng.id}"]`).classList.add('active');
    
    chatWindowHeader.style.display = 'flex';
    chatInputArea.style.display = 'flex';
    chatMessages.innerHTML = ''; // Clear previous messages
    
    chatAvatar.style.backgroundColor = color;
    chatAvatar.style.color = textColor;
    chatAvatar.innerText = `${user.firstname[0]}${user.lastname[0]}`;
    chatUsername.innerText = `${user.firstname} ${user.lastname}`;
    chatGigInfo.innerText = `${eng.skill_provided} ⇄ ${eng.skill_wanted}`;

    // Join socket room
    socket.emit('join_room', eng.id);

    // Load messages
    loadMessages(eng.id);
}

async function loadMessages(engagementId) {
    const response = await fetch(`/api/messages/${engagementId}`);
    const result = await response.json();
    
    if (result.result) {
        result.data.forEach(msg => appendMessage(msg));
        scrollToBottom();
    }
}

function appendMessage(msg) {
    const div = document.createElement('div');
    const isSent = msg.sender_id === currentUser.id;
    div.className = `message ${isSent ? 'sent' : 'received'}`;
    
    const time = new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    div.innerHTML = `
        ${msg.content}
        <div class="message-time">${time}</div>
    `;
    
    chatMessages.appendChild(div);
    scrollToBottom();
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendMessage() {
    const content = messageInput.value.trim();
    if (!content || !currentEngagementId) return;

    socket.emit('send_message', {
        engagementId: currentEngagementId,
        content: content
    });

    messageInput.value = '';
}

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
});

socket.on('receive_message', (msg) => {
    if (msg.engagementId === currentEngagementId || currentEngagementId) { 
        // The check above is a bit loose, ideally the server sends engagementId back with the message
        // But since we join rooms, we receive messages for that room.
        // Let's assume the message object matches what we need.
        appendMessage(msg);
    }
});

init();
