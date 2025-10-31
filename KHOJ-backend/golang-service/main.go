package main

import (
	"fmt"
	"golang-service/config"
	"golang-service/handlers"
	"golang-service/middleware"
	"net/http"
	"os"

	//"golang-service/middleware"

	"golang-service/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	config.ConnectDatabase()
	r := gin.Default()

	// Enable CORS for local frontend
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Accept", "X-Gemini-Api-Key", "X-Google-Api-Key", "X-Api-Key", "X-Gemini-Model"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Debug log: confirm GEMINI_API_KEY presence
	{
		keys := []string{"GEMINI_API_KEY", "GOOGLE_API_KEY", "GENAI_API_KEY", "API_KEY"}
		seen := ""
		for _, k := range keys {
			if v := os.Getenv(k); v != "" {
				masked := v
				if len(v) > 6 {
					masked = v[:6] + "***"
				}
				seen = fmt.Sprintf("%s=%s", k, masked)
				break
			}
		}
		if seen == "" {
			fmt.Println("⚠️  Gemini API key not set (tried: GEMINI_API_KEY, GOOGLE_API_KEY, GENAI_API_KEY, API_KEY)")
		} else {
			fmt.Println("✅ Gemini API key detected:", seen)
		}
	}

	// Register API routes
	routes.RegisterRoutes(r)

	// Test endpoint to verify server is running
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "hello guys",
		})
	})

	// Test endpoint for chat routes debugging
	r.GET("/test-chat-routes", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Chat routes are registered",
			"routes": []string{
				"POST /api/chat/start",
				"POST /api/chat/send",
				"GET /api/chat/user/:user_id",
				"DELETE /api/chat/:id",
				"GET /api/chat/:id",
			},
		})
	})
	r.POST("/signup", handlers.SignUp)
	r.POST("/login", handlers.Login)
	r.POST("/userinterest", middleware.SaveUserAnswers)
	r.GET("/profile", func(c *gin.Context) {
		userID, _ := c.Get("user_id")
		c.JSON(http.StatusOK, gin.H{

			"message": "Welcome",
			"user_id": userID,
		})
	})
	r.Run()
}
