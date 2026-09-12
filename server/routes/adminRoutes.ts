import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../auth.ts';
import {
  Organization,
  Department,
  Examination,
  ExamGroup,
  PostService,
  Job,
  ExamPattern,
  Notice,
  Announcement,
  Notification,
  CareerRoadmap,
  GovernmentExamDetail,
  PracticeQuestion,
  MockTest,
} from '../types.ts';

const router = Router();

// Enforce admin privileges on all admin routes
router.use(authenticateToken as any);
router.use(requireAdmin as any);

// --- 1. ADMIN ANALYTICS & STATS ---
router.get('/analytics', (_req: AuthenticatedRequest, res: Response) => {
  const analytics = db.getAnalytics();
  return res.json({ success: true, analytics });
});

router.get('/stats', (_req: AuthenticatedRequest, res: Response) => {
  const jobs = db.getJobs();
  const govtJobs = jobs.filter((j) => j.jobType === 'GOVERNMENT').length;
  const privateJobs = jobs.filter((j) => j.jobType === 'PRIVATE').length;
  const users = db.getAllUsers();
  const students = users.filter((u) => u.role === 'STUDENT');
  const activeStudents = students.filter((u) => u.isActive).length;
  const exams = db.getExaminations();
  const orgs = db.getOrganizations();
  const notices = db.getNotices();
  const pendingApprovals = jobs.filter((j) => j.status === 'DRAFT').length;

  return res.json({
    success: true,
    stats: {
      totalJobs: jobs.length,
      governmentJobs: govtJobs,
      privateJobs: privateJobs,
      activeStudents: activeStudents,
      totalStudents: students.length,
      totalApplications: 1420 + students.length * 3,
      pendingApprovals: pendingApprovals,
      totalExams: exams.length,
      totalOrganizations: orgs.length,
      totalNotices: notices.length,
    },
  });
});

// --- 2. ADMIN STUDENTS MANAGEMENT ---
router.get('/students', (req: AuthenticatedRequest, res: Response) => {
  const { q } = req.query as Record<string, string>;
  let users = db.getAllUsers().filter((u) => u.role === 'STUDENT');

  if (q && q.trim()) {
    const query = q.trim().toLowerCase();
    users = users.filter((u) => u.fullName.toLowerCase().includes(query) || u.email.toLowerCase().includes(query) || u.mobileNumber.includes(query));
  }

  const enriched = users.map((u) => {
    const profile = db.getProfileByUserId(u.id);
    return {
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      mobileNumber: u.mobileNumber,
      isActive: u.isActive,
      createdAt: u.createdAt,
      profile,
    };
  });

  return res.json({ success: true, students: enriched });
});

router.put('/students/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;
  const updated = db.updateUser(id, { isActive: Boolean(isActive) });
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Student account not found' });
  }
  return res.json({ success: true, message: `Student account ${isActive ? 'activated' : 'deactivated'}`, student: updated });
});

// --- 3. ORGANIZATIONS CRUD ---
router.get('/organizations', (_req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, organizations: db.getOrganizations() });
});

router.post('/organizations', (req: AuthenticatedRequest, res: Response) => {
  const { name, shortName, type, sectorId, stateId, description, officialWebsite, logoUrl, status = 'PUBLISHED' } = req.body;
  if (!name || !shortName || !type || !officialWebsite) {
    return res.status(400).json({ success: false, message: 'Name, short name, type, and official website are required' });
  }

  const newOrg: Organization = {
    id: 'org_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    name: name.trim(),
    shortName: shortName.trim(),
    type,
    sectorId,
    stateId: type === 'STATE' ? stateId : undefined,
    description: description || '',
    officialWebsite: officialWebsite.trim(),
    logoUrl,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.createOrganization(newOrg);
  return res.status(201).json({ success: true, message: 'Organization created successfully', organization: newOrg });
});

router.put('/organizations/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updated = db.updateOrganization(id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Organization not found' });
  }
  return res.json({ success: true, message: 'Organization updated', organization: updated });
});

router.delete('/organizations/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  // Prefer Archive over destructive delete
  const updated = db.updateOrganization(id, { status: 'ARCHIVED' });
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Organization not found' });
  }
  return res.json({ success: true, message: 'Organization archived successfully' });
});

