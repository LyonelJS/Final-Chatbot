const API_KEY = 'AIzaSyCNdQZHu1NjD2la4W_hYCmp71fTXj9zE4Y'
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`

let promptInput = document.querySelector('input[name="prompt"]');
let output = document.querySelector('.output');
let stop = false
// ID elements from HTML
const bot_prompt = 'You are a bot that is to be a professional doctor. You are called "Dok", you dont have to introduce yourself every time you answer, just the first time. So, answer anything as if you were treating a patient. Ask one follow up question about what the user(patient) is asking. Once there is enough information, give advice. Also give disclaimers that any advice you give should be re-consulted to a doctor. You only do disclaimer when you give advice and you always put it in the last.'
const chatMessages = document.getElementById("chat-messages"); // The chat messages div
const userInputBox = document.getElementById("user-input"); // The chat messages div
const historyContainer = document.getElementById("history"); // The history sidebar div
const newChatButton = document.getElementById("new-chat"); // The new chat button
const clearHistoryButton = document.getElementById("clear-history"); // The clear history button
const sendButton = document.getElementById("send-button"); // The send button
const stopButton = document.getElementById("stop-button"); // The send button
const scrollButton = document.getElementById('scroll-down');
const prompt1Button = document.getElementById('prompt1');
const prompt2Button = document.getElementById('prompt2');
const prompt3Button = document.getElementById('prompt3');
const closeButton = document.getElementById('close');
const showPromptButton = document.getElementById('show-prompts');
const promptContainer = document.getElementById('super-container');
let userInputMessage;
let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || []; // Load chat history from local storage
let currentChatIndex = -1

const divider = document.getElementById('vertical-divider');
const chatContainer = document.getElementById('chat-container');
const historySideBar = document.getElementById('history-sidebar');
let isDragging = false;
let initialX;
let initialWidth;


// Load chatContainer width from local storage or default
let chatContainerWidth = parseInt(localStorage.getItem('chatContainerWidth')) || chatContainer.offsetWidth; 
let messages = [];

// Apply saved width on page load
chatContainer.style.width = `${chatContainerWidth}px`;
historySideBar.style.width = `calc(100% - ${chatContainerWidth}px - 5px)`; // Adjust for divider width
scrollButton.style.marginLeft = `calc(${chatContainerWidth}px/2 - 2%)`; // Adjust for divider width
promptContainer.style.width = `calc(${chatContainerWidth}px - 5%)`;


divider.addEventListener('mousedown', (e) => {
  isDragging = true;
  initialX = e.clientX;
  initialWidth = chatContainer.offsetWidth;
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const offsetX = e.clientX - initialX;
  const newWidth = initialWidth - offsetX;

  chatContainer.style.width = `${newWidth}px`;
  historySideBar.style.width = `calc(100% - ${newWidth}px - 5px)`; // Adjust for divider width
  scrollButton.style.marginLeft = `calc(${newWidth}px/2 - 2%)`; // Adjust for divider width
  promptContainer.style.width = `calc(${newWidth}px - 5%)`;

  // Save the new width to local storage
  chatContainerWidth = newWidth;
  localStorage.setItem('chatContainerWidth', chatContainerWidth); 
  if (newWidth < 550) {
    hidePrompts();
    showPromptButton.classList.add('hidden')
  } else {
    checkUserMessage();
  }

  if (newWidth < 200) { // Example threshold of 200px
    scrollButton.classList.add('hidden');
  } else {
    scrollButton.classList.remove('hidden');
  }

});

document.addEventListener('mouseup', () => {
  isDragging = false;
});



  // Adjust divider behavior for smaller screens
if (window.innerWidth < 480) {
    historySideBar.style.width = `100%`;
    chatContainer.style.width = `100%`;
    promptContainer.style.width = '81%';
    divider.style.visibility = 'hidden';
}

// Create new chat and saving the previous one to history
function startNewChat() {
    showPrompts();
    userInputBox.focus();
    // Clear the current chat messages
    chatMessages.innerHTML = `<div class="chatbot-message bot-message">Hello! How can I assist you today? What would you like to ask?" </div>`;
    // Create a new chat
    const newChat = {
        id: Date.now(),
        messages: [
            { sender: "bot", message: "Hello! How can I assist you today? What would you like to ask?" }
        ]
    };
  
    // Add the new chat to chat history
    chatHistory.push(newChat);
  
    // Save the updated chat history to local storage
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    const index = chatHistory.length - 1; // Fix the index at creation time
  
    // Create a new chat tab in the history sidebar
    const historyItem = document.createElement("a");
    historyItem.href = "#";
    historyItem.innerText = `Chat ${chatHistory.length}`;
    historyItem.classList.add("history-item");
    historyItem.addEventListener("click", () => {
      loadChat(index);
      checkUserMessage();
      userInputBox.focus();
  
    });
    historyContainer.appendChild(historyItem);
  
    // Set the current chat index to the newly created chat
    currentChatIndex = chatHistory.length - 1;
    
    // Change color for the active chat in the history tab
    updateActiveHistoryItem();
    // Store the current chat index
    localStorage.setItem('currentChatIndex', currentChatIndex); // Save index
  
    loadChat(currentChatIndex)
    userInputBox.classList.remove('disabled');
    historySideBar.scrollTop = historySideBar.scrollHeight;
  }
  
  
  // Display the selected chat from history
  function loadChat(index) {
  
    currentChatIndex = index;
    chatMessages.innerHTML = ""; // Clear current chat
  
    const selectedChat = chatHistory[currentChatIndex];
    // Display all of the messages for the selected chat
    selectedChat.messages.forEach(msg => {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add(`${msg.sender}-message`);
        const name = msg.sender === 'bot' ? 'Dok' : 'You'; 
        messageDiv.innerHTML = `<b>${name}: </b><br>` + msg.message;
        chatMessages.appendChild(messageDiv);
    });
    // Change color for the active chat in the sidebar (highlight the current chat)
    updateActiveHistoryItem();
  
    // Scroll to the bottom of the chat container
    chatContainer.scrollTop = chatContainer.scrollHeight;
    localStorage.setItem('currentChatIndex', currentChatIndex); // Save index
  }
  
  // Change color for the active chat
  function updateActiveHistoryItem() {
    const allHistoryItems = document.querySelectorAll(".history-item");
  
    // Remove active class from all items first
    allHistoryItems.forEach(item => {
        item.classList.remove("active-chat");
    });
  
    // Get the history item corresponding to the current chat index
    const activeItem = allHistoryItems[currentChatIndex];
  
    // Add the active-chat class to the active chat
    if (activeItem) {
        activeItem.classList.add("active-chat");
    }
  }

