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
const clearAllButton = document.getElementById('clear-all');
const cancelButton = document.getElementById('cancel-button');

let isDragging = false;
let initialX;
let initialWidth;

let chatContainerWidth = parseInt(localStorage.getItem('chatContainerWidth')) || chatContainer.offsetWidth; 
let messages = [];

if (window.innerWidth >= 480) {

// Apply the saved changes to the div size when loading
chatContainer.style.width = `${chatContainerWidth}px`;
historySideBar.style.width = `calc(100% - ${chatContainerWidth}px - 5px)`; 
promptContainer.style.width = `calc(${chatContainerWidth}px - 5%)`;
scrollButton.style.marginLeft = `calc(${chatContainerWidth}px/2 - 2%)`;


divider.addEventListener('mousedown', (e) => {
  isDragging = true;
  initialX = e.clientX;
  initialWidth = chatContainer.offsetWidth;
  
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const parentWidth = chatContainer.parentElement.offsetWidth;

  //Set the max width for chatMessages div
  const minWidth = 0.2 * parentWidth;
  const maxWidth = 0.9 * parentWidth;


  const offsetX = e.clientX - initialX;
  let newWidth = initialWidth - offsetX;

  // Ensure newWidth does not go below 20% of parent width
  if (newWidth < minWidth) {
    newWidth = minWidth;
  }

  // Ensure newWidth does not go above the maxWidth
  if (newWidth > maxWidth) {
    newWidth = maxWidth;

    // Change the buttons to images when maxWidth is reached
    newChatButton.innerHTML = ''; // Clear existing text
    newChatButton.innerHTML = '<img src="newChatButton.png" alt="New Chat" style="width: 50%; height: auto;">';

    clearHistoryButton.innerHTML = ''; // Clear existing text
    clearHistoryButton.innerHTML = '<img src="deleteChatButton.png" alt="Clear History" style="width: 50%; height: auto;">';
  } else { // Change back to text if less than maxWidth
    newChatButton.innerHTML = 'New Chat'; 

    clearHistoryButton.innerHTML = 'Delete History'; 
  }

  // Update styles with the newWidth
  chatContainer.style.width = `${newWidth}px`;
  historySideBar.style.width = `calc(100% - ${newWidth}px - 5px)`; 
  scrollButton.style.marginLeft = `calc(${newWidth}px / 2 - 2%)`; 
  promptContainer.style.width = `calc(${newWidth}px - 5%)`;

  // Save the new width to local storage
  chatContainerWidth = newWidth;
  localStorage.setItem('chatContainerWidth', chatContainerWidth); 
  checkContainerWidth(newWidth);
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});
};

  // Adjust divider for smaller screens
if (window.innerWidth < 480) {
    historySideBar.style.width = `100%`;
    chatContainer.style.width = `100%`;
    promptContainer.style.width = '80%';
    divider.style.visibility = 'hidden';
    
}

// Create new chat and saving the previous chat to history
function startNewChat() {
    // Show the prompts container for the new chat
    showPrompts();
    // Make the focus on the input field
    userInputBox.focus();
    // Clear the current chat messages and set the default message for new chat
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
    // Load the current chat (the newly made one)
    loadChat(currentChatIndex)
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
        const name = msg.sender === 'bot' ? '' : 'You: <br>';
        messageDiv.innerHTML = `<b>${name} </b>` + msg.message;
        chatMessages.appendChild(messageDiv);
    });
    // Change color for the active chat in the sidebar (highlight the current chat)
    updateActiveHistoryItem();
  
    // Scroll to the bottom of the chat container when loading the chat
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
  // Split the words of the api response
  const words = text.split(' ');
  let currentWordIndex = 0;
  // Set the time between each word generation
  const typingInterval = setInterval(() => {
    // Add the text one by one to the chatbot response div
    textElement.innerHTML += (currentWordIndex === 0 ? '': ' ') + words[currentWordIndex++];

    // Stop once all the words are written in the div or the stop button is pressed
    if(currentWordIndex === words.length || stop === true) {
      clearInterval(typingInterval);
      userInputBox.focus();

      if (callback) callback(); // Execute the callback when typing is done

    }
  }, 75)
}
  