// --- 4. DEPARTMENTS CRUD ---
router.get('/departments', (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.query as Record<string, string>;
  return res.json({ success: true, departments: db.getDepartments(organizationId) });
});

router.post('/departments', (req: AuthenticatedRequest, res: Response) => {
  const { organizationId, name, code, description } = req.body;
  if (!organizationId || !name) {
    return res.status(400).json({ success: false, message: 'Organization and department name required' });
  }

  const newDept: Department = {
    id: 'dept_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    organizationId,
    name: name.trim(),
    code,
    description,
  };

  db.createDepartment(newDept);
  return res.status(201).json({ success: true, message: 'Department created', department: newDept });
});

// --- 5. EXAMINATIONS CRUD ---
router.get('/exams', (_req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, examinations: db.getExaminations() });
});

router.post('/exams', (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    shortName,
    organizationId,
    examType = 'Recruitment',
    qualification = 'Graduation',
    description,
    minAge = 18,
    maxAge = 35,
    selectionProcess,
    officialNotificationUrl,
    officialWebsiteUrl,
    officialApplicationUrl,
    status = 'PUBLISHED',
  } = req.body;

  if (!name || !shortName || !organizationId) {
    return res.status(400).json({ success: false, message: 'Exam name, short name, and organization are required' });
  }

  const newExam: Examination = {
    id: 'exam_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    name: name.trim(),
    shortName: shortName.trim(),
    organizationId,
    examType,
    qualification,
    description: description || '',
    minAge: Number(minAge),
    maxAge: Number(maxAge),
    selectionProcess: selectionProcess || 'Written Examination -> Interview',
    officialNotificationUrl,
    officialWebsiteUrl,
    officialApplicationUrl,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.createExamination(newExam);
  return res.status(201).json({ success: true, message: 'Examination created', examination: newExam });
});

router.put('/exams/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updated = db.updateExamination(id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Examination not found' });
  }
  return res.json({ success: true, message: 'Examination updated', examination: updated });
});

router.delete('/exams/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updated = db.updateExamination(id, { status: 'ARCHIVED' });
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Examination not found' });
  }
  return res.json({ success: true, message: 'Examination archived' });
});

// --- 6. EXAM GROUPS CRUD ---
router.get('/groups', (req: AuthenticatedRequest, res: Response) => {
  const { examinationId } = req.query as Record<string, string>;
  return res.json({ success: true, groups: db.getExamGroups(examinationId) });
});

router.post('/groups', (req: AuthenticatedRequest, res: Response) => {
  const { examinationId, name, description, displayOrder = 1, status = 'PUBLISHED' } = req.body;
  if (!examinationId || !name) {
    return res.status(400).json({ success: false, message: 'Examination and group name are required' });
  }

  const newGroup: ExamGroup = {
    id: 'grp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    examinationId,
    name: name.trim(),
    description,
    displayOrder: Number(displayOrder),
    status,
  };

  db.createExamGroup(newGroup);
  return res.status(201).json({ success: true, message: 'Exam group created', group: newGroup });
});

router.put('/groups/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updated = db.updateExamGroup(id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Exam group not found' });
  }
  return res.json({ success: true, message: 'Exam group updated', group: updated });
});

// --- 7. POSTS / SERVICES CRUD ---
router.get('/posts', (req: AuthenticatedRequest, res: Response) => {
  const { examinationId, organizationId } = req.query as Record<string, string>;
  return res.json({ success: true, posts: db.getPostsServices({ examinationId, organizationId }) });
});

router.post('/posts', (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    organizationId,
    examinationId,
    groupId,
    departmentId,
    description,
    qualification = 'Graduation',
    branchRestriction,
    minAge = 18,
    maxAge = 35,
    paySalary,
    responsibilities,
    careerGrowth,
    officialSourceUrl,
    status = 'PUBLISHED',
  } = req.body;

  if (!name || !organizationId || !examinationId) {
    return res.status(400).json({ success: false, message: 'Name, organization, and examination are required' });
  }

  const newPost: PostService = {
    id: 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    name: name.trim(),
    organizationId,
    examinationId,
    groupId: groupId || undefined,
    departmentId: departmentId || undefined,
    description: description || '',
    qualification,
    branchRestriction,
    minAge: Number(minAge),
    maxAge: Number(maxAge),
    paySalary,
    responsibilities,
    careerGrowth,
    officialSourceUrl,
    status,
  };

  db.createPostService(newPost);
  return res.status(201).json({ success: true, message: 'Post / Service created', post: newPost });
});

