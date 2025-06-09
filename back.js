// Student Academic Companion - Complete JavaScript

// ===== GLOBAL STATE MANAGEMENT =====
const AppState = {
  notes: [],
  tasks: [],
  sessions: [],
  timer: {
    isRunning: false,
    isPaused: false,
    timeLeft: 25 * 60, // 25 minutes in seconds
    totalTime: 25 * 60,
    type: 'work'
  },
  settings: {
    soundEnabled: true,
    darkMode: false,
    autoRotateTips: true,
    notifications: true
  },
  charts: {
    progressChart: null,
    pieChart: null
  }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  loadData();
  setupEventListeners();
  initializeCharts();
  updateDashboard();
  loadStudyTip();
  startTipRotation();
  
  // Show welcome animation
  setTimeout(() => {
    document.querySelectorAll('.fade-in').forEach((el, index) => {
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }, 100);
  
  showNotification('Welcome back! Ready to be productive?', 'success');
}

// ===== DATA PERSISTENCE =====
function saveData() {
  const data = {
    notes: AppState.notes,
    tasks: AppState.tasks,
    sessions: AppState.sessions,
    settings: AppState.settings
  };
  
  // Using memory storage as localStorage is not supported
  window.appData = data;
}

function loadData() {
  if (window.appData) {
    const data = window.appData;
    AppState.notes = data.notes || [];
    AppState.tasks = data.tasks || [];
    AppState.sessions = data.sessions || [];
    AppState.settings = { ...AppState.settings, ...data.settings };
  }
  
  // Apply saved settings
  if (AppState.settings.darkMode) {
    document.body.setAttribute('data-theme', 'dark');
  }
  
  updateSoundToggle();
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
  
  // Form submissions
  document.getElementById('taskInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addTask();
    }
  });
  
  document.getElementById('tagInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      uploadNotes();
    }
  });
  
  document.getElementById('searchTag').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      searchNotes();
    }
  });
  
  // Custom timer input
  document.getElementById('customMinutes').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      setCustomTimer();
    }
  });
  
  // Modal close events
  document.addEventListener('click', function(e) {
    if (e.target.id === 'confirmModal') {
      hideModal();
    }
  });
  
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      hideModal();
      hideSearchResults();
    }
  });
}

function handleKeyboardShortcuts(e) {
  if (e.altKey) {
    switch(e.key) {
      case 'p':
        e.preventDefault();
        togglePomodoro();
        break;
      case 't':
        e.preventDefault();
        document.getElementById('taskInput').focus();
        break;
      case 's':
        e.preventDefault();
        document.getElementById('searchTag').focus();
        break;
      case 'd':
        e.preventDefault();
        toggleDarkMode();
        break;
      case 'r':
        e.preventDefault();
        resetPomodoro();
        break;
      case 'h':
        e.preventDefault();
        showNotification('Keyboard shortcuts are active!', 'info');
        break;
    }
  }
}

// ===== NOTES MANAGEMENT =====
function uploadNotes() {
  const tagInput = document.getElementById('tagInput');
  const fileInput = document.getElementById('noteFiles');
  const statusDiv = document.getElementById('uploadStatus');
  
  const tag = tagInput.value.trim();
  const files = fileInput.files;
  
  if (!tag) {
    showStatus('Please enter a tag for your notes.', 'error', statusDiv);
    return;
  }
  
  if (files.length === 0) {
    showStatus('Please select files to upload.', 'error', statusDiv);
    return;
  }
  
  showLoading();
  
  // Simulate file processing
  setTimeout(() => {
    Array.from(files).forEach(file => {
      const note = {
        id: generateId(),
        tag: tag,
        filename: file.name,
        size: formatFileSize(file.size),
        type: file.type,
        uploadDate: new Date().toISOString(),
        content: `Content of ${file.name}` // In real app, would read file content
      };
      
      AppState.notes.push(note);
    });
    
    saveData();
    updateDashboard();
    hideLoading();
    showStatus(`Successfully uploaded ${files.length} file(s) with tag "${tag}"`, 'success', statusDiv);
    showNotification(`${files.length} notes uploaded successfully!`, 'success');
    
    // Clear inputs
    tagInput.value = '';
    fileInput.value = '';
    
    // Update preview
    displayNotesPreview();
    
  }, 1500);
}

function viewNotes() {
  const previewDiv = document.getElementById('notesPreview');
  
  if (AppState.notes.length === 0) {
    previewDiv.innerHTML = `
      <div class="text-center text-muted p-4">
        <div style="font-size: 48px; margin-bottom: 10px;">📄</div>
        <div>No notes uploaded yet</div>
        <small>Upload your first note above to get started!</small>
      </div>
    `;
    return;
  }
  
  displayNotesPreview();
}

