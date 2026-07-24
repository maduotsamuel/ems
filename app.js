const STORAGE_KEY = "workforceProDataV1";
const SESSION_KEY = "workforceProSession";
const DEFAULT_PASSWORD = "Welcome@123";
const PRESENT_END_MINUTES = 10 * 60 + 59;
const LATE_START_MINUTES = 11 * 60;
const LATE_END_MINUTES = 17 * 60;

const seedData = {
  employees: [
    { id: "EMP-001", name: "Samuel Maduot", email: "employee@workforcepro.com", phone: "+211 920 000 000", department: "Information Technology", position: "IT Support Officer", status: "Active", joined: "2024-01-10", salary: 1450, address: "Juba, South Sudan" },
    { id: "EMP-002", name: "Grace Ajak", email: "grace@workforcepro.com", phone: "+211 921 110 002", department: "Human Resources", position: "HR Officer", status: "Active", joined: "2024-03-18", salary: 1600, address: "Juba, South Sudan" },
    { id: "EMP-003", name: "Peter Deng", email: "peter@workforcepro.com", phone: "+211 922 220 003", department: "Finance", position: "Accountant", status: "Active", joined: "2023-11-05", salary: 1750, address: "Juba, South Sudan" },
    { id: "EMP-004", name: "Mary Nyandeng", email: "mary@workforcepro.com", phone: "+211 923 330 004", department: "Operations", position: "Operations Coordinator", status: "On Leave", joined: "2024-05-22", salary: 1500, address: "Juba, South Sudan" },
    { id: "EMP-005", name: "John Lual", email: "john@workforcepro.com", phone: "+211 924 440 005", department: "Marketing", position: "Communications Officer", status: "Active", joined: "2025-01-07", salary: 1380, address: "Juba, South Sudan" },
    { id: "EMP-006", name: "Rebecca Akon", email: "rebecca@workforcepro.com", phone: "+211 925 550 006", department: "Information Technology", position: "Systems Administrator", status: "Active", joined: "2025-03-12", salary: 1900, address: "Juba, South Sudan" }
  ],
  departments: [
    { name: "Information Technology", head: "Rebecca Akon", budget: 45000 },
    { name: "Human Resources", head: "Grace Ajak", budget: 28000 },
    { name: "Finance", head: "Peter Deng", budget: 32000 },
    { name: "Operations", head: "Mary Nyandeng", budget: 52000 },
    { name: "Marketing", head: "John Lual", budget: 24000 }
  ],
  attendance: [
    { employeeId: "EMP-001", date: todayISO(), checkIn: "08:03", checkOut: "", status: "Present" },
    { employeeId: "EMP-002", date: todayISO(), checkIn: "07:55", checkOut: "16:02", status: "Present" },
    { employeeId: "EMP-003", date: todayISO(), checkIn: "08:22", checkOut: "", status: "Late" },
    { employeeId: "EMP-004", date: todayISO(), checkIn: "", checkOut: "", status: "On Leave" },
    { employeeId: "EMP-005", date: todayISO(), checkIn: "08:01", checkOut: "", status: "Present" },
    { employeeId: "EMP-006", date: todayISO(), checkIn: "07:48", checkOut: "", status: "Present" }
  ],
  leaves: [
    { id: 1, employeeId: "EMP-004", type: "Annual Leave", start: addDaysISO(1), end: addDaysISO(5), reason: "Family commitment", status: "Approved" },
    { id: 2, employeeId: "EMP-005", type: "Sick Leave", start: addDaysISO(2), end: addDaysISO(3), reason: "Medical appointment", status: "Pending" },
    { id: 3, employeeId: "EMP-001", type: "Study Leave", start: addDaysISO(7), end: addDaysISO(9), reason: "University examinations", status: "Pending" }
  ],
  performance: [
    { employeeId: "EMP-001", rating: 4.5, goal: 82, note: "Strong technical support and quick response time." },
    { employeeId: "EMP-002", rating: 4.2, goal: 76, note: "Good employee engagement and record management." },
    { employeeId: "EMP-003", rating: 4.6, goal: 88, note: "Accurate reporting and improved monthly close process." },
    { employeeId: "EMP-004", rating: 4.0, goal: 71, note: "Reliable operations coordination." },
    { employeeId: "EMP-005", rating: 3.9, goal: 69, note: "Good campaign delivery with room for stronger reporting." },
    { employeeId: "EMP-006", rating: 4.8, goal: 93, note: "Excellent system uptime and preventive maintenance." }
  ],
  users: [
    { role: "hr", name: "HR Administrator", email: "hr@workforcepro.com", passwordHash: hashPassword(DEFAULT_PASSWORD), employeeId: "EMP-002" },
    { role: "director", name: "Department Director", email: "director@workforcepro.com", passwordHash: hashPassword(DEFAULT_PASSWORD), employeeId: "EMP-006" },
    { role: "employee", name: "Samuel Maduot", email: "employee@workforcepro.com", passwordHash: hashPassword(DEFAULT_PASSWORD), employeeId: "EMP-001" }
  ],
  payrollPaid: false
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

let state = normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)) || seedData);
let currentUser = JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;
let editingEmployeeId = null;
let attendanceRealtimeTimer = null;
let notificationRealtimeTimer = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

document.addEventListener("DOMContentLoaded", init);

function init() {
  saveState();
  bindGlobalEvents();
  $("#attendanceDate").value = todayISO();
  populatePayrollMonths();
  startAttendanceRealtimeUpdates();
  startNotificationRealtimeUpdates();
  if (currentUser) showApp();
  else showLogin();
}

function bindGlobalEvents() {
  $("#loginForm").addEventListener("submit", login);
  $("#togglePassword").addEventListener("click", togglePassword);
  $("#logoutBtn").addEventListener("click", logout);
  window.addEventListener("storage", handleStorageSync);
  $("#menuBtn").addEventListener("click", toggleMobileMenu);
  $("#sidebarOverlay").addEventListener("click", closeMobileMenu);
  window.addEventListener("resize", () => { if (window.innerWidth > 850) closeMobileMenu(); });
  $("#themeBtn").addEventListener("click", toggleTheme);
  $("#closeModalBtn").addEventListener("click", closeModal);
  $("#modalBackdrop").addEventListener("click", e => { if (e.target === $("#modalBackdrop")) closeModal(); });
  $("#notificationBtn").addEventListener("click", toggleNotificationPanel);
  $("#notificationMarkReadBtn").addEventListener("click", markAllNotificationsRead);
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleGlobalKeydown);

  $$(".nav-link").forEach(btn => btn.addEventListener("click", () => navigate(btn.dataset.section)));
  $$("[data-go]").forEach(btn => btn.addEventListener("click", () => navigate(btn.dataset.go)));

  $("#quickAddEmployee").addEventListener("click", () => openEmployeeModal());
  $("#addEmployeeBtn").addEventListener("click", () => openEmployeeModal());
  $("#exportEmployeesBtn").addEventListener("click", exportEmployeesToExcel);
  $("#requestLeaveBtn").addEventListener("click", openLeaveModal);
  $("#addDepartmentBtn").addEventListener("click", openDepartmentModal);
  $("#addReviewBtn").addEventListener("click", openReviewModal);
  $("#runPayrollBtn").addEventListener("click", runPayroll);
  $("#exportPayrollBtn").addEventListener("click", exportPayrollToExcel);
  $("#checkInBtn").addEventListener("click", handleCheckInOut);
  $("#profileForm").addEventListener("submit", saveProfile);
  $("#passwordForm").addEventListener("submit", changePassword);
  $("#profilePictureInput").addEventListener("change", handleProfilePicture);
  $("#removeProfilePictureBtn").addEventListener("click", removeProfilePicture);

  ["employeeSearch", "departmentFilter", "statusFilter"].forEach(id => $("#" + id).addEventListener("input", renderEmployees));
  $("#clearEmployeeFilters").addEventListener("click", clearEmployeeFilters);
  $("#leaveStatusFilter").addEventListener("change", renderLeaves);
  $("#attendanceDate").addEventListener("change", renderAttendance);
  $("#globalSearch").addEventListener("input", globalSearch);
}