router.put('/posts/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updated = db.updatePostService(id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }
  return res.json({ success: true, message: 'Post updated', post: updated });
});

router.delete('/posts/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updated = db.updatePostService(id, { status: 'ARCHIVED' });
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }
  return res.json({ success: true, message: 'Post archived' });
});

// --- 8. JOBS CRUD & PUBLISHING WORKFLOW ---
router.get('/jobs', (req: AuthenticatedRequest, res: Response) => {
  const { status, jobType, category } = req.query as Record<string, string>;
  let jobs = db.getJobs();
  if (status) jobs = jobs.filter((j) => j.status === status);
  if (jobType) jobs = jobs.filter((j) => j.jobType === jobType);
  if (category) jobs = jobs.filter((j) => j.category === category);
  return res.json({ success: true, jobs });
});

router.post('/jobs', (req: AuthenticatedRequest, res: Response) => {
  const {
    title,
    jobType = 'GOVERNMENT',
    category = 'CENTRAL',
    stateId,
    organizationId,
    companyName,
    examinationId,
    groupId,
    postId,
    department,
    qualification = 'Graduation',
    branch,
    minAge,
    maxAge,
    salary,
    vacancies = 'Not Specified',
    applicationStartDate,
    applicationEndDate,
    examDate,
    selectionProcess,
    officialNotificationUrl,
    officialApplicationUrl,
    workMode,
    experienceRequired,
    skillsRequired,
    location,
    sector,
    description,
    status = 'PUBLISHED',
  } = req.body;

  if (!title || (!organizationId && !companyName) || !officialApplicationUrl) {
    return res.status(400).json({ success: false, message: 'Job title, organization/company, and application URL are required' });
  }

  const newJob: Job = {
    id: 'job_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    title: title.trim(),
    jobType,
    category,
    companyName: companyName?.trim(),
    stateId: category === 'STATE' ? stateId : undefined,
    organizationId: organizationId || 'org_upsc',
    examinationId: examinationId || undefined,
    groupId: groupId || undefined,
    postId: postId || undefined,
    department,
    qualification,
    branch,
    minAge: minAge ? Number(minAge) : undefined,
    maxAge: maxAge ? Number(maxAge) : undefined,
    salary,
    vacancies,
    applicationStartDate: applicationStartDate || new Date().toISOString().split('T')[0],
    applicationEndDate: applicationEndDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    examDate,
    selectionProcess: selectionProcess || 'Written Examination & Document Verification',
    officialNotificationUrl: officialNotificationUrl || officialApplicationUrl,
    officialApplicationUrl: officialApplicationUrl.trim(),
    workMode,
    experienceRequired,
    skillsRequired: Array.isArray(skillsRequired) ? skillsRequired : (skillsRequired ? [skillsRequired] : undefined),
    location,
    sector,
    description,
    status,
    viewsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.createJob(newJob);
  return res.status(201).json({ success: true, message: 'Job opportunity created', job: newJob });
});

router.put('/jobs/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updated = db.updateJob(id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }
  return res.json({ success: true, message: 'Job details updated', job: updated });
});

router.put('/jobs/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }

  const updated = db.updateJob(id, { status });
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }
  return res.json({ success: true, message: `Job status updated to ${status}`, job: updated });
});

router.delete('/jobs/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updated = db.updateJob(id, { status: 'ARCHIVED' });
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }
  return res.json({ success: true, message: 'Job archived successfully' });
});

