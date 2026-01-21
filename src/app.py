"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""

from fastapi import FastAPI, HTTPException
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
    """Redirect to the new multi-page homepage"""
    return RedirectResponse(url="/static/home.html")


@app.get("/activities")
def get_activities():
    """Get all activities data"""
    # Reload activities to get latest data
    activities = load_activities()
    return activities


@app.get("/lectures")
def get_lectures():
    """Get all lectures data"""
    lectures_file = os.path.join(current_dir, "lectures.json")
    with open(lectures_file, 'r', encoding='utf-8') as f:
        return json.load(f)


@app.get("/gallery")
def get_gallery():
    """Get all gallery items"""
    gallery_file = os.path.join(current_dir, "gallery.json")
    with open(gallery_file, 'r', encoding='utf-8') as f:
        return json.load(f)


@app.get("/testimonials")
def get_testimonials():
    """Get all testimonials"""
    testimonials_file = os.path.join(current_dir, "testimonials.json")
    with open(testimonials_file, 'r', encoding='utf-8') as f:
        return json.load(f)


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str):
    """Sign up a student for an activity"""
    # Reload activities to get latest data
    activities = load_activities()
    
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Validate student is not already signed up
    if email in activity["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is already signed up"
        )

    # Add student
    activity["participants"].append(email)
    
    # Save updated activities
    save_activities(activities)
    
    return {"message": f"Signed up {email} for {activity_name}"}


@app.delete("/activities/{activity_name}/unregister")
def unregister_from_activity(activity_name: str, email: str):
    """Unregister a student from an activity"""
    # Reload activities to get latest data
    activities = load_activities()
    
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Validate student is signed up
    if email not in activity["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is not signed up for this activity"
        )

    # Remove student
    activity["participants"].remove(email)
    
    # Save updated activities
    save_activities(activities)
    
    return {"message": f"Unregistered {email} from {activity_name}"}
