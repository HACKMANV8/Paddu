package main

import (
    "fmt"
    "golang-service/config"
    "golang-service/handlers"
    "golang-service/middleware"
    "net/http"
    "os"

    //"golang-service/middleware"

    "github.com/gin-gonic/gin"
    "golang-service/routes"
    // "github.com/gin-contrib/cors"
)

func main(){
       config.ConnectDatabase()
	r:=gin.Default()

    // Debug log: confirm GEMINI_API_KEY presence
    {
        keys := []string{"GEMINI_API_KEY", "GOOGLE_API_KEY", "GENAI_API_KEY", "API_KEY"}
        seen := ""
        for _, k := range keys {
            if v := os.Getenv(k); v != "" {
                masked := v
                if len(v) > 6 { masked = v[:6] + "***" }
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

	routes.RegisterRoutes(r)

	r.GET("/ping",func(c *gin.Context){
		c.JSON(http.StatusOK,gin.H{
			"message":"hello guys",
		})
	})
	r.POST("/signup", handlers.SignUp)
	r.POST("/login", handlers.Login)
	r.POST("/userinterest",middleware.SaveUserAnswers)
	r.GET("/profile",func(c *gin.Context){
		userID,_:=c.Get("user_id")
		c.JSON(http.StatusOK,gin.H{

			"message":"Welcome",
			"user_id":userID,
		})
	})
	r.Run()
}