import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { TopInfoBar } from './components/common/TopInfoBar.tsx';
import { TricolorStrip } from './components/common/TricolorStrip.tsx';
import { Header } from './components/common/Header.tsx';
import { Footer } from './components/common/Footer.tsx';
import { AuthModal } from './components/common/AuthModal.tsx';
import { VoiceCareerAssistantModal } from './components/voice/VoiceCareerAssistantModal.tsx';
import { VoiceAssistantFloatingButton } from './components/voice/VoiceAssistantFloatingButton.tsx';

// Public Pages
import { HomePage } from './pages/public/HomePage.tsx';
import { GovernmentJobsPage } from './pages/public/GovernmentJobsPage.tsx';
import { CentralGovernmentPage } from './pages/public/CentralGovernmentPage.tsx';
import { StateGovernmentPage } from './pages/public/StateGovernmentPage.tsx';
import { ExaminationsListPage } from './pages/public/ExaminationsListPage.tsx';
import { ExaminationDetailsPage } from './pages/public/ExaminationDetailsPage.tsx';
import { JobDetailsPage } from './pages/public/JobDetailsPage.tsx';
import { PrivateJobsPage } from './pages/public/PrivateJobsPage.tsx';
import { CareerGuidancePage } from './pages/public/CareerGuidancePage.tsx';
import { CareerRoadmapPage } from './pages/public/CareerRoadmapPage.tsx';
import { ExamPreparationPage } from './pages/public/ExamPreparationPage.tsx';
import { AboutPage } from './pages/public/AboutPage.tsx';
import { HelpPage } from './pages/public/HelpPage.tsx';
import { SettingsPage } from './pages/public/SettingsPage.tsx';
import { StudentSignupPage } from './pages/public/StudentSignupPage.tsx';
import { StudentLoginPage } from './pages/public/StudentLoginPage.tsx';

// Portals
import { StudentPortal } from './pages/student/StudentPortal.tsx';
import { ResumeMatcherPage } from './pages/student/ResumeMatcherPage.tsx';
import { RecommendedJobsPage } from './pages/student/RecommendedJobsPage.tsx';
import { MockInterviewPage } from './pages/student/MockInterviewPage.tsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { AdminLoginPage } from './pages/admin/AdminLoginPage.tsx';
import { Job } from './types.ts';

