import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageCode = 'en' | 'te' | 'hi';

export interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, defaultText?: string) => string;
}

const LANGUAGE_STORAGE_KEY = 'career_definer_language_preference';

const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    'brand.title': 'CAREER DEFINER',
    'brand.portal': 'PORTAL',
    'brand.tagline': 'Define Your Career. Discover Your Future.',
    'nav.home': 'Home',
    'nav.govtJobs': 'Government Jobs',
    'nav.privateJobs': 'Private Jobs',
    'nav.examinations': 'Examinations',
    'nav.guidance': 'Career Guidance',
    'nav.about': 'About',
    'nav.help': 'Help Desk',
    'nav.login': 'Login',
    'nav.signup': 'Sign Up',
    'nav.adminLogin': 'Admin Login',
    'nav.dashboard': 'Student Dashboard',
    'nav.adminDashboard': 'Admin Dashboard',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    'nav.profile': 'My Profile',
    'nav.savedJobs': 'Saved Jobs',
    'nav.notifications': 'Notifications',
    'hero.badge': 'OFFICIAL RECRUITMENT & CAREER MAPPING PORTAL',
    'hero.title': 'Navigate India’s Premier Recruitment Examinations & Careers',
    'hero.description': 'Official portal providing structured notifications, multi-column exam patterns, hierarchical syllabus trees, and AI-powered eligibility & resume matchmaking.',
    'hero.btn.getStarted': 'Get Started Free',
    'hero.btn.explore': 'Explore Active Vacancies',
    'hero.btn.admin': 'Admin Login',
    'hero.searchPlaceholder': 'Search by post, commission (UPSC, SSC, APPSC, RRB) or branch...',
    'cat.central': 'Central Government',
    'cat.state': 'State Government',
    'cat.private': 'Private Sector',
    'cat.tenth': '10th Pass Jobs',
    'cat.twelfth': '12th Pass Jobs',
    'cat.diploma': 'Diploma Jobs',
    'cat.degree': 'Degree / B.Tech Jobs',
    'cat.aiMatcher': 'AI Resume Job Matcher',
    'badge.govt': 'Government',
    'badge.private': 'Private',
    'badge.eligible': 'Eligible',
    'badge.maybeEligible': 'May Be Eligible',
    'badge.notEligible': 'Not Eligible',
    'badge.verified': 'Verified',
    'badge.published': 'Published',
    'card.save': 'Save Job',
    'card.saved': 'Saved',
    'card.viewDetails': 'View Details',
    'card.checkEligibility': 'Check Eligibility',
    'card.vacancies': 'Vacancies',
    'card.lastDate': 'Last Date',
    'card.salary': 'Salary',
    'card.qualification': 'Qualification',
    'card.location': 'Location',
    'section.govtJobs': 'Active Government Recruitment Advertisements',
    'section.privateJobs': 'Corporate & Industry Opportunities',
    'section.resume': 'Resume Upload → AI Job Recommendations',
    'section.howItWorks': 'How CAREER DEFINER Works',
    'section.features': 'National Portal Capabilities',
    'resume.title': 'AI-Powered Resume Job Matcher',
    'resume.subtitle': 'Upload your resume or enter academic details to receive instant, match-scored government and private career recommendations with skill gap analysis.',
    'resume.dropzone': 'Click or Drag & Drop Resume File (.PDF, .DOCX, .TXT)',
    'resume.analyzeBtn': 'Analyze Resume with AI',
    'resume.analyzing': 'Processing & Matching with Commissions...',
    'resume.disclaimer': 'Career Definer AI Matcher is an algorithmic advisory tool. It does not claim or guarantee official recruitment selection or statutory eligibility. Verify official notifications before applying.',
    'settings.title': 'Portal Preferences & Settings',
    'settings.theme': 'Display Theme',
    'settings.language': 'Language Selection',
    'settings.notifications': 'Notification Alerts',
    'settings.privacy': 'Data Privacy',
  },
  te: {
    'brand.title': 'కెరీర్ డిఫైనర్',
    'brand.portal': 'పోర్టల్',
    'brand.tagline': 'మీ కెరీర్‌ను నిర్వచించండి. మీ భవిష్యత్తును కనుగొనండి.',
    'nav.home': 'హోమ్',
    'nav.govtJobs': 'ప్రభుత్వ ఉద్యోగాలు',
    'nav.privateJobs': 'ప్రైవేట్ ఉద్యోగాలు',
    'nav.examinations': 'పోటీ పరీక్షలు',
    'nav.guidance': 'కెరీర్ మార్గదర్శకత్వం',
    'nav.about': 'గురించి',
    'nav.help': 'సహాయ కేంద్రం',
    'nav.login': 'లాగిన్',
    'nav.signup': 'నమోదు చేసుకోండి',
    'nav.adminLogin': 'అడ్మిన్ లాగిన్',
    'nav.dashboard': 'విద్యార్థి డ్యాష్‌బోర్డ్',
    'nav.adminDashboard': 'అడ్మిన్ డ్యాష్‌బోర్డ్',
    'nav.settings': 'సెట్టింగ్‌లు',
    'nav.logout': 'లాగ్అవుట్',
    'nav.profile': 'నా ప్రొఫైల్',
    'nav.savedJobs': 'సేవ్ చేసిన ఉద్యోగాలు',
    'nav.notifications': 'నోటిఫికేషన్లు',
    'hero.badge': 'అధికారిక రిక్రూట్‌మెంట్ & కెరీర్ మ్యాపింగ్ పోర్టల్',
    'hero.title': 'భారతదేశ ప్రముఖ రిక్రూట్‌మెంట్ పరీక్షలు మరియు ఉద్యోగాలు',
    'hero.description': 'వివరణాత్మక నోటిఫికేషన్లు, పరీక్షా విధానాలు, పూర్తి సిలబస్ మరియు AI ఆధారిత అర్హత & రెజ్యూమ్ మ్యాచింగ్ అందించే పోర్టల్.',
    'hero.btn.getStarted': 'ఉచితంగా ప్రారంభించండి',
    'hero.btn.explore': 'ప్రస్తుత ఉద్యోగాలను అన్వేషించండి',
    'hero.btn.admin': 'అడ్మిన్ లాగిన్',
    'hero.searchPlaceholder': 'పోస్ట్, కమిషన్ (UPSC, SSC, APPSC, RRB) లేదా విద్యార్హత ద్వారా శోధించండి...',
    'cat.central': 'కేంద్ర ప్రభుత్వం',
    'cat.state': 'రాష్ట్ర ప్రభుత్వం',
    'cat.private': 'ప్రైవేట్ రంగం',
    'cat.tenth': '10వ తరగతి ఉద్యోగాలు',
    'cat.twelfth': 'ఇంటర్మీడియట్ (12th) ఉద్యోగాలు',
    'cat.diploma': 'డిప్లొమా ఉద్యోగాలు',
    'cat.degree': 'డిగ్రీ / బి.టెక్ ఉద్యోగాలు',
    'cat.aiMatcher': 'AI రెజ్యూమ్ జాబ్ మ్యాచ్',
    'badge.govt': 'ప్రభుత్వ ఉద్యోగం',
    'badge.private': 'ప్రైవేట్ ఉద్యోగం',
    'badge.eligible': 'అర్హులు',
    'badge.maybeEligible': 'అర్హత ఉండవచ్చు',
    'badge.notEligible': 'అర్హత లేదు',
    'badge.verified': 'ధృవీకరించబడింది',
    'badge.published': 'ప్రచురించబడింది',
    'card.save': 'సేవ్ చేయండి',
    'card.saved': 'సేవ్ అయింది',
    'card.viewDetails': 'పూర్తి వివరాలు',
    'card.checkEligibility': 'అర్హతను తనిఖీ చేయండి',
    'card.vacancies': 'ఖాళీలు',
    'card.lastDate': 'చివరి తేదీ',
    'card.salary': 'జీతం',
    'card.qualification': 'విద్యార్హత',
    'card.location': 'ప్రాంతం',
    'section.govtJobs': 'ప్రస్తుత ప్రభుత్వ ఉద్యోగ నోటిఫికేషన్లు',
    'section.privateJobs': 'కార్పొరేట్ & ప్రైవేట్ ఉద్యోగ అవకాశాలు',
    'section.resume': 'రెజ్యూమ్ అప్‌లోడ్ → AI ఉద్యోగ సిఫార్సులు',
    'section.howItWorks': 'CAREER DEFINER ఎలా పనిచేస్తుంది?',
    'section.features': 'పోర్టల్ ముఖ్య విశేషాలు',
    'resume.title': 'AI ఆధారిత రెజ్యూమ్ జాబ్ మ్యాచ్',
    'resume.subtitle': 'మీ రెజ్యూమ్‌ను అప్‌లోడ్ చేయండి లేదా మీ విద్యార్హత వివరాలను సమర్పించి మ్యాచ్ స్కోర్‌లతో కూడిన ఉద్యోగ సిఫార్సులను పొందండి.',
    'resume.dropzone': 'రెజ్యూమ్ ఫైల్‌ను ఇక్కడ అప్‌లోడ్ చేయండి (.PDF, .DOCX, .TXT)',
    'resume.analyzeBtn': 'AI తో రెజ్యూమ్ విశ్లేషించండి',
    'resume.analyzing': 'విశ్లేషిస్తోంది మరియు సరిపోల్చుతోంది...',
    'resume.disclaimer': 'కెరీర్ డిఫైనర్ AI మ్యాచ్ కేవలం సలహా సాధనం మాత్రమే. ఇది ఎటువంటి అధికారిక ఎంపికను లేదా అర్హతను హామీ ఇవ్వదు. దరఖాస్తుకు ముందు అధికారిక నోటిఫికేషన్‌ను పరిశీలించండి.',
    'settings.title': 'పోర్టల్ సెట్టింగ్‌లు & ప్రాధాన్యతలు',
    'settings.theme': 'థీమ్ ఎంపిక',
    'settings.language': 'భాష ఎంపిక',
    'settings.notifications': 'నోటిఫికేషన్ హెచ్చరికలు',
    'settings.privacy': 'గోప్యతా సెట్టింగ్‌లు',
  },
  hi: {
    'brand.title': 'कैरियर डिफाइनर',
    'brand.portal': 'पोर्टल',
    'brand.tagline': 'अपने करियर को परिभाषित करें। अपने भविष्य की खोज करें।',
    'nav.home': 'होम',
    'nav.govtJobs': 'सरकारी नौकरियां',
    'nav.privateJobs': 'प्राइवेट नौकरियां',
    'nav.examinations': 'प्रतियोगी परीक्षाएं',
    'nav.guidance': 'करियर मार्गदर्शन',
    'nav.about': 'के बारे में',
    'nav.help': 'हेल्प डेस्क',
    'nav.login': 'लॉग इन',
    'nav.signup': 'पंजीकरण करें',
    'nav.adminLogin': 'एडमिन लॉगिन',
    'nav.dashboard': 'छात्र डैशबोर्ड',
    'nav.adminDashboard': 'एडमिन डैशबोर्ड',
    'nav.settings': 'सेटिंग्स',
    'nav.logout': 'लॉग आउट',
    'nav.profile': 'मेरी प्रोफाइल',
    'nav.savedJobs': 'सहेजी गई नौकरियां',
    'nav.notifications': 'सूचनाएं',
    'hero.badge': 'आधिकारिक भर्ती एवं करियर मैपिंग पोर्टल',
    'hero.title': 'भारत की प्रमुख भर्ती परीक्षाओं एवं करियर का अन्वेषण करें',
    'hero.description': 'आधिकारिक पोर्टल जो संरचित अधिसूचनाएं, बहु-स्तंभ परीक्षा पैटर्न, पदानुक्रमित पाठ्यक्रम एवं AI आधारित पात्रता व रेज़्यूमे मैच प्रदान करता है।',
    'hero.btn.getStarted': 'निःशुल्क शुरू करें',
    'hero.btn.explore': 'सक्रिय रिक्तियां देखें',
    'hero.btn.admin': 'एडमिन लॉगिन',
    'hero.searchPlaceholder': 'पद, आयोग (UPSC, SSC, APPSC, RRB) या योग्यता द्वारा खोजें...',
    'cat.central': 'केंद्र सरकार',
    'cat.state': 'राज्य सरकार',
    'cat.private': 'निजी क्षेत्र',
    'cat.tenth': '10वीं पास नौकरियां',
    'cat.twelfth': '12वीं पास नौकरियां',
    'cat.diploma': 'डिप्लोमा नौकरियां',
    'cat.degree': 'डिग्री / बी.टेक नौकरियां',
    'cat.aiMatcher': 'AI रेज़्यूमे जॉब मैच',
    'badge.govt': 'सरकारी',
    'badge.private': 'प्राइवेट',
    'badge.eligible': 'पात्र',
    'badge.maybeEligible': 'पात्र हो सकते हैं',
    'badge.notEligible': 'अपात्र',
    'badge.verified': 'सत्यापित',
    'badge.published': 'प्रकाशित',
    'card.save': 'सहेजें',
    'card.saved': 'सहेजा गया',
    'card.viewDetails': 'विवरण देखें',
    'card.checkEligibility': 'पात्रता जांचें',
    'card.vacancies': 'रिक्तियां',
    'card.lastDate': 'अंतिम तिथि',
    'card.salary': 'वेतन',
    'card.qualification': 'योग्यता',
    'card.location': 'स्थान',
    'section.govtJobs': 'सक्रिय सरकारी भर्ती अधिसूचनाएं',
    'section.privateJobs': 'कॉरपोरेट एवं उद्योग अवसर',
    'section.resume': 'रेज़्यूमे अपलोड → AI नौकरी सिफारिशें',
    'section.howItWorks': 'CAREER DEFINER कैसे काम करता है?',
    'section.features': 'राष्ट्रीय पोर्टल की विशेषताएं',
    'resume.title': 'AI संचालित रेज़्यूमे जॉब मैचर',
    'resume.subtitle': 'अपना रेज़्यूमे अपलोड करें या शैक्षणिक विवरण दर्ज करें और मैच स्कोर व स्किल गैप विश्लेषण के साथ नौकरी की सिफारिशें प्राप्त करें।',
    'resume.dropzone': 'रेज़्यूमे फ़ाइल यहाँ अपलोड करें (.PDF, .DOCX, .TXT)',
    'resume.analyzeBtn': 'AI से रेज़्यूमे का विश्लेषण करें',
    'resume.analyzing': 'विश्लेषण एवं मिलान जारी है...',
    'resume.disclaimer': 'कैरियर डिफाइनर AI मैचर एक सलाहकार उपकरण है। यह किसी भी आधिकारिक चयन या वैधानिक पात्रता की गारंटी नहीं देता। आवेदन करने से पूर्व आधिकारिक अधिसूचना अवश्य देखें।',
    'settings.title': 'पोर्टल प्राथमिकताएं एवं सेटिंग्स',
    'settings.theme': 'डिस्प्ले थीम',
    'settings.language': 'भाषा चयन',
    'settings.notifications': 'अधिसूचना अलर्ट',
    'settings.privacy': 'डेटा गोपनीयता',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode;
    return saved === 'en' || saved === 'te' || saved === 'hi' ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
  };

  const t = (key: string, defaultText?: string): string => {
    const dict = translations[language] || translations.en;
    if (dict[key]) return dict[key];
    if (translations.en[key]) return translations.en[key];
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