function login(e) {
  e.preventDefault();
  const selectedRole = $("#loginRole").value;
  const email = $("#loginEmail").value.trim().toLowerCase();
  const password = $("#loginPassword").value.trim();

  const account = state.users.find(user => user.email.toLowerCase() === email);

  if (account && verifyPassword(account, password)) {
    const role = account.role || selectedRole;
    currentUser = { ...account, role };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    $("#loginError").textContent = "";

    if (role !== selectedRole) {
      $("#loginRole").value = role;
    }

    showApp();
    toast("Signed in successfully.");
  } else if (account && canRecoverWithDefaultPassword(account, password)) {
    account.passwordHash = hashPassword(DEFAULT_PASSWORD);
    saveState();

    const role = account.role || selectedRole;
    currentUser = { ...account, role };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    $("#loginError").textContent = "";

    if (role !== selectedRole) {
      $("#loginRole").value = role;
    }

    showApp();
    toast("Signed in successfully.");
  } else {
    $("#loginError").textContent = "Incorrect email, password, or role.";
  }
}

function togglePassword() {
  const input = $("#loginPassword");
  input.type = input.type === "password" ? "text" : "password";
  $("#togglePassword").textContent = input.type === "password" ? "Show" : "Hide";
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  currentUser = null;
  closeNotificationPanel();
  showLogin();
}

function showLogin() {
  closeNotificationPanel();
  $("#loginView").classList.remove("hidden");
  $("#appView").classList.add("hidden");
}

function showApp() {
  syncAttendanceStatusesForDate(todayISO());
  $("#loginView").classList.add("hidden");
  $("#appView").classList.remove("hidden");
  applyRoleAccess();
  renderAll();
}

function applyRoleAccess() {
  $$(".hr-only").forEach(el => el.classList.toggle("hidden", currentUser.role !== "hr"));
  $$(".director-only").forEach(el => {
    const allowed = currentUser.role === "hr" || currentUser.role === "director";
    if (!el.classList.contains("hr-only")) el.classList.toggle("hidden", !allowed);
  });

  $("#sidebarUserName").textContent = currentUser.name;
  $("#sidebarUserRole").textContent = roleLabel(currentUser.role);
  $("#sidebarAvatar").textContent = initials(currentUser.name);
  $("#welcomeTitle").textContent = `Welcome back, ${currentUser.name.split(" ")[0]}`;
}

function roleLabel(role) {
  return role === "hr" ? "HR Administrator" : role === "director" ? "Department Director" : "Employee";
}

