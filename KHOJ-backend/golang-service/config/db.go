package config

import(
	"fmt"
	"log"
	"github.com/jmoiron/sqlx"
	 _ "github.com/lib/pq"
	 "github.com/joho/godotenv"
	 "os"
)


    var DB *sqlx.DB
func ConnectDatabase(){

     err:=godotenv.Load()
	 if err!=nil{
		log.Fatal("Error laoding .env")
	 }

	ConnStr:= os.Getenv("SUPABASE_DB_URL")


fmt.Println("✅ Environment variables loaded successfully!")
    fmt.Println("Supabase URL:", ConnStr)


	db,err:=sqlx.Open("postgres",ConnStr)
	if err!=nil{
		log.Fatal("Error opening database:",err)
	}

   err=db.Ping()
	if err!=nil{
		log.Fatal("Cannot connect to database:",err)

	}

	fmt.Println(" Connected to Supabase PostgreSQL successfully!")

      DB=db
}