function displayNotesPreview() {
  const previewDiv = document.getElementById('notesPreview');
  
  const notesHtml = AppState.notes.map(note => `
    <div class="note-preview slide-in-right" data-note-id="${note.id}">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <div>
          <span class="note-tag">${note.tag}</span>
          <div class="note-filename">${note.filename}</div>
          <div class="note-size">${note.size} • ${formatDate(note.uploadDate)}</div>
        </div>
        <div>
          <button class="btn btn-outline-primary btn-sm me-1" onclick="downloadNote('${note.id}')">
            📥 Download
          </button>
          <button class="btn btn-outline-danger btn-sm" onclick="deleteNote('${note.id}')">
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  `).join('');
  
  previewDiv.innerHTML = notesHtml;
}

function searchNotes() {
  const searchTerm = document.getElementById('searchTag').value.trim().toLowerCase();
  const resultsDiv = document.getElementById('searchResults');
  
  if (!searchTerm) {
    hideSearchResults();
    return;
  }
  
  const filteredNotes = AppState.notes.filter(note => 
    note.tag.toLowerCase().includes(searchTerm) || 
    note.filename.toLowerCase().includes(searchTerm)
  );
  
  if (filteredNotes.length === 0) {
    resultsDiv.innerHTML = '<div class="search-result-item">No notes found</div>';
  } else {
    resultsDiv.innerHTML = filteredNotes.map(note => `
      <div class="search-result-item" onclick="selectNote('${note.id}')">
        <div><strong>${note.tag}</strong> - ${note.filename}</div>
        <small>${formatDate(note.uploadDate)}</small>
      </div>
    `).join('');
  }
  
  resultsDiv.classList.add('show');
}

function hideSearchResults() {
  document.getElementById('searchResults').classList.remove('show');
}

function selectNote(noteId) {
  const note = AppState.notes.find(n => n.id === noteId);
  if (note) {
    showNotification(`Selected: ${note.filename}`, 'info');
    hideSearchResults();
  }
}

function downloadNote(noteId) {
  const note = AppState.notes.find(n => n.id === noteId);
  if (note) {
    // Simulate download
    showNotification(`Downloading ${note.filename}...`, 'info');
    setTimeout(() => {
      showNotification(`${note.filename} downloaded successfully!`, 'success');
    }, 1000);
  }
}

function deleteNote(noteId) {
  const note = AppState.notes.find(n => n.id === noteId);
  if (note) {
    showConfirmModal(
      'Delete Note',
      `Are you sure you want to delete "${note.filename}"?`,
      () => {
        AppState.notes = AppState.notes.filter(n => n.id !== noteId);
        saveData();
        updateDashboard();
        displayNotesPreview();
        showNotification('Note deleted successfully!', 'success');
      }
    );
  }
}

// ===== TASK MANAGEMENT =====
function addTask() {
  const taskInput = document.getElementById('taskInput');
  const taskDue = document.getElementById('taskDue');
  const taskPriority = document.getElementById('taskPriority');
  const statusDiv = document.getElementById('taskStatus');
  
  const taskText = taskInput.value.trim();
  
  if (!taskText) {
    showStatus('Please enter a task description.', 'error', statusDiv);
    return;
  }
  
  const task = {
    id: generateId(),
    text: taskText,
    completed: false,
    priority: taskPriority.value,
    dueDate: taskDue.value || null,
    createdDate: new Date().toISOString()
  };
  
  AppState.tasks.push(task);
  saveData();
  updateDashboard();
  displayTasks();
  
  // Clear inputs
  taskInput.value = '';
  taskDue.value = '';
  taskPriority.value = 'low';
  
  showStatus('Task added successfully!', 'success', statusDiv);
  showNotification('New task added!', 'success');
  
  // Add to session history
  addToSessionHistory('Task Added', taskText);
}

