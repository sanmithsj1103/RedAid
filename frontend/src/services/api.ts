// RedAid Frontend Mock API Service Layer

// --- Types ---
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

// --- Initial Mock Data ---
const INITIAL_DONORS: Donor[] = [
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
    id: 'donor_2',
    fullName: 'Priya Patel',
    phone: '+919876543211',
    dateOfBirth: '1995-11-23',
    bloodGroup: 'A-',
    location: { lat: 12.9698, lng: 77.7499, city: 'Bengaluru', address: 'Whitefield, Bengaluru' },
    availability: 'active',
    snoozeUntil: null,
    lastDonatedAt: null,
    trustScore: 100,
    totalDonations: 0,
    totalResponses: 1,
    totalAccepted: 0,
    badges: [],
    healthDeclaration: { noTattoosRecent: true, noMedicationRecent: true, generalFitness: true },
    isVerified: true,
    isBlacklisted: false,
  },
  {
    id: 'donor_3',
    fullName: 'Rohan Murthy',
    phone: '+919876543212',
    dateOfBirth: '1990-08-05',
    bloodGroup: 'O-',
    location: { lat: 12.9279, lng: 77.6271, city: 'Bengaluru', address: 'Koramangala, Bengaluru' },
    availability: 'snoozed',
    snoozeUntil: '2026-06-20T18:00:00Z',
    lastDonatedAt: '2026-04-01T12:00:00Z',
    trustScore: 85.0,
    totalDonations: 8,
    totalResponses: 15,
    totalAccepted: 9,
    badges: ['first_donation', 'lifesaver', 'veteran'],
    healthDeclaration: { noTattoosRecent: true, noMedicationRecent: true, generalFitness: true },
    isVerified: true,
    isBlacklisted: false,
  },
  {
    id: 'donor_4',
    fullName: 'Vikram Singh',
    phone: '+919876543213',
    dateOfBirth: '1987-03-15',
    bloodGroup: 'B+',
    location: { lat: 12.9141, lng: 77.6413, city: 'Bengaluru', address: 'HSR Layout, Bengaluru' },
    availability: 'active',
    snoozeUntil: null,
    lastDonatedAt: '2025-12-10T11:00:00Z',
    trustScore: 92.0,
    totalDonations: 12,
    totalResponses: 20,
    totalAccepted: 13,
    badges: ['veteran', 'streak_5'],
    healthDeclaration: { noTattoosRecent: true, noMedicationRecent: true, generalFitness: true },
    isVerified: true,
    isBlacklisted: false,
  },
  {
    id: 'donor_5',
    fullName: 'Sunita Rao',
    phone: '+919876543214',
    dateOfBirth: '2001-09-30',
    bloodGroup: 'AB+',
    location: { lat: 12.9304, lng: 77.5794, city: 'Bengaluru', address: 'Jayanagar, Bengaluru' },
    availability: 'unavailable',
    snoozeUntil: null,
    lastDonatedAt: '2026-05-10T09:00:00Z',
    trustScore: 50.0,
    totalDonations: 1,
    totalResponses: 5,
    totalAccepted: 1,
    badges: ['first_donation'],
    healthDeclaration: { noTattoosRecent: false, noMedicationRecent: true, generalFitness: false },
    isVerified: true,
    isBlacklisted: false,
  }
];

const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: 'hospital_1',
    name: 'Manipal Hospital Whitefield',
    registrationNumber: 'KA-BLR-2015-0982',
    phone: '+918025024444',
    email: 'info.wf@manipalhospitals.com',
    address: 'ITPL Main Road, Whitefield, Bengaluru',
    location: { lat: 12.9698, lng: 77.7499, city: 'Bengaluru' },
    isVerified: true,
    isActive: true,
  },
  {
    id: 'hospital_2',
    name: 'Apollo Hospitals Jayanagar',
    registrationNumber: 'KA-BLR-2012-0451',
    phone: '+918026304050',
    email: 'admin.jn@apollohospitals.com',
    address: '21st Main Road, Jayanagar 1st Block, Bengaluru',
    location: { lat: 12.9304, lng: 77.5794, city: 'Bengaluru' },
    isVerified: true,
    isActive: true,
  },
  {
    id: 'hospital_3',
    name: 'Narayana Health HSR',
    registrationNumber: 'KA-BLR-2018-1122',
    phone: '+918049303000',
    email: 'contact.hsr@narayanahealth.org',
    address: 'HSR Layout Sector 3, Bengaluru',
    location: { lat: 12.9141, lng: 77.6413, city: 'Bengaluru' },
    isVerified: false,
    isActive: true,
  }
];

