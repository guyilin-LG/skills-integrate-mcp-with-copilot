"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
import os
import json
from pathlib import Path

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

# Load activities at startup
activities = load_activities()


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/activities")
def get_activities():
    return load_activities()


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str = Query(...)):
    """Sign up a student for an activity"""
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
def unregister_from_activity(activity_name: str, email: str = Query(...)):
    """Unregister a student from an activity"""
    activities = load_activities()
    
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    activity = activities[activity_name]

    if email not in activity["participants"]:
        raise HTTPException(status_code=400, detail="Student is not signed up for this activity")

    activity["participants"].remove(email)
    save_activities(activities)
    
    return {"message": f"Successfully unregistered {email} from {activity_name}"}
