const API_KEY = 'AIzaSyBAzKJLyNO5Fbu86aMt2MbYOHNZWZQXbIk'
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
let minWidthReached = false;

// Load chatContainer width from local storage or default
let chatContainerWidth = parseInt(localStorage.getItem('chatContainerWidth')) || chatContainer.offsetWidth; 
let messages = [];

if (window.innerWidth >= 480) {

// Apply saved width on page load
chatContainer.style.width = `${chatContainerWidth}px`;
historySideBar.style.width = `calc(100% - ${chatContainerWidth}px - 5px)`; // Adjust for divider width
promptContainer.style.width = `calc(${chatContainerWidth}px - 5%)`;
scrollButton.style.marginLeft = `calc(${chatContainerWidth}px/2 - 2%)`; // Adjust for divider width


divider.addEventListener('mousedown', (e) => {
  isDragging = true;
  initialX = e.clientX;
  initialWidth = chatContainer.offsetWidth;
  
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  // Get the parent container's width
  const parentWidth = chatContainer.parentElement.offsetWidth;

  // Calculate 20% of the parent width
  const minWidth = 0.2 * parentWidth;
  const maxWidth = 0.91 * parentWidth;


  const offsetX = e.clientX - initialX;
  let newWidth = initialWidth - offsetX;

  // Ensure newWidth does not go below 20% of parent width
  if (newWidth < minWidth) {
    newWidth = minWidth;
  }

  // Ensure newWidth does not exceed 80% of parent width
  if (newWidth > maxWidth) {
    newWidth = maxWidth;

    // Change the buttons to images when maxWidth is reached
    newChatButton.innerHTML = ''; // Clear existing text
    newChatButton.innerHTML = '<img src="newChatButton.png" alt="New Chat" style="width: 50%; height: auto;">';

    clearHistoryButton.innerHTML = ''; // Clear existing text
    clearHistoryButton.innerHTML = '<img src="deleteChatButton.png" alt="Clear History" style="width: 50%; height: auto;">';
  } else {
    newChatButton.innerHTML = 'New Chat'; // Clear existing text

    clearHistoryButton.innerHTML = 'Delete History'; // Clear existing text
  }

  // Update styles with the constrained newWidth
  chatContainer.style.width = `${newWidth}px`;
  historySideBar.style.width = `calc(100% - ${newWidth}px - 5px)`; // Adjust for divider width
  scrollButton.style.marginLeft = `calc(${newWidth}px / 2 - 2%)`; // Adjust for divider width
  promptContainer.style.width = `calc(${newWidth}px - 5%)`;

  // Save the constrained width to local storage
  chatContainerWidth = newWidth;
  localStorage.setItem('chatContainerWidth', chatContainerWidth); 
  checkContainerWidth(newWidth);
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});
};

  // Adjust divider behavior for smaller screens
if (window.innerWidth < 480) {
    historySideBar.style.width = `100%`;
    chatContainer.style.width = `100%`;
    promptContainer.style.width = '80%';
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
      userInputBox.focus();

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

        const botResponse = botResponseDiv.textContent

        // Save the message to chat history
        const botMessageObj = { sender: "bot", message: botResponse };
        chatHistory[currentChatIndex].messages.push(botMessageObj);
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));

        // Clear the input box
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
      });

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
          
    userInputMessage = promptInput.value
    output.innerHTML += `<div class='user-message'><b>You: </b><br>${userInput}</div>`

    const userMessage = { sender: "user", message: userInput};

      //save the user input to current chat index history
      chatHistory[currentChatIndex].messages.push(userMessage);
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
      
      // Display "Generating..." below the user input
      output.innerHTML += '<div class="generating-message">Dok is Thinking...</div>';

      chatContainer.scrollTop = chatContainer.scrollHeight;

    generateAPIResponse();

    promptInput.value = '';

};


