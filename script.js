const STORAGE_KEY = 'dailyCatTasks';
const THEME_KEY = 'dailyCatTheme';
const statuses = ['todo', 'progress', 'done'];
const categories = ['Personal', 'Study', 'Work', 'Assignments'];
const priorities = ['Low', 'Medium', 'High'];

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(saved)) return [];
    return saved.filter(task => task && typeof task.id === 'string' &&
      typeof task.title === 'string' && statuses.includes(task.status) &&
      categories.includes(task.category) && priorities.includes(task.priority));
  } catch {
    return [];
  }
}

let tasks = loadTasks();
const form = document.getElementById('taskForm');
const searchInput = document.getElementById('search');
const categoryFilter = document.getElementById('filterCategory');

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createTaskCard(task) {
  const card = document.createElement('article');
  card.className = `task ${task.priority.toLowerCase()}`;
  card.draggable = true;
  card.addEventListener('dragstart', event => {
    event.dataTransfer.setData('text/plain', task.id);
    event.dataTransfer.effectAllowed = 'move';
    card.classList.add('dragging');
  });
  card.addEventListener('dragend', () => card.classList.remove('dragging'));
  const heading = document.createElement('h3');
  heading.textContent = task.title;
  card.appendChild(heading);

  if (task.description) {
    const description = document.createElement('p');
    description.textContent = task.description;
    card.appendChild(description);
  }

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = `${task.category} · ${task.priority} priority`;
  card.appendChild(meta);

  const actions = document.createElement('div');
  actions.className = 'actions';
  const statusSelect = document.createElement('select');
  statusSelect.setAttribute('aria-label', `Change status of ${task.title}`);
  [['todo', 'To Do'], ['progress', 'In Progress'], ['done', 'Completed']].forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    statusSelect.appendChild(option);
  });
  statusSelect.value = task.status;
  statusSelect.addEventListener('change', () => {
    task.status = statusSelect.value;
    saveTasks();
    renderTasks();
  });

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.textContent = 'Delete';
  deleteButton.setAttribute('aria-label', `Delete ${task.title}`);
  deleteButton.addEventListener('click', () => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    tasks = tasks.filter(item => item.id !== task.id);
    saveTasks();
    renderTasks();
  });
  actions.append(statusSelect, deleteButton);
  card.appendChild(actions);
  return card;
}

function renderTasks() {
  statuses.forEach(status => {
    document.getElementById(status).replaceChildren();
  });
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const visible = tasks.filter(task => task.title.toLowerCase().includes(query) &&
    (category === 'All' || task.category === category));

  statuses.forEach(status => {
    const columnTasks = visible.filter(task => task.status === status);
    const list = document.getElementById(status);
    columnTasks.forEach(task => list.appendChild(createTaskCard(task)));
    if (columnTasks.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'No tasks here';
      list.appendChild(empty);
    }
  });

  document.getElementById('todoCount').textContent = visible.filter(task => task.status === 'todo').length;
  document.getElementById('progressCount').textContent = visible.filter(task => task.status === 'progress').length;
  document.getElementById('doneCount').textContent = visible.filter(task => task.status === 'done').length;
  const completed = tasks.filter(task => task.status === 'done').length;
  document.getElementById('taskCount').textContent = `${tasks.length - completed} active · ${completed} completed`;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const title = document.getElementById('title').value.trim();
  if (!title) return;
  tasks.push({
    id: crypto.randomUUID(),
    title,
    description: document.getElementById('description').value.trim(),
    category: document.getElementById('category').value,
    priority: document.getElementById('priority').value,
    status: 'todo'
  });
  saveTasks();
  form.reset();
  renderTasks();
});
searchInput.addEventListener('input', renderTasks);
categoryFilter.addEventListener('change', renderTasks);
renderTasks();

document.querySelectorAll('.task-list').forEach(list => {
  list.addEventListener('dragover', event => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    list.classList.add('drop-target');
  });
  list.addEventListener('dragleave', event => {
    if (!list.contains(event.relatedTarget)) list.classList.remove('drop-target');
  });
  list.addEventListener('drop', event => {
    event.preventDefault();
    list.classList.remove('drop-target');
    const id = event.dataTransfer.getData('text/plain');
    const task = tasks.find(item => item.id === id);
    if (!task || !statuses.includes(list.id)) return;
    task.status = list.id;
    saveTasks();
    renderTasks();
  });
});

const themeToggle = document.getElementById('themeToggle');
function applyTheme(theme) {
  const dark = theme === 'dark';
  document.body.classList.toggle('dark', dark);
  themeToggle.textContent = dark ? '☀️ Light mode' : '🌙 Dark mode';
  themeToggle.setAttribute('aria-pressed', String(dark));
}
applyTheme(localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light');
themeToggle.addEventListener('click', () => {
  const next = document.body.classList.contains('dark') ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});
