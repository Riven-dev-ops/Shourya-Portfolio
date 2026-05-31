// Chatbot Floating Widget logic

document.addEventListener('DOMContentLoaded', () => {
  // 1. Generate or fetch Chat Session ID
  let sessionId = localStorage.getItem('inexa_chat_session');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('inexa_chat_session', sessionId);
  }

  // 2. Append Chat HTML to Page
  const chatbotHtml = `
    <!-- Floating Launcher -->
    <div class="chat-launcher" id="chatLauncher">
      <i class="bi bi-chat-dots-fill"></i>
    </div>

    <!-- Chat Card Window -->
    <div class="chat-window" id="chatWindow">
      <div class="chat-header">
        <div class="agent-profile">
          <img src="assets/imgs/avatar/chatbot-avatar.png" alt="Inexa AI" />
          <div class="agent-info">
            <h5>Inexa Assistant</h5>
            <span>Online</span>
          </div>
        </div>
        <button class="chat-close-btn" id="chatCloseBtn" aria-label="Close Chat">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <div class="chat-messages" id="chatMessages">
        <div class="message-bubble bot">
          Hello! I am Inexa AI, Shourya Kumar's virtual design assistant. Ask me anything about his work, rates, or services!
        </div>
      </div>
      <!-- Suggested Questions -->
      <div class="chat-suggestions" id="chatSuggestions">
        <div class="chat-suggestions-scroll">
          <button class="suggestion-chip" data-question="What services do you offer?">What services do you offer?</button>
          <button class="suggestion-chip" data-question="Show me your projects">Show me your projects</button>
          <button class="suggestion-chip" data-question="What are your rates & budgets?">What are your rates?</button>
          <button class="suggestion-chip" data-question="How can I contact you?">How to contact?</button>
        </div>
      </div>
      <div class="chat-input-area">
        <input type="text" id="chatInput" placeholder="Write a message..." autocomplete="off" />
        <button id="chatSendBtn">
          <i class="bi bi-send-fill"></i>
        </button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', chatbotHtml);

  // 3. Select DOM Elements
  const launcher = document.getElementById('chatLauncher');
  const windowCard = document.getElementById('chatWindow');
  const messagesArea = document.getElementById('chatMessages');
  const inputEl = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');

  // Toggle Visibility Helper
  function toggleChat(forceClose = false) {
    const isActive = windowCard.classList.contains('active');
    const shouldClose = forceClose || isActive;
    
    if (shouldClose) {
      windowCard.classList.remove('active');
      launcher.classList.remove('active');
      launcher.querySelector('i').className = 'bi bi-chat-dots-fill';
    } else {
      windowCard.classList.add('active');
      launcher.classList.add('active');
      launcher.querySelector('i').className = 'bi bi-x-lg';
      setTimeout(() => inputEl.focus(), 100);
    }
  }

  // Toggle Visibility Events
  launcher.addEventListener('click', () => toggleChat());
  
  const closeBtn = document.getElementById('chatCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleChat(true);
    });
  }

  // Handle Send Message
  async function sendMessage(customText) {
    const text = (typeof customText === 'string' ? customText : inputEl.value).trim();
    if (!text) return;

    // Append user message bubble
    appendBubble('user', text);
    inputEl.value = '';

    // Scroll to bottom
    scrollToBottom();

    // Show typing indicator
    const typingIndicator = showTypingIndicator();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId })
      });
      const data = await res.json();
      
      // Remove typing indicator
      typingIndicator.remove();

      if (data.response) {
        appendBubble('bot', data.response);
      } else {
        appendBubble('bot', "I'm having trouble connecting to my brain, please try again in a bit!");
      }
    } catch (err) {
      typingIndicator.remove();
      appendBubble('bot', "Connection timed out. Please check your internet connection.");
    }

    scrollToBottom();
  }

  // Key Event triggers
  sendBtn.addEventListener('click', () => sendMessage());
  inputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // Handle click on suggestion chips
  const suggestionContainer = document.getElementById('chatSuggestions');
  if (suggestionContainer) {
    suggestionContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.suggestion-chip');
      if (chip) {
        const question = chip.getAttribute('data-question');
        if (question) {
          sendMessage(question);
        }
      }
    });
  }

  // Helpers
  function appendBubble(sender, messageText) {
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${sender}`;
    bubble.textContent = messageText;
    messagesArea.appendChild(bubble);
  }

  function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    messagesArea.appendChild(indicator);
    scrollToBottom();
    return indicator;
  }

  function scrollToBottom() {
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }
});