function displayTasks() {
  const taskList = document.getElementById('taskList');
  
  if (AppState.tasks.length === 0) {
    taskList.innerHTML = `
      <div class="text-center text-muted p-4">
        <div style="font-size: 48px; margin-bottom: 10px;">📝</div>
        <div>No tasks yet. Add your first task above!</div>
      </div>
    `;
    return;
  }
  
  // Sort tasks by priority and due date
  const sortedTasks = [...AppState.tasks].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    return 0;
  });
  
  const tasksHtml = sortedTasks.map(task => {
    const dueStatus = getDueStatus(task.dueDate);
    return `
      <div class="task-item task-priority-${task.priority} ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
        <div class="d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center flex-grow-1">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                   onchange="toggleTask('${task.id}')">
            <div class="flex-grow-1">
              <div class="task-text">${task.text}</div>
              ${task.dueDate ? `<div class="task-due-date ${dueStatus.class}">📅 ${formatDate(task.dueDate)}</div>` : ''}
            </div>
          </div>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary btn-sm" onclick="editTask('${task.id}')" title="Edit">
              ✏️
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="deleteTask('${task.id}')" title="Delete">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  taskList.innerHTML = tasksHtml;
}

function toggleTask(taskId) {
  const task = AppState.tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    task.completedDate = task.completed ? new Date().toISOString() : null;
    
    saveData();
    updateDashboard();
    displayTasks();
    
    if (task.completed) {
      showNotification('Task completed! 🎉', 'success');
      addToSessionHistory('Task Completed', task.text);
      
      // Add celebration animation
      const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
      if (taskElement) {
        taskElement.classList.add('bounce-animation');
      }
    }
  }
}

function editTask(taskId) {
  const task = AppState.tasks.find(t => t.id === taskId);
  if (task) {
    const newText = prompt('Edit task:', task.text);
    if (newText && newText.trim()) {
      task.text = newText.trim();
      saveData();
      displayTasks();
      showNotification('Task updated!', 'success');
    }
  }
}

function deleteTask(taskId) {
  const task = AppState.tasks.find(t => t.id === taskId);
  if (task) {
    showConfirmModal(
      'Delete Task',
      `Are you sure you want to delete "${task.text}"?`,
      () => {
        AppState.tasks = AppState.tasks.filter(t => t.id !== taskId);
        saveData();
        updateDashboard();
        displayTasks();
        showNotification('Task deleted!', 'success');
      }
    );
  }
}

function clearCompletedTasks() {
  const completedCount = AppState.tasks.filter(t => t.completed).length;
  
  if (completedCount === 0) {
    showNotification('No completed tasks to clear.', 'warning');
    return;
  }
  
  showConfirmModal(
    'Clear Completed Tasks',
    `Are you sure you want to delete ${completedCount} completed task(s)?`,
    () => {
      AppState.tasks = AppState.tasks.filter(t => !t.completed);
      saveData();
      updateDashboard();
      displayTasks();
      showNotification(`${completedCount} completed tasks cleared!`, 'success');
    }
  );
}

function clearAllTasks() {
  if (AppState.tasks.length === 0) {
    showNotification('No tasks to clear.', 'warning');
    return;
  }
  
  showConfirmModal(
    'Clear All Tasks',
    `Are you sure you want to delete all ${AppState.tasks.length} task(s)?`,
    () => {
      AppState.tasks = [];
      saveData();
      updateDashboard();
      displayTasks();
      showNotification('All tasks cleared!', 'success');
    }
  );
}

function getDueStatus(dueDate) {
  if (!dueDate) return { class: '', text: '' };
  
  const due = new Date(dueDate);
  const today = new Date();
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { class: 'overdue', text: 'Overdue' };
  } else if (diffDays <= 1) {
    return { class: 'due-soon', text: 'Due Soon' };
  }
  return { class: '', text: '' };
}

// ===== POMODORO TIMER =====
let timerInterval = null;

function togglePomodoro() {
  const btn = document.getElementById('pomodoroBtn');
  
  if (AppState.timer.isRunning) {
    pausePomodoro();
  } else {
    startPomodoro();
  }
}

function startPomodoro() {
  AppState.timer.isRunning = true;
  AppState.timer.isPaused = false;
  
  const btn = document.getElementById('pomodoroBtn');
  btn.innerHTML = '⏸️ Pause';
  btn.className = 'btn btn-warning';
  
  updatePomodoroStatus('Focus time! Stay concentrated and avoid distractions.');
  
  timerInterval = setInterval(() => {
    AppState.timer.timeLeft--;
    updateTimerDisplay();
    updateProgressRing();
    
    if (AppState.timer.timeLeft <= 0) {
      completePomodoro();
    }
  }, 1000);
  
  addToSessionHistory('Pomodoro Started', `${Math.floor(AppState.timer.totalTime / 60)} minutes`);
}

function pausePomodoro() {
  AppState.timer.isRunning = false;
  AppState.timer.isPaused = true;
  
  clearInterval(timerInterval);
  
  const btn = document.getElementById('pomodoroBtn');
  btn.innerHTML = '▶️ Resume';
  btn.className = 'btn btn-success';
  
  updatePomodoroStatus('Timer paused. Click Resume when ready to continue.');
}

function resetPomodoro() {
  AppState.timer.isRunning = false;
  AppState.timer.isPaused = false;
  AppState.timer.timeLeft = AppState.timer.totalTime;
  
  clearInterval(timerInterval);
  
  const btn = document.getElementById('pomodoroBtn');
  btn.innerHTML = '▶️ Start';
  btn.className = 'btn btn-success';
  
  updateTimerDisplay();
  updateProgressRing();
  updatePomodoroStatus('Ready to focus! Click Start to begin.');
}

function completePomodoro() {
  clearInterval(timerInterval);
  
  AppState.timer.isRunning = false;
  AppState.timer.isPaused = false;
  
  // Update counters
  AppState.sessions.push({
    id: generateId(),
    type: 'pomodoro',
    duration: Math.floor(AppState.timer.totalTime / 60),
    completedAt: new Date().toISOString(),
    description: `${Math.floor(AppState.timer.totalTime / 60)}-minute focus session`
  });
  
  saveData();
  updateDashboard();
  displaySessionHistory();
  
  // Play completion sound
  playSound('complete');
  
  // Show completion notification
  showNotification('🎉 Pomodoro completed! Great job!', 'success');
  updatePomodoroStatus('Session completed! Take a well-deserved break.');
  
  // Reset for next session
  resetPomodoro();
  
  // Add celebration effect
  const timerCard = document.querySelector('.pomodoro-card');
  if (timerCard) {
    timerCard.classList.add('pulse-animation');
    setTimeout(() => {
      timerCard.classList.remove('pulse-animation');
    }, 2000);
  }
  
  addToSessionHistory('Pomodoro Completed', `${Math.floor(AppState.timer.totalTime / 60)} minutes`);
}

function skipTimer() {
  if (AppState.timer.isRunning || AppState.timer.isPaused) {
    showConfirmModal(
      'Skip Timer',
      'Are you sure you want to skip the current session?',
      () => {
        completePomodoro();
        showNotification('Timer skipped!', 'warning');
      }
    );
  }
}

function setTimer(minutes) {
  if (AppState.timer.isRunning) {
    showNotification('Stop the current timer before setting a new one.', 'warning');
    return;
  }
  
  AppState.timer.timeLeft = minutes * 60;
  AppState.timer.totalTime = minutes * 60;
  
  updateTimerDisplay();
  updateProgressRing();
  updatePomodoroStatus(`Timer set to ${minutes} minutes. Ready to start!`);
  
  showNotification(`Timer set to ${minutes} minutes`, 'info');
}

function setCustomTimer() {
  const customMinutes = parseInt(document.getElementById('customMinutes').value);
  
  if (!customMinutes || customMinutes < 1 || customMinutes > 120) {
    showNotification('Please enter a valid time between 1-120 minutes.', 'error');
    return;
  }
  
  setTimer(customMinutes);
  document.getElementById('customMinutes').value = '';
}

function updateTimerDisplay() {
  const display = document.getElementById('timerDisplay');
  const minutes = Math.floor(AppState.timer.timeLeft / 60);
  const seconds = AppState.timer.timeLeft % 60;
  
  display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // Update page title
  if (AppState.timer.isRunning) {
    document.title = `${display.textContent} - Student Academic Companion`;
  } else {
    document.title = 'Student Academic Companion';
  }
}

function updateProgressRing() {
  const circle = document.getElementById('progressCircle');
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  
  const progress = (AppState.timer.totalTime - AppState.timer.timeLeft) / AppState.timer.totalTime;
  const offset = circumference - (progress * circumference);
  
  circle.style.strokeDashoffset = offset;
}

function updatePomodoroStatus(message) {
  document.getElementById('pomodoroStatus').textContent = message;
}

// ===== DASHBOARD UPDATES =====
function updateDashboard() {
  // Update counters
  document.getElementById('notesCount').textContent = AppState.notes.length;
  document.getElementById('tasksCount').textContent = AppState.tasks.length;
  document.getElementById('pomodoroCount').textContent = 
    AppState.sessions.filter(s => s.type === 'pomodoro').length;
  
  const totalFocusTime = AppState.sessions
    .filter(s => s.type === 'pomodoro')
    .reduce((total, session) => total + session.duration, 0);
  document.getElementById('focusTimeCount').textContent = totalFocusTime;
  
  // Update task display
  displayTasks();
  
  // Update session history
  displaySessionHistory();
  
  // Update charts
  updateCharts();
}

// ===== SESSION HISTORY =====
function addToSessionHistory(type, description) {
  AppState.sessions.push({
    id: generateId(),
    type: type.toLowerCase().replace(' ', '_'),
    description: description,
    timestamp: new Date().toISOString()
  });
  
  // Keep only last 50 sessions
  if (AppState.sessions.length > 50) {
    AppState.sessions = AppState.sessions.slice(-50);
  }
  
  saveData();
  displaySessionHistory();
}

function displaySessionHistory() {
  const historyDiv = document.getElementById('sessionHistory');
  
  if (AppState.sessions.length === 0) {
    historyDiv.innerHTML = `
      <div class="text-center text-muted p-4">
        <div style="font-size: 48px; margin-bottom: 10px;">📋</div>
        <div>No recent activity</div>
        <small>Complete tasks or pomodoro sessions to see your progress</small>
      </div>
    `;
    return;
  }
  
  const recentSessions = AppState.sessions.slice(-10).reverse();
  
  const historyHtml = recentSessions.map(session => `
    <div class="session-item">
      <div>
        <div class="session-type">${formatSessionType(session.type)}</div>
        <div style="font-size: 0.9rem; color: var(--text-secondary);">${session.description}</div>
      </div>
      <div class="session-time">${formatTime(session.timestamp)}</div>
    </div>
  `).join('');
  
  historyDiv.innerHTML = historyHtml;
}

function formatSessionType(type) {
  const types = {
    'pomodoro_started': '🚀 Pomodoro Started',
    'pomodoro_completed': '✅ Pomodoro Completed',
    'task_added': '📝 Task Added',
    'task_completed': '✅ Task Completed'
  };
  return types[type] || type;
}

// ===== CHARTS =====
function initializeCharts() {
  initializeProgressChart();
  initializePieChart();
}

function initializeProgressChart() {
  const ctx = document.getElementById('progressChart').getContext('2d');
  
  AppState.charts.progressChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Focus Time (minutes)',
        data: [],
        borderColor: '#4A90E2',
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
        tension: 0.4,
        fill: true
      }, {
        label: 'Tasks Completed',
        data: [],
        borderColor: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Weekly Progress'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function initializePieChart() {
  const ctx = document.getElementById('pieChart').getContext('2d');
  
  AppState.charts.pieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Focus Time', 'Break Time', 'Task Time'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: [
          '#4A90E2',
          '#ffc107',
          '#28a745'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
        },
        title: {
          display: true,
          text: 'Activity Distribution'
        }
      }
    }
  });
}

function updateCharts() {
  updateProgressChart();
  updatePieChart();
}

function updateProgressChart() {
  if (!AppState.charts.progressChart) return;
  
  // Generate last 7 days data
  const last7Days = [];
  const focusData = [];
  const taskData = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    last7Days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
    
    // Calculate focus time for this day
    const dayFocus = AppState.sessions
      .filter(s => s.type === 'pomodoro' && s.completedAt && s.completedAt.startsWith(dateStr))
      .reduce((total, session) => total + session.duration, 0);
    
    focusData.push(dayFocus);
    
    // Calculate tasks completed for this day
    const dayTasks = AppState.tasks
      .filter(t => t.completedDate && t.completedDate.startsWith(dateStr))
      .length;
    
    taskData.push(dayTasks);
  }
  
  AppState.charts.progressChart.data.labels = last7Days;
  AppState.charts.progressChart.data.datasets[0].data = focusData;
  AppState.charts.progressChart.data.datasets[1].data = taskData;
  AppState.charts.progressChart.update();
}

function updatePieChart() {
  if (!AppState.charts.pieChart) return;
  
  const totalFocus = AppState.sessions
    .filter(s => s.type === 'pomodoro')
    .reduce((total, session) => total + session.duration, 0);
  
  const totalTasks = AppState.tasks.filter(t => t.completed).length * 15; // 15 min avg per task
  const totalBreak = Math.floor(totalFocus * 0.2); // 20% of focus time
  
  AppState.charts.pieChart.data.datasets[0].data = [totalFocus, totalBreak, totalTasks];
  AppState.charts.pieChart.update();
}

// Student Academic Companion - Complete JavaScript (Continued)

// ===== STUDY TIPS (CONTINUED) =====
const studyTips = [
  "🧠 Take regular breaks every 25-30 minutes to maintain focus and prevent mental fatigue.",
  "📚 Create a dedicated study space free from distractions to improve concentration.",
  "🎯 Set specific, measurable goals for each study session to stay motivated.",
  "🔄 Use active recall techniques like flashcards instead of just re-reading notes.",
  "💤 Get adequate sleep - your brain consolidates memories during rest periods.",
  "🏃‍♂️ Exercise regularly to improve cognitive function and reduce stress.",
  "🍎 Eat brain-healthy foods like nuts, berries, and fish to enhance memory.",
  "📝 Summarize information in your own words to improve understanding.",
  "👥 Study with friends or join study groups for different perspectives.",
  "🎵 Try background music or white noise if it helps you concentrate.",
  "📱 Put your phone in another room to avoid digital distractions.",
  "🌅 Study during your peak energy hours when you're most alert.",
  "📋 Use the Pomodoro Technique to break work into manageable chunks.",
  "🏆 Reward yourself after completing study goals to stay motivated.",
  "🔍 Practice spaced repetition to improve long-term retention.",
  "📖 Teach concepts to others - it reveals gaps in your understanding.",
  "🎨 Use visual aids like mind maps and diagrams for complex topics.",
  "⏰ Create a consistent study schedule to build productive habits.",
  "🧘 Try meditation or deep breathing to reduce study anxiety.",
  "📊 Track your progress to see how far you've come!"
];

let tipRotationInterval = null;

function loadStudyTip() {
  const tipElement = document.getElementById('studyTip');
  const randomTip = studyTips[Math.floor(Math.random() * studyTips.length)];
  
  tipElement.innerHTML = `
    <div class="study-tip-content fade-in">
      ${randomTip}
    </div>
  `;
}

function startTipRotation() {
  if (AppState.settings.autoRotateTips) {
    tipRotationInterval = setInterval(loadStudyTip, 30000); // Change every 30 seconds
  }
}

function stopTipRotation() {
  if (tipRotationInterval) {
    clearInterval(tipRotationInterval);
    tipRotationInterval = null;
  }
}

function nextTip() {
  loadStudyTip();
}

// ===== SOUND MANAGEMENT =====
function playSound(type) {
  if (!AppState.settings.soundEnabled) return;
  
  // Create audio context for different sound types
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  const frequencies = {
    'complete': [523, 659, 784], // C, E, G - major chord
    'notification': [440, 554], // A, C#
    'warning': [311, 415], // D#, G#
    'error': [208, 277] // G#, C#
  };
  
  const freq = frequencies[type] || frequencies['notification'];
  
  freq.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime + index * 0.1);
    oscillator.stop(audioContext.currentTime + 0.3 + index * 0.1);
  });
}

function toggleSound() {
  AppState.settings.soundEnabled = !AppState.settings.soundEnabled;
  updateSoundToggle();
  saveData();
  
  if (AppState.settings.soundEnabled) {
    playSound('notification');
    showNotification('Sound effects enabled', 'success');
  } else {
    showNotification('Sound effects disabled', 'info');
  }
}

function updateSoundToggle() {
  const soundBtn = document.getElementById('soundToggle');
  if (soundBtn) {
    soundBtn.innerHTML = AppState.settings.soundEnabled ? '🔊 Sound On' : '🔇 Sound Off';
    soundBtn.className = AppState.settings.soundEnabled ? 'btn btn-outline-success' : 'btn btn-outline-secondary';
  }
}

// ===== DARK MODE =====
function toggleDarkMode() {
  AppState.settings.darkMode = !AppState.settings.darkMode;
  
  if (AppState.settings.darkMode) {
    document.body.setAttribute('data-theme', 'dark');
  } else {
    document.body.removeAttribute('data-theme');
  }
  
  saveData();
  showNotification(`${AppState.settings.darkMode ? 'Dark' : 'Light'} mode enabled`, 'info');
}

// ===== NOTIFICATIONS =====
function showNotification(message, type = 'info') {
  if (!AppState.settings.notifications) return;
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type} slide-in-right`;
  
  const icons = {
    'success': '✅',
    'error': '❌',
    'warning': '⚠️',
    'info': 'ℹ️'
  };
  
  notification.innerHTML = `
    <span>${icons[type] || icons.info} ${message}</span>
    <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; font-size: 18px; cursor: pointer; margin-left: 10px;">&times;</button>
  `;
  
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.classList.add('slide-out-right');
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    }
  }, 5000);
  
  // Play sound
  playSound(type);
}