function AppContent() {
  const { user, isAuthenticated, isAdmin, isStudent } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authModalRole, setAuthModalRole] = useState<'STUDENT' | 'ADMIN'>('STUDENT');
  const [voiceAssistantOpen, setVoiceAssistantOpen] = useState(false);

  // Navigation helper
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname + window.location.search);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Parse path and search params
  const [pathname, searchStr] = currentPath.split('?');
  const queryParams = new URLSearchParams(searchStr || '');

  const handleOpenAuth = (mode: 'login' | 'register' = 'login', role: 'STUDENT' | 'ADMIN' = 'STUDENT') => {
    setAuthModalMode(mode);
    setAuthModalRole(role);
    setAuthModalOpen(true);
  };

  // Select job handler
  const handleSelectJob = (job: Job) => {
    navigate(`/jobs/${job.id}`);
  };

  // Select exam handler
  const handleSelectExam = (examId: string) => {
    navigate(`/examinations/${examId}`);
  };

  // Route dispatcher
  const renderCurrentRoute = () => {
    // 1. Home
    if (pathname === '/' || pathname === '') {
      return (
        <HomePage
          onNavigate={navigate}
          onSelectJob={handleSelectJob}
          onOpenVoiceAssistant={() => setVoiceAssistantOpen(true)}
        />
      );
    }

    // 2. Central Government
    if (pathname === '/government-jobs/central') {
      return (
        <CentralGovernmentPage
          onNavigate={navigate}
          onSelectExam={handleSelectExam}
          onSelectJob={handleSelectJob}
        />
      );
    }

    // 3. State Government (All states or specific state)
    if (pathname.startsWith('/government-jobs/states')) {
      const parts = pathname.split('/');
      const stateId = parts[3]; // e.g. /government-jobs/states/st_ap
      return (
        <StateGovernmentPage
          onNavigate={navigate}
          onSelectExam={handleSelectExam}
          onSelectJob={handleSelectJob}
          initialStateId={stateId}
        />
      );
    }

    // 4. Government Jobs Directory
    if (pathname === '/government-jobs') {
      return (
        <GovernmentJobsPage
          onNavigate={navigate}
          onSelectJob={handleSelectJob}
          initialQuery={queryParams.get('q') || ''}
          initialQualification={queryParams.get('qualification') || ''}
        />
      );
    }

    // 5. Job Details
    if (pathname.startsWith('/jobs/')) {
      const jobId = pathname.replace('/jobs/', '');
      return (
        <JobDetailsPage
          jobId={jobId}
          onNavigate={navigate}
          onSelectExam={handleSelectExam}
        />
      );
    }

    // 6. Examinations Directory & Details
    if (pathname.startsWith('/examinations/')) {
      const examId = pathname.replace('/examinations/', '');
      return (
        <ExaminationDetailsPage
          examId={examId}
          onNavigate={navigate}
          onSelectJob={handleSelectJob}
        />
      );
    }
    if (pathname === '/examinations') {
      return (
        <ExaminationsListPage
          onNavigate={navigate}
          onSelectExam={handleSelectExam}
        />
      );
    }

    // 7. Private Jobs
    if (pathname === '/private-jobs') {
      return <PrivateJobsPage onNavigate={navigate} onSelectJob={handleSelectJob} />;
    }

    // 8. Career Guidance & Roadmaps
    if (pathname === '/career-guidance') {
      return <CareerGuidancePage onNavigate={navigate} />;
    }
    if (pathname === '/career-roadmap') {
      return <CareerRoadmapPage onNavigate={navigate} targetCareerProp={queryParams.get('role') || ''} />;
    }

    // 8a. AI Mock Interview
    if (pathname === '/mock-interview') {
      return <MockInterviewPage onNavigate={navigate} initialRole={queryParams.get('role') || ''} />;
    }

    // 8b. Government Exam Preparation
    if (pathname === '/exam-prep') {
      return <ExamPreparationPage onNavigate={navigate} onSelectJob={handleSelectJob} />;
    }

    // 9. About & Help
    if (pathname === '/about') {
      return <AboutPage onNavigate={navigate} />;
    }
    if (pathname === '/help') {
      return <HelpPage onNavigate={navigate} />;
    }

    // 10. AI Resume Matcher & Recommended Jobs
    if (pathname === '/resume-matcher' || pathname === '/student/resume-matcher') {
      return <ResumeMatcherPage onNavigate={navigate} onSelectJob={handleSelectJob} />;
    }
    if (pathname === '/recommended-jobs' || pathname === '/student/recommended-jobs') {
      return (
        <RecommendedJobsPage
          onNavigate={navigate}
          onSelectJob={handleSelectJob}
          resumeId={queryParams.get('resumeId') || undefined}
        />
      );
    }

    // 11. Portal Settings & Preferences
    if (pathname === '/settings') {
      return <SettingsPage onNavigate={navigate} />;
    }

    // 12. Dedicated Separate Admin Login Page
    if (pathname === '/admin/login') {
      if (isAuthenticated && isAdmin) {
        return <AdminDashboard onNavigate={navigate} />;
      }
      return <AdminLoginPage onNavigate={navigate} />;
    }

    // 13. Student Dashboard, Saved Vacancies, Notifications
    if (pathname === '/saved-jobs') {
      if (!isAuthenticated || !isStudent) {
        return (
          <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md text-center space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Candidate Account Sign-In Required
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Please log in to view your saved vacancies and examination notices.
            </p>
            <button
              onClick={() => handleOpenAuth('login', 'STUDENT')}
              className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
            >
              Sign In to Candidate Account
            </button>
          </div>
        );
      }
      return <StudentPortal onNavigate={navigate} onSelectJob={handleSelectJob} initialTab="saved" />;
    }

    if (pathname === '/notifications') {
      if (!isAuthenticated || !isStudent) {
        return (
          <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md text-center space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Candidate Account Sign-In Required
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Please log in to view customized examination notices and recruitment alerts.
            </p>
            <button
              onClick={() => handleOpenAuth('login', 'STUDENT')}
              className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
            >
              Sign In to Candidate Account
            </button>
          </div>
        );
      }
      return <StudentPortal onNavigate={navigate} onSelectJob={handleSelectJob} initialTab="notifications" />;
    }

    if (pathname === '/dashboard') {
      if (!isAuthenticated || !isStudent) {
        return (
          <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md text-center space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Candidate Account Sign-In Required
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Please log in to access your matched opportunities and personal career roadmaps.
            </p>
            <button
              onClick={() => handleOpenAuth('login', 'STUDENT')}
              className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
            >
              Sign In to Candidate Account
            </button>
          </div>
        );
      }
      return <StudentPortal onNavigate={navigate} onSelectJob={handleSelectJob} initialTab="matches" />;
    }

    // 14. Student Candidate Portal (Protected)
    if (pathname === '/candidate-portal' || pathname === '/profile') {
      if (!isAuthenticated || !isStudent) {
        return (
          <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md text-center space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Candidate Account Sign-In Required
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Please log in to your candidate account or register to manage your profile, saved vacancies, and receive customized opportunity matches.
            </p>
            <button
              onClick={() => handleOpenAuth('login', 'STUDENT')}
              className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
            >
              Sign In to Candidate Account
            </button>
          </div>
        );
      }
      return <StudentPortal onNavigate={navigate} onSelectJob={handleSelectJob} initialTab="profile" />;
    }

    // 15. Administrative Console (Protected)
    if (pathname === '/admin') {
      if (!isAuthenticated || !isAdmin) {
        return (
          <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md text-center space-y-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Administrator Privileges Required
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Access to the National Administrative Console is restricted to authenticated portal staff. You can log in using the pre-configured administrator credentials.
            </p>
            <button
              onClick={() => navigate('/admin/login')}
              className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
            >
              Log In as Administrator
            </button>
          </div>
        );
      }
      return <AdminDashboard onNavigate={navigate} />;
    }

    // Direct Login / Signup route helpers
    if (pathname === '/login') {
      if (isAuthenticated) {
        if (isAdmin) return <AdminDashboard onNavigate={navigate} />;
        return <StudentPortal onNavigate={navigate} onSelectJob={handleSelectJob} />;
      }
      return (
        <StudentLoginPage
          onNavigate={navigate}
          initialEmail={queryParams.get('email') || ''}
          registeredSuccess={queryParams.get('registered') === 'true'}
        />
      );
    }

    if (pathname === '/signup' || pathname === '/register') {
      if (isAuthenticated) {
        if (isAdmin) return <AdminDashboard onNavigate={navigate} />;
        return <StudentPortal onNavigate={navigate} onSelectJob={handleSelectJob} />;
      }
      return <StudentSignupPage onNavigate={navigate} />;
    }

    // Fallback: Default to Home
    return (
      <HomePage
        onNavigate={navigate}
        onSelectJob={handleSelectJob}
        onOpenVoiceAssistant={() => setVoiceAssistantOpen(true)}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 w-full max-w-full overflow-x-hidden">
      {/* 0. National Tricolour Strip at the Topmost Position (Saffron -> White -> Green) */}
      <TricolorStrip />

      {/* 1. Official Top Information & Accessibility Bar */}
      <TopInfoBar onNavigate={navigate} />

      {/* 2. Primary Portal Header & Navigation */}
      <Header
        onNavigate={navigate}
        currentPath={pathname}
        onOpenAuth={(role) => handleOpenAuth('login', role || 'STUDENT')}
      />

      {/* 3. Main Page Content View */}
      <main className="flex-1 w-full">{renderCurrentRoute()}</main>

      {/* 4. Official Footer */}
      <Footer onNavigate={navigate} />

      {/* 5. Global Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
        defaultRole={authModalRole}
      />

      {/* 6. AI Voice Career Assistant Floating Trigger Button */}
      <VoiceAssistantFloatingButton onClick={() => setVoiceAssistantOpen(true)} />

      {/* 7. AI Voice Career Assistant Modal (Telugu, Hindi, English) */}
      <VoiceCareerAssistantModal
        isOpen={voiceAssistantOpen}
        onClose={() => setVoiceAssistantOpen(false)}
        onNavigate={navigate}
        onSelectJob={handleSelectJob}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
