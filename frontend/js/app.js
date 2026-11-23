/**
 * Student Complaint Management System - Core Frontend Application Script
 * Provides authentication state, API communication, and UI helpers
 */

// Base API URL (relative path works seamlessly with Express server, Docker, and Nginx proxy)
const API_BASE = '/api';

// ==========================================
// Authentication State Management
// ==========================================
function setAuthData(token, user) {
  localStorage.setItem('scms_token', token);
  localStorage.setItem('scms_user', JSON.stringify(user));
}

function getToken() {
  return localStorage.getItem('scms_token');
}

function getUser() {
  const userJson = localStorage.getItem('scms_user');
  try {
    return userJson ? JSON.parse(userJson) : null;
  } catch (e) {
    return null;
  }
}

function logout() {
  localStorage.removeItem('scms_token');
  localStorage.removeItem('scms_user');
  window.location.href = 'login.html';
}

function isAuthenticated() {
  return !!getToken();
}

/**
 * Check page access authorization
 * Redirects unauthenticated users to login, and ensures role permissions
 */
function protectPage(requiredRole = null) {
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    window.location.href = 'login.html';
    return false;
  }

  if (requiredRole && user.role !== requiredRole) {
    alert(`Access denied. This page requires ${requiredRole} access.`);
    window.location.href = user.role === 'admin' ? 'admin-dashboard.html' : 'student-dashboard.html';
    return false;
  }

  return true;
}

// ==========================================
// API Request Helper
// ==========================================
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    // If token has expired or is invalid, redirect to login
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      alert('Your session has expired. Please log in again.');
      logout();
      return null;
    }

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error.message);
    throw error;
  }
}

// ==========================================
// UI Helpers
// ==========================================

/**
 * Display alert banner in the target container
 */
function showAlert(containerId, message, type = 'danger') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const icon = type === 'success' ? 'bi-check-circle-fill' : (type === 'warning' ? 'bi-exclamation-triangle-fill' : 'bi-exclamation-circle-fill');
  container.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2" role="alert">
      <i class="bi ${icon}"></i>
      <div class="flex-grow-1">${message}</div>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}

/**
 * Return styled badge HTML for complaint status
 */
function getStatusBadge(status) {
  const statusNormalized = (status || '').toLowerCase().replace(/\s+/g, '-');
  let icon = 'bi-clock';

  switch (status) {
    case 'Submitted':
      icon = 'bi-inbox';
      break;
    case 'Under Review':
      icon = 'bi-search';
      break;
    case 'In Progress':
      icon = 'bi-gear-wide-connected';
      break;
    case 'Resolved':
      icon = 'bi-check2-circle';
      break;
    case 'Rejected':
      icon = 'bi-x-circle';
      break;
  }

  return `<span class="badge-status status-${statusNormalized}"><i class="bi ${icon}"></i> ${status}</span>`;
}

/**
 * Format timestamp to readable date-time string
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Automatically update navigation header based on current auth state
 */
function updateNavHeader() {
  const authNavContainer = document.getElementById('auth-nav-items');
  if (!authNavContainer) return;

  const user = getUser();

  if (user) {
    const dashboardLink = user.role === 'admin' ? 'admin-dashboard.html' : 'student-dashboard.html';
    authNavContainer.innerHTML = `
      <li class="nav-item">
        <a class="nav-link" href="${dashboardLink}"><i class="bi bi-grid-fill me-1"></i> Dashboard</a>
      </li>
      ${user.role === 'student' ? `
      <li class="nav-item">
        <a class="nav-link" href="submit-complaint.html"><i class="bi bi-plus-circle me-1"></i> New Complaint</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="track-complaint.html"><i class="bi bi-search me-1"></i> Track</a>
      </li>` : ''}
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle d-flex align-items-center gap-1" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-person-circle fs-5 text-primary"></i>
          <span class="fw-medium">${user.name}</span>
          <span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'} ms-1">${user.role.toUpperCase()}</span>
        </a>
        <ul class="dropdown-menu dropdown-menu-end shadow-sm" aria-labelledby="userDropdown">
          <li><span class="dropdown-item-text text-muted small">${user.email}</span></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="${dashboardLink}"><i class="bi bi-speedometer2 me-2"></i>Dashboard</a></li>
          <li><button class="dropdown-item text-danger" onclick="logout()"><i class="bi bi-box-arrow-right me-2"></i>Sign Out</button></li>
        </ul>
      </li>
    `;
  } else {
    authNavContainer.innerHTML = `
      <li class="nav-item">
        <a class="nav-link" href="track-complaint.html"><i class="bi bi-search me-1"></i> Track Complaint</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="login.html"><i class="bi bi-box-arrow-in-right me-1"></i> Sign In</a>
      </li>
      <li class="nav-item ms-lg-2">
        <a class="btn btn-primary-custom btn-sm text-white" href="register.html">Student Register</a>
      </li>
    `;
  }
}

// Initialize navigation on page load
document.addEventListener('DOMContentLoaded', updateNavHeader);
