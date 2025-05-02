// Data storage
let students = JSON.parse(localStorage.getItem('students')) || [];
let attendanceRecords = JSON.parse(localStorage.getItem('attendance')) || [];
let routes = JSON.parse(localStorage.getItem('routes')) || [
  { id: 1, name: "Main Route", description: "Primary school route", vehicle: "NP-1234", driver: "John Doe" },
  { id: 2, name: "North Route", description: "Northern suburbs", vehicle: "NP-5678", driver: "Jane Smith" }
];

// DOM elements
const tableBody = document.getElementById('table-body');
const homeTotalStudentsEl = document.getElementById('home-total-students');
const presentTodayEl = document.getElementById('present-today');
const absentTodayEl = document.getElementById('absent-today'); // Added absent counter
const paidCountEl = document.getElementById('paid-count');
const unpaidCountEl = document.getElementById('unpaid-count');
const addStudentForm = document.getElementById('add-student-form');
const contactInput = document.getElementById('student-contact');
const routeSelect = document.getElementById('student-route');
const routeOther = document.getElementById('student-route-other');

// Initialize the app
function init() {
  renderTable();
  updateHomeStats();
  document.getElementById('attendance-date').valueAsDate = new Date();
  updateCurrentDate();
  updateTodayAttendance(); // Updated function name
  initSummaryTab();
  populateRouteDropdown();
  
  // Event listeners
  addStudentForm.addEventListener('submit', handleAddStudent);
  contactInput.addEventListener('input', validateContactNumber);
  document.getElementById('add-route-form').addEventListener('submit', handleAddRoute);
  routeSelect.addEventListener('change', function() {
    routeOther.style.display = this.value === 'Other' ? 'block' : 'none';
  });
  
  if (document.querySelector('.tab-content.active-tab').id === 'attendance') {
    loadAttendance();
  }
}

// Tab navigation
function openTab(tabName) {
  const tabContents = document.getElementsByClassName('tab-content');
  for (let i = 0; i < tabContents.length; i++) {
    tabContents[i].classList.remove('active-tab');
  }

  const tabButtons = document.getElementsByClassName('tab-btn');
  for (let i = 0; i < tabButtons.length; i++) {
    tabButtons[i].classList.remove('active');
  }

  document.getElementById(tabName).classList.add('active-tab');
  event.currentTarget.classList.add('active');

  if (tabName === 'attendance') {
    loadAttendance();
  } else if (tabName === 'summary') {
    generateReport();
  } else if (tabName === 'routes') {
    renderRoutes();
  }
}

// Populate route dropdown
function populateRouteDropdown() {
  routeSelect.innerHTML = '<option value="">Select Route</option>' + 
    routes.map(route => `<option value="${route.name}">${route.name}</option>`).join('') +
    '<option value="Other">Other (specify)</option>';
}

// Student management functions
function handleAddStudent(e) {
  e.preventDefault();
  
  const contactValue = contactInput.value.trim();
  
  // Validate form
  if (!validateForm()) {
    return;
  }
  
  // Get route value
  const routeValue = routeSelect.value === 'Other' ? routeOther.value.trim() : routeSelect.value;
  
  const newStudent = {
    id: Date.now(),
    name: document.getElementById('student-name').value.trim(),
    gender: document.getElementById('student-gender').value,
    contact: contactValue,
    route: routeValue,
    paid: false,
    lastPaymentUpdate: null
  };
  
  students.push(newStudent);
  saveData();
  renderTable();
  updateHomeStats();
  addStudentForm.reset();
  routeOther.style.display = 'none';
}

function validateForm() {
  let isValid = true;
  
  // Validate required fields
  const nameInput = document.getElementById('student-name');
  const genderSelect = document.getElementById('student-gender');
  const routeSelect = document.getElementById('student-route');
  
  // Clear previous errors
  document.getElementById('name-error').textContent = '';
  document.getElementById('gender-error').textContent = '';
  document.getElementById('route-error').textContent = '';
  
  if (!nameInput.value.trim()) {
    document.getElementById('name-error').textContent = 'Name is required';
    isValid = false;
  }
  
  if (!genderSelect.value) {
    document.getElementById('gender-error').textContent = 'Gender is required';
    isValid = false;
  }
  
  if (!routeSelect.value) {
    document.getElementById('route-error').textContent = 'Route is required';
    isValid = false;
  }
  
  // Validate custom route if selected
  if (routeSelect.value === 'Other' && !routeOther.value.trim()) {
    document.getElementById('route-error').textContent = 'Please specify a route';
    isValid = false;
  }
  
  // Validate contact number if provided
  const contactValue = contactInput.value.trim();
  if (contactValue && !isValidPhoneNumber(contactValue)) {
    document.getElementById('contact-error').textContent = 'Please enter a valid 10-digit number (with optional + prefix)';
    isValid = false;
  }
  
  return isValid;
}

