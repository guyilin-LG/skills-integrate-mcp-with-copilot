document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const loginForm = document.getElementById("login-form");
  const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
  
  // 过滤控件
  const searchInput = document.getElementById("search-input");
  const dayFilter = document.getElementById("day-filter");
  const categoryFilter = document.getElementById("category-filter");
  const sortSelect = document.getElementById("sort-select");
  
  // Authentication state
  let currentTeacher = null;
  let authToken = null;
  let activitiesData = {}; // 缓存活动数据

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
      // 如果有缓存数据，重新渲染所有卡片（显示删除按钮）
      if (Object.keys(activitiesData).length > 0) {
        Object.entries(activitiesData).forEach(([name, details]) => {
          updateActivityCard(name);
        });
      } else {
        fetchActivities();
      }
    } else {
      userStatus.textContent = "Login";
      loginBtn.style.display = "block";
      logoutBtn.style.display = "none";
      logoutDivider.style.display = "none";
      // 如果有缓存数据，重新渲染所有卡片（隐藏删除按钮）
      if (Object.keys(activitiesData).length > 0) {
        Object.entries(activitiesData).forEach(([name, details]) => {
          updateActivityCard(name);
        });
      } else {
        fetchActivities();
      }
    }
  }

  // Helper function to display messages on activity card
  function showActivityMessage(activityName, text, className) {
    const card = activitiesList.querySelector(`[data-activity-name="${activityName}"]`);
    if (!card) return;
    
    const messageDiv = card.querySelector(".activity-message");
    messageDiv.textContent = text;
    messageDiv.className = `activity-message mt-3 ${className}`;
    messageDiv.style.display = "block";
    
    // Clear message after 5 seconds
    if (messageDiv.clearTimeout) clearTimeout(messageDiv.clearTimeout);
    messageDiv.clearTimeout = setTimeout(() => {
      messageDiv.style.display = "none";
      messageDiv.className = "activity-message mt-3"; // 完全清除className中的success/error/alert
      messageDiv.textContent = '';
    }, 5000);
  }

  // Helper function to display messages
  function showMessage(text, className) {
    messageDiv.textContent = text;
    messageDiv.className = className;
    
    // Clear message after 5 seconds
    if (messageDiv.clearTimeout) clearTimeout(messageDiv.clearTimeout);
    messageDiv.clearTimeout = setTimeout(() => {
      messageDiv.className = ''; // 完全清除className
      messageDiv.innerHTML = '';
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

  // Function to render a single activity card
  function renderActivityCard(name, details) {
    const activityCard = document.createElement("div");
    activityCard.className = "card activity-card mb-3";
    activityCard.dataset.activityName = name; // 添加标识符

    const spotsLeft = details.max_participants - details.participants.length;

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
        <div class="activity-message mt-3" style="display: none;"></div>
      </div>
    `;

    // 绑定删除按钮事件
    activityCard.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });

    return activityCard;
  }

  // Function to update a single activity card (no HTTP request!)
  function updateActivityCard(activityName) {
    const details = activitiesData[activityName];
    if (!details) return;

    // 找到现有的卡片
    const existingCard = activitiesList.querySelector(`[data-activity-name="${activityName}"]`);
    if (!existingCard) return;

    // 创建新卡片并替换
    const newCard = renderActivityCard(activityName, details);
    existingCard.replaceWith(newCard);
  }

  // Function to fetch and update a single activity
  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      activitiesData = await response.json(); // 缓存数据

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(activitiesData).forEach(([name, details]) => {
        // 使用新的渲染函数
        const activityCard = renderActivityCard(name, details);
        activitiesList.appendChild(activityCard);

        // 添加到下拉列表
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
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
        // 直接在前端更新数据（无需HTTP请求）
        if (activitiesData[activity]) {
          activitiesData[activity].participants = 
            activitiesData[activity].participants.filter(p => p !== email);
          updateActivityCard(activity);
          // 在活动卡片下显示成功消息
          showActivityMessage(activity, result.message, "alert alert-success");
        }
      } else if (response.status === 401) {
        showActivityMessage(activity, "Session expired. Please login again.", "alert alert-danger");
        logout();
        // 会话过期后重新获取数据
        await fetchActivities();
      } else if (response.status === 403) {
        showActivityMessage(activity, "You are not authorized to unregister from this activity", "alert alert-danger");
      } else {
        showActivityMessage(activity, result.detail || "An error occurred", "alert alert-danger");
      }
    } catch (error) {
      showActivityMessage(activity, "Failed to unregister. Please try again.", "alert alert-danger");
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
        // 直接在前端更新数据（无需HTTP请求）
        if (activitiesData[activity]) {
          activitiesData[activity].participants.push(email);
          updateActivityCard(activity);
        }
        signupForm.reset();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // 获取活动类别
  function getActivityCategory(name) {
    const sportsKeywords = ['soccer', 'basketball', 'gym'];
    const academicKeywords = ['programming', 'math', 'chess'];
    const artsKeywords = ['art', 'drama'];
    
    const nameLower = name.toLowerCase();
    
    if (sportsKeywords.some(keyword => nameLower.includes(keyword))) return 'sports';
    if (academicKeywords.some(keyword => nameLower.includes(keyword))) return 'academic';
    if (artsKeywords.some(keyword => nameLower.includes(keyword))) return 'arts';
    return 'other';
  }

  // 过滤和排序函数
  function applyFiltersAndSort() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedDay = dayFilter.value;
    const selectedCategory = categoryFilter.value;
    const sortBy = sortSelect.value;

    // 过滤活动
    let filtered = Object.entries(activitiesData).filter(([name, details]) => {
      // 搜索过滤
      const matchesSearch = name.toLowerCase().includes(searchTerm) || 
                           details.description.toLowerCase().includes(searchTerm);
      
      // 星期几过滤
      const matchesDay = !selectedDay || details.schedule.includes(selectedDay);
      
      // 类别过滤
      const matchesCategory = !selectedCategory || getActivityCategory(name) === selectedCategory;
      
      return matchesSearch && matchesDay && matchesCategory;
    });

    // 排序
    if (sortBy === "name") {
      filtered.sort((a, b) => a[0].localeCompare(b[0]));
    } else if (sortBy === "schedule") {
      filtered.sort((a, b) => extractTimeValue(a[1].schedule) - extractTimeValue(b[1].schedule));
    }

    // 更新显示
    document.querySelectorAll(".activity-card").forEach(card => {
      card.style.display = "none";
    });

    filtered.forEach(([name, details]) => {
      const card = activitiesList.querySelector(`[data-activity-name="${name}"]`);
      if (card) {
        card.style.display = "block";
      }
    });

    // 无结果提示
    const visibleCards = Array.from(document.querySelectorAll(".activity-card")).filter(card => card.style.display !== "none");
    if (visibleCards.length === 0) {
      if (!activitiesList.querySelector(".no-results")) {
        const noResults = document.createElement("div");
        noResults.className = "no-results alert alert-info";
        noResults.innerHTML = '<i class="fas fa-info-circle"></i> No activities match your filters.';
        activitiesList.appendChild(noResults);
      }
    } else {
      const noResults = activitiesList.querySelector(".no-results");
      if (noResults) noResults.remove();
    }
  }

  // 从schedule中提取时间（分钟数）
  function extractTimeValue(schedule) {
    const match = schedule.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const period = match[3] ? match[3].toUpperCase() : '';
      
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return hours * 60 + minutes;
    }
    return 0;
  }

  // 事件监听
  searchInput.addEventListener("input", applyFiltersAndSort);
  dayFilter.addEventListener("change", applyFiltersAndSort);
  categoryFilter.addEventListener("change", applyFiltersAndSort);
  sortSelect.addEventListener("change", applyFiltersAndSort);

  // Initialize app
  checkAuthStatus();
});