const INITIAL_REQUESTS: BloodRequest[] = [
  {
    id: 'req_1',
    hospitalId: 'hospital_1',
    hospitalName: 'Manipal Hospital Whitefield',
    hospitalPhone: '+918025024444',
    hospitalAddress: 'ITPL Main Road, Whitefield, Bengaluru',
    hospitalLocation: { lat: 12.9698, lng: 77.7499, city: 'Bengaluru' },
    bloodGroup: 'A-',
    unitsRequired: 2,
    unitsFulfilled: 0,
    priority: 'critical',
    status: 'dispatched',
    notes: 'Emergency bypass surgery. Patient currently in Cardiac ICU. Needs compatibility matching.',
    searchRadiusKm: 15,
    donorsNotified: 2,
    donorsAccepted: 1,
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
    createdAt: new Date().toISOString(),
  },
  {
    id: 'req_2',
    hospitalId: 'hospital_2',
    hospitalName: 'Apollo Hospitals Jayanagar',
    hospitalPhone: '+918026304050',
    hospitalAddress: '21st Main Road, Jayanagar 1st Block, Bengaluru',
    hospitalLocation: { lat: 12.9304, lng: 77.5794, city: 'Bengaluru' },
    bloodGroup: 'O+',
    unitsRequired: 4,
    unitsFulfilled: 2,
    priority: 'urgent',
    status: 'accepted',
    notes: 'Severe thalassaemia patient requiring blood transfusion.',
    searchRadiusKm: 15,
    donorsNotified: 8,
    donorsAccepted: 2,
    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  }
];

const INITIAL_RESPONSES: DonationResponse[] = [
  {
    id: 'resp_1',
    requestId: 'req_1',
    donorId: 'donor_2',
    donorName: 'Priya Patel',
    donorPhone: '+919876543211',
    donorBloodGroup: 'A-',
    donorTrustScore: 100,
    status: 'accepted',
    notifiedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    respondedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'resp_2',
    requestId: 'req_2',
    donorId: 'donor_1',
    donorName: 'Arjun Sharma',
    donorPhone: '+919876543210',
    donorBloodGroup: 'O+',
    donorTrustScore: 98.5,
    status: 'donated',
    notifiedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    respondedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    arrivedAt: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
    donatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    hospitalRating: 5,
    hospitalFeedback: 'Extremely polite, donor arrived within 25 minutes of acceptance!',
  }
];

const INITIAL_INVENTORY: Record<string, BloodInventoryItem[]> = {
  hospital_1: [
    { bloodGroup: 'A+', unitsAvailable: 12, lowStockThreshold: 4 },
    { bloodGroup: 'A-', unitsAvailable: 1, lowStockThreshold: 2 },
    { bloodGroup: 'B+', unitsAvailable: 15, lowStockThreshold: 4 },
    { bloodGroup: 'B-', unitsAvailable: 3, lowStockThreshold: 2 },
    { bloodGroup: 'AB+', unitsAvailable: 8, lowStockThreshold: 2 },
    { bloodGroup: 'AB-', unitsAvailable: 0, lowStockThreshold: 1 },
    { bloodGroup: 'O+', unitsAvailable: 5, lowStockThreshold: 4 },
    { bloodGroup: 'O-', unitsAvailable: 2, lowStockThreshold: 2 },
  ],
  hospital_2: [
    { bloodGroup: 'A+', unitsAvailable: 8, lowStockThreshold: 4 },
    { bloodGroup: 'A-', unitsAvailable: 4, lowStockThreshold: 2 },
    { bloodGroup: 'B+', unitsAvailable: 6, lowStockThreshold: 4 },
    { bloodGroup: 'B-', unitsAvailable: 2, lowStockThreshold: 2 },
    { bloodGroup: 'AB+', unitsAvailable: 4, lowStockThreshold: 2 },
    { bloodGroup: 'AB-', unitsAvailable: 2, lowStockThreshold: 1 },
    { bloodGroup: 'O+', unitsAvailable: 1, lowStockThreshold: 4 },
    { bloodGroup: 'O-', unitsAvailable: 0, lowStockThreshold: 2 },
  ]
};