function validateContactNumber() {
  const contactValue = contactInput.value.trim();
  const errorElement = document.getElementById('contact-error');
  
  if (contactValue && !isValidPhoneNumber(contactValue)) {
    errorElement.textContent = 'Please enter a valid 10-digit number (with optional + prefix)';
    contactInput.classList.add('invalid-input');
  } else {
    errorElement.textContent = '';
    contactInput.classList.remove('invalid-input');
  }
}

function isValidPhoneNumber(phone) {
  return /^\+?\d{10}$/.test(phone);
}

function deleteStudent(id) {
  if (confirm('Are you sure you want to remove this student?')) {
    students = students.filter(s => s.id !== id);
    attendanceRecords = attendanceRecords.filter(r => r.studentId !== id);
    saveData();
    renderTable();
    updateHomeStats();
    if (document.querySelector('.tab-content.active-tab').id === 'attendance') {
      loadAttendance();
    }
  }
}

// Render student table
function renderTable() {
  tableBody.innerHTML = '';
  students.forEach(student => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><a href="#" onclick="viewStudentDetails(${student.id}); return false;">${student.name}</a></td>
      <td>${student.gender}</td>
      <td>${student.contact || '-'}</td>
      <td>${student.route}</td>
      <td class="${student.paid ? 'paid' : 'unpaid'}">${student.paid ? 'Paid' : 'Pending'}</td>
      <td>
        <button onclick="togglePayment(${student.id})">Mark ${student.paid ? 'Unpaid' : 'Paid'}</button>
        <button onclick="viewStudentDetails(${student.id})">Details</button>
        <button onclick="deleteStudent(${student.id})" class="delete-btn">Remove</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// Toggle payment status
function togglePayment(id) {
  const student = students.find(s => s.id === id);
  if (student) {
    student.paid = !student.paid;
    student.lastPaymentUpdate = new Date().toLocaleDateString();
    saveData();
    renderTable();
    updateHomeStats();
  }
}

// Update stats in Home tab
function updateHomeStats() {
  const paidCount = students.filter(s => s.paid).length;
  const unpaidCount = students.filter(s => !s.paid).length;
  
  homeTotalStudentsEl.textContent = students.length;
  paidCountEl.textContent = paidCount;
  unpaidCountEl.textContent = unpaidCount;
  updateTodayAttendance(); // Updated function name
}

// Updated attendance tracking function (now tracks both present and absent)
function updateTodayAttendance() {
  const today = new Date().toISOString().slice(0, 10);
  const presentStudents = new Set();
  const absentStudents = new Set();
  
  // Get all student IDs marked present/absent today
  attendanceRecords.forEach(record => {
    if (record.date === today) {
      if (record.status === 'present') {
        presentStudents.add(record.studentId);
      } else if (record.status === 'absent') {
        absentStudents.add(record.studentId);
      }
    }
  });
  
  // Count only students that still exist in the system
  const validPresentCount = [...presentStudents].filter(id => 
    students.some(student => student.id === id)
  ).length;
  
  const validAbsentCount = [...absentStudents].filter(id => 
    students.some(student => student.id === id)
  ).length;
  
  presentTodayEl.textContent = validPresentCount;
  absentTodayEl.textContent = validAbsentCount;
}

// Initialize summary tab controls
function initSummaryTab() {
  const monthSelect = document.getElementById('month-select');
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  months.forEach((month, index) => {
    const option = document.createElement('option');
    option.value = index + 1;
    option.textContent = month;
    monthSelect.appendChild(option);
  });
  
  // Set current month as default
  monthSelect.value = new Date().getMonth() + 1;
  
  // Populate year dropdown (last 5 years)
  const yearSelect = document.getElementById('year-select');
  const currentYear = new Date().getFullYear();
  
  for (let i = 0; i < 5; i++) {
    const option = document.createElement('option');
    option.value = currentYear - i;
    option.textContent = currentYear - i;
    yearSelect.appendChild(option);
  }
  
  // Set current year as default
  yearSelect.value = currentYear;
}

// Generate report based on selections
function generateReport() {
  const reportType = document.getElementById('report-type').value;
  const month = document.getElementById('month-select').value;
  const year = document.getElementById('year-select').value;
  const statusFilter = document.getElementById('status-filter').value;
  
  if (reportType === 'attendance') {
    generateAttendanceReport(month, year, statusFilter);
  } else {
    generatePaymentReport(statusFilter);
  }
}

// Generate attendance report
function generateAttendanceReport(month, year, statusFilter) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const reportBody = document.getElementById('attendance-summary-body');
  reportBody.innerHTML = '';
  
  // Hide all reports first
  document.querySelectorAll('.report').forEach(r => r.style.display = 'none');
  document.getElementById('attendance-report').style.display = 'block';
  
  // Filter students based on payment status
  const filteredStudents = students.filter(student => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'paid') return student.paid;
    if (statusFilter === 'pending') return !student.paid;
    return true;
  });
  
  filteredStudents.forEach(student => {
    const studentRecords = attendanceRecords.filter(r => 
      r.studentId === student.id && 
      new Date(r.date) >= startDate && 
      new Date(r.date) <= endDate
    );
    
    const presentDays = studentRecords.filter(r => r.status === 'present').length;
    const absentDays = studentRecords.filter(r => r.status === 'absent').length;
    const totalDays = presentDays + absentDays;
    const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    
    let attendanceClass = '';
    if (totalDays > 0) {
      if (attendancePercent >= 90) attendanceClass = 'high-attendance';
      else if (attendancePercent < 70) attendanceClass = 'low-attendance';
      else attendanceClass = 'medium-attendance';
    }
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.name}</td>
      <td>${presentDays}</td>
      <td>${absentDays}</td>
      <td class="${attendanceClass}">
        ${totalDays > 0 ? attendancePercent + '%' : 'No data'}
      </td>
    `;
    reportBody.appendChild(row);
  });
}

// Generate payment report
function generatePaymentReport(statusFilter) {
  const reportBody = document.getElementById('payment-summary-body');
  reportBody.innerHTML = '';
  
  // Hide all reports first
  document.querySelectorAll('.report').forEach(r => r.style.display = 'none');
  document.getElementById('payment-report').style.display = 'block';
  
  // Filter students based on payment status
  const filteredStudents = students.filter(student => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'paid') return student.paid;
    if (statusFilter === 'pending') return !student.paid;
    return true;
  });
  
  filteredStudents.forEach(student => {
    const paidStatus = student.paid ? 'Paid' : 'Pending';
    const lastUpdated = student.lastPaymentUpdate || 'Never';
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.name}</td>
      <td class="${paidStatus === 'Paid' ? 'paid' : 'unpaid'}">${paidStatus}</td>
      <td>${lastUpdated}</td>
    `;
    reportBody.appendChild(row);
  });
}