// Function to delete individual chat history items
function clearChatHistory() {
  

  // Indicate to the user to select a history item to delete
  const instruction = document.createElement('div');
  instruction.classList.add('instruction');
  instruction.innerText = 'Click on a chat history item to delete it or press Cancel to exit.';
  historyContainer.prepend(instruction);

  // Create a cancel button
  const cancelButton = document.createElement('button');
  cancelButton.classList.add('cancel-button');
  cancelButton.innerText = 'Cancel';
  historyContainer.prepend(cancelButton);
  clearHistoryButton.classList.add('hidden')

  // Disable the button to prevent multiple clicks
  clearHistoryButton.disabled = true;
  let previousChatIndex = currentChatIndex
  // Add click event listeners to history items for deletion
  const allHistoryItems = document.querySelectorAll('.history-item');
  allHistoryItems.forEach((historyItem, index) => {
      historyItem.classList.add('deletable')

      historyItem.addEventListener('click', function deleteHistoryItem() {

          // Remove selected chat from chatHistory array
          chatHistory.splice(index, 1);

          // Update the local storage with the new chat history
          localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
            
          // Update currentChatIndex based on the relative position of the deleted chat
      if (previousChatIndex === index) {
        if (previousChatIndex > chatHistory.length -1 ){
          currentChatIndex = chatHistory.length-1; // Reset index if the current chat is deleted

        } else if (previousChatIndex <= chatHistory.length -1){
          currentChatIndex = previousChatIndex;
        }
        else if (currentChatIndex === -1) {
          chatMessages.innerHTML = `<div class="chatbot-message bot-message">No history available. Start a new chat!</div>`;
          hidePrompts();
          showPromptButton.classList.add('hidden');
          sendButton.classList.add('disabled');
          userInputBox.classList.add('disabled');
          userInputBox.value = '';
          newChatButton.focus();
        }
      } else if (previousChatIndex < index) {
        currentChatIndex = previousChatIndex; // No change if the deleted chat is after the current chat
      } else if (previousChatIndex > index) {
        currentChatIndex--; // Shift index if the deleted chat is before the current chat
        currentChatIndex = previousChatIndex - 1
      }

          // Update the UI
          refreshHistoryItem();
          updateActiveHistoryItem();
          localStorage.setItem('currentChatIndex', currentChatIndex);

          // Remove instruction and cancel button, re-enable the button
          instruction.remove();
          cancelButton.remove();
          clearHistoryButton.disabled = false;

          // Remove the event listener after the item is deleted
          historyItem.removeEventListener('click', deleteHistoryItem);
          clearHistoryButton.classList.remove('hidden')
          historyItem.classList.remove('deletable')


      });
  });

  // Add event listener to the cancel button
  cancelButton.addEventListener('click', function cancelDeletionMode() {
      // Remove instruction and cancel button
      instruction.remove();
      cancelButton.remove();
      clearHistoryButton.classList.remove('hidden')
      refreshHistoryItem();
      updateActiveHistoryItem();

      // Re-enable the clear history button
      clearHistoryButton.disabled = false;

      // Remove the click event listeners from history items
      allHistoryItems.forEach((historyItem) => {
          historyItem.replaceWith(historyItem.cloneNode(true)); // Clone and replace to remove listeners
          historyItem.classList.remove('deletable')
      });
  });
}

    
  // Renamed function that updates the chat history view dynamically
  function refreshHistoryItem() {
    historyContainer.innerHTML = ''; // Clear the history container before updating
    
    chatHistory.forEach((chat, index) => {
      const historyItem = document.createElement("a");
      const firstUserMessage = chat.messages.find(msg => msg.sender === "user")?.message || '';
  
      historyItem.innerHTML = `<strong>Chat ${index + 1}</strong>: ${firstUserMessage}`;
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
    stop = true;
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
  
  function checkContainerWidth(width){
    if (width < 550) {
      hidePrompts();
      showPromptButton.classList.add('hidden')
    } else {
      checkUserMessage();
      showPromptButton.classList.remove('hidden');
    }
  
  };  

  function hidePrompts(){
    promptContainer.classList.add('invisible');
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
  checkContainerWidth(chatContainerWidth);
  checkScroll();
  loadHistory();
  disableSend();  