const generateAPIResponse = async () => {
  try { // Get a response from the chatbot API, and input the prompt for it to answer
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
      // Append the container to the output div
      output.appendChild(botResponseDiv);
      // Add the 'Dok: '(sender) text to the container
      botResponseDiv.innerHTML += `<b>Dok: </b><br>`;

      
      // Call the typing effect and input the text and the response div
      showTypingEffect(apiResponse, botResponseDiv, () => {
        // Re-enable UI elements
        historyContainer.classList.remove('disabled');
        newChatButton.classList.remove('disabled');
        clearHistoryButton.classList.remove('disabled');
        stopButton.classList.add('hidden');
        sendButton.classList.remove('hidden');
        // Reset the stop generating response to false
        stop = false;

        // Refresh UI
        refreshHistoryItem();
        updateActiveHistoryItem();

        // Formatted response of the current text in botResponseDiv
        const botResponse = botResponseDiv.innerHTML
        let formattedResponse;
        formattedResponse = botResponse.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

        // Save the formatted response to chat history
        const botMessageObj = { sender: "bot", message: botResponse };
        chatHistory[currentChatIndex].messages.push(botMessageObj);
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));

        // Scroll down
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
      });

      // Scroll to the latest message
      chatContainer.scrollTop = chatContainer.scrollHeight;

      // Remove "Generating..." message if the typing effect starts
      const generatingMessage = document.querySelector('.generating-message');
      if (generatingMessage) {
          generatingMessage.remove();
      }

      
  } catch (error) {
      console.error(error);
  } 
    

};

// Format the initial response that is generated from the bot
const formatResponseText = (text) => {
  return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Removes markdown-style bold (**text**)
      .replace(/\n/g, '<br>')           // Create new line properly
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
    // Set the user input
    const userInput = promptInput.value;
    // Hide the prompts container when a message is sent
    hidePrompts();

    // Add the context of the current selected conversation to the bot
    const selectedChat = chatHistory[currentChatIndex];
        let tempContext;
        selectedChat.messages.forEach(msg => {
      
          tempContext += msg.sender + ':' + msg.message;
          messages = tempContext;
          });
    
    // Add the user input to the conversation div
    userInputMessage = promptInput.value
    output.innerHTML += `<div class='user-message'><b>You: </b><br>${userInput}</div>`
    
    // Set the user message format and sender to save
    const userMessage = { sender: "user", message: userInput};

      //save the user input to current chat index history
      chatHistory[currentChatIndex].messages.push(userMessage);
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
      
      // Display "Generating..." below the user input before the typing effect is shown
      output.innerHTML += '<div class="generating-message">Dok is Thinking...</div>';
      // Scroll to the bottom of the selected chat
      chatContainer.scrollTop = chatContainer.scrollHeight;
    // Call the generate response function
    generateAPIResponse();
    // Clear the input box
    promptInput.value = '';

};