function toggleNotifications() {
  AppState.settings.notifications = !AppState.settings.notifications;
  saveData();
  
  showNotification(
    `Notifications ${AppState.settings.notifications ? 'enabled' : 'disabled'}`,
    AppState.settings.notifications ? 'success' : 'info'
  );
}

// ===== STATUS MESSAGES =====
function showStatus(message, type, element) {
  element.innerHTML = `
    <div class="alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" onclick="this.parentElement.style.display='none'"></button>
    </div>
  `;
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    if (element.firstElementChild) {
      element.firstElementChild.style.display = 'none';
    }
  }, 5000);
}

// ===== LOADING STATES =====
function showLoading() {
  const loadingOverlay = document.createElement('div');
  loadingOverlay.id = 'loadingOverlay';
  loadingOverlay.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <div class="mt-3">Processing files...</div>
    </div>
  `;
  
  document.body.appendChild(loadingOverlay);
}

function hideLoading() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.remove();
  }
}

// ===== MODAL MANAGEMENT =====
function showConfirmModal(title, message, onConfirm, onCancel = null) {
  const modal = document.getElementById('confirmModal');
  const modalTitle = document.getElementById('confirmModalTitle');
  const modalBody = document.getElementById('confirmModalBody');
  const confirmBtn = document.getElementById('confirmBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  
  modalTitle.textContent = title;
  modalBody.textContent = message;
  
  // Remove existing event listeners
  const newConfirmBtn = confirmBtn.cloneNode(true);
  const newCancelBtn = cancelBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
  
  // Add new event listeners
  newConfirmBtn.addEventListener('click', () => {
    onConfirm();
    hideModal();
  });
  
  newCancelBtn.addEventListener('click', () => {
    if (onCancel) onCancel();
    hideModal();
  });
  
  modal.style.display = 'flex';
  modal.classList.add('show');
}

function hideModal() {
  const modal = document.getElementById('confirmModal');
  modal.style.display = 'none';
  modal.classList.remove('show');
}

// ===== UTILITY FUNCTIONS =====
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return 'Today';
  } else if (diffDays === 2) {
    return 'Yesterday';
  } else if (diffDays <= 7) {
    return `${diffDays - 1} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / (1000 * 60));
  
  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffMinutes < 1440) {
    return `${Math.floor(diffMinutes / 60)}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// ===== EXPORT/IMPORT FUNCTIONALITY =====
function exportData() {
  const dataToExport = {
    notes: AppState.notes,
    tasks: AppState.tasks,
    sessions: AppState.sessions,
    settings: AppState.settings,
    exportDate: new Date().toISOString(),
    version: '1.0'
  };
  
  const dataStr = JSON.stringify(dataToExport, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `academic-companion-backup-${new Date().toISOString().split('T')[0]}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showNotification('Data exported successfully!', 'success');
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Validate data structure
        if (!importedData.version || !importedData.exportDate) {
          throw new Error('Invalid backup file format');
        }
        
        showConfirmModal(
          'Import Data',
          'This will replace all current data. Are you sure you want to continue?',
          () => {
            AppState.notes = importedData.notes || [];
            AppState.tasks = importedData.tasks || [];
            AppState.sessions = importedData.sessions || [];
            AppState.settings = { ...AppState.settings, ...importedData.settings };
            
            saveData();
            updateDashboard();
            
            // Apply settings
            if (AppState.settings.darkMode) {
              document.body.setAttribute('data-theme', 'dark');
            } else {
              document.body.removeAttribute('data-theme');
            }
            
            updateSoundToggle();
            showNotification('Data imported successfully!', 'success');
          }
        );
        
      } catch (error) {
        showNotification('Error importing data: Invalid file format', 'error');
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
}