const showTypingEffect = (text, textElement, callback) => {
  const words = text.split(' ');
  let currentWordIndex = 0;

  const typingInterval = setInterval(() => {
    textElement.innerHTML += (currentWordIndex === 0 ? '': ' ') + words[currentWordIndex++];

    if(currentWordIndex === words.length || stop === true) {
      clearInterval(typingInterval);

      if (callback) callback(); // Execute the callback when typing is done

    }
  }, 75)
}
  

const generateAPIResponse = async () => {
  try {
      const response = await fetch(API_URL, {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              contents: [{
                  role: 'user',
                  parts: [{ 
                      text: 'You are a professional chatbot doctor called "Dok". Dont start your answers with "Dok: ". Add follow up questions and disclaimers to reconsult with doctor after you give medical advice. You are to use the context I give you to answer the Patient Message. However, do not repeat any context that has no relation to the Patient Message. ' + 
                            'Context(not to be printed): [' + messages + ']' + 
                            'Patient Message(not to be printed): ' + promptInput.value + 
                            ' Give a proper and professional response. Only use * if you were to make a list.'
                  }]
              }]
          })
      });

      const data = await response.json();

      // Format response text
      const apiResponse = formatResponseText(
          data?.candidates[0].content.parts[0].text
      );

      // Create a container for the bot response
      const botResponseDiv = document.createElement('div');
      botResponseDiv.classList.add('bot-message', 'bot-message-right');
      // Append the container to the output
      output.appendChild(botResponseDiv);
      // Add the formatted text to the container
      botResponseDiv.innerHTML += `<b>Dok: </b><br>`;

      // Typing effect
      showTypingEffect(apiResponse, botResponseDiv, () => {
        // Re-enable UI elements
        historyContainer.classList.remove('disabled');
        newChatButton.classList.remove('disabled');
        clearHistoryButton.classList.remove('disabled');
        stopButton.classList.add('hidden');
        sendButton.classList.remove('hidden');
        stop = false;

        // Refresh UI
        refreshHistoryItem();
        updateActiveHistoryItem();

        // Clear the input box
        
        chatContainer.scrollTop = chatContainer.scrollHeight;

      });

      // Save the message to chat history
      const botMessageObj = { sender: "bot", message: apiResponse };
      chatHistory[currentChatIndex].messages.push(botMessageObj);
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));

      // Scroll to the latest message
      chatContainer.scrollTop = chatContainer.scrollHeight;

      // Remove "Generating..." message if present
      const generatingMessage = document.querySelector('.generating-message');
      if (generatingMessage) {
          generatingMessage.remove();
      }

      
  } catch (error) {
      console.error(error);
  } 

};

