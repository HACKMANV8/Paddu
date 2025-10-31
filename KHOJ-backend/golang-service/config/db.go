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

	// Ensure required tables exist
	createUsers := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		username TEXT NOT NULL,
		email TEXT UNIQUE NOT NULL,
		password TEXT NOT NULL,
		refresh_token TEXT,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW()
	);`

	createChats := `
	CREATE TABLE IF NOT EXISTS chats (
		id TEXT PRIMARY KEY,
		user_id INTEGER NOT NULL,
		topic TEXT NOT NULL,
		created_at TIMESTAMP NOT NULL,
		updated_at TIMESTAMP NOT NULL
	);`

	createMessages := `
	CREATE TABLE IF NOT EXISTS messages (
		id TEXT PRIMARY KEY,
		chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
		role TEXT NOT NULL,
		content TEXT NOT NULL,
		created_at TIMESTAMP NOT NULL
	);`

	createUserAnswers := `
	CREATE TABLE IF NOT EXISTS user_answers (
		user_id INTEGER NOT NULL,
		question_number INTEGER NOT NULL,
		question TEXT NOT NULL,
		answer TEXT NOT NULL
	);`

	if _, err := db.Exec(createUsers); err != nil {
		log.Fatal("Failed creating users table:", err)
	}
	if _, err := db.Exec(createChats); err != nil {
		log.Fatal("Failed creating chats table:", err)
	}
	if _, err := db.Exec(createMessages); err != nil {
		log.Fatal("Failed creating messages table:", err)
	}
	if _, err := db.Exec(createUserAnswers); err != nil {
		log.Fatal("Failed creating user_answers table:", err)
	}

      DB=db
}