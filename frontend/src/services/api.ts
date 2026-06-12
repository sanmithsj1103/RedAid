// RedAid Frontend API Service — Real Backend Integration
// Connects to Express backend at API_BASE_URL

// ─── Configuration ───────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/v1';

// ─── Types ───────────────────────────────────────────────
export interface Location {
  lat: number;
  lng: number;
  city: string;
  address?: string;
}

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type RequestPriority = 'critical' | 'urgent' | 'scheduled';
export type RequestStatus = 'pending' | 'dispatched' | 'accepted' | 'en_route' | 'arrived' | 'completed' | 'cancelled' | 'expired';
export type ResponseStatus = 'notified' | 'accepted' | 'declined' | 'no_show' | 'donated' | 'cancelled' | 'en_route' | 'arrived';
export type AvailabilityStatus = 'active' | 'snoozed' | 'unavailable';

export interface Donor {
  id: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
  bloodGroup: BloodGroup;
  location: Location;
  availability: AvailabilityStatus;
  snoozeUntil: string | null;
  lastDonatedAt: string | null;
  trustScore: number;
  totalDonations: number;
  totalResponses: number;
  totalAccepted: number;
  badges: string[];
  healthDeclaration: Record<string, boolean>;
  isVerified: boolean;
  isBlacklisted: boolean;
}

export interface Hospital {
  id: string;
  name: string;
  registrationNumber: string;
  phone: string;
  email: string;
  address: string;
  location: Location;
  isVerified: boolean;
  isActive: boolean;
}

export interface BloodRequest {
  id: string;
  hospitalId: string;
  hospitalName: string;
  hospitalPhone: string;
  hospitalAddress: string;
  hospitalLocation: Location;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  unitsFulfilled: number;
  priority: RequestPriority;
  status: RequestStatus;
  notes: string;
  searchRadiusKm: number;
  donorsNotified: number;
  donorsAccepted: number;
  expiresAt: string;
  createdAt: string;
}

export interface DonationResponse {
  id: string;
  requestId: string;
  donorId: string;
  donorName: string;
  donorPhone: string;
  donorBloodGroup: BloodGroup;
  donorTrustScore: number;
  status: ResponseStatus;
  notifiedAt: string;
  respondedAt?: string;
  arrivedAt?: string;
  donatedAt?: string;
  hospitalRating?: number;
  hospitalFeedback?: string;
}

export interface BloodInventoryItem {
  bloodGroup: BloodGroup;
  unitsAvailable: number;
  lowStockThreshold: number;
}

export interface HospitalSurplus {
  id: string;
  hospitalId: string;
  hospitalName: string;
  bloodGroup: BloodGroup;
  unitsAvailable: number;
  expiresAt: string;
  isClaimed: boolean;
  claimedBy?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId?: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: any;
  createdAt: string;
}

// ─── Utility: snake_case ↔ camelCase ─────────────────────

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function convertKeysToCamel(obj: any): any {
  if (Array.isArray(obj)) return obj.map(convertKeysToCamel);
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.entries(obj).reduce((acc, [key, val]) => {
      acc[snakeToCamel(key)] = convertKeysToCamel(val);
      return acc;
    }, {} as Record<string, any>);
  }
  return obj;
}

function convertKeysToSnake(obj: any): any {
  if (Array.isArray(obj)) return obj.map(convertKeysToSnake);
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.entries(obj).reduce((acc, [key, val]) => {
      acc[camelToSnake(key)] = convertKeysToSnake(val);
      return acc;
    }, {} as Record<string, any>);
  }
  return obj;
}