const formatResponseText = (text) => {
  return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Removes markdown-style bold (**text**)
      .replace(/\n/g, '<br>')
      .trim();                         // Trims any extra whitespace
};


function sendMessage() {
    // Disable inputs while bot is generating a response
    historyContainer.classList.add('disabled');
    newChatButton.classList.add('disabled');
    clearHistoryButton.classList.add('disabled');
    sendButton.classList.add('disabled');
    stopButton.classList.remove('hidden');
    sendButton.classList.add('hidden');
    const userInput = promptInput.value;
    hidePrompts();

    const selectedChat = chatHistory[currentChatIndex];
        let tempContext;
        selectedChat.messages.forEach(msg => {
      
          tempContext += msg.sender + ':' + msg.message;
          messages = tempContext;
          });
          
    chatContainer.scrollTop = chatContainer.scrollHeight;

    userInputMessage = promptInput.value
    output.innerHTML += `<div class='user-message'><b>You: </b><br>${userInput}</div>`

    const userMessage = { sender: "user", message: userInput};

      //save the user input to current chat index history
      chatHistory[currentChatIndex].messages.push(userMessage);
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
      
      // Display "Generating..." below the user input
      output.innerHTML += '<div class="generating-message">Dok is Thinking...</div>';

    generateAPIResponse();

    promptInput.value = '';

};