// Function to delete individual chat history items
function clearChatHistory() {
  
  // Tell to the user to select a history item to delete
  const instruction = document.createElement('div');
  instruction.classList.add('instruction');
  instruction.innerText = 'Click on a chat history item to delete it or press Cancel to exit.';
  historyContainer.prepend(instruction);

  // Update the UI, hide and show the buttons
  cancelButton.classList.remove('hidden');
  clearHistoryButton.classList.add('hidden')
  clearAllButton.classList.remove('hidden');

  // Record the currentChatIndex when clearHistoryButton is pressed
  let previousChatIndex = currentChatIndex
  // Add click event listeners to history items for deletion when in clear mode
  const allHistoryItems = document.querySelectorAll('.history-item');
  allHistoryItems.forEach((historyItem, index) => {
      historyItem.classList.add('deletable')

      historyItem.addEventListener('click', function deleteHistoryItem() {

          // Remove selected chat from chatHistory array
          chatHistory.splice(index, 1);

          // Update the local storage with the new chat history
          localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
            
          // Update currentChatIndex based on the relative position of the deleted chat
      if (previousChatIndex === index) { // Update the currentChatIndex if the deleted chat is the selected chat
 
        if (previousChatIndex > chatHistory.length -1 ){
          currentChatIndex = chatHistory.length-1; // Make sure that the max currentChatIndex does not go more than the chatHistory length

        } else if (previousChatIndex <= chatHistory.length -1){ // No update if the current chat is deleted, but does not go more than the chatHistory length
          currentChatIndex = previousChatIndex;
        }
      
      } else if (previousChatIndex < index) { // No change if the deleted chat is more than the previous chat index
        currentChatIndex = previousChatIndex; 
      } else if (previousChatIndex > index) { // Update all the chat index so that it subtracts by 1 if the deleted chat is before the current chat index
        currentChatIndex--; 
        currentChatIndex = previousChatIndex - 1
      }

      if (chatHistory.length === 0) { // Automatically start a new chat if after deleting, there is no chat history
        startNewChat();        
      }
          // Update the UI
          loadChat(currentChatIndex);
          checkUserMessage();
          refreshHistoryItem();
          updateActiveHistoryItem();

          // Store the currentChatIndex
          localStorage.setItem('currentChatIndex', currentChatIndex);

          // Remove instruction and cancel button, re-enable the button
          instruction.remove();
          cancelButton.classList.add('hidden');
          clearAllButton.classList.add('hidden');

          // Remove the delete chat event listener from the history items after the item is deleted
          historyItem.removeEventListener('click', deleteHistoryItem);
          clearHistoryButton.classList.remove('hidden')
          historyItem.classList.remove('deletable')


      });
  });

  // Add event listener to the cancel button
  cancelButton.addEventListener('click', function cancelDeletionMode() {
      // Remove instruction and cancel button
      instruction.remove();
      cancelButton.classList.add('hidden');
      clearHistoryButton.classList.remove('hidden')
      clearAllButton.classList.add('hidden');

      //Update the UI
      loadChat(currentChatIndex);
      refreshHistoryItem();
      updateActiveHistoryItem();


      // Remove the click event listeners from history items
      allHistoryItems.forEach((historyItem) => {
          historyItem.replaceWith(historyItem.cloneNode(true)); // Clone and replace to remove listeners
          historyItem.classList.remove('deletable')
      });
  });
}

