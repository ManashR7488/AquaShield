import React, { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import useAuthStore from "./store/useAuthStore";
import NotFoundPage from "./pages/NotFound/NotFoundPage";
import HomePage from "./pages/HomePage/HomePage";
import Login from "./pages/Auth/Login/Login";
import SignUp from "./pages/Auth/SignUp/SignUp";
import ForgotPassword from "./pages/Auth/ForgotPassword/ForgotPassword";
import Dashboard from "./pages/Dashboard/Dashboard";
import Setting from "./pages/Setting/Setting";
import Layout from "./pages/Layout/Layout";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import ProfileComplete from "./pages/User/ProfileComplete";
import Help from "./pages/Help/Help";
import ChatBot from "./components/ChatBot/ChatBot";

// Admin Components
import DistrictList from "./pages/Admin/Districts/DistrictList";
import DistrictCreate from "./pages/Admin/Districts/DistrictCreate";
import DistrictEdit from "./pages/Admin/Districts/DistrictEdit";
import DistrictView from "./pages/Admin/Districts/DistrictView";
import UserList from "./pages/Admin/Users/UserList";
import UserView from "./pages/Admin/Users/UserView";

// Health Officer Components
import BlockList from "./pages/HealthOfficer/Blocks/BlockList";
import BlockCreate from "./pages/HealthOfficer/Blocks/BlockCreate";
import BlockEdit from "./pages/HealthOfficer/Blocks/BlockEdit";
import BlockView from "./pages/HealthOfficer/Blocks/BlockView";
import HealthProgramList from "./pages/HealthOfficer/HealthPrograms/HealthProgramList";
import HealthProgramCreate from "./pages/HealthOfficer/HealthPrograms/HealthProgramCreate";
import HealthProgramEdit from "./pages/HealthOfficer/HealthPrograms/HealthProgramEdit";
import HealthProgramView from "./pages/HealthOfficer/HealthPrograms/HealthProgramView";
import StaffList from "./pages/HealthOfficer/Staff/StaffList";
import StaffAssignment from "./pages/HealthOfficer/Staff/StaffAssignment";

// ASHA Worker Components
import VillageReportList from "./pages/AshaWorker/VillageReports/VillageReportList";
import HealthReportCreate from "./pages/AshaWorker/VillageReports/HealthReportCreate";
import HealthReportView from "./pages/AshaWorker/VillageReports/HealthReportView";
import PatientList from "./pages/AshaWorker/Patients/PatientList";
import PatientCreate from "./pages/AshaWorker/Patients/PatientCreate";
import PatientView from "./pages/AshaWorker/Patients/PatientView";
import VaccinationList from "./pages/AshaWorker/Vaccinations/VaccinationList";
import VaccinationSchedule from "./pages/AshaWorker/Vaccinations/VaccinationSchedule";
import VaccinationComplete from "./pages/AshaWorker/Vaccinations/VaccinationComplete";
import HealthSurvey from "./pages/AshaWorker/HealthSurvey";

// Volunteer Components
import CommunityReportList from "./pages/Volunteer/CommunityReports/CommunityReportList";
import CommunityReportForm from "./pages/Volunteer/CommunityReports/CommunityReportForm";
import CommunityReportCreate from "./pages/Volunteer/CommunityReports/CommunityReportCreate";
import WaterTestList from "./pages/Volunteer/WaterTests/WaterTestList";
import WaterTestForm from "./pages/Volunteer/WaterTests/WaterTestForm";
import WaterTestCreate from "./pages/Volunteer/WaterTests/WaterTestCreate";
import HealthObservationList from "./pages/Volunteer/HealthObservations/HealthObservationList";
import HealthObservationForm from "./pages/Volunteer/HealthObservations/HealthObservationForm";
import HealthObservationCreate from "./pages/Volunteer/HealthObservations/HealthObservationCreate";

// User Components
import FamilyList from "./pages/User/FamilyList";
import AddFamilyMember from "./pages/User/AddFamilyMember";
import FamilyMemberProfile from "./pages/User/FamilyMemberProfile";
import HealthRecordList from "./pages/User/HealthRecordList";
import CreateHealthRecord from "./pages/User/CreateHealthRecord";
import ViewHealthRecord from "./pages/User/ViewHealthRecord";
import HealthTrends from "./pages/User/HealthTrends";
import HealthQueryList from "./pages/User/HealthQueryList";
import CreateHealthQuery from "./pages/User/CreateHealthQuery";
import HealthQueryForm from "./pages/User/HealthQueryForm";

// Guards
import { withAdminGuard } from "./utils/adminGuard";
import { withHealthOfficerGuard } from "./utils/healthOfficerGuard.jsx";
import { withAshaWorkerGuard } from "./utils/ashaWorkerGuard.jsx";
import { withVolunteerGuard } from "./utils/volunteerGuard.jsx";
import { withUserGuard } from "./utils/userGuard.jsx";

// Create protected admin components
const ProtectedDistrictList = withAdminGuard(DistrictList);
const ProtectedDistrictCreate = withAdminGuard(DistrictCreate);
const ProtectedDistrictView = withAdminGuard(DistrictView);
const ProtectedDistrictEdit = withAdminGuard(DistrictEdit);
const ProtectedUserList = withAdminGuard(UserList);
const ProtectedUserView = withAdminGuard(UserView);

// Create protected health officer components
const ProtectedBlockList = withHealthOfficerGuard(BlockList);
const ProtectedBlockCreate = withHealthOfficerGuard(BlockCreate);
const ProtectedBlockEdit = withHealthOfficerGuard(BlockEdit);
const ProtectedBlockView = withHealthOfficerGuard(BlockView);
const ProtectedHealthProgramList = withHealthOfficerGuard(HealthProgramList);
const ProtectedHealthProgramCreate = withHealthOfficerGuard(HealthProgramCreate);
const ProtectedHealthProgramEdit = withHealthOfficerGuard(HealthProgramEdit);
const ProtectedHealthProgramView = withHealthOfficerGuard(HealthProgramView);
const ProtectedStaffList = withHealthOfficerGuard(StaffList);
const ProtectedStaffAssignment = withHealthOfficerGuard(StaffAssignment);

// Create protected ASHA worker components
const ProtectedVillageReportList = withAshaWorkerGuard(VillageReportList);
const ProtectedHealthReportCreate = withAshaWorkerGuard(HealthReportCreate);
const ProtectedHealthReportView = withAshaWorkerGuard(HealthReportView);
const ProtectedPatientList = withAshaWorkerGuard(PatientList);
const ProtectedPatientCreate = withAshaWorkerGuard(PatientCreate);
const ProtectedPatientView = withAshaWorkerGuard(PatientView);
const ProtectedVaccinationList = withAshaWorkerGuard(VaccinationList);
const ProtectedVaccinationSchedule = withAshaWorkerGuard(VaccinationSchedule);
const ProtectedVaccinationComplete = withAshaWorkerGuard(VaccinationComplete);
const ProtectedHealthSurvey = withAshaWorkerGuard(HealthSurvey);

// Create protected volunteer components
const ProtectedCommunityReportList = withVolunteerGuard(CommunityReportList);
const ProtectedCommunityReportForm = withVolunteerGuard(CommunityReportForm);
const ProtectedCommunityReportCreate = withVolunteerGuard(CommunityReportCreate);
const ProtectedWaterTestList = withVolunteerGuard(WaterTestList);
const ProtectedWaterTestForm = withVolunteerGuard(WaterTestForm);
const ProtectedWaterTestCreate = withVolunteerGuard(WaterTestCreate);
const ProtectedHealthObservationList = withVolunteerGuard(HealthObservationList);
const ProtectedHealthObservationForm = withVolunteerGuard(HealthObservationForm);
const ProtectedHealthObservationCreate = withVolunteerGuard(HealthObservationCreate);

// Create protected user components
const ProtectedFamilyList = withUserGuard(FamilyList);
const ProtectedAddFamilyMember = withUserGuard(AddFamilyMember);
const ProtectedFamilyMemberProfile = withUserGuard(FamilyMemberProfile);
const ProtectedHealthRecordList = withUserGuard(HealthRecordList);
const ProtectedCreateHealthRecord = withUserGuard(CreateHealthRecord);
const ProtectedViewHealthRecord = withUserGuard(ViewHealthRecord);
const ProtectedHealthTrends = withUserGuard(HealthTrends);
const ProtectedHealthQueryList = withUserGuard(HealthQueryList);
const ProtectedCreateHealthQuery = withUserGuard(CreateHealthQuery);
const ProtectedHealthQueryForm = withUserGuard(HealthQueryForm);

const App = () => {
  const { checkAuth, isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();
  
  // Check authentication status once on app startup
  useEffect(() => {
    console.log('🚀 App startup - checking authentication...');
    
    console.log('🔍 App Auth Check:', {
      pathname: location.pathname,
      isAuthenticated,
      hasUser: !!user,
      isLoading
    });
    
    console.log('🔄 App: Checking authentication status...');
    checkAuth().then((success) => {
      console.log('🔄 App: Auth check result:', success);
      if (success) {
        console.log('✅ App: Authentication restored successfully');
      } else {
        console.log('❌ App: Authentication check failed');
      }
    });
  }, [checkAuth]);

  return (
    <div className="min-h-screen w-full relative">
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <ChatBot />
      <Routes>
        {/* Define your routes here */}
        <Route path="/" element={<HomePage />} />

        <Route path="/app" element={<Layout />}>
          {/* Protected routes can be nested here */}

          <Route path="auth/login" element={<Login />} />
          <Route path="auth/signup" element={<SignUp />} />
          <Route path="auth/forgot-password" element={<ForgotPassword />} />
          <Route path="profile/complete" element={<ProfileComplete />} />
          <Route path="" element={<Dashboard />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="help" element={<Help />} />
          <Route path="settings" element={<Setting />} />
          
          {/* Admin Routes - Protected with Admin Guard */}
          <Route path="districts" element={<ProtectedDistrictList />} />
          <Route path="districts/new" element={<ProtectedDistrictCreate />} />
          <Route path="districts/:id" element={<ProtectedDistrictView />} />
          <Route path="districts/:id/edit" element={<ProtectedDistrictEdit />} />
          <Route path="users" element={<ProtectedUserList />} />
          <Route path="users/:id" element={<ProtectedUserView />} />
          
          {/* Health Officer Routes - Protected with Health Officer Guard */}
          {/* Block Management Routes */}
          <Route path="blocks" element={<ProtectedBlockList />} />
          <Route path="blocks/new" element={<ProtectedBlockCreate />} />
          <Route path="blocks/:id" element={<ProtectedBlockView />} />
          <Route path="blocks/:id/edit" element={<ProtectedBlockEdit />} />
          
          {/* Health Program Management Routes */}
          <Route path="health-programs" element={<ProtectedHealthProgramList />} />
          <Route path="health-programs/new" element={<ProtectedHealthProgramCreate />} />
          <Route path="health-programs/:id" element={<ProtectedHealthProgramView />} />
          <Route path="health-programs/:id/edit" element={<ProtectedHealthProgramEdit />} />
          
          {/* Staff Management Routes */}
          <Route path="staff" element={<ProtectedStaffList />} />
          <Route path="staff/assign" element={<ProtectedStaffAssignment />} />
          
          {/* ASHA Worker Routes - Protected with ASHA Worker Guard */}
          {/* Village Reports Management Routes */}
          <Route path="village-reports" element={<ProtectedVillageReportList />} />
          <Route path="village-reports/new" element={<ProtectedHealthReportCreate />} />
          <Route path="village-reports/:id" element={<ProtectedHealthReportView />} />
          
          {/* Patient Management Routes */}
          <Route path="patients" element={<ProtectedPatientList />} />
          <Route path="patients/new" element={<ProtectedPatientCreate />} />
          <Route path="patients/:id" element={<ProtectedPatientView />} />
          
          {/* Vaccination Management Routes */}
          <Route path="vaccinations" element={<ProtectedVaccinationList />} />
          <Route path="vaccinations/schedule" element={<ProtectedVaccinationSchedule />} />
          <Route path="vaccinations/complete" element={<ProtectedVaccinationComplete />} />
          
          {/* Health Survey Routes */}
          <Route path="health-surveys" element={<ProtectedHealthSurvey />} />
          
          {/* Volunteer Routes - Protected with Volunteer Guard */}
          {/* Community Reports Routes */}
          <Route path="reports" element={<ProtectedCommunityReportList />} />
          <Route path="reports/new" element={<ProtectedCommunityReportCreate />} />
          <Route path="reports/:id" element={<ProtectedCommunityReportForm />} />
          <Route path="reports/:id/edit" element={<ProtectedCommunityReportForm />} />
          
          {/* Water Tests Routes */}
          <Route path="water-tests" element={<ProtectedWaterTestList />} />
          <Route path="water-tests/new" element={<ProtectedWaterTestCreate />} />
          <Route path="water-tests/:id" element={<ProtectedWaterTestForm />} />
          <Route path="water-tests/:id/edit" element={<ProtectedWaterTestForm />} />
          
          {/* Health Observations Routes */}
          <Route path="observations" element={<ProtectedHealthObservationList />} />
          <Route path="observations/new" element={<ProtectedHealthObservationCreate />} />
          <Route path="observations/:id" element={<ProtectedHealthObservationForm />} />
          <Route path="observations/:id/edit" element={<ProtectedHealthObservationForm />} />
          
          {/* User Routes - Protected with User Guard */}
          {/* Family Management Routes */}
          <Route path="family" element={<ProtectedFamilyList />} />
          <Route path="family/add" element={<ProtectedAddFamilyMember />} />
          <Route path="family/:id" element={<ProtectedFamilyMemberProfile />} />
          <Route path="family/:id/edit" element={<ProtectedAddFamilyMember />} />
          
          {/* Personal Health Records Routes */}
          <Route path="health-records" element={<ProtectedHealthRecordList />} />
          <Route path="health-records/create" element={<ProtectedCreateHealthRecord />} />
          <Route path="health-records/:id" element={<ProtectedViewHealthRecord />} />
          <Route path="health-records/:id/edit" element={<ProtectedCreateHealthRecord />} />
          <Route path="health-trends" element={<ProtectedHealthTrends />} />
          
          {/* Health Query Routes */}
          <Route path="health-queries" element={<ProtectedHealthQueryList />} />
          <Route path="health-queries/create" element={<ProtectedCreateHealthQuery />} />
          <Route path="health-queries/:id" element={<ProtectedHealthQueryForm />} />
          <Route path="health-queries/edit/:id" element={<ProtectedCreateHealthQuery />} />
          
        </Route>
        <Route path="/*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
};

export default App;
