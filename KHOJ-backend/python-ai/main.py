# app.py
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv

from flask import Flask, request, jsonify
from flask_mail import Mail, Message
from flask_sqlalchemy import SQLAlchemy

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore

# load env
load_dotenv(".env.local")

app = Flask(__name__)

# --- Config from env ---
DATABASE_URL = os.getenv("DATABASE_URL")
print("Loaded DATABASE_URL:", os.getenv("DATABASE_URL"))

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set in .env.local")

app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Mail config
app.config["MAIL_SERVER"] = os.getenv("MAIL_SERVER", "smtp.gmail.com")
app.config["MAIL_PORT"] = int(os.getenv("MAIL_PORT", 587))
app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")
app.config["MAIL_USE_TLS"] = os.getenv("MAIL_USE_TLS", "True").lower() in ("true", "1", "yes")
app.config["MAIL_USE_SSL"] = os.getenv("MAIL_USE_SSL", "False").lower() in ("true", "1", "yes")
app.config["MAIL_DEFAULT_SENDER"] = os.getenv("MAIL_DEFAULT_SENDER", app.config["MAIL_USERNAME"])

# --- Extensions ---
db = SQLAlchemy(app)
mail = Mail(app)

# --- Models ---
class Notification(db.Model):
    __tablename__ = "notifications"
    # NOTE: You requested user_id as primary key. Usually primary key should be unique per row.
    # If you expect multiple notifications per user, use 'id' as PK and keep 'user_id' as FK.
    # Here we implement exactly as requested: user_id is PK.
    user_id = db.Column(db.String(36), primary_key=True)  # will store a UUID string
    to_email = db.Column(db.String(320), nullable=False)
    subject = db.Column(db.String(512), nullable=False)
    body = db.Column(db.Text, nullable=True)
    scheduled_time = db.Column(db.DateTime, nullable=False)
    sent = db.Column(db.Boolean, default=False)
    sent_time = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "to_email": self.to_email,
            "subject": self.subject,
            "body": self.body,
            "scheduled_time": self.scheduled_time.isoformat(),
            "sent": self.sent,
            "sent_time": self.sent_time.isoformat() if self.sent_time else None,
            "created_at": self.created_at.isoformat()
        }

# --- Scheduler ---
jobstores = {"default": SQLAlchemyJobStore(url=DATABASE_URL)}
scheduler = BackgroundScheduler(jobstores=jobstores)
scheduler.start()

# --- Job function ---
def send_email_job(user_id):
    """Job executed by APScheduler: send email and mark as sent."""
    with app.app_context():
        notif = Notification.query.get(user_id)
        if not notif:
            app.logger.warning("No notification found for user_id=%s", user_id)
            return
        if notif.sent:
            app.logger.info("Notification %s already sent", user_id)
            return
        try:
            msg = Message(subject=notif.subject, recipients=[notif.to_email], body=notif.body or "")
            mail.send(msg)
            notif.sent = True
            notif.sent_time = datetime.utcnow()
            db.session.commit()
            app.logger.info("Sent email to %s (user_id=%s)", notif.to_email, user_id)
        except Exception as exc:
            app.logger.exception("Failed to send email for %s: %s", user_id, exc)


# --- Routes ---
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Flask scheduler running"}), 200


@app.route("/schedule", methods=["POST"])
def schedule():
    """
    Request JSON:
    {
      "user_id": "optional-UUID-string-or-empty",
      "email": "recipient@example.com",
      "subject": "Reminder",
      "body": "Don't forget...",
      "send_time": "2025-10-31T18:00:00"   # ISO 8601 (naive local or include timezone)
    }
    If user_id is missing, a new UUID will be created and returned.
    NOTE: user_id is primary key. Scheduling for same user_id will replace existing notification.
    """
    data = request.get_json(force=True)
    to_email = data.get("email")
    subject = data.get("subject", "Scheduled Notification")
    body = data.get("body", "")
    send_time_str = data.get("send_time")
    user_id = data.get("user_id") or str(uuid.uuid4())

    if not to_email or not send_time_str:
        return jsonify({"error": "email and send_time are required"}), 400

    try:
        scheduled_time = datetime.fromisoformat(send_time_str)
    except Exception:
        return jsonify({"error": "send_time must be ISO8601 like 2025-10-31T18:00:00"}), 400

    # Upsert notification (user_id is PK)
    notif = Notification.query.get(user_id)
    if notif:
        # overwrite fields
        notif.to_email = to_email
        notif.subject = subject
        notif.body = body
        notif.scheduled_time = scheduled_time
        notif.sent = False
        notif.sent_time = None
    else:
        notif = Notification(
            user_id=user_id,
            to_email=to_email,
            subject=subject,
            body=body,
            scheduled_time=scheduled_time
        )
        db.session.add(notif)

    db.session.commit()

    # schedule job in APScheduler (job id mapped to user_id)
    job_id = f"email_{user_id}"
    scheduler.add_job(func=send_email_job, trigger="date", run_date=scheduled_time, args=[user_id],
                      id=job_id, replace_existing=True)

    return jsonify({"message": "scheduled", "user_id": user_id, "job_id": job_id}), 201


@app.route("/notifications", methods=["GET"])
def list_notifications():
    alln = Notification.query.order_by(Notification.created_at.desc()).all()
    return jsonify([n.to_dict() for n in alln]), 200


@app.route("/jobs", methods=["GET"])
def list_jobs():
    jobs = scheduler.get_jobs()
    out = []
    for j in jobs:
        out.append({
            "id": j.id,
            "next_run_time": j.next_run_time.isoformat() if j.next_run_time else None,
            "args": j.args
        })
    return jsonify(out), 200


@app.route("/cancel/<job_id>", methods=["DELETE"])
def cancel(job_id):
    try:
        scheduler.remove_job(job_id)
    except Exception:
        return jsonify({"error": "job not found"}), 404

    # If job corresponds to user notification, remove record
    if job_id.startswith("email_"):
        uid = job_id[len("email_"):]
        notif = Notification.query.get(uid)
        if notif:
            db.session.delete(notif)
            db.session.commit()

    return jsonify({"message": f"removed {job_id}"}), 200


if __name__ == "__main__":
    # create tables
    with app.app_context():
        db.create_all()
    app.run(debug=True, host="127.0.0.1", port=5000)