// Clear the chat history (using the clear history button)
function clearChatHistory() {
    hidePrompts();
    showPromptButton.classList.add('hidden');
    // Clear chat messages from the chat message div
    chatMessages.innerHTML = `<div class="chatbot-message bot-message">No history available. Start a new chat!</div>`;
    
    // Clear history from the local storage
    chatHistory = [];
    localStorage.removeItem('chatHistory');
    localStorage.removeItem('currentChatIndex');
    
    
    // Remove all chat history tab from the sidebar
    historyContainer.innerHTML = '';
    
    // Update the current chat index (-1 is none)
    currentChatIndex = -1;
    userInputBox.classList.add('disabled');
    sendButton.classList.add('disabled');
    }
    
  // Renamed function that updates the chat history view dynamically
  function refreshHistoryItem() {
    historyContainer.innerHTML = ''; // Clear the history container before updating
    
    chatHistory.forEach((chat, index) => {
      const historyItem = document.createElement("a");
      const firstUserMessage = chat.messages.find(msg => msg.sender === "user")?.message || '';
      const cutMessage = firstUserMessage.length > 50 ? firstUserMessage.substring(0, 50) + '...' : firstUserMessage;
  
      historyItem.innerHTML = `<strong>Chat ${index + 1}</strong>: ${cutMessage}`;
      historyItem.href = "#";
      historyItem.classList.add("history-item");
  
      // Update the history item click event
      historyItem.addEventListener("click", () => {
        loadChat(index);
        checkUserMessage();
        userInputBox.focus();
  
      });
      historyContainer.appendChild(historyItem); // Append to the history container
    });
  }
  
  // Load the Chat history
    function loadHistory() {
      
      promptInput.focus(); // Set focus back to the input field
  
      // Check if chat history exists in local storage
      if (!Array.isArray(chatHistory)) {
          localStorage.removeItem('chatHistory');
          chatHistory = [];
      }
      // Automatically start a new chat if there is no chat when loading the chatbot
      if (!Array.isArray(chatHistory) || chatHistory.length === 0) {
          startNewChat();
      } else{
      
      refreshHistoryItem();
      const savedChatIndex = localStorage.getItem('currentChatIndex');
      
      if (savedChatIndex !== null) {
          currentChatIndex = parseInt(savedChatIndex, 10);
          loadChat(currentChatIndex); // Automatically load the saved chat
      }
      }
      }
  
  function disableSend(){
  sendButton.classList.add('disabled');
        // Event listener for send button click
  sendButton.addEventListener('click', (ev) => {
    ev.preventDefault();
    sendMessage(ev); // Pass ev to sendMessage
    });
      
  // Event listener for Enter key press in the input field
  promptInput.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      if (promptInput.value.trim() !== '') {
  
      ev.preventDefault(); 
      sendMessage(ev);
    }}
  });
  }
  // Prevent empty prompts
  userInputBox.addEventListener('input', () => {
    if (promptInput.value.trim() !== ''){
      sendButton.classList.remove('disabled');
    } else {
      sendButton.classList.add('disabled');
    }
  })
  
  stopButton.addEventListener('click', () => {
    stop = true
    userInputBox.focus();

  }
  );
  
  
  
  function isScrolledToBottom() {
    return chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 100;
  }
  
  let checkScrollInterval
  
  function checkScroll() {
  checkScrollInterval = setInterval(() => {
    if (isScrolledToBottom()) {
      // Hide the scroll button if scrolled to the bottom
      scrollButton.classList.add('hidden');
    } else {
      // Show the scroll button if not at the bottom
      scrollButton.classList.remove('hidden');
    }
  }, 100);
  }
  
  
  // Event listener for scroll events
  chatContainer.addEventListener('scroll', () => {
    if (isScrolledToBottom()) {
      scrollButton.classList.add('hidden'); // Hide button if at bottom
    } else {
      scrollButton.classList.remove('hidden'); // Show button if not at bottom
    }
  });
  
  scrollButton.addEventListener('click', () => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
  }
  );
  
  
  newChatButton.addEventListener("click", startNewChat);
  
  clearHistoryButton.addEventListener("click", clearChatHistory);
  
  function checkUserMessage(){
    let hasUserMessage = false;
  
    if (currentChatIndex !== -1 && chatHistory[currentChatIndex]) {
      hasUserMessage = chatHistory[currentChatIndex].messages.some(
        message => message.sender === "user"
      );
    }
  
    // Show prompts if there are no user messages in the current chat
    if (!hasUserMessage) {
      showPrompts();
    } else {
      hidePrompts();
    }
  }
  
  function hidePrompts(){
    promptContainer.classList.add('invisible');
    showPromptButton.classList.remove('hidden')
    showPromptButton.innerHTML = '?'
  };
  
  function showPrompts(){
    promptContainer.classList.remove('invisible');
    showPromptButton.classList.remove('hidden')
    showPromptButton.innerHTML = 'X';
  };
  
  function insertPrompts(prompt){
    userInputBox.value = prompt.textContent;
  };
  
  closeButton.addEventListener('click', () => {
    hidePrompts();
  });
  
  showPromptButton.addEventListener('click', () => {
    if (showPromptButton.textContent === 'X') {
      hidePrompts();
    } else {
      showPrompts();
    }
    });
  
  prompt1Button.addEventListener('click', () => {
    insertPrompts(prompt1Button);
    sendButton.classList.remove('disabled');
    userInputBox.focus();
  });
  
  prompt2Button.addEventListener('click', () => {
    insertPrompts(prompt2Button);
    sendButton.classList.remove('disabled');
    userInputBox.focus();
  });
  
  prompt3Button.addEventListener('click', () => {
    insertPrompts(prompt3Button);
    sendButton.classList.remove('disabled');
    userInputBox.focus();
  });
  
    // Load history when the page is loaded
  checkScroll();
  loadHistory();
  disableSend();  