// ===== STATISTICS =====
function showStatistics() {
  const totalNotes = AppState.notes.length;
  const totalTasks = AppState.tasks.length;
  const completedTasks = AppState.tasks.filter(t => t.completed).length;
  const totalPomodoros = AppState.sessions.filter(s => s.type === 'pomodoro').length;
  const totalFocusTime = AppState.sessions
    .filter(s => s.type === 'pomodoro')
    .reduce((total, session) => total + session.duration, 0);
  
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const avgSessionTime = totalPomodoros > 0 ? Math.round(totalFocusTime / totalPomodoros) : 0;
  
  const statsHtml = `
    <div class="statistics-grid">
      <div class="stat-item">
        <div class="stat-value">${totalNotes}</div>
        <div class="stat-label">Notes Uploaded</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${completedTasks}/${totalTasks}</div>
        <div class="stat-label">Tasks Completed</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${completionRate}%</div>
        <div class="stat-label">Completion Rate</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${totalPomodoros}</div>
        <div class="stat-label">Focus Sessions</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${Math.floor(totalFocusTime / 60)}h ${totalFocusTime % 60}m</div>
        <div class="stat-label">Total Focus Time</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${avgSessionTime}min</div>
        <div class="stat-label">Avg Session Length</div>
      </div>
    </div>
  `;
  
  showConfirmModal('Your Statistics', statsHtml, () => {});
}

