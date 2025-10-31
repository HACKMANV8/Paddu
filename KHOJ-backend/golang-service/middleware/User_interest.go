package middleware

import (
	"golang-service/models"
	
	"net/http"

	"golang-service/config"

	"github.com/gin-gonic/gin"
)

func SaveUserAnswers(c *gin.Context){
	var payload models.AnswerPayload


	if err:=c.ShouldBindJSON(&payload); err!=nil{
		c.JSON(http.StatusBadRequest,gin.H{"error":"Invalid input"})
		return
	}



	for _, ans:=range payload.Answers{
        _,err:=config.DB.Exec(`
			INSERT INTO user_answers (user_id, question_number, question, answer)
			VALUES ($1, $2, $3, $4)
		`, payload.ID, ans.QuestionNumber, ans.Question, ans.Answer)

		if err!=nil{
			c.JSON(http.StatusInternalServerError,gin.H{"error": "Failed to save answers"})
		}
	}
		c.JSON(http.StatusOK, gin.H{"message": "Answers saved successfully!"})

}