// --- 9. DYNAMIC SYLLABUS MANAGEMENT ---
// Subject CRUD & Reorder
router.post('/exams/:examId/syllabus/subjects', (req: AuthenticatedRequest, res: Response) => {
  const { examId } = req.params;
  const { name, displayOrder } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Subject name required' });

  const newSubject = db.createSubject({
    id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    examinationId: examId,
    name: name.trim(),
    displayOrder: displayOrder ? Number(displayOrder) : Date.now(),
  });
  return res.status(201).json({ success: true, subject: newSubject });
});

router.put('/syllabus/subjects/:id', (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateSubject(req.params.id, req.body);
  return res.json({ success: Boolean(updated), subject: updated });
});

router.delete('/syllabus/subjects/:id', (req: AuthenticatedRequest, res: Response) => {
  const deleted = db.deleteSubject(req.params.id);
  return res.json({ success: deleted });
});

// Topic CRUD
router.post('/syllabus/subjects/:subjectId/topics', (req: AuthenticatedRequest, res: Response) => {
  const { subjectId } = req.params;
  const { name, displayOrder } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Topic name required' });

  const newTopic = db.createTopic({
    id: 'top_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    subjectId,
    name: name.trim(),
    displayOrder: displayOrder ? Number(displayOrder) : Date.now(),
  });
  return res.status(201).json({ success: true, topic: newTopic });
});

router.put('/syllabus/topics/:id', (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateTopic(req.params.id, req.body);
  return res.json({ success: Boolean(updated), topic: updated });
});

router.delete('/syllabus/topics/:id', (req: AuthenticatedRequest, res: Response) => {
  const deleted = db.deleteTopic(req.params.id);
  return res.json({ success: deleted });
});

// Subtopic CRUD
router.post('/syllabus/topics/:topicId/subtopics', (req: AuthenticatedRequest, res: Response) => {
  const { topicId } = req.params;
  const { name, displayOrder } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Subtopic name required' });

  const newSubtopic = db.createSubtopic({
    id: 'subtop_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    topicId,
    name: name.trim(),
    displayOrder: displayOrder ? Number(displayOrder) : Date.now(),
  });
  return res.status(201).json({ success: true, subtopic: newSubtopic });
});

router.put('/syllabus/subtopics/:id', (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateSubtopic(req.params.id, req.body);
  return res.json({ success: Boolean(updated), subtopic: updated });
});

router.delete('/syllabus/subtopics/:id', (req: AuthenticatedRequest, res: Response) => {
  const deleted = db.deleteSubtopic(req.params.id);
  return res.json({ success: deleted });
});

// --- 10. DYNAMIC EXAM PATTERN BUILDER ---
// Get patterns for an exam (including drafts)
router.get('/exams/:examId/exam-patterns', (req: AuthenticatedRequest, res: Response) => {
  const patterns = db.getExamPatterns(req.params.examId, false);
  return res.json({ success: true, examPatterns: patterns });
});

// Create pattern
router.post('/exams/:examId/exam-patterns', (req: AuthenticatedRequest, res: Response) => {
  const { examId } = req.params;
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'Pattern title is required' });

  const newPattern: ExamPattern = {
    id: 'pat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    examinationId: examId,
    title: title.trim(),
    description: description || '',
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.createExamPattern(newPattern);

  // Default initial columns
  const col1 = db.addExamPatternColumn({
    id: 'col_' + Date.now() + '_1',
    examPatternId: newPattern.id,
    columnName: 'Paper / Section',
    displayOrder: 1,
  });
  const col2 = db.addExamPatternColumn({
    id: 'col_' + Date.now() + '_2',
    examPatternId: newPattern.id,
    columnName: 'Questions',
    displayOrder: 2,
  });
  const col3 = db.addExamPatternColumn({
    id: 'col_' + Date.now() + '_3',
    examPatternId: newPattern.id,
    columnName: 'Marks',
    displayOrder: 3,
  });
  const col4 = db.addExamPatternColumn({
    id: 'col_' + Date.now() + '_4',
    examPatternId: newPattern.id,
    columnName: 'Duration',
    displayOrder: 4,
  });

  // Default initial row
  const row1 = db.addExamPatternRow({
    id: 'row_' + Date.now() + '_1',
    examPatternId: newPattern.id,
    displayOrder: 1,
  });

  db.upsertCell(row1.id, col1.id, 'General Studies');
  db.upsertCell(row1.id, col2.id, '100');
  db.upsertCell(row1.id, col3.id, '200');
  db.upsertCell(row1.id, col4.id, '120 Minutes');

  const full = db.getExamPatternById(newPattern.id);
  return res.status(201).json({ success: true, examPattern: full });
});