// ===== KEYBOARD SHORTCUTS HELP =====
function showKeyboardShortcuts() {
  const shortcutsHtml = `
    <div class="shortcuts-grid">
      <div class="shortcut-item">
        <kbd>Alt + P</kbd>
        <span>Toggle Pomodoro Timer</span>
      </div>
      <div class="shortcut-item">
        <kbd>Alt + T</kbd>
        <span>Focus Task Input</span>
      </div>
      <div class="shortcut-item">
        <kbd>Alt + S</kbd>
        <span>Focus Search Notes</span>
      </div>
      <div class="shortcut-item">
        <kbd>Alt + D</kbd>
        <span>Toggle Dark Mode</span>
      </div>
      <div class="shortcut-item">
        <kbd>Alt + R</kbd>
        <span>Reset Timer</span>
      </div>
      <div class="shortcut-item">
        <kbd>Escape</kbd>
        <span>Close Modals</span>
      </div>
    </div>
  `;
  
  showConfirmModal('Keyboard Shortcuts', shortcutsHtml, () => {});
}

// ===== CLEANUP AND ERROR HANDLING =====
window.addEventListener('beforeunload', function() {
  saveData();
  stopTipRotation();
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});

window.addEventListener('error', function(e) {
  console.error('Application error:', e.error);
  showNotification('An error occurred. Please refresh the page if issues persist.', 'error');
});

