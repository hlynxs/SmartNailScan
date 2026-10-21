import React, { createContext, useContext, useState } from 'react';

const ChatBotContext = createContext(null);

export function ChatBotProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [hasGreeted, setHasGreeted] = useState(false);

  const addMessage = (from, text) => {
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), from, text }]);
  };

  return (
    <ChatBotContext.Provider value={{ open, setOpen, messages, addMessage, hasGreeted, setHasGreeted }}>
      {children}
    </ChatBotContext.Provider>
  );
}

export function useChatBot() {
  return useContext(ChatBotContext);
}