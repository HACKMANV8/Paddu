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
	}
}
