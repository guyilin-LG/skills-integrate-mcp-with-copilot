"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""

from fastapi import FastAPI, HTTPException, Query, Depends, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os
import json
from pathlib import Path
import hashlib
import hmac

# JWT configuration
SECRET_KEY = "mergington-high-school-secret-key-learning-project"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Password hashing configuration
PASSWORD_SALT = "mergington-high-school-salt-for-passwords"

def hash_password(password: str) -> str:
    """Hash password using HMAC-SHA256"""
    return hmac.new(
        PASSWORD_SALT.encode(),
        password.encode(),
        hashlib.sha256
    ).hexdigest()

def verify_password(stored_hash: str, provided_password: str) -> bool:
    """Verify password against stored hash"""
    return stored_hash == hash_password(provided_password)

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

# Load activities from JSON file
def load_activities():
    """Load activities from activities.json file"""
    activities_file = os.path.join(current_dir, "activities.json")
    with open(activities_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_activities(activities_data):
    """Save activities to activities.json file"""
    activities_file = os.path.join(current_dir, "activities.json")
    with open(activities_file, 'w', encoding='utf-8') as f:
        json.dump(activities_data, f, indent=2, ensure_ascii=False)

# Load teachers from JSON file
def load_teachers():
    """Load teachers from teachers.json file"""
    teachers_file = os.path.join(current_dir, "teachers.json")
    with open(teachers_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return {teacher["email"]: teacher for teacher in data["teachers"]}

# Helper functions for JWT
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_teacher(authorization: Optional[str] = Header(None)) -> str:
    """Verify token and return teacher email"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    # Extract token from "Bearer <token>" format
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    token = parts[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Load activities at startup
activities = load_activities()


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.post("/login")
def login(email: str = Query(...), password: str = Query(...)):
    """Teacher login endpoint"""
    teachers = load_teachers()
    
    if email not in teachers:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    teacher = teachers[email]
    if not verify_password(teacher["password"], password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": email, "name": teacher["name"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "teacher_name": teacher["name"],
        "email": email
    }


@app.get("/verify-token")
def verify_token(teacher_email: str = Depends(get_current_teacher)):
    """Verify if token is valid"""
    teachers = load_teachers()
    teacher = teachers[teacher_email]
    return {
        "valid": True,
        "email": teacher_email,
        "teacher_name": teacher["name"]
    }


@app.get("/activities")
def get_activities():
    return load_activities()


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str = Query(...)):
    """Sign up a student for an activity (no authentication required)"""
    activities = load_activities()
    
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    activity = activities[activity_name]

    if email in activity["participants"]:
        raise HTTPException(status_code=400, detail="Student is already signed up")

    activity["participants"].append(email)
    save_activities(activities)
    
    return {"message": f"Successfully signed up {email} for {activity_name}"}


@app.delete("/activities/{activity_name}/unregister")
def unregister_from_activity(activity_name: str, email: str = Query(...), 
                            teacher_email: str = Depends(get_current_teacher)):
    """Unregister a student from an activity (teacher only)"""
    activities = load_activities()
    
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    activity = activities[activity_name]
    
    # Check if teacher is an instructor for this activity
    if teacher_email not in activity.get("instructors", []):
        raise HTTPException(status_code=403, 
                          detail="Only activity instructors can unregister students")

    if email not in activity["participants"]:
        raise HTTPException(status_code=400, detail="Student is not signed up for this activity")

    activity["participants"].remove(email)
    save_activities(activities)
    
    return {"message": f"Successfully unregistered {email} from {activity_name}"}
