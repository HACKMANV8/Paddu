# send_test.py
from main import mail, Message, app

with app.app_context():
    msg = Message(subject="Test Email", recipients=["deepikashetty02022006@gmail.com"], body="Scheduler test!")
    mail.send(msg)
    print("Test email sent (or an exception was raised).")
