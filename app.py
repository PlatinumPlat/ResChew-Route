import os, math, sqlite3
from flask import Flask, render_template, request, jsonify, json

app = Flask(__name__)

def init_db():
    conn = sqlite3.connect("sessions.db")
    cursor = conn.cursor()
    cursor.execute("""CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        date TEXT,
        original_image TEXT,
        result_image TEXT,
        confidence REAL,
        severity TEXT,
        deviation_percent REAL,
        conclusion TEXT,
        keypoints TEXT,
        shoulder_tilt REAL,
        hip_tilt REAL
    )""")


@app.route("/index.html")
def home():
    return render_template("index.html")

@app.route("/restaurant.html")
def restaurant():
    return render_template("restaurant.html")

@app.route("/about.html")
def about():
    return render_template("about.html")

@app.route("/faq.html")
def faq():
    return render_template("faq.html")

@app.route("/guide.html")
def guide():
    return render_template("guide.html")

@app.route("/info.html")
def info():
    return render_template("info.html")


if __name__ == '__main__':
    init_db()
    app.run(debug=True)