function navigate(section) {
  $$(".section").forEach(el => el.classList.remove("active"));
  $$(".nav-link").forEach(el => el.classList.remove("active"));
  $(`#${section}Section`).classList.add("active");
  $(`.nav-link[data-section="${section}"]`)?.classList.add("active");
  $("#pageTitle").textContent = titleCase(section);
  closeMobileMenu();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderAll() {
  $("#currentDate").textContent = new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  renderDashboard();
  renderEmployees();
  renderAttendance();
  renderLeaves();
  renderPayroll();
  renderPerformance();
  renderDepartments();
  renderProfile();
  renderNotifications();
}

function renderDashboard() {
  syncAttendanceStatusesForDate(todayISO());
  const scopedEmployees = getScopedEmployees();
  const scopedIds = new Set(scopedEmployees.map(employee => employee.id));
  const scopedAttendance = state.attendance.filter(record => scopedIds.has(record.employeeId));
  const scopedLeaves = state.leaves.filter(leave => scopedIds.has(leave.employeeId));
  const scopedPerformance = state.performance.filter(review => scopedIds.has(review.employeeId));

  const active = scopedEmployees.filter(e => e.status === "Active").length;
  const present = scopedAttendance.filter(a => a.date === todayISO() && ["Present", "Late"].includes(a.status)).length;
  const pendingLeaves = scopedLeaves.filter(l => l.status === "Pending").length;
  const avgRating = average(scopedPerformance.map(p => p.rating)).toFixed(1);

  const stats = currentUser.role === "employee"
    ? [
        ["Leave balance", "18 days", "📅", "Available this year"],
        ["Attendance", `${Math.round((present / Math.max(scopedEmployees.length, 1)) * 100)}%`, "✓", "Today's team rate"],
        ["My rating", getPerformance(currentUser.employeeId)?.rating || "N/A", "⭐", "Current review"],
        ["Pending requests", state.leaves.filter(l => l.employeeId === currentUser.employeeId && l.status === "Pending").length, "⏳", "Awaiting review"]
      ]
    : [
        ["Total employees", scopedEmployees.length, "👥", `${active} active`],
        ["Present today", present, "✓", `${Math.round((present / Math.max(scopedEmployees.length, 1)) * 100)}% attendance`],
        ["Pending leave", pendingLeaves, "📅", "Requires review"],
        ["Average rating", avgRating, "⭐", "Current cycle"]
      ];

  $("#statCards").innerHTML = stats.map(([label, value, icon, note]) => statCard(label, value, icon, note)).join("");

  const week = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const values = [84, 91, 88, 94, 86];
  $("#attendanceChart").innerHTML = week.map((day, i) => `
    <div class="bar-column">
      <div class="bar-track"><div class="bar-fill" style="height:${values[i]}%"></div></div>
      <strong>${values[i]}%</strong><span>${day}</span>
    </div>`).join("");

  renderDepartmentDistribution();

  const recent = [...scopedEmployees].sort((a,b) => getRecruitedDate(b).localeCompare(getRecruitedDate(a))).slice(0,4);
  $("#recentEmployees").innerHTML = recent.map(personRow).join("");

  const pending = scopedLeaves.filter(l => l.status === "Pending").slice(0,4);
  $("#dashboardLeaveList").innerHTML = pending.length ? pending.map(l => {
    const e = getEmployee(l.employeeId);
    return `<div class="request-row">
      <div class="person-avatar">${initials(e?.name || "?")}</div>
      <div class="meta"><strong>${e?.name || "Unknown"}</strong><span>${l.type} · ${daysBetween(l.start,l.end)} day(s)</span></div>
      <span class="badge warning">${l.status}</span>
    </div>`;
  }).join("") : `<p class="muted">No pending leave requests.</p>`;
}

function renderDepartmentDistribution() {
  const scopedEmployees = getScopedEmployees();
  const total = Math.max(scopedEmployees.length, 1);
  $("#departmentDistribution").innerHTML = state.departments.map(d => {
    const count = scopedEmployees.filter(e => e.department === d.name).length;
    const pct = Math.round((count / total) * 100);
    return `<div class="progress-item">
      <div class="progress-label"><span>${d.name}</span><strong>${count}</strong></div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join("");
}


function getFilteredEmployees() {
  const search = $("#employeeSearch").value.toLowerCase();
  const department = $("#departmentFilter").value;
  const status = $("#statusFilter").value;

  const employees = getScopedEmployees();

  return employees.filter(e => {
    const matchSearch = [e.name, e.email, e.id, e.position, e.phone]
      .join(" ")
      .toLowerCase()
      .includes(search);
    return matchSearch && (!department || e.department === department) && (!status || e.status === status);
  });
}

function exportEmployeesToExcel() {
  const employees = getFilteredEmployees();
  if (!employees.length) {
    toast("There are no employee records to export.");
    return;
  }

  const escapeCell = value => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const rows = employees.map(e => `
    <tr>
      <td>${escapeCell(e.id)}</td>
      <td>${escapeCell(e.name)}</td>
      <td>${escapeCell(e.email)}</td>
      <td>${escapeCell(e.phone)}</td>
      <td>${escapeCell(e.department)}</td>
      <td>${escapeCell(e.position)}</td>
      <td>${escapeCell(e.status)}</td>
      <td>${escapeCell(formatDate(getRecruitedDate(e)))}</td>
      <td>${escapeCell(formatDateOrDash(getContractEndDate(e)))}</td>
      <td>${escapeCell(e.salary)}</td>
      <td>${escapeCell(e.address || "")}</td>
    </tr>`).join("");

  const workbook = `<!DOCTYPE html>
  <html xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="UTF-8">
    <style>
      table { border-collapse: collapse; font-family: Arial, sans-serif; }
      th { background: #1358d2; color: #ffffff; font-weight: bold; }
      th, td { border: 1px solid #b8c0cc; padding: 8px; text-align: left; }
      .number { mso-number-format: "0"; }
    </style>
  </head>
  <body>
    <table>
      <thead>
        <tr>
          <th>Employee ID</th><th>Full Name</th><th>Email</th><th>Phone</th>
          <th>Department</th><th>Position</th><th>Status</th><th>Date Recruited</th><th>Contract End</th>
          <th>Monthly Salary (USD)</th><th>Address</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </body>
  </html>`;

  const blob = new Blob(["\ufeff", workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `employee-database-${todayISO()}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast(`${employees.length} employee record(s) exported to Excel.`);
}

function renderEmployees() {
  if (!currentUser) return;
  const search = $("#employeeSearch").value.toLowerCase();
  const department = $("#departmentFilter").value;
  const status = $("#statusFilter").value;

  populateDepartmentFilter();

  const employees = getFilteredEmployees();

  $("#employeeTableBody").innerHTML = employees.map(e => `
    <tr>
      <td><div class="employee-cell"><div class="person-avatar">${initials(e.name)}</div><div class="meta"><strong>${e.name}</strong><span>${e.email}</span></div></div></td>
      <td>${e.id}</td>
      <td>${e.department}</td>
      <td>${e.position}</td>
      <td>${badge(e.status)}</td>
      <td>${formatDate(getRecruitedDate(e))}</td>
      <td>${formatDateOrDash(getContractEndDate(e))}</td>
      <td><div class="action-menu">
        <button class="action-btn" onclick="viewEmployee('${e.id}')">View</button>
        ${currentUser.role === "hr" ? `<button class="action-btn" onclick="openEmployeeModal('${e.id}')">Edit</button><button class="action-btn" onclick="deleteEmployee('${e.id}')">Delete</button>` : ""}
      </div></td>
    </tr>`).join("");

  $("#employeeEmpty").classList.toggle("hidden", employees.length !== 0);
}

function populateDepartmentFilter() {
  const select = $("#departmentFilter");
  const current = select.value;
  const departments = [...new Set(getScopedEmployees().map(employee => employee.department))].filter(Boolean);
  select.innerHTML = `<option value="">All departments</option>` + departments.map(name => `<option>${name}</option>`).join("");
  select.value = current;
}

function clearEmployeeFilters() {
  $("#employeeSearch").value = "";
  $("#departmentFilter").value = "";
  $("#statusFilter").value = "";
  renderEmployees();
}

function openEmployeeModal(id = null) {
  editingEmployeeId = id;
  const employee = id ? getEmployee(id) : null;
  $("#modalTitle").textContent = employee ? "Edit employee" : "Add employee";
  $("#modalSubtitle").textContent = employee ? "Update employee information." : "Create a new employee record.";
  $("#modalBody").innerHTML = `
    <form id="employeeForm" class="form-grid">
      <label>Full name<input name="name" value="${employee?.name || ""}" required></label>
      <label>Email<input name="email" type="email" value="${employee?.email || ""}" required></label>
      <label>Phone<input name="phone" value="${employee?.phone || ""}" required></label>
      <label>Department<select name="department" required>${state.departments.map(d => `<option ${employee?.department === d.name ? "selected" : ""}>${d.name}</option>`).join("")}</select></label>
      <label>Position<input name="position" value="${employee?.position || ""}" required></label>
      <label>Status<select name="status">${["Active","On Leave","Inactive"].map(s => `<option ${employee?.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></label>
      <label>Date recruited<input name="dateRecruited" type="date" value="${getRecruitedDate(employee)}" required></label>
      <label>Contract end date<input name="contractEndDate" type="date" value="${getContractEndDate(employee)}"></label>
      <label>Monthly salary<input name="salary" type="number" min="0" value="${employee?.salary || 1000}" required></label>
      <label class="full">Address<input name="address" value="${employee?.address || "Juba, South Sudan"}"></label>
      <div class="modal-actions full">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">${employee ? "Save changes" : "Add employee"}</button>
      </div>
    </form>`;
  $("#employeeForm").addEventListener("submit", saveEmployee);
  openModal();
}

function saveEmployee(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const values = Object.fromEntries(form.entries());
  values.salary = Number(values.salary);
  values.dateRecruited = values.dateRecruited || todayISO();
  values.joined = values.dateRecruited;
  values.contractEndDate = values.contractEndDate || "";

  if (editingEmployeeId) {
    const index = state.employees.findIndex(e => e.id === editingEmployeeId);
    state.employees[index] = normalizeEmployeeDates({ ...state.employees[index], ...values });
    syncEmployeeUser(state.employees[index]);
    toast("Employee updated.");
  } else {
    const next = Math.max(0, ...state.employees.map(e => Number(e.id.split("-")[1]))) + 1;
    const employee = normalizeEmployeeDates({ ...values, id: `EMP-${String(next).padStart(3,"0")}` });
    state.employees.push(employee);
    state.performance.push({ employeeId: employee.id, rating: 0, goal: 0, note: "No review recorded." });
    createEmployeeLogin(employee);
    toast(`Employee added. Login created with password ${DEFAULT_PASSWORD}.`);
  }
  saveState();
  closeModal();
  renderAll();
}

function viewEmployee(id) {
  const e = getEmployee(id);
  $("#modalTitle").textContent = e.name;
  $("#modalSubtitle").textContent = `${e.position} · ${e.department}`;
  $("#modalBody").innerHTML = `<div style="padding:20px">
    <div class="profile-details">
      <div><span>Employee ID</span><strong>${e.id}</strong></div>
      <div><span>Email</span><strong>${e.email}</strong></div>
      <div><span>Phone</span><strong>${e.phone}</strong></div>
      <div><span>Status</span><strong>${e.status}</strong></div>
      <div><span>Date recruited</span><strong>${formatDate(getRecruitedDate(e))}</strong></div>
      <div><span>Contract end</span><strong>${formatDateOrDash(getContractEndDate(e))}</strong></div>
      <div><span>Salary</span><strong>${money(e.salary)}</strong></div>
      <div><span>Address</span><strong>${e.address || "-"}</strong></div>
    </div>
  </div>`;
  openModal();
}

function deleteEmployee(id) {
  const e = getEmployee(id);
  if (!confirm(`Delete ${e.name}? This cannot be undone.`)) return;
  state.employees = state.employees.filter(x => x.id !== id);
  state.attendance = state.attendance.filter(x => x.employeeId !== id);
  state.leaves = state.leaves.filter(x => x.employeeId !== id);
  state.performance = state.performance.filter(x => x.employeeId !== id);
  state.users = state.users.filter(x => x.employeeId !== id);
  saveState();
  renderAll();
  toast("Employee deleted.");
}

function renderAttendance() {
  if (!currentUser) return;
  const date = $("#attendanceDate").value || todayISO();
  syncAttendanceStatusesForDate(date);
  const scopedIds = new Set(getScopedEmployees().map(employee => employee.id));
  const records = state.attendance.filter(record => record.date === date && scopedIds.has(record.employeeId));

  const present = records.filter(a => a.status === "Present").length;
  const late = records.filter(a => a.status === "Late").length;
  const absent = records.filter(a => a.status === "Absent").length;
  const leave = records.filter(a => a.status === "On Leave").length;
  $("#attendanceSummary").innerHTML = [
    ["Present", present, "✓", "On time"],
    ["Late", late, "⏱", "After start time"],
    ["Absent", absent, "✕", "No attendance"],
    ["On leave", leave, "📅", "Approved leave"]
  ].map(x => statCard(...x)).join("");

  $("#attendanceTableBody").innerHTML = records.map(a => {
    const e = getEmployee(a.employeeId);
    return `<tr>
      <td><div class="employee-cell"><div class="person-avatar">${initials(e?.name || "?")}</div><div class="meta"><strong>${e?.name || "Unknown"}</strong><span>${e?.position || ""}</span></div></div></td>
      <td>${formatDate(a.date)}</td><td>${a.checkIn || "-"}</td><td>${a.checkOut || "-"}</td>
      <td>${calculateHours(a.checkIn, a.checkOut)}</td><td>${badge(a.status)}</td>
      ${currentUser.role !== "employee" ? `<td><button class="action-btn" onclick="editAttendance('${a.employeeId}','${a.date}')">Edit</button></td>` : ""}
    </tr>`;
  }).join("");
}

function handleCheckInOut() {
  const id = currentUser.employeeId;
  let record = state.attendance.find(a => a.employeeId === id && a.date === todayISO());
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  if (!record) {
    record = { employeeId: id, date: todayISO(), checkIn: time, checkOut: "", status: getAttendanceStatusForTime(time) };
    state.attendance.push(record);
    toast("You have checked in.");
  } else if (!record.checkOut) {
    record.checkOut = time;
    toast("You have checked out.");
  } else {
    toast("Attendance is already complete for today.");
    return;
  }
  saveState();
  renderAttendance();
  renderDashboard();
  renderNotifications();
}

function editAttendance(employeeId, date) {
  if (currentUser.role === "director") {
    const directorDepartment = getEmployee(currentUser.employeeId)?.department;
    const employee = getEmployee(employeeId);
    if (!employee || employee.department !== directorDepartment) {
      toast("You can only edit attendance for your department employees.");
      return;
    }
  }

  const record = state.attendance.find(a => a.employeeId === employeeId && a.date === date);
  $("#modalTitle").textContent = "Edit attendance";
  $("#modalSubtitle").textContent = getEmployee(employeeId)?.name || employeeId;
  $("#modalBody").innerHTML = `
    <form id="attendanceForm" class="form-grid">
      <label>Date<input name="date" type="date" value="${record.date}" required></label>
      <label>Status<select name="status">${["Present","Late","Absent","On Leave"].map(s => `<option ${s===record.status?"selected":""}>${s}</option>`)}</select></label>
      <label>Check in<input name="checkIn" type="time" value="${record.checkIn}"></label>
      <label>Check out<input name="checkOut" type="time" value="${record.checkOut}"></label>
      <div class="modal-actions full"><button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary">Save</button></div>
    </form>`;
  $("#attendanceForm").addEventListener("submit", e => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.target).entries());
    if (values.checkIn && !["Absent", "On Leave"].includes(values.status)) {
      values.status = getAttendanceStatusForTime(values.checkIn);
    }
    Object.assign(record, values);
    saveState(); closeModal(); renderAttendance(); renderDashboard(); renderNotifications(); toast("Attendance updated.");
  });
  openModal();
}

function renderLeaves() {
  if (!currentUser) return;
  const scopedIds = new Set(getScopedEmployees().map(employee => employee.id));
  let leaves = state.leaves.filter(leave => scopedIds.has(leave.employeeId));
  const filter = $("#leaveStatusFilter").value;
  if (filter) leaves = leaves.filter(l => l.status === filter);

  const allRoleLeaves = state.leaves.filter(leave => scopedIds.has(leave.employeeId));
  $("#leaveSummary").innerHTML = [
    ["Pending", allRoleLeaves.filter(l => l.status === "Pending").length, "⏳", "Awaiting decision"],
    ["Approved", allRoleLeaves.filter(l => l.status === "Approved").length, "✓", "Approved requests"],
    ["Rejected", allRoleLeaves.filter(l => l.status === "Rejected").length, "✕", "Rejected requests"],
    ["Total days", allRoleLeaves.reduce((sum,l) => sum + daysBetween(l.start,l.end),0), "📅", "All requests"]
  ].map(x => statCard(...x)).join("");

  $("#leaveTableBody").innerHTML = leaves.map(l => {
    const e = getEmployee(l.employeeId);
    const action = currentUser.role === "employee"
      ? (l.status === "Pending" ? `<button class="action-btn" onclick="cancelLeave(${l.id})">Cancel</button>` : "-")
      : (l.status === "Pending" ? `<div class="action-menu"><button class="action-btn" onclick="updateLeave(${l.id},'Approved')">Approve</button><button class="action-btn" onclick="updateLeave(${l.id},'Rejected')">Reject</button></div>` : "-");
    return `<tr>
      <td><div class="employee-cell"><div class="person-avatar">${initials(e?.name || "?")}</div><div class="meta"><strong>${e?.name || "Unknown"}</strong><span>${e?.department || ""}</span></div></div></td>
      <td>${l.type}</td><td>${formatDate(l.start)} - ${formatDate(l.end)}</td><td>${daysBetween(l.start,l.end)}</td>
      <td>${l.reason}</td><td>${badge(l.status)}</td><td>${action}</td>
    </tr>`;
  }).join("");
}

function openLeaveModal() {
  $("#modalTitle").textContent = "Request leave";
  $("#modalSubtitle").textContent = "Submit a leave application for review.";
  const scopedEmployees = getScopedEmployees();
  const employeeOptions = currentUser.role === "employee"
    ? `<option value="${currentUser.employeeId}">${getEmployee(currentUser.employeeId).name}</option>`
    : scopedEmployees.map(e => `<option value="${e.id}">${e.name}</option>`).join("");
  $("#modalBody").innerHTML = `
    <form id="leaveForm" class="form-grid">
      <label class="full">Employee<select name="employeeId">${employeeOptions}</select></label>
      <label>Leave type<select name="type"><option>Annual Leave</option><option>Sick Leave</option><option>Study Leave</option><option>Emergency Leave</option><option>Maternity Leave</option></select></label>
      <label>Status<select name="status" ${currentUser.role === "employee" ? "disabled" : ""}><option>Pending</option><option>Approved</option></select></label>
      <label>Start date<input name="start" type="date" min="${todayISO()}" required></label>
      <label>End date<input name="end" type="date" min="${todayISO()}" required></label>
      <label class="full">Reason<textarea name="reason" rows="3" required></textarea></label>
      <div class="modal-actions full"><button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary">Submit request</button></div>
    </form>`;
  $("#leaveForm").addEventListener("submit", e => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.target).entries());
    values.status = values.status || "Pending";
    if (values.end < values.start) return toast("End date must be after the start date.");
    state.leaves.push({ ...values, id: Date.now() });
    saveState(); closeModal(); renderAll(); toast("Leave request submitted.");
  });
  openModal();
}

function updateLeave(id, status) {
  const leave = state.leaves.find(l => l.id === id);
  if (!leave) return;

  if (currentUser.role === "director") {
    const directorDepartment = getEmployee(currentUser.employeeId)?.department;
    const employee = getEmployee(leave.employeeId);
    if (!employee || employee.department !== directorDepartment) {
      toast("You can only manage leave for your department employees.");
      return;
    }
  }

  leave.status = status;
  const employee = getEmployee(leave.employeeId);
  if (status === "Approved" && leave.start <= todayISO() && leave.end >= todayISO()) employee.status = "On Leave";
  saveState(); renderAll(); toast(`Leave ${status.toLowerCase()}.`);
}

function cancelLeave(id) {
  state.leaves = state.leaves.filter(l => l.id !== id);
  saveState(); renderLeaves(); renderDashboard(); toast("Leave request cancelled.");
}

function renderPayroll() {
  if (!currentUser) return;
  const rows = getScopedEmployees().map(e => {
    const allowance = Math.round(e.salary * .12);
    const deductions = Math.round(e.salary * .06);
    return { ...e, allowance, deductions, net: e.salary + allowance - deductions };
  });
  const gross = rows.reduce((s,e) => s + e.salary,0);
  const allowances = rows.reduce((s,e) => s + e.allowance,0);
  const deductions = rows.reduce((s,e) => s + e.deductions,0);
  const net = rows.reduce((s,e) => s + e.net,0);

  $("#payrollSummary").innerHTML = [
    ["Gross payroll", money(gross), "💰", "Basic salaries"],
    ["Allowances", money(allowances), "+", "12% total"],
    ["Deductions", money(deductions), "-", "6% total"],
    ["Net payroll", money(net), "✓", state.payrollPaid ? "Processed" : "Not processed"]
  ].map(x => statCard(...x)).join("");

  $("#payrollTableBody").innerHTML = rows.map(e => `
    <tr>
      <td><div class="employee-cell"><div class="person-avatar">${initials(e.name)}</div><div class="meta"><strong>${e.name}</strong><span>${e.id}</span></div></div></td>
      <td>${money(e.salary)}</td><td>${money(e.allowance)}</td><td>${money(e.deductions)}</td><td><strong>${money(e.net)}</strong></td>
      <td>${badge(state.payrollPaid ? "Paid" : "Pending")}</td>
      <td><button class="action-btn" onclick="downloadPayslip('${e.id}')">Download</button></td>
    </tr>`).join("");
}


function exportPayrollToExcel() {
  const scopedEmployees = getScopedEmployees();
  if (!scopedEmployees.length) {
    toast("There are no payroll records to export.");
    return;
  }

  const period = $("#payrollMonth").value || "Current period";
  const status = state.payrollPaid ? "Paid" : "Pending";
  const escapeCell = value => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const payrollRows = scopedEmployees.map(e => {
    const allowance = Math.round(e.salary * .12);
    const deductions = Math.round(e.salary * .06);
    const net = e.salary + allowance - deductions;
    return { employee: e, allowance, deductions, net };
  });

  const rows = payrollRows.map(({ employee, allowance, deductions, net }) => `
    <tr>
      <td>${escapeCell(employee.id)}</td>
      <td>${escapeCell(employee.name)}</td>
      <td>${escapeCell(employee.department)}</td>
      <td>${escapeCell(employee.position)}</td>
      <td>${escapeCell(employee.salary)}</td>
      <td>${escapeCell(allowance)}</td>
      <td>${escapeCell(deductions)}</td>
      <td>${escapeCell(net)}</td>
      <td>${escapeCell(status)}</td>
      <td>${escapeCell(period)}</td>
    </tr>`).join("");

  const gross = payrollRows.reduce((sum, row) => sum + row.employee.salary, 0);
  const totalAllowances = payrollRows.reduce((sum, row) => sum + row.allowance, 0);
  const totalDeductions = payrollRows.reduce((sum, row) => sum + row.deductions, 0);
  const totalNet = payrollRows.reduce((sum, row) => sum + row.net, 0);

  const workbook = `<!DOCTYPE html>
  <html xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="UTF-8">
    <style>
      table { border-collapse: collapse; font-family: Arial, sans-serif; }
      th { background: #1358d2; color: #ffffff; font-weight: bold; }
      th, td { border: 1px solid #b8c0cc; padding: 8px; text-align: left; }
      .title { background: #111827; color: #ffffff; font-size: 16px; font-weight: bold; }
      .summary { background: #eaf1ff; font-weight: bold; }
      .number { mso-number-format: "0"; }
    </style>
  </head>
  <body>
    <table>
      <tr><td class="title" colspan="10">WorkforcePro Payroll Register</td></tr>
      <tr><td colspan="2"><strong>Payroll period</strong></td><td colspan="8">${escapeCell(period)}</td></tr>
      <tr><td colspan="2"><strong>Export date</strong></td><td colspan="8">${escapeCell(formatDate(todayISO()))}</td></tr>
      <tr><td colspan="10"></td></tr>
      <thead>
        <tr>
          <th>Employee ID</th><th>Employee Name</th><th>Department</th><th>Position</th>
          <th>Basic Salary (USD)</th><th>Allowances (USD)</th><th>Deductions (USD)</th>
          <th>Net Pay (USD)</th><th>Status</th><th>Payroll Period</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr class="summary">
          <td colspan="4">Payroll Totals</td>
          <td>${gross}</td><td>${totalAllowances}</td><td>${totalDeductions}</td><td>${totalNet}</td>
          <td>${escapeCell(status)}</td><td>${escapeCell(period)}</td>
        </tr>
      </tbody>
    </table>
  </body>
  </html>`;

  const safePeriod = period.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const blob = new Blob(["\ufeff", workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `payroll-${safePeriod || todayISO()}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast(`${payrollRows.length} payroll record(s) exported to Excel.`);
}

function populatePayrollMonths() {
  const select = $("#payrollMonth");
  const now = new Date();
  for (let i=0;i<6;i++) {
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const text = d.toLocaleDateString("en", { month:"long", year:"numeric" });
    select.insertAdjacentHTML("beforeend", `<option>${text}</option>`);
  }
  select.addEventListener("change", () => $("#payrollPeriod").textContent = select.value);
  $("#payrollPeriod").textContent = select.value;
}

function runPayroll() {
  state.payrollPaid = true;
  saveState(); renderPayroll(); toast("Payroll processed successfully.");
}

function downloadPayslip(id) {
  if (currentUser.role === "employee" && id !== currentUser.employeeId) {
    toast("You can only download your own payslip.");
    return;
  }

  if (currentUser.role === "director") {
    const directorDepartment = getEmployee(currentUser.employeeId)?.department;
    const employee = getEmployee(id);
    if (!employee || employee.department !== directorDepartment) {
      toast("You can only download payslips for your department employees.");
      return;
    }
  }

  const e = getEmployee(id);
  const allowance = Math.round(e.salary * .12), deduction = Math.round(e.salary * .06), net = e.salary + allowance - deduction;
  const content = `WORKFORCEPRO PAYSLIP\n\nEmployee: ${e.name}\nEmployee ID: ${e.id}\nPeriod: ${$("#payrollMonth").value}\n\nBasic Salary: ${money(e.salary)}\nAllowances: ${money(allowance)}\nDeductions: ${money(deduction)}\nNet Pay: ${money(net)}\nStatus: ${state.payrollPaid ? "Paid" : "Pending"}\n`;
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${e.id}-payslip.txt`; a.click();
  URL.revokeObjectURL(url);
}

function renderPerformance() {
  if (!currentUser) return;
  let data = [...state.performance];
  if (currentUser.role === "director") {
    const dept = getEmployee(currentUser.employeeId)?.department;
    data = data.filter(p => getEmployee(p.employeeId)?.department === dept);
  }
  if (currentUser.role === "employee") data = data.filter(p => p.employeeId === currentUser.employeeId);

  $("#performanceCards").innerHTML = data.map(p => {
    const e = getEmployee(p.employeeId);
    return `<article class="performance-card">
      <div class="performance-head">
        <div class="employee-cell"><div class="person-avatar">${initials(e?.name || "?")}</div><div class="meta"><strong>${e?.name || "Unknown"}</strong><span>${e?.position || ""}</span></div></div>
        <div class="rating">${p.rating.toFixed(1)}</div>
      </div>
      <div class="goal-row"><div class="progress-label"><span>Goal completion</span><strong>${p.goal}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${p.goal}%"></div></div></div>
      <p class="muted">${p.note}</p>
    </article>`;
  }).join("");

  const top = [...data].sort((a,b) => b.rating-a.rating).slice(0,5);
  $("#topPerformers").innerHTML = top.map((p,i) => {
    const e = getEmployee(p.employeeId);
    return `<div class="rank-row"><strong>#${i+1}</strong><div class="person-avatar">${initials(e?.name || "?")}</div><div class="meta"><strong>${e?.name || "Unknown"}</strong><span>${e?.department || ""}</span></div><strong style="margin-left:auto">${p.rating.toFixed(1)}</strong></div>`;
  }).join("");
}

function openReviewModal() {
  let employees = state.employees;
  if (currentUser.role === "director") {
    const dept = getEmployee(currentUser.employeeId)?.department;
    employees = employees.filter(e => e.department === dept);
  }
  $("#modalTitle").textContent = "Add performance review";
  $("#modalSubtitle").textContent = "Record an employee rating and progress.";
  $("#modalBody").innerHTML = `
    <form id="reviewForm" class="form-grid">
      <label class="full">Employee<select name="employeeId">${employees.map(e => `<option value="${e.id}">${e.name}</option>`)}</select></label>
      <label>Rating (0-5)<input name="rating" type="number" min="0" max="5" step=".1" required></label>
      <label>Goal completion (%)<input name="goal" type="number" min="0" max="100" required></label>
      <label class="full">Review note<textarea name="note" rows="4" required></textarea></label>
      <div class="modal-actions full"><button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary">Save review</button></div>
    </form>`;
  $("#reviewForm").addEventListener("submit", e => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.target).entries());
    values.rating = Number(values.rating); values.goal = Number(values.goal);
    const existing = getPerformance(values.employeeId);
    if (existing) Object.assign(existing, values);
    else state.performance.push(values);
    saveState(); closeModal(); renderPerformance(); renderDashboard(); toast("Performance review saved.");
  });
  openModal();
}

function renderDepartments() {
  if (currentUser.role !== "hr") {
    $("#departmentCards").innerHTML = `<p class="muted">Department management is available to HR only.</p>`;
    return;
  }

  $("#departmentCards").innerHTML = state.departments.map(d => {
    const employees = state.employees.filter(e => e.department === d.name);
    return `<article class="department-card">
      <div class="stat-icon">🏢</div>
      <h3>${d.name}</h3><p>Department head: ${d.head}</p>
      <div class="department-stats"><span>${employees.length} employee(s)</span><strong>${money(d.budget)}</strong></div>
    </article>`;
  }).join("");
}

function openDepartmentModal() {
  if (currentUser.role !== "hr") {
    toast("Only HR can add departments.");
    return;
  }

  $("#modalTitle").textContent = "Add department";
  $("#modalSubtitle").textContent = "Create an organizational department.";
  $("#modalBody").innerHTML = `
    <form id="departmentForm" class="form-grid">
      <label class="full">Department name<input name="name" required></label>
      <label>Department head<input name="head" required></label>
      <label>Annual budget<input name="budget" type="number" min="0" required></label>
      <div class="modal-actions full"><button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary">Add department</button></div>
    </form>`;
  $("#departmentForm").addEventListener("submit", e => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.target).entries());
    values.budget = Number(values.budget);
    state.departments.push(values);
    saveState(); closeModal(); renderAll(); toast("Department added.");
  });
  openModal();
}

function renderProfile() {
  if (!currentUser) return;
  const e = getEmployee(currentUser.employeeId) || state.employees[0];
  const avatar = $("#profileAvatar");
  const photo = $("#profilePhoto");
  avatar.textContent = initials(e.name);
  if (e.profilePicture) {
    photo.src = e.profilePicture;
    photo.classList.remove("hidden");
    avatar.classList.add("hidden");
  } else {
    photo.removeAttribute("src");
    photo.classList.add("hidden");
    avatar.classList.remove("hidden");
  }
  $("#removeProfilePictureBtn").disabled = !e.profilePicture;
  $("#profileName").textContent = e.name;
  $("#profilePosition").textContent = e.position;
  $("#profileEmployeeId").textContent = e.id;
  $("#profileDepartment").textContent = e.department;
  $("#profileEmail").textContent = e.email;
  $("#profilePhone").textContent = e.phone;
  $("#profileJoined").textContent = formatDate(getRecruitedDate(e));
  $("#profileContractEnd").textContent = formatDateOrDash(getContractEndDate(e));
  $("#profileNameInput").value = e.name;
  $("#profileEmailInput").value = e.email;
  $("#profilePhoneInput").value = e.phone;
  $("#profilePositionInput").value = e.position;
  $("#profileAddressInput").value = e.address || "";
  $("#currentPasswordInput").value = "";
  $("#newPasswordInput").value = "";
  $("#confirmPasswordInput").value = "";
}


function handleProfilePicture(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    toast("Please select a valid image file.");
    event.target.value = "";
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    toast("Profile picture must be smaller than 5 MB.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      const size = Math.min(image.width, image.height);
      const startX = (image.width - size) / 2;
      const startY = (image.height - size) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, startX, startY, size, size, 0, 0, 400, 400);
      const employee = getEmployee(currentUser.employeeId);
      employee.profilePicture = canvas.toDataURL("image/jpeg", 0.82);
      saveState();
      renderProfile();
      event.target.value = "";
      toast("Profile picture updated.");
    };
    image.onerror = () => toast("The selected image could not be loaded.");
    image.src = reader.result;
  };
  reader.onerror = () => toast("The selected image could not be read.");
  reader.readAsDataURL(file);
}

