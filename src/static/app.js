document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const loginForm = document.getElementById("login-form");
  const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
  
  // Authentication state
  let currentTeacher = null;
  let authToken = null;

  // Check if user was previously logged in
  function checkAuthStatus() {
    const token = localStorage.getItem("authToken");
    const teacher = localStorage.getItem("currentTeacher");
    
    if (token && teacher) {
      authToken = token;
      currentTeacher = JSON.parse(teacher);
    }
    // Always update status and load activities, regardless of login status
    updateUserStatus();
  }

  // Update user status in header
  function updateUserStatus() {
    const userStatus = document.getElementById("user-status");
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const logoutDivider = document.getElementById("logout-divider");

    if (currentTeacher) {
      userStatus.textContent = currentTeacher.name;
      loginBtn.style.display = "none";
      logoutBtn.style.display = "block";
      logoutDivider.style.display = "block";
      fetchActivities();
    } else {
      userStatus.textContent = "Login";
      loginBtn.style.display = "block";
      logoutBtn.style.display = "none";
      logoutDivider.style.display = "none";
      fetchActivities();
    }
  }

  // Helper function to display messages
  function showMessage(text, className) {
    messageDiv.textContent = text;
    messageDiv.className = className;
    setTimeout(() => {
      if (messageDiv.classList.contains('success') || messageDiv.classList.contains('error')) {
        messageDiv.innerHTML = '';
      }
    }, 5000);
  }

  // Handle login
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
      const response = await fetch(
        `/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
        { method: "POST" }
      );

      if (response.ok) {
        const result = await response.json();
        authToken = result.access_token;
        currentTeacher = {
          name: result.teacher_name,
          email: result.email
        };

        // Store in localStorage
        localStorage.setItem("authToken", authToken);
        localStorage.setItem("currentTeacher", JSON.stringify(currentTeacher));

        document.getElementById("login-message").innerHTML = '';
        loginForm.reset();
        loginModal.hide();
        updateUserStatus();
        fetchActivities();
      } else {
        let errorMsg = "Login failed";
        try {
          const result = await response.json();
          errorMsg = result.detail || errorMsg;
        } catch (e) {
          // Response was not JSON
        }
        document.getElementById("login-message").textContent = errorMsg;
        document.getElementById("login-message").className = "alert alert-danger";
      }
    } catch (error) {
      document.getElementById("login-message").textContent = "Network error. Please try again.";
      document.getElementById("login-message").className = "alert alert-danger";
      console.error("Error logging in:", error);
    }
  });

  // Handle logout
  function logout() {
    authToken = null;
    currentTeacher = null;
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentTeacher");
    updateUserStatus();
  }

  document.getElementById("logout-btn").addEventListener("click", (event) => {
    event.preventDefault();
    logout();
  });

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "card activity-card mb-3";

        const spotsLeft = details.max_participants - details.participants.length;

        // Format instructors with their names
        const instructorsHTML = details.instructors
          ? details.instructors.map(email => 
              `<li><strong>${getTeacherName(email)}</strong><br><small class="text-muted">${email}</small></li>`
            ).join("")
          : "<li><em>No instructors assigned</em></li>";

        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section mt-3">
              <h6 class="mb-2">Participants (${details.participants.length}/${details.max_participants}):</h6>
              <ul class="list-unstyled small">
                ${details.participants
                  .map((email) => {
                    const deleteBtn = currentTeacher && details.instructors.includes(currentTeacher.email)
                      ? `<button class="btn btn-sm btn-danger delete-btn ms-2" data-activity="${name}" data-email="${email}"><i class="fas fa-trash-alt"></i></button>`
                      : '';
                    return `<li class="mb-1 d-flex justify-content-between align-items-center"><span>${email}</span>${deleteBtn}</li>`;
                  })
                  .join("")}
              </ul>
            </div>`
            : `<p class="text-muted small">No participants yet</p>`;

        activityCard.innerHTML = `
          <div class="card-body">
            <h5 class="card-title">${name}</h5>
            <p class="card-text">${details.description}</p>
            <div class="row g-2 mb-3">
              <div class="col-sm-6">
                <p class="mb-1"><strong>📅 Schedule:</strong></p>
                <p class="text-muted small">${details.schedule}</p>
              </div>
              <div class="col-sm-6">
                <p class="mb-1"><strong>📍 Location:</strong></p>
                <p class="text-muted small">${details.location || 'TBD'}</p>
              </div>
            </div>
            <div class="mb-3">
              <p class="mb-2"><strong>👨‍🏫 Instructors:</strong></p>
              <ul class="list-unstyled small">
                ${instructorsHTML}
              </ul>
            </div>
            <p class="mb-0"><strong>Available Spots:</strong> <span class="badge ${spotsLeft > 5 ? 'bg-success' : spotsLeft > 0 ? 'bg-warning' : 'bg-danger'}">${spotsLeft}/${details.max_participants}</span></p>
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Helper function to get teacher name (for display purposes)
  function getTeacherName(email) {
    // Since we don't have a list of all teachers on the frontend,
    // we'll just display the email as-is or extract the name part
    const namePart = email.split('@')[0].replace(/\./g, ' ');
    return namePart.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    if (!authToken) {
      showMessage("You must be logged in to unregister students", "error");
      return;
    }

    if (!confirm(`Are you sure you want to unregister ${email} from ${activity}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${authToken}`
          }
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        fetchActivities();
      } else if (response.status === 401) {
        showMessage("Session expired. Please login again.", "error");
        logout();
        fetchActivities();
      } else if (response.status === 403) {
        showMessage("You are not authorized to unregister from this activity", "error");
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  checkAuthStatus();
});
