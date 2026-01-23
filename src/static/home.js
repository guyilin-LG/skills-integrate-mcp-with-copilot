// Home page JavaScript
document.addEventListener("DOMContentLoaded", async () => {
  await loadFeaturedActivities();
});

async function loadFeaturedActivities() {
  try {
    const response = await fetch("/activities");
    const activities = await response.json();

    const featuredGrid = document.getElementById("featured-activities-grid");
    featuredGrid.innerHTML = "";

    // Filter featured activities
    const featured = Object.entries(activities).filter(
      ([_, details]) => details.featured === true
    );

    if (featured.length === 0) {
      featuredGrid.innerHTML = "<p>No featured activities at this time.</p>";
      return;
    }

    featured.forEach(([name, details]) => {
      const card = createActivityCard(name, details);
      featuredGrid.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading featured activities:", error);
    document.getElementById("featured-activities-grid").innerHTML =
      "<p>Failed to load activities. Please try again later.</p>";
  }
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
      <p><strong>👥</strong> ${spotsLeft} spots left</p>
    </div>
    <div class="activity-card-action">View Details →</div>
  `;

  return card;
}

async function loadStats() {
  try {
    const response = await fetch("/activities");
    const activities = await response.json();

    // Count total activities
    const totalActivities = Object.keys(activities).length;
    document.getElementById("total-activities").textContent = `${totalActivities}+`;

    // Count total participants
    const totalParticipants = Object.values(activities).reduce(
      (sum, activity) => sum + activity.participants.length,
      0
    );
    document.getElementById("total-participants").textContent = `${totalParticipants}+`;
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}
