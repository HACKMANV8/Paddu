"use client";
import React, { useState, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, ArrowLeft, MessageSquare, X } from "lucide-react";
import { motion } from "framer-motion";

export default function QuizPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
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
    setUsername(localStorage.getItem("username") || "");

    // Load all user chats
    loadUserChats(uid);
  }, [router]);

  const loadUserChats = async (uid) => {
    if (!uid) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/chat/user/${uid}`);
      if (res.ok) {
        const chatList = await res.json();
        setChats(chatList || []);
      }
    } catch (err) {
      console.error("Failed to load chats:", err);
    } finally {
      setLoading(false);
    }
  };

  // Group chats by topic and calculate statistics
  const topicStats = chats.reduce((acc, chat) => {
    const topic = chat.topic || "Untitled";
    if (!acc[topic]) {
      acc[topic] = {
        topic,
        count: 0,
        lastActivity: null,
        chatIds: [],
      };
    }
    acc[topic].count += 1;
    acc[topic].chatIds.push(chat.id);
    const chatDate = new Date(chat.updated_at || chat.created_at);
    if (!acc[topic].lastActivity || chatDate > acc[topic].lastActivity) {
      acc[topic].lastActivity = chatDate;
    }
    return acc;
  }, {});

  const topics = Object.values(topicStats).sort((a, b) => {
    // Sort by last activity, most recent first
    if (b.lastActivity && a.lastActivity) {
      return b.lastActivity - a.lastActivity;
    }
    return b.count - a.count; // Fallback to count
  });

  const maxCount = Math.max(...topics.map(t => t.count), 1);

  const formatDate = (date) => {
    if (!date) return "Never";
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleTopicClick = async (topicData) => {
    // Navigate to chat and load the most recent chat for this topic
    if (topicData.chatIds.length > 0) {
      // Find the most recent chat for this topic
      const mostRecentChat = chats
        .filter(chat => chat.topic === topicData.topic)
        .sort((a, b) => {
          const dateA = new Date(a.updated_at || a.created_at);
          const dateB = new Date(b.updated_at || b.created_at);
          return dateB - dateA;
        })[0];
      
      if (mostRecentChat) {
        // Store chat info for the chat page to load
        sessionStorage.setItem("chatId", mostRecentChat.id);
        sessionStorage.setItem("chatTopic", mostRecentChat.topic);
      }
      router.push("/chat");
    } else {
      // If no chats exist for this topic, navigate to chat
      router.push("/chat");
    }
  };

  return (
    <>
      <Head>
        <title>Quiz & Topics</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-[#0a0014] to-[#1a0033] text-white">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.back()}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div className="flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-violet-400" />
                <div>
                  <h1 className="text-3xl font-bold">Quiz & Topics</h1>
                  <p className="text-gray-400 text-sm">Your learning topics and progress</p>
                </div>
              </div>
            </div>
            <Link
              href="/chat"
              className="px-4 py-2 rounded-lg bg-violet-700/20 hover:bg-violet-700/30 border border-violet-500/20 text-white transition flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Back to Chat
            </Link>
          </div>

          {/* Topics Visualization */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
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
          ) : topics.length === 0 ? (
            <div className="text-center py-20">
              <GraduationCap className="w-16 h-16 mx-auto mb-4 text-violet-400/50" />
              <p className="text-gray-400 text-lg mb-2">No topics yet</p>
              <p className="text-gray-500 text-sm">Start a chat to begin learning!</p>
              <Link
                href="/chat"
                className="mt-4 inline-block px-6 py-3 rounded-lg bg-violet-700 hover:bg-violet-600 text-white transition"
              >
                Start Chatting
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-900/60 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-violet-400" />
                  Topics Overview
                </h2>
                
                <div className="space-y-4">
                  {topics.map((topicData, index) => {
                    const percentage = (topicData.count / maxCount) * 100;
                    const mostRecentChat = chats
                      .filter(chat => chat.topic === topicData.topic)
                      .sort((a, b) => {
                        const dateA = new Date(a.updated_at || a.created_at);
                        const dateB = new Date(b.updated_at || b.created_at);
                        return dateB - dateA;
                      })[0];
                    
                    return (
                      <motion.div
                        key={topicData.topic}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group bg-white/5 hover:bg-white/10 rounded-lg p-4 border border-white/10 hover:border-violet-500/30 transition-all"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1 min-w-0" onClick={() => handleTopicClick(topicData)}>
                            <h3 className="text-lg font-semibold text-white truncate group-hover:text-violet-400 transition cursor-pointer">
                              {topicData.topic}
                            </h3>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-gray-400">
                                {topicData.count} {topicData.count === 1 ? "chat" : "chats"}
                              </span>
                              <span className="text-sm text-gray-500">
                                Last: {formatDate(topicData.lastActivity)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4 flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-2xl font-bold text-violet-400">{topicData.count}</span>
                              <p className="text-xs text-gray-500">chats</p>
                            </div>
                            {mostRecentChat && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTopic(topicData);
                                  setSelectedChat(mostRecentChat);
                                  setShowDurationModal(true);
                                }}
                                className="px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 text-white text-sm font-medium transition flex items-center gap-2"
                              >
                                <GraduationCap className="w-4 h-4" />
                                Quiz
                              </motion.button>
                            )}
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="relative w-full h-4 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: index * 0.1 + 0.2, duration: 0.6 }}
                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-500 rounded-full shadow-lg"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-medium text-white/80 z-10">
                              {topicData.count} {topicData.count === 1 ? "conversation" : "conversations"}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Statistics Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900/60 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                  <p className="text-gray-400 text-sm mb-2">Total Topics</p>
                  <p className="text-3xl font-bold text-violet-400">{topics.length}</p>
                </div>
                <div className="bg-gray-900/60 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                  <p className="text-gray-400 text-sm mb-2">Total Chats</p>
                  <p className="text-3xl font-bold text-violet-400">{chats.length}</p>
                </div>
                <div className="bg-gray-900/60 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                  <p className="text-gray-400 text-sm mb-2">Most Active</p>
                  <p className="text-lg font-semibold text-white truncate">
                    {topics.length > 0 ? topics[0].topic : "None"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Duration Selection Modal */}
      {showDurationModal && selectedTopic && selectedChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Select Quiz Duration</h3>
              <button
                onClick={() => {
                  setShowDurationModal(false);
                  setSelectedTopic(null);
                  setSelectedChat(null);
                }}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-400 mb-6">
              How long do you want your quiz to be on <span className="text-violet-400 font-semibold">{selectedTopic.topic}</span>?
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[5, 10, 15, 30].map((duration) => (
                <motion.button
                  key={duration}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={async () => {
                    try {
                      const res = await fetch(`${apiBaseUrl}/api/quiz/start`, {
                        method: "POST",
                        headers: { 
                          "Content-Type": "application/json",
                          "X-Gemini-Api-Key": localStorage.getItem("geminiApiKey") || "",
                        },
                        body: JSON.stringify({
                          user_id: userId,
                          chat_id: selectedChat.id,
                          topic: selectedTopic.topic,
                          duration: duration,
                        }),
                      });
                      
                      const text = await res.text();
                      let data;
                      try {
                        data = JSON.parse(text);
                      } catch (parseErr) {
                        console.error("JSON parse error:", parseErr);
                        console.error("Response text:", text);
                        alert("Failed to parse quiz response. Please try again.");
                        return;
                      }
                      
                      if (res.ok && data.quiz_id) {
                        setShowDurationModal(false);
                        setSelectedTopic(null);
                        setSelectedChat(null);
                        if (data.existing) {
                          // Existing quiz found, redirect to it
                          router.push(`/quiz/take?id=${data.quiz_id}`);
                        } else {
                          // New quiz created, redirect to it
                          router.push(`/quiz/take?id=${data.quiz_id}`);
                        }
                      } else {
                        if (res.status === 409 && data.quiz_id) {
                          // Quiz exists with quiz_id, redirect to it
                          setShowDurationModal(false);
                          setSelectedTopic(null);
                          setSelectedChat(null);
                          router.push(`/quiz/take?id=${data.quiz_id}`);
                        } else {
                          alert(data?.error || "Failed to start quiz");
                        }
                      }
                    } catch (err) {
                      console.error("Start quiz error:", err);
                      alert("Failed to start quiz: " + err.message);
                    }
                  }}
                  className="px-4 py-3 rounded-lg bg-violet-700/20 hover:bg-violet-700/30 border border-violet-500/20 text-white transition"
                >
                  <div className="font-semibold">{duration} min</div>
                  <div className="text-xs text-gray-400 mt-1">
                    ~{Math.max(1, Math.floor(duration / 3))} questions
                  </div>
                </motion.button>
              ))}
            </div>

            <button
              onClick={() => {
                setShowDurationModal(false);
                setSelectedTopic(null);
                setSelectedChat(null);
              }}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
}

