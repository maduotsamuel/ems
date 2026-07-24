/**
 * WorkforcePro - API-Based Frontend
 * Uses PHP backend instead of localStorage
 */

const API_URL = '/emm/api';
const CSRF_STORAGE_KEY = 'workforceProCsrfToken';

// ============================================
// API SERVICE
// ============================================
class APIService {
  static async request(method, endpoint, data = null) {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include' // Include session cookies
    };

    const csrfToken = this.getCsrfToken();
    if (csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      options.headers['X-CSRF-Token'] = csrfToken;
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'API Error');
      }

      return result.data || result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  static get(endpoint) {
    return this.request('GET', endpoint);
  }

  static post(endpoint, data) {
    return this.request('POST', endpoint, data);
  }

  static put(endpoint, data) {
    return this.request('PUT', endpoint, data);
  }

  static delete(endpoint) {
    return this.request('DELETE', endpoint);
  }

  static getCsrfToken() {
    return window.sessionStorage.getItem(CSRF_STORAGE_KEY) || window.localStorage.getItem(CSRF_STORAGE_KEY) || '';
  }

  static setCsrfToken(token) {
    if (!token) return;
    window.sessionStorage.setItem(CSRF_STORAGE_KEY, token);
  }

  static clearCsrfToken() {
    window.sessionStorage.removeItem(CSRF_STORAGE_KEY);
    window.localStorage.removeItem(CSRF_STORAGE_KEY);
  }
}

// ============================================
// AUTHENTICATION
// ============================================
class AuthService {
  static async login(email, password, role) {
    try {
      const response = await APIService.post('/auth/login', { email, password, role });
      APIService.setCsrfToken(response.csrf_token);
      currentUser = response.user;
      return response;
    } catch (error) {
      showError('Login failed: ' + error.message);
      throw error;
    }
  }

  static async logout() {
    try {
      await APIService.post('/auth/logout', {});
      currentUser = null;
      APIService.clearCsrfToken();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  static async getMe() {
    try {
      const response = await APIService.get('/auth/me');
      APIService.setCsrfToken(response.csrf_token);
      return response.user;
    } catch (error) {
      APIService.clearCsrfToken();
      return null;
    }
  }

  static async changePassword(oldPassword, newPassword, confirmPassword) {
    try {
      const response = await APIService.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  static async resetPassword(userId) {
    try {
      const response = await APIService.post('/auth/reset-password', { user_id: userId });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

// ============================================
// EMPLOYEE SERVICE
// ============================================
class EmployeeService {
  static async getAll() {
    return APIService.get('/employees');
  }

  static async getById(id) {
    return APIService.get(`/employees/${id}`);
  }

  static async create(employee) {
    return APIService.post('/employees', employee);
  }

  static async update(id, employee) {
    return APIService.put(`/employees/${id}`, employee);
  }

  static async delete(id) {
    return APIService.delete(`/employees/${id}`);
  }
}

// ============================================
// ATTENDANCE SERVICE
// ============================================
class AttendanceService {
  static async getByDate(date) {
    return APIService.get(`/attendance?date=${date}`);
  }

  static async record(employeeId, data) {
    return APIService.post('/attendance', {
      employee_id: employeeId,
      ...data
    });
  }

  static async update(id, data) {
    return APIService.put(`/attendance/${id}`, data);
  }
}

// ============================================
// LEAVE SERVICE
// ============================================
class LeaveService {
  static async getAll() {
    return APIService.get('/leaves');
  }

  static async create(leave) {
    return APIService.post('/leaves', leave);
  }

  static async update(id, data) {
    return APIService.put(`/leaves/${id}`, data);
  }
}

// ============================================
// DEPARTMENT SERVICE
// ============================================
class DepartmentService {
  static async getAll() {
    return APIService.get('/departments');
  }

  static async create(department) {
    return APIService.post('/departments', department);
  }
}

// ============================================
// PERFORMANCE SERVICE
// ============================================
class PerformanceService {
  static async getAll() {
    return APIService.get('/performance');
  }

  static async create(review) {
    return APIService.post('/performance', review);
  }
}

// ============================================
// PAYROLL SERVICE
// ============================================
class PayrollService {
  static async getByMonth(month) {
    return APIService.get(`/payroll?month=${month}`);
  }

  static async process() {
    return APIService.post('/payroll/process', {});
  }
}

// ============================================
// GLOBAL STATE
// ============================================
let currentUser = null;

// ============================================
// UI UTILITIES
// ============================================
function showSuccess(message) {
  const el = document.getElementById('successMessage');
  if (el) {
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
  }
}

function showError(message) {
  const el = document.getElementById('errorMessage');
  if (el) {
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 5000);
  }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is logged in
  const user = await AuthService.getMe();
  if (user) {
    currentUser = user;
    showApp();
  } else {
    showLogin();
  }
});

// ============================================
// LOGIN HANDLER
// ============================================
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const role = document.getElementById('loginRole').value;

  try {
    await AuthService.login(email, password, role);
    showSuccess('Login successful!');
    showApp();
  } catch (error) {
    showError('Login failed. Please check your credentials.');
  }
});

// ============================================
// LOGOUT HANDLER
// ============================================
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await AuthService.logout();
  showLogin();
});

// ============================================
// LOAD DATA FUNCTIONS (Updated for API)
// ============================================
async function loadEmployees() {
  try {
    const employees = await EmployeeService.getAll();
    state.employees = employees;
    displayEmployees();
  } catch (error) {
    showError('Failed to load employees: ' + error.message);
  }
}

async function loadDepartments() {
  try {
    const departments = await DepartmentService.getAll();
    state.departments = departments;
  } catch (error) {
    console.error('Failed to load departments:', error);
  }
}

async function loadAttendance() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const attendance = await AttendanceService.getByDate(today);
    state.attendance = attendance;
    displayAttendance();
  } catch (error) {
    showError('Failed to load attendance: ' + error.message);
  }
}

async function loadLeaves() {
  try {
    const leaves = await LeaveService.getAll();
    state.leaves = leaves;
  } catch (error) {
    console.error('Failed to load leaves:', error);
  }
}

// ============================================
// HELPER: state object (keeps structure)
// ============================================
const state = {
  employees: [],
  departments: [],
  attendance: [],
  leaves: [],
  performance: []
};

// Re-export and adapt existing functions for API
function showApp() {
  document.getElementById('loginView').classList.add('hidden');
  document.getElementById('appView').classList.remove('hidden');
  navigate('dashboard');
  
  // Load initial data
  loadEmployees();
  loadDepartments();
  loadAttendance();
  loadLeaves();
}

function showLogin() {
  document.getElementById('loginView').classList.remove('hidden');
  document.getElementById('appView').classList.add('hidden');
}
