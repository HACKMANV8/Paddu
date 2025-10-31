package main

import (
	"golang-service/config"
	"golang-service/handlers"
	"golang-service/middleware"
	"net/http"

	//"golang-service/middleware"

	"github.com/gin-gonic/gin"
	"golang-service/routes"
	// "github.com/gin-contrib/cors"
)

func main(){
       config.ConnectDatabase()
	r:=gin.Default()

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