// Update Pattern Metadata / Status (DRAFT, PUBLISHED, ARCHIVED)
router.put('/exam-patterns/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updated = db.updateExamPattern(id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Pattern not found' });
  return res.json({ success: true, examPattern: db.getExamPatternById(id) });
});

// Columns: Add Column
router.post('/exam-patterns/:patternId/columns', (req: AuthenticatedRequest, res: Response) => {
  const { patternId } = req.params;
  const { columnName, displayOrder } = req.body;
  if (!columnName) return res.status(400).json({ success: false, message: 'Column name is required' });

  const col = db.addExamPatternColumn({
    id: 'col_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    examPatternId: patternId,
    columnName: columnName.trim(),
    displayOrder: displayOrder ? Number(displayOrder) : Date.now(),
  });

  return res.status(201).json({ success: true, column: col, examPattern: db.getExamPatternById(patternId) });
});

// Columns: Edit Column
router.put('/exam-patterns/columns/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updated = db.updateExamPatternColumn(id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Column not found' });
  return res.json({ success: true, column: updated });
});

// Columns: Delete Column
router.delete('/exam-patterns/columns/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteExamPatternColumn(id);
  return res.json({ success: deleted });
});

// Rows: Add Row
router.post('/exam-patterns/:patternId/rows', (req: AuthenticatedRequest, res: Response) => {
  const { patternId } = req.params;
  const { displayOrder } = req.body;

  const row = db.addExamPatternRow({
    id: 'row_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    examPatternId: patternId,
    displayOrder: displayOrder ? Number(displayOrder) : Date.now(),
  });

  return res.status(201).json({ success: true, row, examPattern: db.getExamPatternById(patternId) });
});

// Rows: Edit / Reorder Row
router.put('/exam-patterns/rows/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updated = db.updateExamPatternRow(id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Row not found' });
  return res.json({ success: true, row: updated });
});

// Rows: Delete Row
router.delete('/exam-patterns/rows/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteExamPatternRow(id);
  return res.json({ success: deleted });
});

// Cells: Upsert Cell Value
router.put('/exam-patterns/:patternId/cells', (req: AuthenticatedRequest, res: Response) => {
  const { rowId, columnId, cellValue } = req.body;
  if (!rowId || !columnId) {
    return res.status(400).json({ success: false, message: 'rowId and columnId are required' });
  }

  const cell = db.upsertCell(rowId, columnId, cellValue !== undefined ? String(cellValue) : '');
  return res.json({ success: true, cell });
});

// --- 11. ROADMAP PHASES CRUD ---
router.post('/exams/:examId/roadmap', (req: AuthenticatedRequest, res: Response) => {
  const { examId } = req.params;
  const { phaseNumber, title, duration, description, keyActionPoints } = req.body;
  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Title and description are required' });
  }

  const phase = db.createRoadmapPhase({
    id: 'rd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    examinationId: examId,
    phaseNumber: phaseNumber ? Number(phaseNumber) : 1,
    title: title.trim(),
    duration: duration || '',
    description: description.trim(),
    keyActionPoints: Array.isArray(keyActionPoints) ? keyActionPoints : [],
  });

  return res.status(201).json({ success: true, phase });
});

router.put('/roadmap/:id', (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateRoadmapPhase(req.params.id, req.body);
  return res.json({ success: Boolean(updated), phase: updated });
});

router.delete('/roadmap/:id', (req: AuthenticatedRequest, res: Response) => {
  const deleted = db.deleteRoadmapPhase(req.params.id);
  return res.json({ success: deleted });
});

// --- 12. NOTICES CRUD ---
router.get('/notices', (_req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, notices: db.getNotices() });
});

