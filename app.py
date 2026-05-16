import os
import secrets
from flask import Flask, render_template, make_response

app = Flask(__name__)

# --- Security Configuration ---
# Generate a random secret key if one isn't provided in environment
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_hex(32))
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 hour session

@app.after_request
def add_security_headers(response):
    """Add standard security headers to every response."""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com https://polyfill.io; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self';"
    return response

# --- Routes ---

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/system/modeling")
def system_modeling():
    return render_template("modeling system.html")

@app.route("/system/analysis")
def system_analysis():
    return render_template("system analysis.html")

@app.route("/control/pid")
def control_pid():
    return render_template("PID.html")

@app.route("/control/state-space")
def control_state_space():
    return render_template("State Space.html")

@app.route("/simulink/modeling")
def simulink_modeling():
    return render_template("Simulink Modeling.html")

@app.route("/simulink/control")
def simulink_control():
    return render_template("control.html")

@app.route("/simulink/simscape")
def simulink_simscape():
    return render_template("simscape.html")

# --- Error Handlers ---

@app.errorhandler(404)
def page_not_found(e):
    return render_template("index.html"), 404

@app.errorhandler(500)
def internal_server_error(e):
    return "Internal Server Error", 500

if __name__ == "__main__":
    # In production, use a proper WSGI server like Waitress or Gunicorn
    app.run(debug=True, host="0.0.0.0", port=5000)
