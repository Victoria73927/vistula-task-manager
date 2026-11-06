let API = "";
let HEADERS = {};
let editingId = null;

const form = document.getElementById("task-form");
const titleInput = document.getElementById("task-title");
const descInput = document.getElementById("task-description");
const submitBtn = document.getElementById("task-submit");
const cancelBtn = document.getElementById("task-cancel");
const list = document.getElementById("task-list");
const statusEl = document.getElementById("status-message");

function showStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.className = isError ? "error" : "";
}

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: { ...HEADERS, ...(options.headers || {}) },
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${await res.text()}`);
  }
  return res.status === 204 ? null : res.text().then((t) => (t ? JSON.parse(t) : null));
}

async function loadTasks() {
  try {
    const tasks = await api("?select=*&order=id.asc");
    render(tasks);
    showStatus(tasks.length ? "" : "No tasks yet. Add your first one above.");
  } catch (e) {
    showStatus("Could not load tasks. " + e.message, true);
  }
}

function render(tasks) {
  list.innerHTML = "";
  for (const t of tasks) {
    const item = document.createElement("div");
    item.className = "task-item" + (t.completed ? " done" : "");
    item.dataset.id = t.id;

    const title = document.createElement("h3");
    title.className = "task-title";
    title.textContent = t.title;

    const desc = document.createElement("p");
    desc.className = "task-description";
    desc.textContent = t.description || "";

    const status = document.createElement("span");
    status.className = "task-status";
    status.textContent = t.completed ? "Completed" : "Not completed";

    const toggle = document.createElement("button");
    toggle.className = "toggle-task";
    toggle.textContent = t.completed ? "Mark incomplete" : "Mark complete";
    toggle.onclick = () => toggleTask(t);

    const edit = document.createElement("button");
    edit.className = "edit-task";
    edit.textContent = "Edit";
    edit.onclick = () => startEdit(t);

    const del = document.createElement("button");
    del.className = "delete-task";
    del.textContent = "Delete";
    del.onclick = () => deleteTask(t.id);

    const actions = document.createElement("div");
    actions.className = "task-actions";
    actions.append(toggle, edit, del);

    item.append(title, desc, status, actions);
    list.appendChild(item);
  }
}

function startEdit(t) {
  editingId = t.id;
  titleInput.value = t.title;
  descInput.value = t.description || "";
  submitBtn.textContent = "Save changes";
  cancelBtn.hidden = false;
  titleInput.focus();
}

function resetForm() {
  editingId = null;
  form.reset();
  submitBtn.textContent = "Add task";
  cancelBtn.hidden = true;
}

async function toggleTask(t) {
  try {
    await api(`?id=eq.${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !t.completed }),
    });
    await loadTasks();
  } catch (e) {
    showStatus("Could not update task. " + e.message, true);
  }
}

async function deleteTask(id) {
  try {
    await api(`?id=eq.${id}`, { method: "DELETE" });
    if (editingId === id) resetForm();
    await loadTasks();
    showStatus("Task deleted.");
  } catch (e) {
    showStatus("Could not delete task. " + e.message, true);
  }
}

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const body = {
    title: titleInput.value.trim(),
    description: descInput.value.trim(),
  };
  if (!body.title) return showStatus("Title is required.", true);
  try {
    if (editingId === null) {
      await api("", {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(body),
      });
    } else {
      await api(`?id=eq.${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    resetForm();
    await loadTasks();
    showStatus("Saved.");
  } catch (e) {
    showStatus("Could not save task. " + e.message, true);
  }
});

cancelBtn.addEventListener("click", resetForm);

(async function init() {
  try {
    const cfg = await (await fetch("config.json")).json();
    API = `${cfg.supabaseUrl}/rest/v1/${cfg.tableName}`;
    HEADERS = {
      apikey: cfg.supabasePublishableKey,
      Authorization: `Bearer ${cfg.supabasePublishableKey}`,
    };
    await loadTasks();
  } catch (e) {
    showStatus("Could not load configuration. " + e.message, true);
  }
})();