router.post('/notices', (req: AuthenticatedRequest, res: Response) => {
  const { title, organizationName, category = 'CENTRAL', status = 'NEW', linkUrl, isImportant = false } = req.body;
  if (!title || !organizationName) {
    return res.status(400).json({ success: false, message: 'Title and organization are required' });
  }

  const notice: Notice = {
    id: 'not_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    title: title.trim(),
    organizationName: organizationName.trim(),
    category,
    status,
    date: new Date().toISOString().split('T')[0],
    linkUrl,
    isImportant: Boolean(isImportant),
  };

  db.createNotice(notice);
  return res.status(201).json({ success: true, notice });
});

router.put('/notices/:id', (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateNotice(req.params.id, req.body);
  return res.json({ success: Boolean(updated), notice: updated });
});

router.delete('/notices/:id', (req: AuthenticatedRequest, res: Response) => {
  const deleted = db.deleteNotice(req.params.id);
  return res.json({ success: deleted });
});

// --- 13. ANNOUNCEMENTS CRUD ---
router.get('/announcements', (_req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, announcements: db.getAnnouncements() });
});

router.post('/announcements', (req: AuthenticatedRequest, res: Response) => {
  const { title, content, category = 'Platform Updates', isActive = true } = req.body;
  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Title and content are required' });
  }

  const anc: Announcement = {
    id: 'anc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    title: title.trim(),
    content: content.trim(),
    category,
    date: new Date().toISOString().split('T')[0],
    isActive: Boolean(isActive),
  };

  db.createAnnouncement(anc);
  return res.status(201).json({ success: true, announcement: anc });
});

router.put('/announcements/:id', (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateAnnouncement(req.params.id, req.body);
  return res.json({ success: Boolean(updated), announcement: updated });
});

// --- 14. NOTIFICATIONS BROADCAST ---
router.get('/notifications', (_req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, notifications: db.getNotifications() });
});

router.post('/notifications', (req: AuthenticatedRequest, res: Response) => {
  const { title, message, targetAudience = 'ALL', targetValue, linkUrl } = req.body;
  if (!title || !message) {
    return res.status(400).json({ success: false, message: 'Title and message are required' });
  }

  const notification: Notification = {
    id: 'ntf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    title: title.trim(),
    message: message.trim(),
    targetAudience,
    targetValue,
    linkUrl,
    createdAt: new Date().toISOString(),
  };

  db.createNotification(notification);
  return res.status(201).json({ success: true, notification });
});

router.delete('/notifications/:id', (req: AuthenticatedRequest, res: Response) => {
  const deleted = db.deleteNotification(req.params.id);
  return res.json({ success: deleted });
});

// --- CAREER ROADMAPS ADMIN ---
router.get('/roadmaps', (_req: AuthenticatedRequest, res: Response) => {
  const roadmaps = db.getAllRoadmapsAdmin();
  return res.json({ success: true, roadmaps });
});

router.post('/roadmaps', (req: AuthenticatedRequest, res: Response) => {
  const data = req.body;
  if (!data.title) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }
  const roadmap: CareerRoadmap = {
    id: data.id || `rdmp_${Date.now()}`,
    title: data.title,
    category: data.category || 'General',
    sector: data.sector || 'BOTH',
    targetQualification: data.targetQualification || 'Any Graduate',
    importantSkills: data.importantSkills || [],
    suitableJobRoles: data.suitableJobRoles || [],
    growthOpportunities: data.growthOpportunities || '',
    overview: data.overview || '',
    learningPhases: data.learningPhases || [],
    timelinePlans: data.timelinePlans || [],
    status: data.status || 'PUBLISHED',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const saved = db.saveRoadmap(roadmap);
  return res.json({ success: true, roadmap: saved });
});

router.delete('/roadmaps/:id', (req: AuthenticatedRequest, res: Response) => {
  const deleted = db.deleteRoadmap(req.params.id);
  return res.json({ success: deleted });
});

// --- GOVERNMENT EXAMS ADMIN ---
router.get('/exam-prep/exams', (_req: AuthenticatedRequest, res: Response) => {
  const exams = db.getAllGovernmentExamsAdmin();
  return res.json({ success: true, exams });
});

