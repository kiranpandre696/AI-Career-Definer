import React, { useState } from 'react';
import { HelpCircle, Mail, MessageSquare, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';

interface HelpPageProps {
  onNavigate: (path: string) => void;
}

export const HelpPage: React.FC<HelpPageProps> = ({ onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ name: '', email: '', query: '' });

  const faqs = [
    {
      q: 'Is Career Definer an official government website?',
      a: 'No. Career Definer is an independent career guidance and recruitment information directory. We curate and index officially published notifications from UPSC, SSC, APPSC, State Commissions, and government gazettes. Candidates must always verify and submit applications on the official recruitment commission portals directly.',
    },
    {
      q: 'How does the Eligibility Checker evaluate candidate eligibility?',
      a: 'The Eligibility Checker dynamically matches your age, academic qualification level (e.g. 10th, 12th, Diploma, Graduation, B.Tech), graduation branch, and home domicile state against the criteria specified in the official recruitment advertisement.',
    },
    {
      q: 'How do I download official exam syllabi and question patterns?',
      a: 'Navigate to Examinations, select the exam dossier (e.g. UPSC CSE, SSC CGL, APPSC Group-I), and open the Dynamic Exam Pattern or Dynamic Syllabus tabs. You can also click "Official Notification" to download the comprehensive PDF issued by the commission.',
    },
    {
      q: 'Does Career Definer charge any application fees or counseling fees?',
      a: 'No. Career Definer provides all information, syllabi, exam schemes, and eligibility evaluations completely free of cost. We never request bank details, OTPs, or fee payments.',
    },
  ];

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackForm({ name: '', email: '', query: '' });
      setFeedbackSent(false);
    }, 4000);
  };

  return (
    <div className="space-y-6 pb-16">
      <Breadcrumbs items={[{ label: 'Help & FAQs' }]} onNavigate={onNavigate} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Help Desk & Frequently Asked Questions
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Find answers to candidate queries regarding examinations, eligibility checks, and official portal links.
            </p>
          </div>

          {/* FAQs Accordion */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left p-4 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900 dark:text-white transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </button>

                  {isOpen && (
                    <div className="p-4 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Contact & Feedback Form */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-900 dark:text-amber-400" />
              Candidate Queries & Portal Feedback
            </h2>

            {feedbackSent ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Thank you! Your feedback or query has been received.
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={feedbackForm.name}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                      placeholder="e.g. Ramesh Sharma"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={feedbackForm.email}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                      placeholder="ramesh@example.com"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Describe your query, correction suggestion, or feedback
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={feedbackForm.query}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, query: e.target.value })}
                    placeholder="Provide details or commission notification references..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-bold rounded-md transition-colors cursor-pointer"
                >
                  Submit Query
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