// ===== RESPONSIVE DESIGN HELPERS =====
function handleResize() {
  // Update charts on resize
  if (AppState.charts.progressChart) {
    AppState.charts.progressChart.resize();
  }
  if (AppState.charts.pieChart) {
    AppState.charts.pieChart.resize();
  }
}

window.addEventListener('resize', debounce(handleResize, 250));

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ===== ACCESSIBILITY IMPROVEMENTS =====
function initializeAccessibility() {
  // Add ARIA labels and roles
  document.getElementById('pomodoroBtn').setAttribute('aria-label', 'Start Pomodoro Timer');
  document.getElementById('timerDisplay').setAttribute('aria-live', 'polite');
  
  // Keyboard navigation for custom elements
  document.querySelectorAll('.task-item').forEach(item => {
    item.setAttribute('tabindex', '0');
    item.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        const checkbox = this.querySelector('.task-checkbox');
        if (checkbox) {
          checkbox.click();
        }
      }
    });
  });
}

// ===== PERFORMANCE MONITORING =====
function logPerformance(operation, startTime) {
  const duration = performance.now() - startTime;
  if (duration > 100) { // Log operations taking longer than 100ms
    console.warn(`Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
  }
}

// ===== FINAL INITIALIZATION =====
// This ensures all components are properly initialized
document.addEventListener('DOMContentLoaded', function() {
  // Additional initialization after main init
  setTimeout(() => {
    initializeAccessibility();
    
    // Welcome message for first-time users
    if (!window.appData) {
      setTimeout(() => {
        showNotification('Welcome! Press Alt+H to see keyboard shortcuts.', 'info');
      }, 2000);
    }
  }, 500);
});

// Export functions for global access
window.StudentCompanion = {
  // Core functions
  addTask,
  uploadNotes,
  togglePomodoro,
  resetPomodoro,
  setTimer,
  
  // Utility functions
  exportData,
  importData,
  showStatistics,
  showKeyboardShortcuts,
  toggleDarkMode,
  toggleSound,
  toggleNotifications,
  
  // Data access
  getAppState: () => AppState,
  saveData,
  loadData
};
function exportProgress() {
  const progress = AppState.sessions.map(session => ({
    type: session.type,
    description: session.description,
    timestamp: session.timestamp || session.completedAt
  }));
  const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'progress-export.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showNotification('Progress exported!', 'success');
}

function resetProgress() {
  showConfirmModal('Reset Stats', 'Are you sure you want to clear all progress?', () => {
    AppState.sessions = [];
    saveData();
    updateDashboard();
    showNotification('Progress reset!', 'warning');
  });
}

function startQuickPomodoro() {
  setTimer(25);
  startPomodoro();
}

function addQuickTask() {
  const quickText = prompt('Enter quick task:');
  if (quickText) {
    document.getElementById('taskInput').value = quickText;
    addTask();
  }
}

function takeBreak() {
  setTimer(5);
  startPomodoro();
}

function printSummary() {
  const summaryWindow = window.open('', '_blank');
  const summaryContent = `
    <h2>Session Summary</h2>
    <p>Total Focus Time: ${AppState.sessions.reduce((sum, s) => sum + (s.duration || 0), 0)} minutes</p>
    <ul>
      ${AppState.sessions.map(s => `<li>${s.type}: ${s.description} (${formatTime(s.timestamp || s.completedAt)})</li>`).join('')}
    </ul>
  `;
  summaryWindow.document.write(`<html><head><title>Summary</title></head><body>${summaryContent}</body></html>`);
  summaryWindow.print();
}

function toggleTipAutoRotation() {
  AppState.settings.autoRotateTips = !AppState.settings.autoRotateTips;
  const btn = document.getElementById('autoRotateBtn');
  btn.textContent = AppState.settings.autoRotateTips ? '⏰ Auto-rotate: ON' : '⏰ Auto-rotate: OFF';
  if (AppState.settings.autoRotateTips) {
    startTipRotation();
  } else {
    stopTipRotation();
  }
  saveData();
  showNotification('Auto-rotate ' + (AppState.settings.autoRotateTips ? 'enabled' : 'disabled'), 'info');
}

function getNewTip() {
  loadStudyTip();
  showNotification('Here’s a fresh tip! 💡', 'info');
}