router.post('/exam-prep/exams', (req: AuthenticatedRequest, res: Response) => {
  const data = req.body;
  if (!data.examName) {
    return res.status(400).json({ success: false, message: 'Exam name is required' });
  }
  const exam: GovernmentExamDetail = {
    id: data.id || `exam_${Date.now()}`,
    examName: data.examName,
    shortName: data.shortName || data.examName,
    category: data.category || 'CENTRAL',
    conductingOrganization: data.conductingOrganization || 'Recruitment Commission',
    officialWebsite: data.officialWebsite || 'https://www.india.gov.in',
    frequency: data.frequency || 'Annual',
    eligibility: data.eligibility || {
      minAge: 18,
      maxAge: 30,
      educationQualification: 'Graduation',
      nationality: 'Citizen of India',
    },
    examPattern: data.examPattern || [],
    subjects: data.subjects || [],
    syllabus: data.syllabus || [],
    recommendedBooks: data.recommendedBooks || [],
    previousYearCutoffs: data.previousYearCutoffs || [],
    status: data.status || 'PUBLISHED',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const saved = db.saveGovernmentExam(exam);
  return res.json({ success: true, exam: saved });
});

router.delete('/exam-prep/exams/:id', (req: AuthenticatedRequest, res: Response) => {
  const deleted = db.deleteGovernmentExam(req.params.id);
  return res.json({ success: deleted });
});

// --- PRACTICE QUESTIONS ADMIN ---
router.get('/exam-prep/questions', (_req: AuthenticatedRequest, res: Response) => {
  const questions = db.getAllPracticeQuestionsAdmin();
  return res.json({ success: true, questions });
});

router.post('/exam-prep/questions', (req: AuthenticatedRequest, res: Response) => {
  const data = req.body;
  if (!data.questionText || !data.options || data.options.length < 2) {
    return res.status(400).json({ success: false, message: 'Valid question text and options are required' });
  }
  const question: PracticeQuestion = {
    id: data.id || `pq_${Date.now()}`,
    examId: data.examId || '',
    subject: data.subject || 'General Studies',
    topic: data.topic || 'General',
    difficulty: data.difficulty || 'MEDIUM',
    questionText: data.questionText,
    options: data.options,
    correctAnswerIndex: Number(data.correctAnswerIndex) || 0,
    explanation: data.explanation || '',
    marks: Number(data.marks) || 1,
    negativeMarks: Number(data.negativeMarks) || 0.25,
    status: data.status || 'PUBLISHED',
  };
  const saved = db.savePracticeQuestion(question);
  return res.json({ success: true, question: saved });
});

router.delete('/exam-prep/questions/:id', (req: AuthenticatedRequest, res: Response) => {
  const deleted = db.deletePracticeQuestion(req.params.id);
  return res.json({ success: deleted });
});

// --- MOCK TESTS ADMIN ---
router.get('/exam-prep/mock-tests', (_req: AuthenticatedRequest, res: Response) => {
  const tests = db.getMockTests();
  return res.json({ success: true, mockTests: tests });
});

router.post('/exam-prep/mock-tests', (req: AuthenticatedRequest, res: Response) => {
  const data = req.body;
  if (!data.title || !data.examName) {
    return res.status(400).json({ success: false, message: 'Title and exam name are required' });
  }
  const test: MockTest = {
    id: data.id || `mt_${Date.now()}`,
    examId: data.examId || '',
    examName: data.examName,
    title: data.title,
    tierStage: data.tierStage || 'Tier 1',
    durationMinutes: Number(data.durationMinutes) || 60,
    totalMarks: Number(data.totalMarks) || 100,
    negativeMarking: Boolean(data.negativeMarking),
    negativeMarksPerWrong: Number(data.negativeMarksPerWrong) || 0.25,
    sections: data.sections || [],
    questionIds: data.questionIds || [],
    status: data.status || 'PUBLISHED',
    createdAt: data.createdAt || new Date().toISOString(),
  };
  const saved = db.saveMockTest(test);
  return res.json({ success: true, mockTest: saved });
});

router.delete('/exam-prep/mock-tests/:id', (req: AuthenticatedRequest, res: Response) => {
  const deleted = db.deleteMockTest(req.params.id);
  return res.json({ success: deleted });
});

export default router;
