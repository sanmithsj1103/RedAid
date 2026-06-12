import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PortalSwitcher } from './components/PortalSwitcher';

// Donor Portal Screens
import { DonorLogin } from './portals/donor/Login';
import { DonorRegister } from './portals/donor/Register';
import { DonorDashboard } from './portals/donor/Dashboard';
import { DonorRequestDetail } from './portals/donor/RequestDetail';
import { DonationHistory } from './portals/donor/DonationHistory';
import { CertificateViewer } from './portals/donor/CertificateViewer';
import { DonorProfileSettings } from './portals/donor/ProfileSettings';
import { DonorDonate } from './portals/donor/Donate';
import { DonorMap } from './portals/donor/MapSection';
import { DonorProfile } from './portals/donor/Profile';
import { DonorGuide } from './portals/donor/DonationGuide';
import { DonorNotifications } from './portals/donor/DonorNotifications';
import { DonorNavigation } from './portals/donor/DonorNavigation';

// Hospital Portal Screens
import { HospitalLogin } from './portals/hospital/Login';
import { HospitalRegister } from './portals/hospital/Register';
import { HospitalDashboard } from './portals/hospital/HospitalDashboard';
import { CreateRequest } from './portals/hospital/CreateRequest';
import { RequestsList } from './portals/hospital/RequestsList';
import { RequestTracker } from './portals/hospital/RequestTracker';
import { InventoryManager } from './portals/hospital/InventoryManager';
import { CrossHospitalCoordination } from './portals/hospital/CrossHospitalCoordination';
import { DonorsDirectory } from './portals/hospital/DonorsDirectory';
import { AnalyticsInsights } from './portals/hospital/AnalyticsInsights';
import { HospitalSettings } from './portals/hospital/HospitalSettings';

// Admin Portal Screens
import { AdminLogin } from './portals/admin/Login';
import { AdminDashboard } from './portals/admin/AdminDashboard';
import { UserManagement } from './portals/admin/UserManagement';
import { FraudAbuseMonitor } from './portals/admin/FraudAbuseMonitor';
import { SystemAnnouncements } from './portals/admin/SystemAnnouncements';
import { AuditLogsView } from './portals/admin/AuditLogsView';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Core Gateway Selector */}
        <Route path="/" element={<PortalSwitcher />} />

        {/* Donor Routes */}
        <Route path="/donor" element={<DonorDashboard />} />
        <Route path="/donor/login" element={<DonorLogin />} />
        <Route path="/donor/register" element={<DonorRegister />} />
        <Route path="/donor/dashboard" element={<DonorDashboard />} />
        <Route path="/donor/request/:requestId" element={<DonorRequestDetail />} />
        <Route path="/donor/history" element={<DonationHistory />} />
        <Route path="/donor/certificate/:responseId" element={<CertificateViewer />} />
        <Route path="/donor/settings" element={<DonorProfileSettings />} />
        <Route path="/donor/donate" element={<DonorDonate />} />
        <Route path="/donor/map" element={<DonorMap />} />
        <Route path="/donor/profile" element={<DonorProfile />} />
        <Route path="/donor/guide" element={<DonorGuide />} />
        <Route path="/donor/notifications" element={<DonorNotifications />} />
        <Route path="/donor/navigation/:requestId" element={<DonorNavigation />} />

        {/* Hospital Routes */}
        <Route path="/hospital" element={<HospitalDashboard />} />
        <Route path="/hospital/login" element={<HospitalLogin />} />
        <Route path="/hospital/register" element={<HospitalRegister />} />
        <Route path="/hospital/create" element={<CreateRequest />} />
        <Route path="/hospital/requests" element={<RequestsList />} />
        <Route path="/hospital/request/:requestId" element={<RequestTracker />} />
        <Route path="/hospital/inventory" element={<InventoryManager />} />
        <Route path="/hospital/coordination" element={<CrossHospitalCoordination />} />
        <Route path="/hospital/donors" element={<DonorsDirectory />} />
        <Route path="/hospital/analytics" element={<AnalyticsInsights />} />
        <Route path="/hospital/settings" element={<HospitalSettings />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/fraud" element={<FraudAbuseMonitor />} />
        <Route path="/admin/broadcast" element={<SystemAnnouncements />} />
        <Route path="/admin/logs" element={<AuditLogsView />} />

        {/* Fallback to Gateway Selector */}
        <Route path="*" element={<PortalSwitcher />} />
      </Routes>
    </Router>
  );
};

export default App;