// Attendance functions
function loadAttendance() {
  const date = document.getElementById('attendance-date').value || new Date().toISOString().slice(0,10);
  document.getElementById('attendance-date').value = date;
  
  const tbody = document.getElementById('attendance-body');
  tbody.innerHTML = '';
  
  students.forEach(student => {
    const record = attendanceRecords.find(r => 
      r.studentId === student.id && r.date === date
    );

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.name}</td>
      <td>${student.route}</td>
      <td>
        <button class="attendance-btn ${record?.status === 'present' ? 'present active' : 'present'}" 
          onclick="markAttendance(${student.id}, 'present', this)">Present</button>
        <button class="attendance-btn ${record?.status === 'absent' ? 'absent active' : 'absent'}" 
          onclick="markAttendance(${student.id}, 'absent', this)">Absent</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function markAttendance(studentId, status, button) {
  const date = document.getElementById('attendance-date').value;
  const row = button.closest('tr');
  
  // Update records
  attendanceRecords = attendanceRecords.filter(r => 
    !(r.studentId === studentId && r.date === date)
  );
  attendanceRecords.push({ date, studentId, status });
  
  // Update UI
  row.querySelectorAll('.attendance-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  button.classList.add('active');
  
  saveData();
  updateTodayAttendance(); // Updated function name
}

// Route management functions
function handleAddRoute(e) {
  e.preventDefault();
  
  const routeName = document.getElementById('route-name').value.trim();
  if (!routeName) {
    document.getElementById('route-name-error').textContent = 'Route name is required';
    return;
  }
  
  const newRoute = {
    id: Date.now(),
    name: routeName,
    description: document.getElementById('route-description').value.trim(),
    vehicle: document.getElementById('route-vehicle').value.trim(),
    driver: document.getElementById('route-driver').value.trim()
  };
  
  routes.push(newRoute);
  saveData();
  renderRoutes();
  populateRouteDropdown();
  document.getElementById('add-route-form').reset();
}

function renderRoutes() {
  const routeTableBody = document.getElementById('route-table-body');
  const routeCardsContainer = document.getElementById('route-cards-container');
  
  routeTableBody.innerHTML = '';
  routeCardsContainer.innerHTML = '';
  
  // Render route cards (statistics)
  routes.forEach(route => {
    const routeStudents = students.filter(s => s.route === route.name);
    const today = new Date().toISOString().slice(0, 10);
    const presentCount = attendanceRecords.filter(r => 
      r.date === today && 
      r.status === 'present' && 
      routeStudents.some(s => s.id === r.studentId)
    ).length;
    
    const card = document.createElement('div');
    card.className = 'route-card';
    card.innerHTML = `
      <h4>${route.name}</h4>
      <div class="route-stat">
        <span class="route-stat-label">Students:</span>
        <span class="route-stat-value">${routeStudents.length}</span>
      </div>
      <div class="route-stat">
        <span class="route-stat-label">Present Today:</span>
        <span class="route-stat-value">${presentCount}</span>
      </div>
      <div class="route-stat">
        <span class="route-stat-label">Vehicle:</span>
        <span class="route-stat-value">${route.vehicle || 'N/A'}</span>
      </div>
      <div class="route-stat">
        <span class="route-stat-label">Driver:</span>
        <span class="route-stat-value">${route.driver || 'N/A'}</span>
      </div>
    `;
    routeCardsContainer.appendChild(card);
  });
  
  // Render route table
  routes.forEach(route => {
    const routeStudents = students.filter(s => s.route === route.name);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${route.name}</td>
      <td>${route.description || '-'}</td>
      <td>${route.vehicle || '-'}</td>
      <td>${route.driver || '-'}</td>
      <td>${routeStudents.length}</td>
      <td class="route-actions">
        <button class="view-route-btn" onclick="viewRouteDetails(${route.id})">View</button>
        <button class="edit-route-btn" onclick="editRoute(${route.id})">Edit</button>
        <button class="delete-route-btn" onclick="deleteRoute(${route.id})">Delete</button>
      </td>
    `;
    routeTableBody.appendChild(row);
  });
}

function viewRouteDetails(routeId) {
  const route = routes.find(r => r.id === routeId);
  if (!route) return;
  
  const routeStudents = students.filter(s => s.route === route.name);
  
  alert(`Route: ${route.name}\n
Description: ${route.description || 'N/A'}\n
Vehicle: ${route.vehicle || 'N/A'}\n
Driver: ${route.driver || 'N/A'}\n
Total Students: ${routeStudents.length}\n
Students: ${routeStudents.map(s => s.name).join(', ') || 'None'}`);
}

function editRoute(routeId) {
  const route = routes.find(r => r.id === routeId);
  if (!route) return;
  
  const newName = prompt("Enter new route name:", route.name);
  if (newName && newName.trim()) {
    route.name = newName.trim();
    route.description = prompt("Enter new description:", route.description) || route.description;
    route.vehicle = prompt("Enter new vehicle number:", route.vehicle) || route.vehicle;
    route.driver = prompt("Enter new driver name:", route.driver) || route.driver;
    saveData();
    renderRoutes();
    populateRouteDropdown();
  }
}

function deleteRoute(routeId) {
  if (confirm("Are you sure you want to delete this route? Students assigned to this route will keep their route name but it won't be managed anymore.")) {
    routes = routes.filter(r => r.id !== routeId);
    saveData();
    renderRoutes();
    populateRouteDropdown();
  }
}

// Student details functions
function viewStudentDetails(studentId) {
  const student = students.find(s => s.id === studentId);
  if (!student) return;
  
  // Fill basic info
  document.getElementById('modal-student-name').textContent = student.name;
  document.getElementById('modal-gender').textContent = student.gender;
  document.getElementById('modal-contact').textContent = student.contact || 'N/A';
  document.getElementById('modal-route').textContent = student.route;
  document.getElementById('modal-payment').textContent = student.paid ? 'Paid' : 'Pending';
  document.getElementById('modal-payment').className = student.paid ? 'paid' : 'unpaid';
  document.getElementById('modal-last-update').textContent = student.lastPaymentUpdate || 'Never';
  
  // Fill attendance history (last 7 records)
  const historyBody = document.getElementById('attendance-history-body');
  historyBody.innerHTML = '';
  
  const studentAttendance = attendanceRecords
    .filter(r => r.studentId === studentId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 7);
  
  studentAttendance.forEach(record => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDateForDisplay(record.date)}</td>
      <td class="${record.status === 'present' ? 'paid' : 'unpaid'}">
        ${record.status.charAt(0).toUpperCase() + record.status.slice(1)}
      </td>
    `;
    historyBody.appendChild(row);
  });
  
  // Show modal
  document.getElementById('student-details-modal').style.display = 'block';
}

function closeModal() {
  document.getElementById('student-details-modal').style.display = 'none';
}

function formatDateForDisplay(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Date functions
function updateCurrentDate() {
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  document.getElementById('current-date').textContent = 
    new Date().toLocaleDateString(undefined, options);
}

// Save all data
function saveData() {
  localStorage.setItem('students', JSON.stringify(students));
  localStorage.setItem('attendance', JSON.stringify(attendanceRecords));
  localStorage.setItem('routes', JSON.stringify(routes));
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);