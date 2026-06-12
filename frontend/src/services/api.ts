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

<<<<<<< HEAD
// --- Initial Mock Data ---
const INITIAL_DONORS: Donor[] = [
  {
    id: 'donor_julianne',
    fullName: 'Julianne Dorsey',
    phone: '+919876543220',
    dateOfBirth: '1997-04-12',
    bloodGroup: 'O+',
    location: { lat: 12.9812, lng: 77.7320, city: 'Bengaluru', address: 'Hope Farm, Bengaluru' },
    availability: 'active',
    snoozeUntil: null,
    lastDonatedAt: '2023-10-12T12:00:00Z',
    trustScore: 98,
    totalDonations: 14,
    totalResponses: 15,
    totalAccepted: 14,
    badges: ['lifesaver', 'veteran'],
    healthDeclaration: { noTattoosRecent: true, noMedicationRecent: true, generalFitness: true },
    isVerified: true,
    isBlacklisted: false,
  },
  {
    id: 'donor_marcus',
    fullName: 'Marcus Kinsley',
    phone: '+919876543221',
    dateOfBirth: '1993-02-14',
    bloodGroup: 'AB-',
    location: { lat: 12.9242, lng: 77.7121, city: 'Bengaluru', address: 'Bellandur, Bengaluru' },
    availability: 'snoozed',
    snoozeUntil: '2026-07-20T18:00:00Z',
    lastDonatedAt: '2023-11-22T12:00:00Z',
    trustScore: 85,
    totalDonations: 8,
    totalResponses: 10,
    totalAccepted: 8,
    badges: ['veteran'],
    healthDeclaration: { noTattoosRecent: true, noMedicationRecent: true, generalFitness: true },
    isVerified: true,
    isBlacklisted: false,
  },
  {
    id: 'donor_sarah_r',
    fullName: 'Sarah Richardson',
    phone: '+919876543222',
    dateOfBirth: '1994-09-08',
    bloodGroup: 'A-',
    location: { lat: 12.9620, lng: 77.7580, city: 'Bengaluru', address: 'Channasandra, Bengaluru' },
    availability: 'active',
    snoozeUntil: null,
    lastDonatedAt: '2023-12-05T12:00:00Z',
    trustScore: 92,
    totalDonations: 21,
    totalResponses: 25,
    totalAccepted: 21,
    badges: ['lifesaver', 'veteran', 'streak_5'],
    healthDeclaration: { noTattoosRecent: true, noMedicationRecent: true, generalFitness: true },
    isVerified: true,
    isBlacklisted: false,
  },
  {
    id: 'donor_thomas',
    fullName: 'Thomas Bennington',
    phone: '+919876543223',
    dateOfBirth: '1989-10-10',
    bloodGroup: 'B+',
    location: { lat: 12.8710, lng: 77.6840, city: 'Bengaluru', address: 'Electronic City, Bengaluru' },
    availability: 'unavailable',
    snoozeUntil: null,
    lastDonatedAt: '2023-09-15T12:00:00Z',
    trustScore: 72,
    totalDonations: 5,
    totalResponses: 8,
    totalAccepted: 5,
    badges: ['veteran'],
    healthDeclaration: { noTattoosRecent: true, noMedicationRecent: true, generalFitness: true },
    isVerified: true,
    isBlacklisted: false,
  },
  {
    id: 'donor_anita',
    fullName: 'Anita Lowman',
    phone: '+919876543224',
    dateOfBirth: '1991-05-15',
    bloodGroup: 'O-',
    location: { lat: 12.9412, lng: 77.7210, city: 'Bengaluru', address: 'Marathahalli, Bengaluru' },
    availability: 'active',
    snoozeUntil: null,
    lastDonatedAt: '2024-01-18T12:00:00Z',
    trustScore: 100,
    totalDonations: 32,
    totalResponses: 32,
    totalAccepted: 32,
    badges: ['lifesaver', 'veteran', 'streak_5'],
    healthDeclaration: { noTattoosRecent: true, noMedicationRecent: true, generalFitness: true },
    isVerified: true,
    isBlacklisted: false,
  },
  {
    id: 'donor_adrian',
    fullName: 'Adrian Sterling',
    phone: '+919876543225',
    dateOfBirth: '1996-07-20',
    bloodGroup: 'O-',
    location: { lat: 12.9512, lng: 77.7310, city: 'Bengaluru', address: 'Brookefield, Bengaluru' },
    availability: 'active',
    snoozeUntil: null,
    lastDonatedAt: '2023-10-12T12:00:00Z',
    trustScore: 98,
    totalDonations: 10,
    totalResponses: 11,
    totalAccepted: 10,
    badges: ['lifesaver', 'streak_3'],
    healthDeclaration: { noTattoosRecent: true, noMedicationRecent: true, generalFitness: true },
    isVerified: true,
    isBlacklisted: false,
  },
  {
    id: 'donor_1',
    fullName: 'Arjun Sharma',
    phone: '+919876543210',
    dateOfBirth: '1998-05-12',
    bloodGroup: 'O+',
    location: { lat: 12.9716, lng: 77.5946, city: 'Bengaluru', address: 'Indiranagar, Bengaluru' },
    availability: 'active',
    snoozeUntil: null,
    lastDonatedAt: '2026-02-15T10:00:00Z',
    trustScore: 98.5,
    totalDonations: 4,
    totalResponses: 10,
    totalAccepted: 4,
    badges: ['first_donation', 'streak_3', 'lifesaver'],
    healthDeclaration: { noTattoosRecent: true, noMedicationRecent: true, generalFitness: true },
    isVerified: true,
    isBlacklisted: false,
  },
  {
    id: 'donor_samuel',
    fullName: 'Samuel Richardson',
    phone: '+1 (555) 012-3456',
    dateOfBirth: '2000-01-01',
    bloodGroup: 'O+',
    location: { lat: 28.6139, lng: 77.2090, city: 'New Delhi', address: 'Sector 12, New Delhi' },
    availability: 'active',
    snoozeUntil: null,
    lastDonatedAt: '2023-10-24T12:00:00Z',
    trustScore: 85,
    totalDonations: 12,
    totalResponses: 15,
    totalAccepted: 12,
    badges: ['lifesaver', 'veteran', 'streak_3', 'first_donation', 'gold_donor'],
    healthDeclaration: { noTattoosRecent: true, noMedicationRecent: true, generalFitness: true },
    isVerified: true,
    isBlacklisted: false,
=======
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
>>>>>>> 385aa2671327c2bf0c83f743dca091d87ce46fa4
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
<<<<<<< HEAD
    let loadedDonors = loadData('donors', INITIAL_DONORS);
    if (!loadedDonors.some(d => d.fullName === 'Samuel Richardson')) {
      localStorage.removeItem('redaid_donors');
      localStorage.removeItem('redaid_hospitals');
      localStorage.removeItem('redaid_requests');
      localStorage.removeItem('redaid_responses');
      localStorage.removeItem('redaid_inventory');
      localStorage.removeItem('redaid_surplus');
      localStorage.removeItem('redaid_audit_logs');
      localStorage.removeItem('redaid_active_user');
      loadedDonors = INITIAL_DONORS;
    }
    this.donors = loadedDonors;
    this.hospitals = loadData('hospitals', INITIAL_HOSPITALS);
    this.requests = loadData('requests', INITIAL_REQUESTS);
    this.responses = loadData('responses', INITIAL_RESPONSES);
    this.inventory = loadData('inventory', INITIAL_INVENTORY);
    this.surplus = loadData('surplus', INITIAL_SURPLUS);
    this.auditLogs = loadData('audit_logs', []);
    this.activeUser = loadData('active_user', { id: 'donor_samuel', role: 'donor' }); // Default active user to donor_samuel for testing donor portal
  }

  private persist() {
    saveData('donors', this.donors);
    saveData('hospitals', this.hospitals);
    saveData('requests', this.requests);
    saveData('responses', this.responses);
    saveData('inventory', this.inventory);
    saveData('surplus', this.surplus);
    saveData('audit_logs', this.auditLogs);
    saveData('active_user', this.activeUser);
  }

  private delay<T>(value: T): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(value), 500));
  }

  private log(action: string, entityType: string, entityId: string, metadata: any = {}) {
    const log: AuditLog = {
      id: `log_${Math.random().toString(36).substr(2, 9)}`,
      actorId: this.activeUser?.id,
      actorRole: this.activeUser?.role || 'system',
      action,
      entityType,
      entityId,
      metadata,
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    this.persist();
  }

  // --- Session Methods ---
  getActiveUser() {
    return this.delay(this.activeUser);
  }

  login(phone: string, role: 'donor' | 'hospital' | 'admin') {
    if (role === 'admin') {
      this.activeUser = { id: 'admin_1', role: 'admin' };
      this.log('auth.login', 'admin', 'admin_1');
      this.persist();
      return this.delay({ success: true, user: this.activeUser });
    }

    if (role === 'donor') {
      const cleanPhoneInput = phone.replace(/\D/g, '');
      const donor = this.donors.find(d => d.phone.replace(/\D/g, '') === cleanPhoneInput);
      if (donor) {
        if (donor.isBlacklisted) throw new Error('Your account has been blacklisted.');
        this.activeUser = { id: donor.id, role: 'donor' };
        this.log('auth.login', 'donor', donor.id);
        this.persist();
        return this.delay({ success: true, user: this.activeUser, profile: donor });
=======
    // Restore session from sessionStorage
    const saved = sessionStorage.getItem('redaid_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.accessToken = parsed.accessToken || null;
        this.activeUser = parsed.activeUser || null;
      } catch {
        sessionStorage.removeItem('redaid_session');
>>>>>>> 385aa2671327c2bf0c83f743dca091d87ce46fa4
      }
    }
  }

<<<<<<< HEAD
  logout() {
    if (this.activeUser) {
      this.log('auth.logout', this.activeUser.role, this.activeUser.id);
    }
    this.activeUser = null;
    this.persist();
    return this.delay({ success: true });
  }

  sendOtp(phone: string) {
    console.log(`[OTP Engine] Generating OTP code for: ${phone}`);
    return this.delay({ success: true, otpSent: true });
  }

  verifyOtp(phone: string, code: string) {
    console.log(`[OTP Engine] Verified OTP code: ${code} for phone: ${phone}`);
    return this.delay({ success: true });
  }

  // --- Registration Methods ---
  registerDonor(data: Omit<Donor, 'id' | 'trustScore' | 'totalDonations' | 'totalResponses' | 'totalAccepted' | 'badges' | 'isVerified' | 'isBlacklisted' | 'lastDonatedAt' | 'snoozeUntil'>) {
    const newDonor: Donor = {
      ...data,
      id: `donor_${Math.random().toString(36).substr(2, 9)}`,
      trustScore: 100,
      totalDonations: 0,
      totalResponses: 0,
      totalAccepted: 0,
      badges: [],
      lastDonatedAt: null,
      snoozeUntil: null,
      isVerified: true,
      isBlacklisted: false,
    };
    this.donors.push(newDonor);
    this.activeUser = { id: newDonor.id, role: 'donor' };
    this.log('donor.register', 'donor', newDonor.id);
    this.persist();
    return this.delay({ success: true, user: this.activeUser, profile: newDonor });
  }

  registerHospital(data: Omit<Hospital, 'id' | 'isVerified' | 'isActive'>) {
    const newHosp: Hospital = {
      ...data,
      id: `hospital_${Math.random().toString(36).substr(2, 9)}`,
      isVerified: false, // requires admin verification
      isActive: true,
    };
    this.hospitals.push(newHosp);
    // Initialize empty inventory for new hospital
    this.inventory[newHosp.id] = [
      { bloodGroup: 'A+', unitsAvailable: 0, lowStockThreshold: 2 },
      { bloodGroup: 'A-', unitsAvailable: 0, lowStockThreshold: 2 },
      { bloodGroup: 'B+', unitsAvailable: 0, lowStockThreshold: 2 },
      { bloodGroup: 'B-', unitsAvailable: 0, lowStockThreshold: 2 },
      { bloodGroup: 'AB+', unitsAvailable: 0, lowStockThreshold: 2 },
      { bloodGroup: 'AB-', unitsAvailable: 0, lowStockThreshold: 2 },
      { bloodGroup: 'O+', unitsAvailable: 0, lowStockThreshold: 2 },
      { bloodGroup: 'O-', unitsAvailable: 0, lowStockThreshold: 2 },
    ];
    this.activeUser = { id: newHosp.id, role: 'hospital' };
    this.log('hospital.register', 'hospital', newHosp.id);
    this.persist();
    return this.delay({ success: true, user: this.activeUser, profile: newHosp });
  }

  // --- Donor Portal Methods ---
  getDonorProfile(donorId?: string) {
    const id = donorId || this.activeUser?.id;
    const donor = this.donors.find(d => d.id === id);
    if (!donor) throw new Error('Donor profile not found');
    return this.delay(donor);
  }

  updateDonorProfile(fields: Partial<Donor>) {
    if (!this.activeUser || this.activeUser.role !== 'donor') throw new Error('Unauthorized');
    this.donors = this.donors.map(d => {
      if (d.id === this.activeUser!.id) {
        const updated = { ...d, ...fields };
        this.log('donor.update_profile', 'donor', d.id, fields);
        return updated;
      }
      return d;
    });
    this.persist();
    return this.getDonorProfile();
  }

  setAvailability(status: AvailabilityStatus, snoozeUntil: string | null = null) {
    if (!this.activeUser || this.activeUser.role !== 'donor') throw new Error('Unauthorized');
    this.donors = this.donors.map(d => {
      if (d.id === this.activeUser!.id) {
        const updated = { ...d, availability: status, snoozeUntil };
        this.log('donor.set_availability', 'donor', d.id, { status, snoozeUntil });
        return updated;
      }
      return d;
    });
    this.persist();
    return this.getDonorProfile();
  }

  getDonorActiveRequest() {
    if (!this.activeUser || this.activeUser.role !== 'donor') throw new Error('Unauthorized');
    // Find requests this donor has accepted and are not completed/cancelled
    const response = this.responses.find(r => r.donorId === this.activeUser!.id && (r.status === 'accepted' || r.status === 'en_route' || r.status === 'arrived'));
    if (!response) return this.delay(null);

    const request = this.requests.find(req => req.id === response.requestId);
    if (!request) return this.delay(null);

    return this.delay({ response, request });
  }

  getDonorNotifications() {
    if (!this.activeUser || this.activeUser.role !== 'donor') throw new Error('Unauthorized');
    // Find all responses (notifications) for this donor
    const list = this.responses.filter(r => r.donorId === this.activeUser!.id);
    // Join with request details
    const joined = list.map(resp => {
      const request = this.requests.find(req => req.id === resp.requestId);
      return { response: resp, request };
    }).sort((a, b) => new Date(b.response.notifiedAt).getTime() - new Date(a.response.notifiedAt).getTime());

    return this.delay(joined);
  }

  getBloodRequestById(requestId: string) {
    const request = this.requests.find(r => r.id === requestId);
    return this.delay(request || null);
  }

  getOrCreateResponseForDonor(requestId: string) {
    if (!this.activeUser || this.activeUser.role !== 'donor') throw new Error('Unauthorized');
    const donor = this.donors.find(d => d.id === this.activeUser!.id);
    if (!donor) throw new Error('Donor profile not found');

    let response = this.responses.find(r => r.requestId === requestId && r.donorId === donor.id);
    if (!response) {
      response = {
        id: `resp_sim_${requestId}`,
        requestId: requestId,
        donorId: donor.id,
        donorName: donor.fullName,
        donorPhone: donor.phone,
        donorBloodGroup: donor.bloodGroup,
        donorTrustScore: donor.trustScore,
        status: 'notified',
        notifiedAt: new Date().toISOString()
      };
      this.responses.push(response);
      this.persist();
    }
    return this.delay(response);
  }

  respondToRequest(responseId: string, action: 'accept' | 'decline') {
    if (!this.activeUser || this.activeUser.role !== 'donor') throw new Error('Unauthorized');
    const status: ResponseStatus = action === 'accept' ? 'accepted' : 'declined';
    
    this.responses = this.responses.map(r => {
      if (r.id === responseId) {
        const updated = { ...r, status, respondedAt: new Date().toISOString() };
        this.log(`donor.respond_${action}`, 'donation_responses', r.id);
        
        // If accepted, update the request statistics
        if (action === 'accept') {
          this.requests = this.requests.map(req => {
            if (req.id === r.requestId) {
              return { ...req, status: 'accepted' as RequestStatus, donorsAccepted: req.donorsAccepted + 1 };
            }
            return req;
          });
        }
        return updated;
      }
      return r;
    });

    // Update donor stats if accepted
    if (action === 'accept') {
      this.donors = this.donors.map(d => {
        if (d.id === this.activeUser!.id) {
          return { ...d, totalAccepted: d.totalAccepted + 1, totalResponses: d.totalResponses + 1 };
        }
        return d;
      });
=======
  private persistSession() {
    if (this.accessToken && this.activeUser) {
      sessionStorage.setItem('redaid_session', JSON.stringify({
        accessToken: this.accessToken,
        activeUser: this.activeUser,
      }));
>>>>>>> 385aa2671327c2bf0c83f743dca091d87ce46fa4
    } else {
      sessionStorage.removeItem('redaid_session');
    }
  }

<<<<<<< HEAD
  updateDonorResponseStatus(responseId: string, status: 'en_route' | 'arrived' | 'donated') {
    this.responses = this.responses.map(r => {
      if (r.id === responseId) {
        let timeKey = 'respondedAt';
        if (status === 'arrived') timeKey = 'arrivedAt';
        if (status === 'donated') timeKey = 'donatedAt';

        const updated = { ...r, status: status as ResponseStatus, [timeKey]: new Date().toISOString() };
        this.log(`donor.status_${status}`, 'donation_responses', r.id);

        // Update central request status as well
        this.requests = this.requests.map(req => {
          if (req.id === r.requestId) {
            const nextStatus = status === 'donated' ? 'completed' : status;
            const nextFulfilled = status === 'donated' ? Math.min(req.unitsRequired, req.unitsFulfilled + 1) : req.unitsFulfilled;
            return { ...req, status: nextStatus as RequestStatus, unitsFulfilled: nextFulfilled };
          }
          return req;
        });

        // Update donor stats if completed
        if (status === 'donated') {
          this.donors = this.donors.map(d => {
            if (d.id === r.donorId) {
              return {
                ...d,
                totalDonations: d.totalDonations + 1,
                lastDonatedAt: new Date().toISOString()
              };
            }
            return d;
          });
        }

        return updated;
=======
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
>>>>>>> 385aa2671327c2bf0c83f743dca091d87ce46fa4
      }
      // Refresh failed — clear session
      this.accessToken = null;
      this.activeUser = null;
      this.persistSession();
      throw new Error('Session expired. Please log in again.');
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error?.message || errData.message || (typeof errData.error === 'string' ? errData.error : null) || `Request failed: ${res.status}`;
      throw new Error(errMsg);
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
    // Transform frontend data to backend donorRegisterSchema shape
    const backendPayload = {
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      bloodGroup: data.bloodGroup,
      city: data.location?.city || '',
      state: data.location?.state || 'Karnataka',
      latitude: data.location?.lat ?? 12.9716,
      longitude: data.location?.lng ?? 77.5946,
      healthDeclaration: {
        consentGiven: true,
        questions: {
          recentIllness: !data.healthDeclaration?.generalFitness,
          recentSurgery: !data.healthDeclaration?.noTattoosRecent,
          currentMedications: !data.healthDeclaration?.noMedicationRecent,
          chronicConditions: false,
          recentTransfusion: false,
          pregnancy: false,
        }
      }
    };

    const res: any = await this.request('POST', '/auth/donor/register', backendPayload);
    // After registration, the user must re-verify OTP to get updated token with role
    return { success: true, donorId: res.donorId || res.data?.donorId, role: 'donor' };
  }

  async registerHospital(data: any) {
    // Transform frontend data to backend hospitalRegisterSchema shape
    const backendPayload = {
      name: data.name,
      registrationNumber: data.registrationNumber,
      phone: data.phone,
      email: data.email,
      address: data.address,
      city: data.location?.city || '',
      state: data.location?.state || 'Delhi',
      latitude: data.location?.lat ?? 28.6139,
      longitude: data.location?.lng ?? 77.2090,
      department: data.department || 'Blood Bank Services',
    };

    const res: any = await this.request('POST', '/auth/hospital/register', backendPayload);
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