// ─── Utility: PostGIS EWKB Point parser ─────────────────
// PostGIS returns geography as EWKB hex. For a 2D point (SRID 4326):
// Byte order(1) + WKB type(4) + SRID(4) + X/lon(8) + Y/lat(8) = 25 bytes = 50 hex chars
function parseEwkbPoint(hex: string): { lat: number; lng: number } | null {
  if (!hex || hex.length < 50) return null;
  try {
    // Detect byte order: 01 = little-endian, 00 = big-endian
    const byteOrder = hex.substring(0, 2);
    const isLE = byteOrder === '01';
    // Skip byte_order(2) + type(8) + srid(8) = 18 hex chars
    const coordHex = hex.substring(18);
    const lonHex = coordHex.substring(0, 16);
    const latHex = coordHex.substring(16, 32);

    function hexToFloat64(h: string, littleEndian: boolean): number {
      const bytes = new Uint8Array(8);
      for (let i = 0; i < 8; i++) {
        bytes[i] = parseInt(h.substring(i * 2, i * 2 + 2), 16);
      }
      const buf = new ArrayBuffer(8);
      const view = new DataView(buf);
      if (littleEndian) {
        for (let i = 0; i < 8; i++) view.setUint8(i, bytes[i]);
      } else {
        for (let i = 0; i < 8; i++) view.setUint8(i, bytes[i]);
      }
      return view.getFloat64(0, littleEndian);
    }

    const lng = hexToFloat64(lonHex, isLE);
    const lat = hexToFloat64(latHex, isLE);
    return { lat, lng };
  } catch {
    return null;
  }
}

// ─── Utility: Transform DB row into frontend-friendly shape ──

function transformDonorRow(row: any): any {
  if (!row) return row;
  // Parse location from PostGIS
  if (row.location && typeof row.location === 'string') {
    const coords = parseEwkbPoint(row.location);
    if (coords) {
      row.location = { ...coords, city: row.city || '', address: row.address || '' };
    }
  }
  // Map badges from array of badge objects to array of strings
  if (Array.isArray(row.badges)) {
    row.badges = row.badges.map((b: any) => (typeof b === 'string' ? b : b.badgeType || b.badge_type || b));
  }
  return row;
}

function transformHospitalRow(row: any): any {
  if (!row) return row;
  if (row.location && typeof row.location === 'string') {
    const coords = parseEwkbPoint(row.location);
    if (coords) {
      row.location = { ...coords, city: row.city || '', address: row.address || '' };
    }
  }
  return row;
}

function transformRequestRow(row: any): any {
  if (!row) return row;
  // Flatten joined hospital data if present
  if (row.hospitals) {
    const h = row.hospitals;
    row.hospitalName = h.name || h.hospitalName || '';
    row.hospitalPhone = h.phone || h.hospitalPhone || '';
    row.hospitalAddress = h.address || h.hospitalAddress || '';
    if (h.location && typeof h.location === 'string') {
      const coords = parseEwkbPoint(h.location);
      row.hospitalLocation = coords ? { ...coords, city: h.city || '' } : { lat: 0, lng: 0, city: h.city || '' };
    } else if (h.location) {
      row.hospitalLocation = h.location;
    }
    delete row.hospitals;
  }
  return row;
}

// ─── API Service Class ───────────────────────────────────

class ApiService {
  private accessToken: string | null = null;
  private activeUser: { id: string; role: 'donor' | 'hospital' | 'admin' } | null = null;
  private isRefreshing = false;
  private refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

