package routes

import(
	"github.com/gin-gonic/gin"
	"golang-service/handlers"
)


func RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		api.POST("/chat/start", handlers.StartChat)
		api.POST("/chat/send", handlers.SendMessage)
		api.GET("/chat/:id", handlers.GetChatHistory)
		
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