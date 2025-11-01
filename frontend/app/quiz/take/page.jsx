"use client";
import React, { useState, useEffect, Suspense } from "react";
import Head from "next/head";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

function TakeQuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizId = searchParams.get("id");
  
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [startTime] = useState(Date.now());
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080";

  useEffect(() => {
    if (!quizId) {
      router.push("/quiz");
      return;
    }
    loadQuiz();
  }, [quizId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const loadQuiz = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/quiz/${quizId}`);
      
      if (!res.ok) {
        const text = await res.text();
        let errorMsg = "Unknown error";
        try {
          const errorData = JSON.parse(text);
          errorMsg = errorData.error || errorMsg;
        } catch {
          errorMsg = text || `HTTP ${res.status}`;
        }
        alert("Failed to load quiz: " + errorMsg);
        router.push("/quiz");
        setLoading(false);
        return;
      }
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error("JSON parse error:", parseErr);
        console.error("Response text:", text);
        alert("Failed to parse quiz data. Response: " + text.substring(0, 100));
        router.push("/quiz");
        setLoading(false);
        return;
      }
      
      if (data.quiz && data.questions) {
        setQuiz(data.quiz);
        setQuestions(data.questions);
      } else {
        alert("Invalid quiz data received");
        router.push("/quiz");
      }
    } catch (err) {
      console.error("Load quiz error:", err);
      alert("Failed to load quiz: " + err.message);
      router.push("/quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, optionIndex) => {
    const optionLabels = ["A", "B", "C", "D"];
    setAnswers({
      ...answers,
      [questionId]: optionLabels[optionIndex],
    });
  };

  const handleTextAnswerChange = (questionId, text) => {
    setAnswers({
      ...answers,
      [questionId]: text,
    });
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    if (Object.keys(answers).length < questions.length) {
      const unanswered = questions.filter(q => !answers[q.id]);
      if (unanswered.length > 0) {
        if (!confirm(`You have ${unanswered.length} unanswered question(s). Do you want to submit anyway?`)) {
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/quiz/submit`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Gemini-Api-Key": localStorage.getItem("geminiApiKey") || "",
        },
        body: JSON.stringify({
          quiz_id: parseInt(quizId),
          answers: answers,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResults(data);
      } else {
        alert("Failed to submit quiz: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Failed to submit quiz: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Quiz...</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
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
      </>
    );
  }

  if (results) {
    return (
      <>
        <Head>
          <title>Quiz Results</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
                    results.percentage >= 70
                      ? "bg-green-500/20 text-green-400"
                      : results.percentage >= 50
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  <GraduationCap className="w-12 h-12" />
                </motion.div>
                <h1 className="text-3xl font-bold text-white mb-2">Quiz Completed!</h1>
                <div className="text-5xl font-bold text-violet-400 mb-2">
                  {results.score}/{results.total_questions}
                </div>
                <div className="text-2xl font-semibold text-gray-300">
                  {results.percentage.toFixed(1)}%
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {results.results.map((result, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    className={`p-4 rounded-lg border ${
                      result.is_correct
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-red-500/10 border-red-500/30"
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      {result.is_correct ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-white font-medium mb-2">{result.question}</p>
                        {result.options && result.options.length > 0 ? (
                          <div className="space-y-1">
                            {result.options.map((option, optIdx) => {
                            const optionLabels = ["A", "B", "C", "D"];
                            const isCorrect = result.correct_answer === optionLabels[optIdx];
                            const isUserAnswer = result.user_answer === optionLabels[optIdx];
                            return (
                              <div
                                key={optIdx}
                                className={`px-3 py-2 rounded ${
                                  isCorrect
                                    ? "bg-green-500/20 text-green-400"
                                    : isUserAnswer && !isCorrect
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-white/5 text-gray-400"
                                }`}
                              >
                                {optionLabels[optIdx]}. {option}
                                {isCorrect && " ✓"}
                              </div>
                            );
                          })}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="px-3 py-2 rounded bg-white/5">
                              <span className="text-gray-400 text-sm">Correct Answer:</span>
                              <p className="text-green-400 mt-1">{result.correct_answer}</p>
                            </div>
                            <div className={`px-3 py-2 rounded ${
                              result.is_correct ? "bg-green-500/20" : "bg-red-500/20"
                            }`}>
                              <span className="text-gray-400 text-sm">Your Answer:</span>
                              <p className={result.is_correct ? "text-green-400" : "text-red-400"}>{result.user_answer}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push("/quiz")}
                  className="px-6 py-3 rounded-lg bg-violet-700 hover:bg-violet-600 text-white transition"
                >
                  Back to Topics
                </button>
                <button
                  onClick={() => router.push("/chat")}
                  className="px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition"
                >
                  Back to Chat
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Take Quiz - {quiz?.topic}</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/quiz")}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">{quiz?.topic}</h1>
                <p className="text-sm text-gray-400">
                  Question {Object.keys(answers).length} of {questions.length} answered
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatTime(timeElapsed)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Content */}
        <div className="max-w-4xl mx-auto p-4">
          <div className="space-y-6">
            {questions.map((question, idx) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10"
              >
                <div className="mb-4">
                  <span className="text-sm font-semibold text-violet-400">
                    Question {idx + 1} of {questions.length}
                  </span>
                  <h3 className="text-lg font-semibold text-white mt-2">{question.question}</h3>
                </div>

                {/* MCQ Options or Text Input */}
                {question.options && question.options.length > 0 ? (
                  <div className="space-y-3">
                    {question.options.map((option, optIdx) => {
                      const optionLabels = ["A", "B", "C", "D"];
                      const isSelected = answers[question.id] === optionLabels[optIdx];
                      return (
                        <label
                          key={optIdx}
                          className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition border ${
                            isSelected
                              ? "bg-violet-700/30 border-violet-500"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={optionLabels[optIdx]}
                            checked={isSelected}
                            onChange={() => handleAnswerChange(question.id, optIdx)}
                            className="w-5 h-5 text-violet-600 focus:ring-violet-500 focus:ring-2"
                          />
                          <span className="text-white font-medium">{optionLabels[optIdx]}.</span>
                          <span className="text-gray-300 flex-1">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Your Answer:
                    </label>
                    <textarea
                      value={answers[question.id] || ""}
                      onChange={(e) => handleTextAnswerChange(question.id, e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 min-h-[100px] resize-y"
                    />
                    <p className="mt-2 text-xs text-gray-400">
                      Your answer will be checked by AI for correctness
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-4 rounded-lg bg-violet-700 hover:bg-violet-600 text-white font-semibold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <GraduationCap className="w-5 h-5" />
                  Submit Quiz
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function TakeQuizPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
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
    }>
      <TakeQuizContent />
    </Suspense>
  );
}