function removeProfilePicture() {
  const employee = getEmployee(currentUser.employeeId);
  if (!employee || !employee.profilePicture) return;
  employee.profilePicture = "";
  saveState();
  renderProfile();
  toast("Profile picture removed.");
}

function saveProfile(e) {
  e.preventDefault();
  const employee = getEmployee(currentUser.employeeId);
  employee.name = $("#profileNameInput").value.trim();
  employee.email = $("#profileEmailInput").value.trim();
  employee.phone = $("#profilePhoneInput").value.trim();
  employee.position = $("#profilePositionInput").value.trim();
  employee.address = $("#profileAddressInput").value.trim();
  currentUser.name = employee.name;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
  saveState(); applyRoleAccess(); renderAll(); toast("Profile updated.");
}

function changePassword(e) {
  e.preventDefault();

  if (!currentUser) {
    toast("You must be logged in to change your password.");
    return;
  }

  const oldPassword = $("#currentPasswordInput").value;
  const newPassword = $("#newPasswordInput").value;
  const confirmPassword = $("#confirmPasswordInput").value;

  const account = state.users.find(user => user.employeeId === currentUser.employeeId || user.email.toLowerCase() === currentUser.email.toLowerCase());
  if (!account) {
    toast("User account not found.");
    return;
  }

  if (!verifyPassword(account, oldPassword)) {
    toast("Current password is incorrect.");
    return;
  }

  if (newPassword !== confirmPassword) {
    toast("New password and confirm password do not match.");
    return;
  }

  if (newPassword === DEFAULT_PASSWORD) {
    toast("Please choose a password different from the default password.");
    return;
  }

  const validationErrors = validatePassword(newPassword);
  if (validationErrors.length) {
    toast(validationErrors[0]);
    return;
  }

  account.passwordHash = hashPassword(newPassword);
  saveState();
  syncCurrentUserFromState();
  $("#currentPasswordInput").value = "";
  $("#newPasswordInput").value = "";
  $("#confirmPasswordInput").value = "";
  toast("Password changed successfully.");
}