  constructor() {
    // Restore session from sessionStorage
    const saved = sessionStorage.getItem('redaid_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.accessToken = parsed.accessToken || null;
        this.activeUser = parsed.activeUser || null;
      } catch {
        sessionStorage.removeItem('redaid_session');
      }
    }
  }

  private persistSession() {
    if (this.accessToken && this.activeUser) {
      sessionStorage.setItem('redaid_session', JSON.stringify({
        accessToken: this.accessToken,
        activeUser: this.activeUser,
      }));
    } else {
      sessionStorage.removeItem('redaid_session');
    }
  }

  // ─── Core HTTP Method ──────────────────────────────────

  private async request<T>(
    method: string,
    path: string,
    body?: any,
    options: { skipAuth?: boolean; rawResponse?: boolean } = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!options.skipAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const url = `${API_BASE_URL}${path}`;

    const res = await fetch(url, {
      method,
      headers,
      credentials: 'include', // Send cookies for refresh token
      body: body ? JSON.stringify(convertKeysToSnake(body)) : undefined,
    });

    // Handle 401 — attempt silent token refresh
    if (res.status === 401 && !options.skipAuth && !path.includes('/auth/refresh')) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        // Retry original request with new token
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryRes = await fetch(url, {
          method,
          headers,
          credentials: 'include',
          body: body ? JSON.stringify(convertKeysToSnake(body)) : undefined,
        });

        if (!retryRes.ok) {
          const errData = await retryRes.json().catch(() => ({}));
          throw new Error(errData.message || errData.error || `Request failed: ${retryRes.status}`);
        }

        const retryJson = await retryRes.json();
        return options.rawResponse ? retryJson : convertKeysToCamel(retryJson);
      }
      // Refresh failed — clear session
      this.accessToken = null;
      this.activeUser = null;
      this.persistSession();
      throw new Error('Session expired. Please log in again.');
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || `Request failed: ${res.status}`);
    }

    const json = await res.json();
    return options.rawResponse ? json : convertKeysToCamel(json);
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.refreshQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        this.refreshQueue.forEach(({ reject }) => reject(new Error('Refresh failed')));
        this.refreshQueue = [];
        return null;
      }

      const data = await res.json();
      this.accessToken = data.access_token;
      this.persistSession();

      // Resolve queued requests
      this.refreshQueue.forEach(({ resolve }) => resolve(this.accessToken!));
      this.refreshQueue = [];

      return this.accessToken;
    } catch {
      this.refreshQueue.forEach(({ reject }) => reject(new Error('Refresh failed')));
      this.refreshQueue = [];
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  // ─── Session Methods ───────────────────────────────────

  getActiveUser() {
    return Promise.resolve(this.activeUser);
  }

  async login(emailOrPhone: string, role: 'donor' | 'hospital' | 'admin', password?: string) {
    const body: Record<string, string> = {};

    if (role === 'admin') {
      body.email = 'sanmith-admin@gmail.com';
      body.password = password || emailOrPhone;
    } else if (role === 'hospital') {
      body.email = emailOrPhone;
      body.password = password || '';
    } else {
      // Donor login uses phone+password
      body.phone = emailOrPhone;
      body.password = password || '';
    }

    const res: any = await this.request('POST', '/auth/login', body, { skipAuth: true, rawResponse: true });

    this.accessToken = res.access_token;
    this.activeUser = {
      id: res.entity_id || res.entityId || '',
      role: (res.role as 'donor' | 'hospital' | 'admin') || role,
    };
    this.persistSession();

    return { success: true, user: this.activeUser };
  }

  async logout() {
    try {
      await this.request('POST', '/auth/logout', undefined, { skipAuth: true });
    } catch {
      // Logout should always succeed client-side
    }
    this.accessToken = null;
    this.activeUser = null;
    this.persistSession();
    return { success: true };
  }

  async sendOtp(phone: string) {
    return this.request<{ message: string }>('POST', '/auth/otp/send', { phone }, { skipAuth: true });
  }

  async verifyOtp(phone: string, code: string) {
    const res: any = await this.request('POST', '/auth/otp/verify', { phone, token: code }, { skipAuth: true, rawResponse: true });

    if (res.is_new_user || res.isNewUser) {
      // New user — store temp token for registration
      this.accessToken = res.access_token;
      this.persistSession();
      return { success: true, isNewUser: true };
    }

    // Existing user — session established
    this.accessToken = res.access_token;
    this.activeUser = {
      id: res.entity_id || '',
      role: (res.role as 'donor' | 'hospital' | 'admin') || 'donor',
    };
    this.persistSession();
    return { success: true, isNewUser: false, user: this.activeUser };
  }

  // ─── Registration Methods ──────────────────────────────

  async registerDonor(data: any) {
    const res: any = await this.request('POST', '/auth/donor/register', data);
    // After registration, the user must re-verify OTP to get updated token with role
    return { success: true, donorId: res.donorId || res.data?.donorId, role: 'donor' };
  }

  async registerHospital(data: any) {
    const res: any = await this.request('POST', '/auth/hospital/register', data);
    return { success: true, hospitalId: res.hospitalId || res.data?.hospitalId, role: 'hospital', isVerified: false };
  }

  // ─── Donor Portal Methods ──────────────────────────────

  async getDonorProfile(donorId?: string) {
    const res: any = await this.request('GET', '/donor/profile');
    return transformDonorRow(res.data || res);
  }

  async updateDonorProfile(fields: Partial<Donor>) {
    const res: any = await this.request('PATCH', '/donor/profile', fields);
    return transformDonorRow(res.data || res);
  }

  async setAvailability(status: AvailabilityStatus, snoozeUntil: string | null = null) {
    const body: any = { availability: status };
    if (snoozeUntil) body.snoozeUntil = snoozeUntil;
    const res: any = await this.request('PATCH', '/donor/availability', body);
    return transformDonorRow(res.data || res);
  }

  async getDonorActiveRequest() {
    const res: any = await this.request('GET', '/donor/requests/active');
    const data = res.data;
    if (!data) return null;
    return data;
  }

  async getDonorNotifications() {
    const res: any = await this.request('GET', '/donor/notifications');
    return res.data || [];
  }

  async respondToRequest(responseId: string, action: 'accept' | 'decline') {
    const res: any = await this.request('PATCH', `/donor/requests/${responseId}/respond`, { action });
    return { success: true, ...res };
  }

  async updateDonorResponseStatus(responseId: string, status: 'en_route' | 'arrived') {
    const res: any = await this.request('PATCH', `/donor/requests/${responseId}/status`, { status });
    return { success: true, ...res };
  }

  async getDonorDonationHistory() {
    const res: any = await this.request('GET', '/donor/history');
    return res.data || [];
  }

  async getDonorBadges() {
    const res: any = await this.request('GET', '/donor/badges');
    return res.data || {};
  }

  async deleteDonorAccount() {
    const res: any = await this.request('DELETE', '/donor/account');
    this.accessToken = null;
    this.activeUser = null;
    this.persistSession();
    return { success: true, ...res };
  }

  // ─── Hospital Portal Methods ───────────────────────────

  async getHospitalProfile(hospitalId?: string) {
    const res: any = await this.request('GET', '/hospital/profile');
    return transformHospitalRow(res.data || res);
  }

  async updateHospitalProfile(fields: Partial<Hospital>) {
    const res: any = await this.request('PATCH', '/hospital/profile', fields);
    return transformHospitalRow(res.data || res);
  }

  async updateDonor(donorId: string, fields: Partial<Donor>) {
    // Admin-level operation through admin routes
    const res: any = await this.request('PATCH', `/admin/donors/${donorId}/verify`, fields);
    return res.data || res;
  }

  async getHospitalInventory() {
    const res: any = await this.request('GET', '/hospital/inventory');
    return res.data || [];
  }

  async updateInventoryItem(bloodGroup: BloodGroup, unitsAvailable: number) {
    const encoded = encodeURIComponent(bloodGroup);
    const res: any = await this.request('PATCH', `/hospital/inventory/${encoded}`, { unitsAvailable });
    return res.data || [];
  }

  async createBloodRequest(data: { bloodGroup: BloodGroup; unitsRequired: number; priority: RequestPriority; notes: string }) {
    const res: any = await this.request('POST', '/hospital/requests', data);
    return transformRequestRow(res.data || res);
  }

  async getHospitalRequests() {
    const res: any = await this.request('GET', '/hospital/requests?limit=50');
    const items = res.data || [];
    return items.map(transformRequestRow);
  }

  async cancelRequest(requestId: string) {
    const res: any = await this.request('PATCH', `/hospital/requests/${requestId}/cancel`);
    return { success: true, ...res };
  }

  async getLiveRequestTracker(requestId: string) {
    const res: any = await this.request('GET', `/hospital/requests/${requestId}`);
    const data = res.data || res;
    const request = transformRequestRow({ ...data });
    // The response includes donation_responses joined as 'donationResponses' or 'responses'
    const responses = data.donationResponses || data.responses || [];
    return { request, responses };
  }

  async markDonationComplete(responseId: string, requestId?: string) {
    // requestId is needed for the backend route: /hospital/requests/:id/donors/:responseId/complete
    // If not provided, we need to look it up. For now require it.
    const reqId = requestId || 'unknown';
    const res: any = await this.request('PATCH', `/hospital/requests/${reqId}/donors/${responseId}/complete`);
    return { success: true, ...res };
  }

  async markDonorNoShow(responseId: string, requestId?: string) {
    const reqId = requestId || 'unknown';
    const res: any = await this.request('PATCH', `/hospital/requests/${reqId}/donors/${responseId}/no-show`);
    return { success: true, ...res };
  }

  async submitDonorFeedback(responseId: string, rating: number, feedback: string, requestId?: string) {
    const reqId = requestId || 'unknown';
    const res: any = await this.request('POST', `/hospital/requests/${reqId}/donors/${responseId}/rating`, { rating, feedback });
    return { success: true, ...res };
  }

  async getSurplusBloodListings() {
    const res: any = await this.request('GET', '/hospital/surplus');
    return res.data || [];
  }

  async publishSurplusBlood(bloodGroup: BloodGroup, unitsAvailable: number, hoursValid: number) {
    const res: any = await this.request('POST', '/hospital/surplus', {
      bloodGroup,
      unitsAvailable,
      expiresInHours: hoursValid,
    });
    return res.data || res;
  }

  async claimSurplusBlood(surplusId: string) {
    const res: any = await this.request('PATCH', `/hospital/surplus/${surplusId}/claim`);
    return { success: true, ...res };
  }

  // ─── Admin Portal Methods ──────────────────────────────

  async getAdminAnalytics() {
    const res: any = await this.request('GET', '/admin/analytics/overview');
    const data = res.data || res;
    // Transform to the shape the dashboard expects
    return {
      kpis: data,
      demandByGroup: data.demandByGroup || {},
      recentActivity: data.recentActivity || [],
    };
  }

  async getDonorsAdminList() {
    const res: any = await this.request('GET', '/admin/donors?limit=50');
    return res.data || [];
  }

  async getHospitalsAdminList() {
    const res: any = await this.request('GET', '/admin/hospitals?limit=50');
    return res.data || [];
  }

  async verifyHospital(hospitalId: string) {
    const res: any = await this.request('PATCH', `/admin/hospitals/${hospitalId}/verify`);
    return { success: true, ...res };
  }

  async blacklistDonor(donorId: string, blacklist: boolean) {
    const endpoint = blacklist
      ? `/admin/donors/${donorId}/blacklist`
      : `/admin/donors/${donorId}/unblacklist`;
    const res: any = await this.request('PATCH', endpoint);
    return { success: true, ...res };
  }

  async blacklistHospital(hospitalId: string, blacklist: boolean) {
    const endpoint = blacklist
      ? `/admin/hospitals/${hospitalId}/blacklist`
      : `/admin/hospitals/${hospitalId}/unblacklist`;
    const res: any = await this.request('PATCH', endpoint);
    return { success: true, ...res };
  }

  async getAuditLogs() {
    const res: any = await this.request('GET', '/admin/audit-logs?limit=50');
    return res.data || [];
  }

  async broadcastAnnouncement(title: string, message: string, targets: 'all' | 'donors' | 'hospitals') {
    const res: any = await this.request('POST', '/admin/broadcast', {
      title,
      body: message,
      filters: { role: targets === 'hospitals' ? 'all' : targets === 'donors' ? 'donor' : 'all' },
    });
    return { success: true, ...res };
  }
}

export const api = new ApiService();
