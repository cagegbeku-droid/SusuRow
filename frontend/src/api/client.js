import axios from 'axios';

// Detect whether app is running inside native Android/Capacitor (localhost) or web
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    const isNativeCapacitor = 
      window.location.hostname === 'localhost' ||
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'ionic:' ||
      window.location.origin.includes('localhost') ||
      !!window.Capacitor;

    if (isNativeCapacitor) {
      return 'https://susurow.onrender.com/api';
    }
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT Bearer token automatically if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('susurow_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication Endpoints
export const registerUser = async (payload) => {
  const res = await api.post('/auth/register', payload);
  return res.data;
};

export const loginUser = async (payload) => {
  const res = await api.post('/auth/login', payload);
  return res.data;
};

export const loginWithGoogle = async (payload) => {
  const res = await api.post('/auth/google', payload);
  return res.data;
};

export const sendOtp = async (payload) => {
  const res = await api.post('/auth/send-otp', payload);
  return res.data;
};

export const verifyOtp = async (payload) => {
  const res = await api.post('/auth/verify-otp', payload);
  return res.data;
};

export const getProfile = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

export const updateProfile = async (payload) => {
  const res = await api.put('/auth/profile', payload);
  return res.data;
};

export const submitKYC = async (payload) => {
  const res = await api.post('/auth/kyc', payload);
  return res.data;
};

export const setSecurityPIN = async (payload) => {
  const res = await api.post('/auth/pin', payload);
  return res.data;
};

export const configureWallets = async (payload) => {
  const res = await api.post('/auth/wallet', payload);
  return res.data;
};

export const configureAutoDebit = async (payload) => {
  const res = await api.post('/auth/auto-debit', payload);
  return res.data;
};

export const deactivateAccount = async () => {
  const res = await api.post('/auth/deactivate');
  return res.data;
};

export const deleteAccount = async () => {
  const res = await api.delete('/auth/account');
  return res.data;
};

// Group Endpoints
export const getGroups = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.frequency) params.append('frequency', filters.frequency);
  if (filters.rotation_type) params.append('rotation_type', filters.rotation_type);
  if (filters.status) params.append('status', filters.status);
  if (filters.is_private !== undefined) params.append('is_private', filters.is_private);
  if (filters.search) params.append('search', filters.search);

  const res = await api.get(`/groups?${params.toString()}`);
  return res.data;
};

export const getGroupDetail = async (groupId) => {
  const res = await api.get(`/groups/${groupId}`);
  return res.data;
};

export const getGroupByCode = async (inviteCode) => {
  const res = await api.get(`/groups/code/${inviteCode.trim()}`);
  return res.data;
};

export const getUserGroups = async (phoneNumber) => {
  const res = await api.get(`/groups/user/${encodeURIComponent(phoneNumber)}`);
  return res.data;
};

export const createGroup = async (groupData) => {
  const res = await api.post('/groups', groupData);
  return res.data;
};

export const deleteGroup = async (groupId, phoneNumber) => {
  const res = await api.delete(`/groups/${groupId}?phone_number=${encodeURIComponent(phoneNumber)}`);
  return res.data;
};

export const reopenGroup = async (groupId, phoneNumber) => {
  const res = await api.post(`/groups/reopen/${groupId}?phone_number=${encodeURIComponent(phoneNumber)}`);
  return res.data;
};

export const joinGroup = async (payload) => {
  const res = await api.post('/members/join', payload);
  return res.data;
};

export const submitBid = async (payload) => {
  const res = await api.post('/members/bid', payload);
  return res.data;
};

// Chat & Messages Endpoints
export const getGroupMessages = async (groupId) => {
  const res = await api.get(`/chat/${groupId}/messages`);
  return res.data;
};

export const sendGroupMessage = async (payload) => {
  const res = await api.post('/chat/send', payload);
  return res.data;
};