function globalSearch(e) {
  const q = e.target.value.trim();
  if (!q) return;
  navigate("employees");
  $("#employeeSearch").value = q;
  renderEmployees();
}

function toggleMobileMenu() {
  const isOpen = $("#sidebar").classList.toggle("open");
  $("#sidebarOverlay").classList.toggle("open", isOpen);
  document.body.classList.toggle("menu-open", isOpen);
  $("#menuBtn").setAttribute("aria-expanded", String(isOpen));
}
function closeMobileMenu() {
  $("#sidebar").classList.remove("open");
  $("#sidebarOverlay").classList.remove("open");
  document.body.classList.remove("menu-open");
  $("#menuBtn").setAttribute("aria-expanded", "false");
}

function toggleNotificationPanel(event) {
  event.stopPropagation();
  const panel = $("#notificationPanel");
  const isOpen = panel.classList.contains("hidden");

  panel.classList.toggle("hidden", !isOpen);
  $("#notificationBtn").setAttribute("aria-expanded", String(isOpen));

  if (isOpen) {
    renderNotifications(true);
  }
}

function closeNotificationPanel() {
  const panel = $("#notificationPanel");
  if (!panel) return;

  panel.classList.add("hidden");
  $("#notificationBtn")?.setAttribute("aria-expanded", "false");
}

