"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Menu, Send, Plus, LayoutDashboard, MessageSquare, X } from 'lucide-react';

export default function Chat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm Khoj. How can I help you today?", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [previousChats] = useState([
    { id: 1, title: 'Machine Learning Basics', date: '2 hours ago' },
    { id: 2, title: 'React Best Practices', date: 'Yesterday' },
    { id: 3, title: 'Python Data Analysis', date: '3 days ago' }
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: inputValue,
        sender: 'user'
      };
      setMessages([...messages, newMessage]);
      setInputValue('');

      setTimeout(() => {
        const botResponse = {
          id: messages.length + 2,
          text: "I'm processing your query. This is a demo response from Khoj.",
          sender: 'bot'
        };
        setMessages(prev => [...prev, botResponse]);
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([
      { id: 1, text: "Hello! I'm Khoj. How can I help you today?", sender: 'bot' }
    ]);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 text-white">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-purple-900/50 backdrop-blur-md border-r border-purple-700/30 transition-transform duration-300 z-50 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } w-72`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-purple-700/30">
            <div>
              <h2 className="text-xl font-bold text-purple-100">Khoj</h2>
              <p className="text-xs text-purple-300">Tunnel your curiosity</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-purple-800/50 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center gap-3 px-4 py-3 bg-purple-700 hover:bg-purple-600 rounded-lg transition-colors"
            >
              <Plus size={20} />
              <span className="font-medium">New Chat</span>
            </button>
          </div>

          {/* Menu Options */}
          <div className="px-4 pb-4 border-b border-purple-700/30">
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-800/50 rounded-lg transition-colors">
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </button>
          </div>

          {/* Previous Chats */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-semibold text-purple-300 mb-3 px-2">Previous Chats</h3>
            <div className="space-y-2">
              {previousChats.map(chat => (
                <button
                  key={chat.id}
                  className="w-full flex items-start gap-3 px-3 py-2 hover:bg-purple-800/50 rounded-lg transition-colors text-left"
                >
                  <MessageSquare size={18} className="mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{chat.title}</p>
                    <p className="text-xs text-purple-400">{chat.date}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-purple-700/30 bg-purple-900/30 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-purple-800/50 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-purple-100">Khoj</h1>
            <p className="text-xs text-purple-300">Tunnel your curiosity</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl px-6 py-4 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-purple-600 ml-12'
                    : 'bg-purple-800/50 mr-12'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-purple-700/30 bg-purple-900/30 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-3 bg-purple-800/30 rounded-2xl p-2 border border-purple-700/30">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Khoj anything..."
                className="flex-1 bg-transparent px-4 py-3 outline-none resize-none text-sm placeholder-purple-400"
                rows="1"
                style={{ maxHeight: '120px' }}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="p-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:opacity-50 rounded-xl transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}