// Delete all the chat history
function clearAllHistory() {
  // Clear chat messages from the chat message div
  chatMessages.innerHTML = `<div class="chatbot-message bot-message">No history available. Start a new chat!</div>`;
  
  // Clear history from the local storage
  chatHistory = [];
  localStorage.removeItem('chatHistory');
  localStorage.removeItem('currentChatIndex');

  // Remove all chat history tab from the sidebar
  historyContainer.innerHTML = '';
  
  // Update the UI by starting a new chat
  startNewChat();
  checkUserMessage();

  // Hide and Show the buttons
  cancelButton.classList.add('hidden');
  clearAllButton.classList.add('hidden');
  clearHistoryButton.classList.remove('hidden');

}

    
  // Update the chat history view
  function refreshHistoryItem() {
    historyContainer.innerHTML = ''; // Clear the history container before updating
    
    chatHistory.forEach((chat, index) => { // Update the writings on the chat history items
      const historyItem = document.createElement("a");
      const firstUserMessage = chat.messages.find(msg => msg.sender === "user")?.message || '';
      if (firstUserMessage === ''){
        historyItem.innerHTML = `<strong>Chat ${index + 1}</strong>`
      } else {
        historyItem.innerHTML = `<strong>Chat ${index + 1}</strong>: ${firstUserMessage}`;
      }
  
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
      
        // Update the chat history items
      refreshHistoryItem();
      const savedChatIndex = localStorage.getItem('currentChatIndex');
      
      if (savedChatIndex !== null) {
          currentChatIndex = parseInt(savedChatIndex, 10);
          loadChat(currentChatIndex); // Automatically load the saved chat
      }
      }
      }
  
  // Check whether the send function should be available
  function disableSend(){
    // Disable the send button by default (no input)
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
  // Prevent empty prompts by detecting input from the input box
  userInputBox.addEventListener('input', () => {
    if (promptInput.value.trim() !== ''){
      sendButton.classList.remove('disabled'); // Enable the send button if there is input
    } else {
      sendButton.classList.add('disabled'); // Disable the send button if there is no input
    }
  })
  
  stopButton.addEventListener('click', () => { // Add event listener for the stop button
    stop = true;
    userInputBox.focus();
  }
  );
  
  
  
  function isScrolledToBottom() { // Checks if the current chat is scrolled to the bottom
    return chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 100;
  }
  
  let checkScrollInterval
  
  function checkScroll() { // Continuously check whether the current chat is scrolled to the bottom
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
  
  // Scrolls the current chat to the bottom when clicked
  scrollButton.addEventListener('click', () => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
  }
  );
  
  // Event listener for new chat button
  newChatButton.addEventListener("click", startNewChat);
  // Event listener for clear history button
  clearHistoryButton.addEventListener("click", clearChatHistory);
  // Event listener for clear all button
  clearAllButton.addEventListener('click', clearAllHistory)
  // Check whether to show prompt based on the input
  function checkUserMessage(){
    let hasUserMessage = false;
    // Shows if there is an existing user message in the current selected chat
    if (currentChatIndex !== -1 && chatHistory[currentChatIndex]) {
      hasUserMessage = chatHistory[currentChatIndex].messages.some(
        message => message.sender === "user"
      );
    }
  
    // Show prompts if there are no user messages in the current chat
    if (!hasUserMessage) {
      showPrompts();
    } else { // Hide it otherwise
      hidePrompts();

    }
  }
  
  // Hide the prompt if the chat message container is too small
  function checkContainerWidth(width){
    if (width < 550) {
      hidePrompts();
      showPromptButton.classList.add('hidden')
    } else {
      checkUserMessage();
      showPromptButton.classList.remove('hidden');
    }
  
  };  

  // Hide the prompt and edit the show prompt button text
  function hidePrompts(){
    promptContainer.classList.add('invisible');
    showPromptButton.innerHTML = '?'
  };
    // Show the prompt and edit the show prompt button text
  function showPrompts(){
    promptContainer.classList.remove('invisible');
    showPromptButton.classList.remove('hidden')
    showPromptButton.innerHTML = 'X';
  };
  // Puts the selected prompt inside the input box
  function insertPrompts(prompt){
    userInputBox.value = prompt.textContent;
  };
  // Close the prompt container
  closeButton.addEventListener('click', () => {
    hidePrompts();
  });
  
  // Show prompt button event listener
  showPromptButton.addEventListener('click', () => {
    if (showPromptButton.textContent === 'X') {
      hidePrompts(); // Hide prompts if the text is 'X'
    } else {
      showPrompts(); // Show the prompts if the text is '?'
    }
    });
  
  // prompt 1 button event listener
  prompt1Button.addEventListener('click', () => {
    insertPrompts(prompt1Button); // put prompt 1 in input box
    sendButton.classList.remove('disabled'); // Enable the send button
    userInputBox.focus(); // Focus on the input box
  });
  // prompt 2 button event listener
  prompt2Button.addEventListener('click', () => {
    insertPrompts(prompt2Button); // put prompt 2 in input box
    sendButton.classList.remove('disabled'); // Enable the send button
    userInputBox.focus(); // Focus on the input box
  });
  // prompt 3 button event listener
  prompt3Button.addEventListener('click', () => {
    insertPrompts(prompt3Button); // put prompt 3 in input box
    sendButton.classList.remove('disabled'); // Enable the send button
    userInputBox.focus(); // Focus on the input box
  });
  
  // Check the message container width to decide whether to show prompt
  checkContainerWidth(chatContainerWidth);
  // Check if the selected chat is scrolled to the bottom
  checkScroll();
  // Load history when the page is loaded
  loadHistory();
  // Check whether send should be enabled or not
  disableSend();  