function handleDocumentClick(event) {
  const shell = $("#notificationShell");
  if (shell && !shell.contains(event.target)) {
    closeNotificationPanel();
  }
}

function handleGlobalKeydown(event) {
  if (event.key === "Escape") {
    closeNotificationPanel();
  }
}

function openModal() { $("#modalBackdrop").classList.remove("hidden"); }
function closeModal() { $("#modalBackdrop").classList.add("hidden"); editingEmployeeId = null; }

function toggleTheme() {
  document.body.classList.toggle("dark");
  $("#themeBtn").textContent = document.body.classList.contains("dark") ? "☀" : "☾";
}

function saveState() {
  const persistedState = {
    ...state,
    users: state.users.map(user => {
      const safeUser = { ...user };
      delete safeUser.password;
      return safeUser;
    })
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
}

function handleStorageSync(event) {
  if (event.key !== STORAGE_KEY || !event.newValue) return;

  state = normalizeState(JSON.parse(event.newValue));
  syncCurrentUserFromState();

  if (currentUser) {
    renderAll();
  }
}

function normalizeState(rawState) {
  const nextState = { ...rawState };
  nextState.employees = Array.isArray(nextState.employees) ? nextState.employees.map(normalizeEmployeeDates) : [];
  nextState.users = Array.isArray(nextState.users) ? nextState.users : [];
  nextState.notificationReads = Array.isArray(nextState.notificationReads) ? nextState.notificationReads : [];

  ensureDefaultAccounts(nextState);

  for (const user of nextState.users) {
    // Migrate legacy stored plaintext password to hashed storage.
    if (!user.passwordHash && user.password) {
      user.passwordHash = hashPassword(user.password);
      delete user.password;
    }

    if (!user.passwordHash) {
      user.passwordHash = hashPassword(DEFAULT_PASSWORD);
    }
  }

  return nextState;
}

function ensureDefaultAccounts(nextState) {
  const requiredAccounts = [
    { role: "hr", name: "HR Administrator", email: "hr@workforcepro.com", employeeId: "EMP-002" },
    { role: "director", name: "Department Director", email: "director@workforcepro.com", employeeId: "EMP-006" },
    { role: "employee", name: "Samuel Maduot", email: "employee@workforcepro.com", employeeId: "EMP-001" }
  ];

  for (const account of requiredAccounts) {
    const existing = nextState.users.find(user => user.email?.toLowerCase() === account.email.toLowerCase());
    if (existing) {
      existing.role = existing.role || account.role;
      existing.name = existing.name || account.name;
      existing.employeeId = existing.employeeId || account.employeeId;
      continue;
    }

    nextState.users.push({
      ...account,
      passwordHash: hashPassword(DEFAULT_PASSWORD)
    });
  }
}

function createEmployeeLogin(employee) {
  const existingUser = state.users.find(user => user.employeeId === employee.id || user.email.toLowerCase() === employee.email.toLowerCase());
  if (existingUser) {
    existingUser.name = employee.name;
    existingUser.email = employee.email;
    existingUser.employeeId = employee.id;
    existingUser.role = existingUser.role || "employee";
    if (!existingUser.passwordHash) {
      existingUser.passwordHash = hashPassword(DEFAULT_PASSWORD);
    }
    return existingUser;
  }

  const user = {
    role: "employee",
    name: employee.name,
    email: employee.email,
    passwordHash: hashPassword(DEFAULT_PASSWORD),
    employeeId: employee.id
  };

  state.users.push(user);
  return user;
}

function syncEmployeeUser(employee) {
  const user = state.users.find(item => item.employeeId === employee.id);
  if (!user) return;

  user.name = employee.name;
  user.email = employee.email;

  if (currentUser?.employeeId === employee.id) {
    currentUser = { ...currentUser, name: user.name, email: user.email };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
  }
}

function syncCurrentUserFromState() {
  if (!currentUser) return;

  const syncedUser = state.users.find(user => user.employeeId === currentUser.employeeId || (user.role === currentUser.role && user.email === currentUser.email));

  if (!syncedUser) {
    sessionStorage.removeItem(SESSION_KEY);
    currentUser = null;
    closeNotificationPanel();
    showLogin();
    return;
  }

  currentUser = { ...currentUser, ...syncedUser };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
}

function renderNotifications(markAsRead = false) {
  const notifications = buildNotifications();

  if (markAsRead || !$("#notificationPanel")?.classList.contains("hidden")) {
    markNotificationsAsRead(notifications.map(notification => notification.id), false);
  }

  const unreadCount = notifications.filter(notification => !state.notificationReads.includes(notification.id)).length;
  const badge = $("#notificationCount");
  badge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
  badge.classList.toggle("hidden", unreadCount === 0);

  $("#notificationSubtitle").textContent = notifications.length
    ? `${notifications.length} live update${notifications.length === 1 ? "" : "s"}`
    : "No alerts right now";

  $("#notificationList").innerHTML = notifications.length
    ? notifications.map(notification => {
        const unread = !state.notificationReads.includes(notification.id);
        return `<article class="notification-item ${notification.level} ${unread ? "unread" : ""}">
          <div class="notification-icon">${notification.icon}</div>
          <div>
            <strong>${notification.title}</strong>
            <p>${notification.message}</p>
            <small>${notification.meta}</small>
          </div>
        </article>`;
      }).join("")
    : `<div class="notification-empty">Everything is up to date.</div>`;
}

function startNotificationRealtimeUpdates() {
  if (notificationRealtimeTimer) {
    clearInterval(notificationRealtimeTimer);
  }

  notificationRealtimeTimer = setInterval(() => {
    if (!currentUser) return;
    renderNotifications();
  }, 5000);
}

function buildNotifications() {
  if (!currentUser) return [];

  syncAttendanceStatusesForDate(todayISO());

  const notifications = [];
  const today = todayISO();
  const activeEmployees = state.employees.filter(employee => employee.status === "Active");
  const lateRecords = state.attendance.filter(record => record.date === today && record.status === "Late");
  const pendingLeaves = state.leaves.filter(leave => leave.status === "Pending");
  const approvedLeavesToday = state.leaves.filter(leave => leave.status === "Approved" && leave.start <= today && leave.end >= today);

  if (currentUser.role === "employee") {
    const myRecord = state.attendance.find(record => record.employeeId === currentUser.employeeId && record.date === today);
    const myPendingLeaves = pendingLeaves.filter(leave => leave.employeeId === currentUser.employeeId);
    const myDecision = [...state.leaves]
      .filter(leave => leave.employeeId === currentUser.employeeId && ["Approved", "Rejected"].includes(leave.status))
      .sort((left, right) => right.id - left.id)[0];

    if (myRecord) {
      notifications.push({
        id: `attendance-${today}-${myRecord.status}`,
        level: myRecord.status === "Late" ? "warning" : "success",
        icon: myRecord.status === "Late" ? "⏱" : "✓",
        title: `Attendance marked ${myRecord.status.toLowerCase()}`,
        message: `Your check-in at ${myRecord.checkIn || "--:--"} has been recorded for today.`,
        meta: "Attendance status updates live"
      });
    } else if (isAfterNotificationThreshold(9, 0)) {
      notifications.push({
        id: `attendance-missing-${today}`,
        level: "danger",
        icon: "!",
        title: "You have not checked in yet",
        message: "Use the attendance action to record today’s check-in.",
        meta: "Reminder generated in real time"
      });
    }

    if (myPendingLeaves.length) {
      notifications.push({
        id: `leave-pending-self-${today}-${myPendingLeaves.length}`,
        level: "warning",
        icon: "📅",
        title: `${myPendingLeaves.length} leave request pending`,
        message: "Your leave request is still waiting for review.",
        meta: "Leave workflow update"
      });
    }

    if (myDecision) {
      notifications.push({
        id: `leave-decision-${myDecision.id}-${myDecision.status}`,
        level: myDecision.status === "Approved" ? "success" : "danger",
        icon: myDecision.status === "Approved" ? "✓" : "✕",
        title: `Leave request ${myDecision.status.toLowerCase()}`,
        message: `${myDecision.type} from ${formatDate(myDecision.start)} to ${formatDate(myDecision.end)} was ${myDecision.status.toLowerCase()}.`,
        meta: "Most recent leave decision"
      });
    }
  } else {
    if (pendingLeaves.length) {
      notifications.push({
        id: `leave-pending-team-${today}-${pendingLeaves.length}`,
        level: "warning",
        icon: "📅",
        title: `${pendingLeaves.length} leave request${pendingLeaves.length === 1 ? "" : "s"} waiting`,
        message: "Open the leave section to review pending requests.",
        meta: "Live team approval queue"
      });
    }

    if (lateRecords.length) {
      notifications.push({
        id: `attendance-late-${today}-${lateRecords.length}`,
        level: "danger",
        icon: "⏱",
        title: `${lateRecords.length} employee${lateRecords.length === 1 ? "" : "s"} marked late`,
        message: `${lateRecords.slice(0, 3).map(record => getEmployee(record.employeeId)?.name || record.employeeId).join(", ")}${lateRecords.length > 3 ? " and more" : ""}.`,
        meta: "Attendance updates refresh automatically"
      });
    }

    const missingCheckIns = activeEmployees.filter(employee => {
      if (approvedLeavesToday.some(leave => leave.employeeId === employee.id)) return false;
      return !state.attendance.some(record => record.employeeId === employee.id && record.date === today && record.checkIn);
    });

    if (missingCheckIns.length && isAfterNotificationThreshold(9, 0)) {
      notifications.push({
        id: `attendance-missing-team-${today}-${missingCheckIns.length}`,
        level: "warning",
        icon: "🔔",
        title: `${missingCheckIns.length} employee${missingCheckIns.length === 1 ? "" : "s"} still not checked in`,
        message: `${missingCheckIns.slice(0, 3).map(employee => employee.name).join(", ")}${missingCheckIns.length > 3 ? " and more" : ""}.`,
        meta: "Real-time attendance reminder"
      });
    }

    if (currentUser.role === "hr" && !state.payrollPaid) {
      notifications.push({
        id: `payroll-pending-${today}`,
        level: "warning",
        icon: "💳",
        title: "Payroll not processed",
        message: "This month’s payroll is still pending. Open payroll to process it.",
        meta: "HR reminder"
      });
    }
  }

  return notifications;
}

function markAllNotificationsRead(event) {
  event.stopPropagation();
  markNotificationsAsRead(buildNotifications().map(notification => notification.id));
  renderNotifications();
}

function markNotificationsAsRead(ids, persist = true) {
  const nextIds = ids.filter(Boolean);
  if (!nextIds.length) return;

  const merged = new Set(state.notificationReads);
  let changed = false;

  for (const id of nextIds) {
    if (!merged.has(id)) {
      merged.add(id);
      changed = true;
    }
  }

  if (!changed) return;

  state.notificationReads = [...merged];
  if (persist) saveState();
}

function getEmployee(id) { return state.employees.find(e => e.id === id); }
function getPerformance(id) { return state.performance.find(p => p.employeeId === id); }

function normalizeEmployeeDates(employee) {
  const recruited = employee?.dateRecruited || employee?.joined || todayISO();
  return {
    ...employee,
    dateRecruited: recruited,
    joined: employee?.joined || recruited,
    contractEndDate: employee?.contractEndDate || ""
  };
}

function getRecruitedDate(employee) {
  if (!employee) return todayISO();
  return employee.dateRecruited || employee.joined || todayISO();
}

function getContractEndDate(employee) {
  if (!employee) return "";
  return employee.contractEndDate || "";
}

function getScopedEmployees() {
  if (!currentUser) return [];

  if (currentUser.role === "employee") {
    return state.employees.filter(employee => employee.id === currentUser.employeeId);
  }

  if (currentUser.role === "director") {
    const directorDepartment = getEmployee(currentUser.employeeId)?.department;
    return state.employees.filter(employee => employee.department === directorDepartment);
  }

  return [...state.employees];
}

function statCard(label, value, icon, note) {
  return `<article class="stat-card"><div class="stat-top"><div class="stat-icon">${icon}</div><span class="trend">${note}</span></div><h3>${value}</h3><p>${label}</p></article>`;
}

function personRow(e) {
  return `<div class="person-row"><div class="person-avatar">${initials(e.name)}</div><div class="meta"><strong>${e.name}</strong><span>${e.position}</span></div>${badge(e.status)}</div>`;
}

function badge(status) {
  const cls = ["Active","Present","Approved","Paid"].includes(status) ? "success" : ["Pending","Late","On Leave"].includes(status) ? "warning" : ["Rejected","Inactive","Absent"].includes(status) ? "danger" : "info";
  return `<span class="badge ${cls}">${status}</span>`;
}

function initials(name) { return name.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase(); }
function titleCase(text) { return text.charAt(0).toUpperCase() + text.slice(1); }
function average(arr) { return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }
function formatDate(date) {
  if (!date) return "-";
  return new Date(date + "T00:00:00").toLocaleDateString("en", { day:"2-digit", month:"short", year:"numeric" });
}
function formatDateOrDash(date) {
  return date ? formatDate(date) : "-";
}
function money(value) { return new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", maximumFractionDigits:0 }).format(value); }

function daysBetween(start, end) {
  const a = new Date(start), b = new Date(end);
  return Math.max(1, Math.floor((b-a)/(1000*60*60*24))+1);
}

function calculateHours(start, end) {
  if (!start || !end) return "-";
  const [sh,sm] = start.split(":").map(Number), [eh,em] = end.split(":").map(Number);
  const mins = (eh*60+em)-(sh*60+sm);
  return mins > 0 ? `${Math.floor(mins/60)}h ${mins%60}m` : "-";
}

function getAttendanceStatusForTime(time) {
  const minutes = timeToMinutes(time);
  if (minutes === null) return "Absent";
  if (minutes >= LATE_START_MINUTES && minutes <= LATE_END_MINUTES) return "Late";
  return "Present";
}

function syncAttendanceStatusesForDate(date) {
  if (date !== todayISO()) return false;

  let changed = false;
  for (const record of state.attendance) {
    if (record.date !== date || !record.checkIn || ["Absent", "On Leave"].includes(record.status)) {
      continue;
    }

    const nextStatus = getAttendanceStatusForTime(record.checkIn);
    if (record.status !== nextStatus) {
      record.status = nextStatus;
      changed = true;
    }
  }

  if (changed) saveState();
  return changed;
}

function startAttendanceRealtimeUpdates() {
  if (attendanceRealtimeTimer) {
    clearInterval(attendanceRealtimeTimer);
  }

  attendanceRealtimeTimer = setInterval(() => {
    if (!currentUser) return;

    const selectedDate = $("#attendanceDate")?.value || todayISO();
    const changed = syncAttendanceStatusesForDate(selectedDate);
    renderNotifications();

    if (selectedDate === todayISO() || changed) {
      renderAttendance();
      renderDashboard();
    }
  }, 60000);
}

function timeToMinutes(time) {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function isAfterNotificationThreshold(hours, minutes) {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes() >= hours * 60 + minutes;
}

function hashPassword(password) {
  let hash = 5381;
  const input = String(password || '');

  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
    hash |= 0;
  }

  return `h${(hash >>> 0).toString(16)}`;
}

function verifyPassword(user, plainPassword) {
  if (!user) return false;

  if (user.passwordHash && user.passwordHash.startsWith('$2y$')) {
    // Legacy bcrypt hashes cannot be verified in this client-only mode.
    return plainPassword === DEFAULT_PASSWORD;
  }

  if (user.passwordHash) {
    return user.passwordHash === hashPassword(plainPassword);
  }

  return user.password === plainPassword;
}

function canRecoverWithDefaultPassword(user, plainPassword) {
  if (plainPassword !== DEFAULT_PASSWORD) return false;

  const defaultEmails = [
    'hr@workforcepro.com',
    'director@workforcepro.com',
    'employee@workforcepro.com'
  ];

  return defaultEmails.includes((user.email || '').toLowerCase());
}

function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push("Password must be at least 8 characters.");
  if (!/[A-Z]/.test(password)) errors.push("Password must include an uppercase letter.");
  if (!/[a-z]/.test(password)) errors.push("Password must include a lowercase letter.");
  if (!/[0-9]/.test(password)) errors.push("Password must include a number.");
  if (!/[@$!%*?&]/.test(password)) errors.push("Password must include one special character (@$!%*?&).");
  return errors;
}

function toast(message) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  $("#toastContainer").appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

window.openEmployeeModal = openEmployeeModal;
window.closeModal = closeModal;
window.viewEmployee = viewEmployee;
window.deleteEmployee = deleteEmployee;
window.editAttendance = editAttendance;
window.updateLeave = updateLeave;
window.cancelLeave = cancelLeave;
window.downloadPayslip = downloadPayslip;
