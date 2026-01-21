// Activity detail page JavaScript
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const activityName = urlParams.get("name");

  if (!activityName) {
    window.location.href = "activities.html";
    return;
  }

  await loadActivityDetail(activityName);
  setupSignupForm(activityName);
});

async function loadActivityDetail(activityName) {
  try {
    const response = await fetch("/activities");
    const activities = await response.json();

    if (!activities[activityName]) {
      alert("Activity not found");
      window.location.href = "activities.html";
      return;
    }

    const activity = activities[activityName];
    displayActivityDetail(activityName, activity);
  } catch (error) {
    console.error("Error loading activity details:", error);
    alert("Failed to load activity details");
  }
}

function displayActivityDetail(name, details) {
  // Update page title
  document.getElementById("page-title").textContent = `${name} - Mergington High School`;
  document.getElementById("activity-title").textContent = name;
  document.getElementById("activity-breadcrumb").textContent = name;

  // Update category
  const categoryBadge = document.getElementById("activity-category");
  categoryBadge.textContent = details.category || "General";
  categoryBadge.className = "activity-category-badge";

  // Update description
  document.getElementById("activity-full-description").textContent =
    details.full_description || details.description;

  // Update details
  document.getElementById("activity-schedule").textContent = details.schedule;
  document.getElementById("activity-location").textContent = details.location || "TBD";
  document.getElementById("activity-instructor").textContent = details.instructor || "TBD";

  // Update availability
  const spotsLeft = details.max_participants - details.participants.length;
  const availabilityElement = document.getElementById("activity-availability");
  availabilityElement.textContent = `${spotsLeft} spots available (${details.participants.length}/${details.max_participants})`;

  if (spotsLeft === 0) {
    availabilityElement.style.color = "#c62828";
    availabilityElement.textContent += " - FULL";
    document.querySelector("#signup-form button").disabled = true;
    document.querySelector("#signup-form button").textContent = "Activity Full";
  }

  // Update tags
  const tagsContainer = document.getElementById("activity-tags");
  if (details.tags && details.tags.length > 0) {
    tagsContainer.innerHTML = details.tags
      .map((tag) => `<span class="tag">${tag}</span>`)
      .join("");
  } else {
    tagsContainer.innerHTML = "<p>No tags available</p>";
  }

  // Update participants list
  displayParticipants(details.participants, name);
}

function displayParticipants(participants, activityName) {
  const participantsList = document.getElementById("participants-list");

  if (participants.length === 0) {
    participantsList.innerHTML = "<p><em>No participants yet. Be the first to join!</em></p>";
    return;
  }

  participantsList.innerHTML = `
    <ul class="participants-ul">
      ${participants
        .map(
          (email) => `
        <li class="participant-item">
          <span class="participant-email">${email}</span>
          <button class="delete-btn" data-activity="${activityName}" data-email="${email}">
            ❌
          </button>
        </li>
      `
        )
        .join("")}
    </ul>
  `;

  // Add event listeners to delete buttons
  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", handleUnregister);
  });
}

function setupSignupForm(activityName) {
  const form = document.getElementById("signup-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const messageDiv = document.getElementById("message");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        form.reset();

        // Refresh activity details
        await loadActivityDetail(activityName);
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });
}

async function handleUnregister(event) {
  const button = event.target;
  const activity = button.getAttribute("data-activity");
  const email = button.getAttribute("data-email");

  if (!confirm(`Remove ${email} from ${activity}?`)) {
    return;
  }

  try {
    const response = await fetch(
      `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();

    if (response.ok) {
      // Refresh activity details
      await loadActivityDetail(activity);
      
      const messageDiv = document.getElementById("message");
      messageDiv.textContent = result.message;
      messageDiv.className = "message success";
      messageDiv.classList.remove("hidden");

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } else {
      alert(result.detail || "Failed to unregister");
    }
  } catch (error) {
    alert("Failed to unregister. Please try again.");
    console.error("Error unregistering:", error);
  }
}