const INITIAL_SURPLUS: HospitalSurplus[] = [
  {
    id: 'sur_1',
    hospitalId: 'hospital_1',
    hospitalName: 'Manipal Hospital Whitefield',
    bloodGroup: 'B+',
    unitsAvailable: 6,
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    isClaimed: false,
    createdAt: new Date().toISOString(),
  }
];

// --- DB Helpers ---
const loadData = <T>(key: string, fallback: T): T => {
  const data = localStorage.getItem(`redaid_${key}`);
  return data ? JSON.parse(data) : fallback;
};

const saveData = <T>(key: string, val: T): void => {
  localStorage.setItem(`redaid_${key}`, JSON.stringify(val));
};

// --- API Implementation ---
class ApiService {
  private donors: Donor[];
  private hospitals: Hospital[];
  private requests: BloodRequest[];
  private responses: DonationResponse[];
  private inventory: Record<string, BloodInventoryItem[]>;
  private surplus: HospitalSurplus[];
  private auditLogs: AuditLog[];
  private activeUser: { id: string; role: 'donor' | 'hospital' | 'admin' } | null;

  constructor() {
    this.donors = loadData('donors', INITIAL_DONORS);
    this.hospitals = loadData('hospitals', INITIAL_HOSPITALS);
    this.requests = loadData('requests', INITIAL_REQUESTS);
    this.responses = loadData('responses', INITIAL_RESPONSES);
    this.inventory = loadData('inventory', INITIAL_INVENTORY);
    this.surplus = loadData('surplus', INITIAL_SURPLUS);
    this.auditLogs = loadData('audit_logs', []);
    this.activeUser = loadData('active_user', { id: 'donor_1', role: 'donor' }); // Default logged in user
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
      const donor = this.donors.find(d => d.phone === phone);
      if (donor) {
        if (donor.isBlacklisted) throw new Error('Your account has been blacklisted.');
        this.activeUser = { id: donor.id, role: 'donor' };
        this.log('auth.login', 'donor', donor.id);
        this.persist();
        return this.delay({ success: true, user: this.activeUser, profile: donor });
      }
      throw new Error('Donor phone number not found. Please register.');
    }

