"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, LayoutGrid, MessageSquare, Menu, X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [topic, setTopic] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startingChat, setStartingChat] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [chatList, setChatList] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Set sidebar open by default on desktop, closed on mobile
    const checkScreenSize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);
  const messagesEndRef = useRef(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080";

  useEffect(() => {
    // Check if user is logged in
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      router.push("/Login");
      return;
    }
    const uid = parseInt(storedUserId, 10);
    setUserId(uid);

    // Check if there's a stored chat_id for this session first
    const storedChatId = sessionStorage.getItem("chatId");
    const storedTopic = sessionStorage.getItem("chatTopic");
    if (storedChatId && storedTopic) {
      setChatId(storedChatId);
      setTopic(storedTopic);
      loadChatHistory(storedChatId);
      // Still load chat list for sidebar
      loadUserChats(uid, false);
    } else {
      // No stored chat, load chat list and auto-select first one if available
      loadUserChats(uid, true);
    }
  }, [router]);

  const loadUserChats = async (uid, autoLoadFirstChat = false) => {
    if (!uid) {
      console.log("loadUserChats: No user ID provided");
      return;
    }
    setLoadingChats(true);
    try {
      const url = `${apiBaseUrl}/api/chat/user/${uid}`;
      console.log("Loading chats from:", url);
      const res = await fetch(url);
      console.log("Chat list response status:", res.status);
      
      if (res.ok) {
        const chats = await res.json();
        console.log("Chats received:", chats);
        console.log("Number of chats:", chats?.length || 0);
        setChatList(chats || []);
        
        // If no chat is currently selected and user has chats, auto-load the most recent one
        if (autoLoadFirstChat && chats && chats.length > 0 && !chatId) {
          const mostRecentChat = chats[0]; // Already sorted by updated_at DESC from backend
          console.log("Auto-loading most recent chat:", mostRecentChat.id);
          await loadChat(mostRecentChat.id, mostRecentChat.topic);
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to load chat list:", res.status, res.statusText, errorData);
      }
    } catch (err) {
      console.error("Failed to load chat list:", err);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChatHistory = async (chatIdToLoad) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/chat/${chatIdToLoad}`);
      if (res.ok) {
        const history = await res.json();
        setMessages(history || []);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  };

  const startChat = async () => {
    if (!topicInput.trim() || !userId) {
      setError("Please enter a topic");
      return;
    }

    setStartingChat(true);
    setError("");

    try {
      const res = await fetch(`${apiBaseUrl}/api/chat/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          topic: topicInput.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to start chat");
      }

      // Handle both new and existing chats
      setChatId(data.chat_id);
      setTopic(topicInput.trim());
      sessionStorage.setItem("chatId", data.chat_id);
      sessionStorage.setItem("chatTopic", topicInput.trim());
      
      // If it's an existing chat, load its history
      if (data.existing) {
        await loadChatHistory(data.chat_id);
      } else {
        setMessages([]);
      }
      
      // Reload chat list to refresh the sidebar
      if (userId) {
        loadUserChats(userId);
      }
    } catch (err) {
      setError(err.message || "Failed to start chat");
    } finally {
      setStartingChat(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !chatId || !userId) {
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setLoading(true);
    setError("");

    // Add user message to UI immediately
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const headers = {
        "Content-Type": "application/json",
      };
      
      // Include X-Gemini-Api-Key if available in env (optional, backend will fallback)
      if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        headers["X-Gemini-Api-Key"] = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      }

      const res = await fetch(`${apiBaseUrl}/api/chat/send`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_id: userId,
          chat_id: chatId,
          message: userMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Remove the temp user message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMsg.id));
        
        if (res.status === 409) {
          setError(
            `Message is off-topic. This chat is for '${data.required_topic || topic}'. Start a new chat for a different topic.`
          );
        } else {
          setError(data?.error || "Failed to send message");
        }
        return;
      }

      // Replace temp message with real message from backend
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== tempUserMsg.id);
        // Add bot reply
        return [
          ...filtered,
          {
            id: `user-${Date.now()}`,
            role: "user",
            content: userMessage,
            created_at: new Date().toISOString(),
          },
          {
            id: `bot-${Date.now()}`,
            role: "bot",
            content: data.reply,
            created_at: new Date().toISOString(),
          },
        ];
      });
      // Refresh chat list to update last modified time
      if (userId) {
        loadUserChats(userId);
      }
    } catch (err) {
      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMsg.id));
      setError(err.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) {
        sendMessage();
      }
    }
  };

  const startNewChat = () => {
    setChatId(null);
    setTopic("");
    setTopicInput("");
    setMessages([]);
    sessionStorage.removeItem("chatId");
    sessionStorage.removeItem("chatTopic");
    // Reload chat list after starting new chat
    if (userId) {
      loadUserChats(userId);
    }
  };

  const loadChat = async (selectedChatId, selectedTopic) => {
    setChatId(selectedChatId);
    setTopic(selectedTopic);
    sessionStorage.setItem("chatId", selectedChatId);
    sessionStorage.setItem("chatTopic", selectedTopic);
    await loadChatHistory(selectedChatId);
    // Close sidebar on mobile after selecting a chat
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const deleteChat = async (chatIdToDelete, chatTopicToDelete, e) => {
    e.stopPropagation(); // Prevent loading the chat when clicking delete
    
    if (!userId || !chatIdToDelete) {
      return;
    }

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete the chat about "${chatTopicToDelete}"?`)) {
      return;
    }

    try {
      const url = `${apiBaseUrl}/api/chat/${chatIdToDelete}`;
      console.log("Deleting chat:", url, "with user_id:", userId);
      
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      console.log("Delete response status:", res.status, res.statusText);

      if (!res.ok) {
        // Read response as text first to avoid JSON parsing issues
        let responseText = "";
        try {
          responseText = await res.text();
        } catch (readErr) {
          console.error("Failed to read response:", readErr);
        }

        let errorMessage = "Failed to delete chat";
        
        // Try to parse as JSON only if we got text back
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData?.error || errorMessage;
            console.error("Delete error:", errorData);
          } catch (parseErr) {
            // If JSON parsing fails, use the text or status text
            errorMessage = responseText || res.statusText || errorMessage;
            console.error("Failed to parse error response:", parseErr);
          }
        } else {
          errorMessage = res.statusText || errorMessage;
        }
        
        // If 404, provide more helpful message
        if (res.status === 404) {
          errorMessage = "Chat not found. It may have already been deleted.";
        }
        
        throw new Error(errorMessage);
      }

      // Reload chat list first
      if (userId) {
        await loadUserChats(userId, false);
      }

      // If the deleted chat was the active one, clear it after list reloads
      if (chatId === chatIdToDelete) {
        setChatId(null);
        setTopic("");
        setMessages([]);
        sessionStorage.removeItem("chatId");
        sessionStorage.removeItem("chatTopic");
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
      setError(err.message || "Failed to delete chat");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  // Show loading state while checking for chats
  if (!chatId && loadingChats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0014] to-[#1a0033] text-white p-4">
        <div className="text-center">
          <div className="flex justify-center gap-1 mb-4">
            <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"></span>
            <span
              className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></span>
            <span
              className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></span>
          </div>
          <p className="text-gray-400">Loading your chats...</p>
        </div>
      </div>
    );
  }

  // Show topic input only if chat hasn't started AND user has no chats
  if (!chatId && !loadingChats && chatList.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0014] to-[#1a0033] text-white p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative bg-gray-900/60 backdrop-blur-lg rounded-2xl shadow-[0_0_40px_rgba(0,0,0)] p-10 w-full max-w-md border border-white/10"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-900 to-neutral-600 rounded-2xl opacity-0 blur-lg"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="w-12 h-12 text-violet-400" />
            </div>
            <h2 className="text-3xl font-extrabold text-center mb-2 bg-gradient-to-r from-violet-50 to-violet-100 bg-clip-text text-transparent">
              Start a Chat
            </h2>
            <p className="text-center text-gray-400 mb-6 text-sm">
              Enter a topic you&apos;d like to learn about
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Topic</label>
                <input
                  type="text"
                  placeholder="e.g., algebra, physics, literature..."
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !startingChat) {
                      startChat();
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-gray-100 placeholder-gray-500"
                  disabled={startingChat}
                />
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {error}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startChat}
                disabled={startingChat || !topicInput.trim()}
                className="relative w-full py-3 font-semibold rounded-full overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-violet-700 via-violet-600 to-indigo-600 hover:shadow-[0_0_24px_-4px_rgba(217,70,239,0.8)]"
              >
                <span className="relative z-10 text-white">
                  {startingChat ? "Starting..." : "Start Chat"}
                </span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show chat interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0014] to-[#1a0033] text-white flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? "280px" : "0px",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="h-screen bg-gray-900/60 backdrop-blur-lg border-r border-white/10 flex-shrink-0 overflow-hidden"
      >
        <div className={`flex flex-col h-full w-[280px] transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">KHOJ</h2>
            </div>
            
            {/* Dashboard Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/Dashboard")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-violet-700/20 hover:bg-violet-700/30 border border-violet-500/20 text-white transition mb-4"
            >
              <LayoutGrid className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </motion.button>
          </div>

          {/* Chat History Section */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Chat History
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => userId && loadUserChats(userId)}
                  disabled={loadingChats}
                  className="text-violet-400 hover:text-violet-300 text-xs disabled:opacity-50"
                  title="Refresh chat list"
                >
                  ↻
                </button>
                <button
                  onClick={() => {
                    startNewChat();
                    if (userId) {
                      loadUserChats(userId);
                    }
                  }}
                  className="text-violet-400 hover:text-violet-300 text-xs"
                >
                  + New
                </button>
              </div>
            </div>

            {loadingChats ? (
              <div className="flex justify-center py-8">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"></span>
                  <span
                    className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></span>
                </div>
              </div>
            ) : chatList.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No chats yet</p>
                <p className="text-xs mt-1">Start a new chat to begin</p>
              </div>
            ) : (
              <div className="space-y-2">
                {chatList.map((chat) => (
                  <div
                    key={chat.id}
                    className={`group relative w-full p-3 rounded-lg transition ${
                      chatId === chat.id
                        ? "bg-violet-700/30 border border-violet-500/30"
                        : "bg-white/5 hover:bg-white/10 border border-white/10"
                    }`}
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => loadChat(chat.id, chat.topic)}
                      className="w-full text-left flex items-start gap-2"
                    >
                      <MessageSquare
                        className={`w-4 h-4 mt-1 flex-shrink-0 ${
                          chatId === chat.id ? "text-violet-400" : "text-gray-400"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            chatId === chat.id ? "text-white" : "text-gray-300"
                          }`}
                        >
                          {chat.topic}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(chat.updated_at || chat.created_at)}
                        </p>
                      </div>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => deleteChat(chat.id, chat.topic, e)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 text-red-400 hover:text-red-300"
                      title="Delete chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-white/10 bg-gray-900/40 backdrop-blur-sm">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Toggle sidebar button - visible on all screens */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-white/10 transition"
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </motion.button>
              <Bot className="w-6 h-6 text-violet-400" />
              <div>
                <h1 className="text-lg font-semibold">Chat: {topic}</h1>
                <p className="text-xs text-gray-400">AI Tutor Assistant</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startNewChat}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-sm transition"
            >
              New Chat
            </motion.button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-4">
          <AnimatePresence>
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-gray-400"
              >
                <Bot className="w-16 h-16 mx-auto mb-4 text-violet-400/50" />
                <p>Start the conversation! Ask me anything about {topic}.</p>
              </motion.div>
            ) : (
              messages.map((message, index) => (
                <motion.div
                  key={message.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "bot" && (
                    <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-violet-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-violet-700 to-indigo-700 text-white"
                        : "bg-gray-800/60 backdrop-blur-sm border border-white/10 text-gray-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    {message.created_at && (
                      <p className="text-xs mt-2 opacity-60">
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-indigo-400" />
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 justify-start"
            >
              <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-violet-400" />
              </div>
              <div className="bg-gray-800/60 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"></span>
                  <span
                    className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></span>
                </div>
              </div>
            </motion.div>
          )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4">
            <div className="max-w-4xl mx-auto mb-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              {error}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-white/10 bg-gray-900/40 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask me anything about ${topic}...`}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-gray-100 placeholder-gray-500 disabled:opacity-50"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={sendMessage}
              disabled={loading || !inputMessage.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-700 to-indigo-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_24px_-4px_rgba(217,70,239,0.8)] transition flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              {loading ? "Sending..." : "Send"}
            </motion.button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

