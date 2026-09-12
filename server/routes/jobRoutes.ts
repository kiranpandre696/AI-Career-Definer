import { Router, Response } from 'express';
import { db } from '../db.ts';
import { optionalAuth, AuthenticatedRequest } from '../auth.ts';

const router = Router();

// GET all Jobs with advanced search and filters
router.get('/jobs', (req, res) => {
  const {
    q,
    category,
    stateId,
    organizationId,
    examinationId,
    groupId,
    postId,
    qualification,
    jobType,
    workMode,
    sector,
    minAge,
    maxAge,
    status = 'PUBLISHED',
    page = '1',
    limit = '10',
  } = req.query as Record<string, string>;

  let jobs = db.getJobs();
  const allOrgs = db.getOrganizations();
  const allExams = db.getExaminations();
  const allPosts = db.getPostsServices();
  const allStates = db.getStates();

  // Filter status
  if (status !== 'ALL') {
    jobs = jobs.filter((j) => j.status === status);
  }

  // Filter job type (GOVERNMENT or PRIVATE)
  if (jobType) {
    jobs = jobs.filter((j) => j.jobType === jobType);
  }

  // Filter category (CENTRAL or STATE or PRIVATE)
  if (category) {
    jobs = jobs.filter((j) => j.category === category);
  }

  // Filter state
  if (stateId) {
    jobs = jobs.filter((j) => j.stateId === stateId);
  }

  // Filter organization
  if (organizationId) {
    jobs = jobs.filter((j) => j.organizationId === organizationId);
  }

  // Filter examination
  if (examinationId) {
    jobs = jobs.filter((j) => j.examinationId === examinationId);
  }

  // Filter group
  if (groupId) {
    jobs = jobs.filter((j) => j.groupId === groupId);
  }

  // Filter post
  if (postId) {
    jobs = jobs.filter((j) => j.postId === postId);
  }

  // Filter qualification (Support qualification ladder: e.g. B.Tech also qualifies for Graduation)
  if (qualification) {
    jobs = jobs.filter((j) => {
      if (j.qualification === qualification) return true;
      if (qualification === 'Graduation' && ['B.Tech', 'B.E', 'B.Sc', 'B.A', 'B.Com', 'Post Graduation'].includes(j.qualification)) {
        return true;
      }
      return false;
    });
  }

  // Filter private work mode
  if (workMode) {
    jobs = jobs.filter((j) => j.workMode === workMode);
  }

  // Filter sector
  if (sector) {
    jobs = jobs.filter((j) => j.sector?.toLowerCase() === sector.toLowerCase());
  }

  // Filter age
  if (minAge) {
    const min = Number(minAge);
    jobs = jobs.filter((j) => !j.minAge || j.minAge <= min);
  }
  if (maxAge) {
    const max = Number(maxAge);
    jobs = jobs.filter((j) => !j.maxAge || j.maxAge >= max);
  }

  // Search keyword (q)
  if (q && q.trim()) {
    const query = q.trim().toLowerCase();
    jobs = jobs.filter((j) => {
      const org = allOrgs.find((o) => o.id === j.organizationId);
      const exam = j.examinationId ? allExams.find((e) => e.id === j.examinationId) : null;
      const post = j.postId ? allPosts.find((p) => p.id === j.postId) : null;
      const state = j.stateId ? allStates.find((s) => s.id === j.stateId) : null;

      const inTitle = j.title.toLowerCase().includes(query);
      const inOrg = org ? org.name.toLowerCase().includes(query) || org.shortName.toLowerCase().includes(query) : false;
      const inExam = exam ? exam.name.toLowerCase().includes(query) || exam.shortName.toLowerCase().includes(query) : false;
      const inPost = post ? post.name.toLowerCase().includes(query) : false;
      const inQual = j.qualification.toLowerCase().includes(query) || (j.branch && j.branch.toLowerCase().includes(query));
      const inState = state ? state.name.toLowerCase().includes(query) : false;
      const inLoc = j.location ? j.location.toLowerCase().includes(query) : false;
      const inDesc = j.description ? j.description.toLowerCase().includes(query) : false;
      const inSkills = j.skillsRequired ? j.skillsRequired.some((s) => s.toLowerCase().includes(query)) : false;

      return inTitle || inOrg || inExam || inPost || inQual || inState || inLoc || inDesc || inSkills;
    });
  }

  const total = jobs.length;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const startIndex = (pageNum - 1) * limitNum;
  const paginated = jobs.slice(startIndex, startIndex + limitNum);

  // Enrich with details
  const enriched = paginated.map((j) => {
    const organization = allOrgs.find((o) => o.id === j.organizationId);
    const examination = j.examinationId ? allExams.find((e) => e.id === j.examinationId) : undefined;
    const post = j.postId ? allPosts.find((p) => p.id === j.postId) : undefined;
    const state = j.stateId ? allStates.find((s) => s.id === j.stateId) : undefined;
    return { ...j, organization, examination, post, state };
  });

  return res.json({
    success: true,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    jobs: enriched,
  });
});

