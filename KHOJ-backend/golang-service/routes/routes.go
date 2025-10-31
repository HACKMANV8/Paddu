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
	}
}