// Activities list page JavaScript
document.addEventListener("DOMContentLoaded", async () => {
  await loadActivities();
  setupFilters();
});

let allActivities = {};

async function loadActivities() {
  try {
    const response = await fetch("/activities");
    allActivities = await response.json();
    displayActivities(allActivities);
  } catch (error) {
    console.error("Error loading activities:", error);
    document.getElementById("activities-grid").innerHTML =
      "<p>Failed to load activities. Please try again later.</p>";
  }
}

function displayActivities(activities) {
  const grid = document.getElementById("activities-grid");
  grid.innerHTML = "";

  const entries = Object.entries(activities);
  
  if (entries.length === 0) {
    grid.innerHTML = "<p>No activities found.</p>";
    return;
  }

  entries.forEach(([name, details]) => {
    const card = createActivityCard(name, details);
    grid.appendChild(card);
  });
}

function createActivityCard(name, details) {
  const spotsLeft = details.max_participants - details.participants.length;

  const card = document.createElement("a");
  card.href = `activity-detail.html?name=${encodeURIComponent(name)}`;
  card.className = "activity-card";

  card.innerHTML = `
    <div class="activity-card-header">
      <h3>${name}</h3>
      <span class="category-badge">${details.category || "General"}</span>
    </div>
    <p class="activity-description">${details.description}</p>
    <div class="activity-meta">
      <p><strong>📅</strong> ${details.schedule}</p>
      <p><strong>📍</strong> ${details.location || "TBD"}</p>
      <p><strong>👥</strong> ${spotsLeft} spots left</p>
    </div>
    <div class="activity-card-action">View Details & Sign Up →</div>
  `;

  return card;
}

function setupFilters() {
  const categoryFilter = document.getElementById("category-filter");
  
  categoryFilter.addEventListener("change", (e) => {
    const selectedCategory = e.target.value;
    
    if (selectedCategory === "all") {
      displayActivities(allActivities);
    } else {
      const filtered = Object.fromEntries(
        Object.entries(allActivities).filter(
          ([_, details]) => details.category === selectedCategory
        )
      );
      displayActivities(filtered);
    }
  });
}
