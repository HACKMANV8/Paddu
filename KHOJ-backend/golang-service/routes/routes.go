package routes

import (
	"golang-service/handlers"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		chat := api.Group("/chat")
		{
			chat.POST("/start", handlers.StartChat)
			chat.POST("/send", handlers.SendMessage)
			// More specific route must come before the general one
			chat.GET("/user/:user_id", handlers.GetUserChats)
			chat.DELETE("/:id", handlers.DeleteChat)
			chat.GET("/:id", handlers.GetChatHistory)
		}

		// Schedule endpoints
		api.POST("/schedule", handlers.CreateSchedule)
		api.GET("/schedule/:user_id", handlers.GetUserSchedules)
		api.GET("/schedule/due", handlers.GetDueSchedules) // For n8n/cron
		api.DELETE("/schedule/:id", handlers.CancelSchedule)

		// Quiz endpoints
		api.POST("/quiz/reminder", handlers.TriggerQuizReminder) // Webhook for n8n
		api.POST("/quiz/start", handlers.StartQuiz)
		api.POST("/quiz/answer", handlers.SubmitQuizAnswer)
	}
}