// GET single Job by ID
router.get('/jobs/:id', (req, res) => {
  const { id } = req.params;
  const job = db.getJobById(id);
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }

  // Increment view counter
  db.incrementJobViews(id);

  const organization = db.getOrganizationById(job.organizationId);
  const examination = job.examinationId ? db.getExaminationById(job.examinationId) : undefined;
  const examGroup = job.groupId ? db.getExamGroups().find((g) => g.id === job.groupId) : undefined;
  const post = job.postId ? db.getPostServiceById(job.postId) : undefined;
  const state = job.stateId ? db.getStates().find((s) => s.id === job.stateId) : undefined;

  return res.json({
    success: true,
    job: {
      ...job,
      organization,
      examination,
      examGroup,
      post,
      state,
    },
  });
});

// Check Eligibility for a Job
router.post('/jobs/:id/check-eligibility', optionalAuth as any, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const job = db.getJobById(id);
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }

  // Gather user profile or body overrides
  let profile = req.user ? db.getProfileByUserId(req.user.id) : null;
  const checkData = {
    age: req.body.age || (profile?.dateOfBirth ? calculateAge(profile.dateOfBirth) : undefined),
    qualification: req.body.qualification || profile?.highestQualification,
    branch: req.body.branch || profile?.branchStream,
    state: req.body.state || profile?.state,
  };

  const missingFields: string[] = [];
  if (checkData.age === undefined) missingFields.push('Date of Birth / Age');
  if (!checkData.qualification) missingFields.push('Highest Qualification');

  const criteriaResults: { name: string; status: 'PASS' | 'FAIL' | 'REVIEW'; detail: string }[] = [];

  // Age Check
  if (checkData.age !== undefined) {
    const age = Number(checkData.age);
    if (job.minAge && age < job.minAge) {
      criteriaResults.push({
        name: 'Age Requirement',
        status: 'FAIL',
        detail: `Minimum age required is ${job.minAge} years (Current age: ${age}).`,
      });
    } else if (job.maxAge && age > job.maxAge) {
      criteriaResults.push({
        name: 'Age Requirement',
        status: 'FAIL',
        detail: `Maximum age permissible is ${job.maxAge} years (Current age: ${age}). Reserved categories may have relaxation.`,
      });
    } else {
      criteriaResults.push({
        name: 'Age Requirement',
        status: 'PASS',
        detail: `Age (${age} years) is within permissible bracket (${job.minAge || 18} - ${job.maxAge || 42} years).`,
      });
    }
  } else {
    criteriaResults.push({
      name: 'Age Requirement',
      status: 'REVIEW',
      detail: `Prescribed age bracket: ${job.minAge || 18} to ${job.maxAge || 42} years. Add your date of birth to evaluate.`,
    });
  }

  // Qualification Check
  if (checkData.qualification) {
    const qualRank: Record<string, number> = {
      '10th': 1,
      '12th': 2,
      'Diploma': 2.5,
      'Graduation': 3,
      'B.A': 3,
      'B.Com': 3,
      'B.Sc': 3,
      'B.Tech': 3.5,
      'B.E': 3.5,
      'Post Graduation': 4,
      'M.Tech': 4.5,
      'M.A': 4,
      'M.Sc': 4,
    };

    const userRank = qualRank[checkData.qualification] || 2;
    const requiredRank = qualRank[job.qualification] || 3;

    if (job.qualification === checkData.qualification) {
      criteriaResults.push({
        name: 'Educational Qualification',
        status: 'PASS',
        detail: `Qualification matches exact requirement: ${job.qualification}.`,
      });
    } else if (userRank >= requiredRank && (job.qualification === 'Graduation' || job.qualification === '12th' || job.qualification === '10th')) {
      criteriaResults.push({
        name: 'Educational Qualification',
        status: 'PASS',
        detail: `Possesses ${checkData.qualification}, satisfying the minimum requirement of ${job.qualification}.`,
      });
    } else if (userRank < requiredRank) {
      criteriaResults.push({
        name: 'Educational Qualification',
        status: 'FAIL',
        detail: `Requires minimum ${job.qualification}. Selected qualification is ${checkData.qualification}.`,
      });
    } else {
      criteriaResults.push({
        name: 'Educational Qualification',
        status: 'REVIEW',
        detail: `Requires ${job.qualification}. Please verify branch equivalency in official notification.`,
      });
    }
  } else {
    criteriaResults.push({
      name: 'Educational Qualification',
      status: 'REVIEW',
      detail: `Prescribed qualification is ${job.qualification}. Complete profile to evaluate.`,
    });
  }

  // State Domicile Check (if state recruitment)
  if (job.category === 'STATE' && job.stateId) {
    const jobState = db.getStates().find((s) => s.id === job.stateId);
    if (jobState) {
      if (checkData.state && checkData.state.toLowerCase() === jobState.name.toLowerCase()) {
        criteriaResults.push({
          name: 'State Domicile / Local Reservation',
          status: 'PASS',
          detail: `Local candidate of ${jobState.name} eligible for local cadre quota.`,
        });
      } else if (checkData.state) {
        criteriaResults.push({
          name: 'State Domicile / Open Quota',
          status: 'REVIEW',
          detail: `Candidates from other states may be eligible under Open / Non-Local quota (typically 15-20% vacancies).`,
        });
      } else {
        criteriaResults.push({
          name: 'State Cadre',
          status: 'REVIEW',
          detail: `Conducted for ${jobState.name}. Check local vs non-local vacancy distribution.`,
        });
      }
    }
  }

  // Overall status determination
  const hasFail = criteriaResults.some((c) => c.status === 'FAIL');
  const hasReview = criteriaResults.some((c) => c.status === 'REVIEW');

  let overallStatus: 'ELIGIBLE' | 'CHECK_REQUIREMENTS' | 'NOT_ELIGIBLE' = 'ELIGIBLE';
  let badgeColor: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';

  if (hasFail) {
    overallStatus = 'NOT_ELIGIBLE';
    badgeColor = 'RED';
  } else if (hasReview || missingFields.length > 0) {
    overallStatus = 'CHECK_REQUIREMENTS';
    badgeColor = 'YELLOW';
  }

  return res.json({
    success: true,
    overallStatus,
    badgeColor,
    criteriaResults,
    missingFields,
    disclaimer: 'Eligibility information is provided for guidance only. Verify the official recruitment notification before applying.',
    profileUsed: checkData,
  });
});