// Reminders
export const triggerDueReminders = async (groupId) => {
  const params = groupId ? `?group_id=${groupId}` : '';
  const res = await api.post(`/reminders/send-due-reminders${params}`);
  return res.data;
};

export const initiatePayment = async (payload) => {
  const res = await api.post('/payments/initiate', payload);
  return res.data;
};

export const submitPaymentOtp = async (payload) => {
  const res = await api.post('/payments/submit-otp', payload);
  return res.data;
};

export const verifyPayment = async (reference) => {
  const res = await api.get(`/payments/verify/${reference}`);
  return res.data;
};

export const processWebhookSettlement = async (payload) => {
  const res = await api.post('/payments/webhook', payload);
  return res.data;
};

export const simulateInstantPayment = async (payload) => {
  const res = await api.post('/payments/simulate-instant', payload);
  return res.data;
};

export const executeBallotDraw = async (payload) => {
  const res = await api.post('/rotation/ballot', payload);
  return res.data;
};

export const advanceRound = async (groupId, creatorPhone) => {
  const query = creatorPhone ? `?creator_phone=${encodeURIComponent(creatorPhone)}` : '';
  const res = await api.post(`/rotation/advance/${groupId}${query}`);
  return res.data;
};

export const getGroupPayouts = async (groupId) => {
  const res = await api.get(`/rotation/payouts/${groupId}`);
  return res.data;
};

export const getGroupPayments = async (groupId) => {
  const res = await api.get(`/payments/${groupId}`);
  return res.data;
};

export const getPlatformStats = async () => {
  const res = await api.get('/stats');
  return res.data;
};

export const getUserTransactions = async () => {
  const res = await api.get('/auth/transactions');
  return res.data;
};

export const resolveMoMoAccount = async (payload) => {
  const res = await api.post('/auth/resolve-momo', payload);
  return res.data;
};

// ==========================================
// Executive Admin Panel API Endpoints
// ==========================================

export const getAdminMetrics = async () => {
  const res = await api.get('/admin/metrics');
  return res.data;
};

export const getAdminUsers = async (params = {}) => {
  const res = await api.get('/admin/users', { params });
  return res.data;
};

export const updateUserKycStatus = async (userId, status, note = '') => {
  const res = await api.post(`/admin/users/${userId}/kyc-status`, { status, note });
  return res.data;
};

export const toggleUserFreeze = async (userId) => {
  const res = await api.post(`/admin/users/${userId}/toggle-freeze`);
  return res.data;
};

export const toggleUserAdmin = async (userId) => {
  const res = await api.post(`/admin/users/${userId}/toggle-admin`);
  return res.data;
};

export const getAdminCircles = async (params = {}) => {
  const res = await api.get('/admin/circles', { params });
  return res.data;
};

export const getAdminCircleMembers = async (groupId) => {
  const res = await api.get(`/admin/circles/${groupId}/members`);
  return res.data;
};

export const overrideCirclePayout = async (groupId) => {
  const res = await api.post(`/admin/circles/${groupId}/payout-override`);
  return res.data;
};

export const getAdminTransactions = async (params = {}) => {
  const res = await api.get('/admin/transactions', { params });
  return res.data;
};

export const reconcileTransaction = async (txId, note = 'Manual reconciliation') => {
  const res = await api.post(`/admin/transactions/${txId}/reconcile`, { note });
  return res.data;
};

export const broadcastAdminSMS = async (payload) => {
  const res = await api.post('/admin/broadcast-sms', payload);
  return res.data;
};

export const adminDeleteCircle = async (groupId) => {
  const res = await api.delete(`/admin/groups/${groupId}`);
  return res.data;
};

export const adminPurgeTestData = async () => {
  const res = await api.post('/admin/system/purge-test-data');
  return res.data;
};

export const getAdminTreasury = async () => {
  const res = await api.get('/admin/treasury');
  return res.data;
};

export const adminWithdrawRevenue = async (payload) => {
  const res = await api.post('/admin/treasury/withdraw', payload);
  return res.data;
};

export default api;