    // Hospital login
    const hospital = this.hospitals.find(h => h.phone === phone || h.email === phone);
    if (hospital) {
      this.activeUser = { id: hospital.id, role: 'hospital' };
      this.log('auth.login', 'hospital', hospital.id);
      this.persist();
      return this.delay({ success: true, user: this.activeUser, profile: hospital });
    }
    throw new Error('Hospital phone/email not found. Please register.');
  }

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
    } else {
      this.donors = this.donors.map(d => {
        if (d.id === this.activeUser!.id) {
          return { ...d, totalResponses: d.totalResponses + 1 };
        }
        return d;
      });
    }

    this.persist();
    return this.delay({ success: true });
  }

  updateDonorResponseStatus(responseId: string, status: 'en_route' | 'arrived') {
    this.responses = this.responses.map(r => {
      if (r.id === responseId) {
        const timeKey = status === 'en_route' ? 'respondedAt' : 'arrivedAt';
        const updated = { ...r, status: status as ResponseStatus, [timeKey]: new Date().toISOString() };
        this.log(`donor.status_${status}`, 'donation_responses', r.id);

        // Update central request status as well
        this.requests = this.requests.map(req => {
          if (req.id === r.requestId) {
            return { ...req, status: status as RequestStatus };
          }
          return req;
        });

        return updated;
      }
      return r;
    });
    this.persist();
    return this.delay({ success: true });
  }

  getDonorDonationHistory() {
    if (!this.activeUser || this.activeUser.role !== 'donor') throw new Error('Unauthorized');
    const donatedList = this.responses.filter(r => r.donorId === this.activeUser!.id && r.status === 'donated');
    const joined = donatedList.map(resp => {
      const request = this.requests.find(req => req.id === resp.requestId);
      return { response: resp, request };
    });
    return this.delay(joined);
  }

  // --- Hospital Portal Methods ---
  getHospitalProfile(hospitalId?: string) {
    const id = hospitalId || this.activeUser?.id;
    const hosp = this.hospitals.find(h => h.id === id);
    if (!hosp) throw new Error('Hospital profile not found');
    return this.delay(hosp);
  }

  getHospitalInventory() {
    if (!this.activeUser || this.activeUser.role !== 'hospital') throw new Error('Unauthorized');
    const items = this.inventory[this.activeUser.id] || [];
    return this.delay(items);
  }

  updateInventoryItem(bloodGroup: BloodGroup, unitsAvailable: number) {
    if (!this.activeUser || this.activeUser.role !== 'hospital') throw new Error('Unauthorized');
    this.inventory[this.activeUser.id] = this.inventory[this.activeUser.id].map(item => {
      if (item.bloodGroup === bloodGroup) {
        this.log('hospital.update_inventory', 'blood_inventory', this.activeUser!.id, { bloodGroup, unitsAvailable });
        return { ...item, unitsAvailable, updatedAt: new Date().toISOString() };
      }
      return item;
    });
    this.persist();
    return this.getHospitalInventory();
  }

  createBloodRequest(data: { bloodGroup: BloodGroup; unitsRequired: number; priority: RequestPriority; notes: string }) {
    if (!this.activeUser || this.activeUser.role !== 'hospital') throw new Error('Unauthorized');
    const hospital = this.hospitals.find(h => h.id === this.activeUser!.id)!;

    // Filter compatible, verified, active, non-blacklisted donors within 15km
    const compatibleGroups = this.getCompatibleDonorGroups(data.bloodGroup);
    const eligibleDonors = this.donors.filter(d => {
      if (!d.isVerified || d.isBlacklisted || d.availability !== 'active') return false;
      if (!compatibleGroups.includes(d.bloodGroup)) return false;
      
      // Auto-enforced 90-day lock
      if (d.lastDonatedAt) {
        const lastDonated = new Date(d.lastDonatedAt).getTime();
        const ninetyDays = 90 * 24 * 60 * 60 * 1000;
        if (Date.now() - lastDonated < ninetyDays) return false;
      }
      return true;
    });

    const newRequest: BloodRequest = {
      id: `req_${Math.random().toString(36).substr(2, 9)}`,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      hospitalPhone: hospital.phone,
      hospitalAddress: hospital.address,
      hospitalLocation: hospital.location,
      bloodGroup: data.bloodGroup,
      unitsRequired: data.unitsRequired,
      unitsFulfilled: 0,
      priority: data.priority,
      status: 'dispatched',
      notes: data.notes,
      searchRadiusKm: 15,
      donorsNotified: eligibleDonors.length,
      donorsAccepted: 0,
      expiresAt: new Date(Date.now() + (data.priority === 'critical' ? 2 : data.priority === 'urgent' ? 6 : 24) * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.requests.unshift(newRequest);
    this.log('request.created', 'blood_requests', newRequest.id, data);

    // Create donation_responses entries for matched donors to notify them
    eligibleDonors.forEach(donor => {
      const resp: DonationResponse = {
        id: `resp_${Math.random().toString(36).substr(2, 9)}`,
        requestId: newRequest.id,
        donorId: donor.id,
        donorName: donor.fullName,
        donorPhone: donor.phone,
        donorBloodGroup: donor.bloodGroup,
        donorTrustScore: donor.trustScore,
        status: 'notified',
        notifiedAt: new Date().toISOString(),
      };
      this.responses.push(resp);
    });

    this.persist();
    return this.delay(newRequest);
  }

  getHospitalRequests() {
    if (!this.activeUser || this.activeUser.role !== 'hospital') throw new Error('Unauthorized');
    const list = this.requests.filter(r => r.hospitalId === this.activeUser!.id);
    return this.delay(list);
  }

  cancelRequest(requestId: string) {
    this.requests = this.requests.map(r => {
      if (r.id === requestId) {
        this.log('request.cancelled', 'blood_requests', requestId);
        return { ...r, status: 'cancelled' as RequestStatus };
      }
      return r;
    });
    // Cancel any active donation responses
    this.responses = this.responses.map(resp => {
      if (resp.requestId === requestId && (resp.status === 'notified' || resp.status === 'accepted' || resp.status === 'en_route')) {
        return { ...resp, status: 'cancelled' as ResponseStatus };
      }
      return resp;
    });
    this.persist();
    return this.delay({ success: true });
  }

  getLiveRequestTracker(requestId: string) {
    const request = this.requests.find(r => r.id === requestId);
    if (!request) throw new Error('Request not found');

    const notifiedDonors = this.responses.filter(r => r.requestId === requestId);
    return this.delay({ request, responses: notifiedDonors });
  }

  markDonationComplete(responseId: string) {
    let donorId = '';
    let requestId = '';
    let donorBlood = '';

    this.responses = this.responses.map(r => {
      if (r.id === responseId) {
        donorId = r.donorId;
        requestId = r.requestId;
        donorBlood = r.donorBloodGroup;
        return { ...r, status: 'donated' as ResponseStatus, donatedAt: new Date().toISOString() };
      }
      return r;
    });

    // Update donor attributes (Eligibility lock, donation count, trust score)
    this.donors = this.donors.map(d => {
      if (d.id === donorId) {
        const totalDons = d.totalDonations + 1;
        const currentScore = d.trustScore;
        // Increase trust score on successful donation up to 100
        const newScore = Math.min(100, currentScore + 2.5);
        
        // Award badge triggers
        const badges = [...d.badges];
        if (totalDons === 1 && !badges.includes('first_donation')) badges.push('first_donation');
        if (totalDons === 5 && !badges.includes('streak_5')) badges.push('streak_5');
        if (totalDons === 10 && !badges.includes('veteran')) badges.push('veteran');

        return {
          ...d,
          totalDonations: totalDons,
          trustScore: newScore,
          lastDonatedAt: new Date().toISOString(),
          badges,
        };
      }
      return d;
    });

    // Update request units fulfilled
    this.requests = this.requests.map(req => {
      if (req.id === requestId) {
        const fulfilled = req.unitsFulfilled + 1;
        const newStatus = fulfilled >= req.unitsRequired ? 'completed' : req.status;
        return { ...req, unitsFulfilled: fulfilled, status: newStatus as RequestStatus };
      }
      return req;
    });

    this.log('donation.completed', 'donation_responses', responseId, { donorId, requestId });
    this.persist();
    return this.delay({ success: true });
  }

  markDonorNoShow(responseId: string) {
    let donorId = '';
    this.responses = this.responses.map(r => {
      if (r.id === responseId) {
        donorId = r.donorId;
        return { ...r, status: 'no_show' as ResponseStatus };
      }
      return r;
    });

    // Reduce donor trust score for no show
    this.donors = this.donors.map(d => {
      if (d.id === donorId) {
        const newScore = Math.max(0, d.trustScore - 15); // Strict penalty for no-shows
        return { ...d, trustScore: newScore };
      }
      return d;
    });

    this.log('donation.no_show', 'donation_responses', responseId, { donorId });
    this.persist();
    return this.delay({ success: true });
  }

  submitDonorFeedback(responseId: string, rating: number, feedback: string) {
    this.responses = this.responses.map(r => {
      if (r.id === responseId) {
        return { ...r, hospitalRating: rating, hospitalFeedback: feedback };
      }
      return r;
    });
    this.log('hospital.feedback_submitted', 'donation_responses', responseId, { rating, feedback });
    this.persist();
    return this.delay({ success: true });
  }

  getSurplusBloodListings() {
    return this.delay(this.surplus);
  }

  publishSurplusBlood(bloodGroup: BloodGroup, unitsAvailable: number, hoursValid: number) {
    if (!this.activeUser || this.activeUser.role !== 'hospital') throw new Error('Unauthorized');
    const hospital = this.hospitals.find(h => h.id === this.activeUser!.id)!;

    const newSurplus: HospitalSurplus = {
      id: `sur_${Math.random().toString(36).substr(2, 9)}`,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      bloodGroup,
      unitsAvailable,
      expiresAt: new Date(Date.now() + hoursValid * 60 * 60 * 1000).toISOString(),
      isClaimed: false,
      createdAt: new Date().toISOString(),
    };

    this.surplus.unshift(newSurplus);
    this.log('surplus.published', 'hospital_surplus', newSurplus.id, { bloodGroup, unitsAvailable });
    this.persist();
    return this.delay(newSurplus);
  }

  claimSurplusBlood(surplusId: string) {
    if (!this.activeUser || this.activeUser.role !== 'hospital') throw new Error('Unauthorized');
    this.surplus = this.surplus.map(s => {
      if (s.id === surplusId) {
        this.log('surplus.claimed', 'hospital_surplus', surplusId, { claimedBy: this.activeUser!.id });
        return { ...s, isClaimed: true, claimedBy: this.activeUser!.id };
      }
      return s;
    });
    this.persist();
    return this.delay({ success: true });
  }

  // --- Admin Portal Methods ---
  getAdminAnalytics() {
    const totalDonors = this.donors.length;
    const totalHospitals = this.hospitals.length;
    const totalRequestsCount = this.requests.length;
    const completedDonationsCount = this.responses.filter(r => r.status === 'donated').length;
    const criticalRequestsCount = this.requests.filter(r => r.priority === 'critical').length;
    
    // Group requests by blood group
    const demandByGroup: Record<string, number> = {};
    this.requests.forEach(r => {
      demandByGroup[r.bloodGroup] = (demandByGroup[r.bloodGroup] || 0) + r.unitsRequired;
    });

    return this.delay({
      kpis: {
        totalDonors,
        totalHospitals,
        totalRequests: totalRequestsCount,
        completedDonations: completedDonationsCount,
        criticalRequests: criticalRequestsCount,
        averageTrustScore: parseFloat((this.donors.reduce((acc, d) => acc + d.trustScore, 0) / totalDonors).toFixed(1)),
      },
      demandByGroup,
      recentActivity: this.auditLogs.slice(0, 10),
    });
  }

  getDonorsAdminList() {
    return this.delay(this.donors);
  }

  getHospitalsAdminList() {
    return this.delay(this.hospitals);
  }

  verifyHospital(hospitalId: string) {
    this.hospitals = this.hospitals.map(h => {
      if (h.id === hospitalId) {
        this.log('admin.verify_hospital', 'hospitals', hospitalId);
        return { ...h, isVerified: true };
      }
      return h;
    });
    this.persist();
    return this.delay({ success: true });
  }

  blacklistDonor(donorId: string, blacklist: boolean) {
    this.donors = this.donors.map(d => {
      if (d.id === donorId) {
        this.log(blacklist ? 'admin.blacklist_donor' : 'admin.unblacklist_donor', 'donors', donorId);
        return { ...d, isBlacklisted: blacklist };
      }
      return d;
    });
    this.persist();
    return this.delay({ success: true });
  }

  blacklistHospital(hospitalId: string, blacklist: boolean) {
    this.hospitals = this.hospitals.map(h => {
      if (h.id === hospitalId) {
        this.log(blacklist ? 'admin.blacklist_hospital' : 'admin.unblacklist_hospital', 'hospitals', hospitalId);
        return { ...h, isBlacklisted: blacklist, isActive: !blacklist } as any;
      }
      return h;
    });
    this.persist();
    return this.delay({ success: true });
  }

  getAuditLogs() {
    return this.delay(this.auditLogs);
  }

  broadcastAnnouncement(title: string, message: string, targets: 'all' | 'donors' | 'hospitals') {
    this.log('admin.broadcast_announcement', 'broadcast', 'system', { title, message, targets });
    console.log(`[Push Notification Broadcaster] Sending broadcast to ${targets.toUpperCase()}: "${title}" - ${message}`);
    return this.delay({ success: true });
  }

  // --- Compatibility Helper ---
  private getCompatibleDonorGroups(recipientGroup: BloodGroup): BloodGroup[] {
    const compatibilityMap: Record<BloodGroup, BloodGroup[]> = {
      'O-': ['O-'],
      'O+': ['O-', 'O+'],
      'A-': ['O-', 'A-'],
      'A+': ['O-', 'O+', 'A-', 'A+'],
      'B-': ['O-', 'B-'],
      'B+': ['O-', 'O+', 'B-', 'B+'],
      'AB-': ['O-', 'A-', 'B-', 'AB-'],
      'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    };
    return compatibilityMap[recipientGroup] || [];
  }
}

export const api = new ApiService();