function calculateAge(dobStr: string): number {
  const dob = new Date(dobStr);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

// --- HIERARCHY ENDPOINTS ---
router.get('/hierarchy/sectors', (_req, res) => {
  return res.json({ success: true, sectors: db.getSectors() });
});

router.get('/hierarchy/states', (_req, res) => {
  return res.json({ success: true, states: db.getStates() });
});

router.get('/hierarchy/organizations', (req, res) => {
  const { type, stateId, sectorId, status = 'PUBLISHED' } = req.query as Record<string, string>;
  const orgs = db.getOrganizations({ type, stateId, sectorId, status });
  return res.json({ success: true, organizations: orgs });
});

router.get('/hierarchy/organizations/:id', (req, res) => {
  const org = db.getOrganizationById(req.params.id);
  if (!org) {
    return res.status(404).json({ success: false, message: 'Organization not found' });
  }
  const exams = db.getExaminations({ organizationId: org.id, status: 'PUBLISHED' });
  const jobs = db.getJobs().filter((j) => j.organizationId === org.id && j.status === 'PUBLISHED');
  const departments = db.getDepartments(org.id);
  return res.json({ success: true, organization: org, exams, jobs, departments });
});

router.get('/hierarchy/departments', (req, res) => {
  const { organizationId } = req.query as Record<string, string>;
  return res.json({ success: true, departments: db.getDepartments(organizationId) });
});

router.get('/hierarchy/exams', (req, res) => {
  const { organizationId, examType, status = 'PUBLISHED' } = req.query as Record<string, string>;
  const exams = db.getExaminations({ organizationId, examType, status });
  const allOrgs = db.getOrganizations();
  const enriched = exams.map((e) => ({
    ...e,
    organization: allOrgs.find((o) => o.id === e.organizationId),
  }));
  return res.json({ success: true, examinations: enriched });
});

router.get('/hierarchy/exams/:id', (req, res) => {
  const exam = db.getExaminationById(req.params.id);
  if (!exam) {
    return res.status(404).json({ success: false, message: 'Examination not found' });
  }
  const organization = db.getOrganizationById(exam.organizationId);
  const groups = db.getExamGroups(exam.id);
  const posts = db.getPostsServices({ examinationId: exam.id, status: 'PUBLISHED' });
  const jobs = db.getJobs().filter((j) => j.examinationId === exam.id && j.status === 'PUBLISHED');
  const syllabusTree = db.getSyllabusTree(exam.id);
  const examPatterns = db.getExamPatterns(exam.id, true);
  const roadmap = db.getRoadmap(exam.id);

  return res.json({
    success: true,
    examination: exam,
    organization,
    groups,
    posts,
    jobs,
    syllabusTree,
    examPatterns,
    roadmap,
  });
});

router.get('/hierarchy/groups', (req, res) => {
  const { examinationId } = req.query as Record<string, string>;
  return res.json({ success: true, groups: db.getExamGroups(examinationId) });
});

router.get('/hierarchy/posts', (req, res) => {
  const { examinationId, organizationId, groupId, status = 'PUBLISHED' } = req.query as Record<string, string>;
  const posts = db.getPostsServices({ examinationId, organizationId, groupId, status });
  return res.json({ success: true, posts });
});

router.get('/hierarchy/posts/:id', (req, res) => {
  const post = db.getPostServiceById(req.params.id);
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post or Service not found' });
  }
  const organization = db.getOrganizationById(post.organizationId);
  const examination = db.getExaminationById(post.examinationId);
  const examGroup = post.groupId ? db.getExamGroups().find((g) => g.id === post.groupId) : undefined;
  const jobs = db.getJobs().filter((j) => j.postId === post.id && j.status === 'PUBLISHED');

  return res.json({
    success: true,
    post,
    organization,
    examination,
    examGroup,
    jobs,
  });
});

// Public Notices
router.get('/notices', (_req, res) => {
  return res.json({ success: true, notices: db.getNotices() });
});

// Public Announcements
router.get('/announcements', (_req, res) => {
  return res.json({ success: true, announcements: db.getAnnouncements().filter((a) => a.isActive) });
});

export default router;
