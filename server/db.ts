import fs from 'fs';
import path from 'path';
import { getInitialSeedData } from './seedData.ts';
import {
  User,
  StudentProfile,
  StateEntity,
  SectorEntity,
  Organization,
  Department,
  Examination,
  ExamGroup,
  PostService,
  Job,
  SavedJob,
  ExamPattern,
  ExamPatternColumn,
  ExamPatternRow,
  ExamPatternCell,
  SyllabusSubject,
  SyllabusTopic,
  SyllabusSubtopic,
  PreparationRoadmapPhase,
  Notice,
  Announcement,
  Notification,
  UserNotificationRead,
  CareerRoadmap,
  StudentRoadmapProgress,
  MockInterview,
  GovernmentExamDetail,
  StudentExamStudyPlan,
  StudentExamSyllabusProgress,
  PracticeQuestion,
  MockTest,
  StudentMockTestAttempt,
  StudentResumeAnalysis,
} from './types.ts';

interface DatabaseSchema {
  users: User[];
  studentProfiles: StudentProfile[];
  states: StateEntity[];
  sectors: SectorEntity[];
  organizations: Organization[];
  departments: Department[];
  examinations: Examination[];
  examGroups: ExamGroup[];
  postsServices: PostService[];
  jobs: Job[];
  savedJobs: SavedJob[];
  examPatterns: ExamPattern[];
  examPatternColumns: ExamPatternColumn[];
  examPatternRows: ExamPatternRow[];
  examPatternCells: ExamPatternCell[];
  syllabusSubjects: SyllabusSubject[];
  syllabusTopics: SyllabusTopic[];
  syllabusSubtopics: SyllabusSubtopic[];
  preparationRoadmaps: PreparationRoadmapPhase[];
  notices: Notice[];
  announcements: Announcement[];
  notifications: Notification[];
  userNotificationReads: UserNotificationRead[];
  careerRoadmaps: CareerRoadmap[];
  studentRoadmapProgress: StudentRoadmapProgress[];
  mockInterviews: MockInterview[];
  governmentExams: GovernmentExamDetail[];
  studentExamStudyPlans: StudentExamStudyPlan[];
  studentExamSyllabusProgress: StudentExamSyllabusProgress[];
  practiceQuestions: PracticeQuestion[];
  mockTests: MockTest[];
  studentMockTestAttempts: StudentMockTestAttempt[];
  studentResumes: StudentResumeAnalysis[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

class Database {
  private data: DatabaseSchema;
  private isLoaded = false;

  constructor() {
    this.data = getInitialSeedData();
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        if (fileContent.trim()) {
          const parsed = JSON.parse(fileContent) as Partial<DatabaseSchema>;
          // Merge with initial seed data to ensure all keys and state-wise jobs exist
          const initial = getInitialSeedData();

          // Merge states
          const stateMap = new Map<string, StateEntity>();
          initial.states.forEach(s => stateMap.set(s.id, s));
          if (parsed.states) parsed.states.forEach(s => stateMap.set(s.id, s));

          // Merge organizations
          const orgMap = new Map<string, Organization>();
          initial.organizations.forEach(o => orgMap.set(o.id, o));
          if (parsed.organizations) parsed.organizations.forEach(o => orgMap.set(o.id, o));

          // Merge jobs (seed jobs added, user modifications preserved)
          const jobMap = new Map<string, Job>();
          initial.jobs.forEach(j => jobMap.set(j.id, j));
          if (parsed.jobs) {
            parsed.jobs.forEach(j => {
              jobMap.set(j.id, j);
            });
          }

          // Merge users (seed users preserved, registered users preserved)
          const userMap = new Map<string, User>();
          initial.users.forEach(u => userMap.set(u.id, u));
          if (parsed.users) parsed.users.forEach(u => userMap.set(u.id, u));

          // Merge student profiles (keyed by userId to prevent duplicates and preserve registered profiles)
          const profileMap = new Map<string, StudentProfile>();
          initial.studentProfiles.forEach(p => profileMap.set(p.userId, p));
          if (parsed.studentProfiles) parsed.studentProfiles.forEach(p => profileMap.set(p.userId, p));

          this.data = {
            users: Array.from(userMap.values()),
            studentProfiles: Array.from(profileMap.values()),
            states: Array.from(stateMap.values()),
            sectors: parsed.sectors?.length ? parsed.sectors : initial.sectors,
            organizations: Array.from(orgMap.values()),
            departments: parsed.departments || initial.departments,
            examinations: parsed.examinations?.length ? parsed.examinations : initial.examinations,
            examGroups: parsed.examGroups || initial.examGroups,
            postsServices: parsed.postsServices?.length ? parsed.postsServices : initial.postsServices,
            jobs: Array.from(jobMap.values()),
            savedJobs: parsed.savedJobs || [],
            examPatterns: parsed.examPatterns?.length ? parsed.examPatterns : initial.examPatterns,
            examPatternColumns: parsed.examPatternColumns?.length ? parsed.examPatternColumns : initial.examPatternColumns,
            examPatternRows: parsed.examPatternRows?.length ? parsed.examPatternRows : initial.examPatternRows,
            examPatternCells: parsed.examPatternCells?.length ? parsed.examPatternCells : initial.examPatternCells,
            syllabusSubjects: parsed.syllabusSubjects?.length ? parsed.syllabusSubjects : initial.syllabusSubjects,
            syllabusTopics: parsed.syllabusTopics?.length ? parsed.syllabusTopics : initial.syllabusTopics,
            syllabusSubtopics: parsed.syllabusSubtopics?.length ? parsed.syllabusSubtopics : initial.syllabusSubtopics,
            preparationRoadmaps: parsed.preparationRoadmaps?.length ? parsed.preparationRoadmaps : initial.preparationRoadmaps,
            notices: parsed.notices?.length ? parsed.notices : initial.notices,
            announcements: parsed.announcements?.length ? parsed.announcements : initial.announcements,
            notifications: parsed.notifications?.length ? parsed.notifications : initial.notifications,
            userNotificationReads: parsed.userNotificationReads || [],
            careerRoadmaps: parsed.careerRoadmaps?.length ? parsed.careerRoadmaps : initial.careerRoadmaps,
            studentRoadmapProgress: parsed.studentRoadmapProgress || [],
            mockInterviews: parsed.mockInterviews || [],
            governmentExams: parsed.governmentExams?.length ? parsed.governmentExams : initial.governmentExams,
            studentExamStudyPlans: parsed.studentExamStudyPlans || [],
            studentExamSyllabusProgress: parsed.studentExamSyllabusProgress || [],
            practiceQuestions: parsed.practiceQuestions?.length ? parsed.practiceQuestions : initial.practiceQuestions,
            mockTests: parsed.mockTests?.length ? parsed.mockTests : initial.mockTests,
            studentMockTestAttempts: parsed.studentMockTestAttempts || [],
            studentResumes: (parsed as any).studentResumes || [],
          };
          this.persist();
          this.isLoaded = true;
          return;
        }
      }

      // If no file exists, write seed data
      this.persist();
      this.isLoaded = true;
    } catch (err) {
      console.error('Error initializing database file, using in-memory seed fallback:', err);
      this.data = getInitialSeedData();
      this.isLoaded = true;
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpPath = DB_FILE + '.tmp';
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpPath, DB_FILE);
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
  }

  // --- USERS & PROFILES ---
  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserById(id: string): User | undefined {
    return this.findUserById(id);
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    return this.data.users[idx];
  }

  public getAllUsers(): User[] {
    return this.data.users;
  }

  public getProfileByUserId(userId: string): StudentProfile | undefined {
    return this.data.studentProfiles.find((p) => p.userId === userId);
  }

  public upsertProfile(userId: string, profileData: Partial<StudentProfile>): StudentProfile {
    const existingIdx = this.data.studentProfiles.findIndex((p) => p.userId === userId);
    const now = new Date().toISOString();
    if (existingIdx !== -1) {
      this.data.studentProfiles[existingIdx] = {
        ...this.data.studentProfiles[existingIdx],
        ...profileData,
        updatedAt: now,
      };
      this.persist();
      return this.data.studentProfiles[existingIdx];
    } else {
      const newProfile: StudentProfile = {
        id: 'prof_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        userId,
        fullName: profileData.fullName || '',
        email: profileData.email || '',
        mobileNumber: profileData.mobileNumber || '',
        interests: profileData.interests || [],
        skills: profileData.skills || [],
        preferredCategories: profileData.preferredCategories || ['CENTRAL', 'STATE'],
        createdAt: now,
        updatedAt: now,
        ...profileData,
      };
      this.data.studentProfiles.push(newProfile);
      this.persist();
      return newProfile;
    }
  }

  // --- STATES & SECTORS ---
  public getStates(): StateEntity[] {
    return this.data.states;
  }

  public getSectors(): SectorEntity[] {
    return this.data.sectors;
  }

  // --- ORGANIZATIONS ---
  public getOrganizations(filter?: { type?: string; stateId?: string; sectorId?: string; status?: string }): Organization[] {
    return this.data.organizations.filter((org) => {
      if (filter?.status && org.status !== filter.status) return false;
      if (filter?.type && org.type !== filter.type) return false;
      if (filter?.stateId && org.stateId !== filter.stateId) return false;
      if (filter?.sectorId && org.sectorId !== filter.sectorId) return false;
      return true;
    });
  }

  public getOrganizationById(id: string): Organization | undefined {
    return this.data.organizations.find((o) => o.id === id);
  }

  public createOrganization(org: Organization): Organization {
    this.data.organizations.push(org);
    this.persist();
    return org;
  }

  public updateOrganization(id: string, updates: Partial<Organization>): Organization | null {
    const idx = this.data.organizations.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    this.data.organizations[idx] = { ...this.data.organizations[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    return this.data.organizations[idx];
  }

  // --- DEPARTMENTS ---
  public getDepartments(organizationId?: string): Department[] {
    if (organizationId) {
      return this.data.departments.filter((d) => d.organizationId === organizationId);
    }
    return this.data.departments;
  }

  public createDepartment(dept: Department): Department {
    this.data.departments.push(dept);
    this.persist();
    return dept;
  }

  // --- EXAMINATIONS ---
  public getExaminations(filter?: { organizationId?: string; examType?: string; status?: string }): Examination[] {
    return this.data.examinations.filter((exam) => {
      if (filter?.status && exam.status !== filter.status) return false;
      if (filter?.organizationId && exam.organizationId !== filter.organizationId) return false;
      if (filter?.examType && exam.examType !== filter.examType) return false;
      return true;
    });
  }

  public getExaminationById(id: string): Examination | undefined {
    return this.data.examinations.find((e) => e.id === id);
  }

  public createExamination(exam: Examination): Examination {
    this.data.examinations.push(exam);
    this.persist();
    return exam;
  }

  public updateExamination(id: string, updates: Partial<Examination>): Examination | null {
    const idx = this.data.examinations.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    this.data.examinations[idx] = { ...this.data.examinations[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    return this.data.examinations[idx];
  }

  // --- EXAM GROUPS ---
  public getExamGroups(examinationId?: string): ExamGroup[] {
    let groups = this.data.examGroups;
    if (examinationId) {
      groups = groups.filter((g) => g.examinationId === examinationId);
    }
    return groups.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public createExamGroup(group: ExamGroup): ExamGroup {
    this.data.examGroups.push(group);
    this.persist();
    return group;
  }

  public updateExamGroup(id: string, updates: Partial<ExamGroup>): ExamGroup | null {
    const idx = this.data.examGroups.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    this.data.examGroups[idx] = { ...this.data.examGroups[idx], ...updates };
    this.persist();
    return this.data.examGroups[idx];
  }

  // --- POSTS & SERVICES ---
  public getPostsServices(filter?: { examinationId?: string; organizationId?: string; groupId?: string; status?: string }): PostService[] {
    return this.data.postsServices.filter((post) => {
      if (filter?.status && post.status !== filter.status) return false;
      if (filter?.examinationId && post.examinationId !== filter.examinationId) return false;
      if (filter?.organizationId && post.organizationId !== filter.organizationId) return false;
      if (filter?.groupId && post.groupId !== filter.groupId) return false;
      return true;
    });
  }

  public getPostServiceById(id: string): PostService | undefined {
    return this.data.postsServices.find((p) => p.id === id);
  }

  public createPostService(post: PostService): PostService {
    this.data.postsServices.push(post);
    this.persist();
    return post;
  }

  public updatePostService(id: string, updates: Partial<PostService>): PostService | null {
    const idx = this.data.postsServices.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.postsServices[idx] = { ...this.data.postsServices[idx], ...updates };
    this.persist();
    return this.data.postsServices[idx];
  }

  // --- JOBS ---
  public getJobs(): Job[] {
    return this.data.jobs;
  }

  public getJobById(id: string): Job | undefined {
    return this.data.jobs.find((j) => j.id === id);
  }

  public incrementJobViews(id: string): void {
    const job = this.getJobById(id);
    if (job) {
      job.viewsCount = (job.viewsCount || 0) + 1;
      this.persist();
    }
  }

  public createJob(job: Job): Job {
    this.data.jobs.push(job);
    this.persist();
    return job;
  }

  public updateJob(id: string, updates: Partial<Job>): Job | null {
    const idx = this.data.jobs.findIndex((j) => j.id === id);
    if (idx === -1) return null;
    this.data.jobs[idx] = { ...this.data.jobs[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    return this.data.jobs[idx];
  }

  // --- SAVED JOBS ---
  public getSavedJobs(userId: string): SavedJob[] {
    return this.data.savedJobs.filter((s) => s.userId === userId);
  }

  public saveJob(userId: string, jobId: string): SavedJob {
    const existing = this.data.savedJobs.find((s) => s.userId === userId && s.jobId === jobId);
    if (existing) return existing;
    const newSaved: SavedJob = {
      id: 'saved_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      jobId,
      savedAt: new Date().toISOString(),
    };
    this.data.savedJobs.push(newSaved);
    this.persist();
    return newSaved;
  }

  public unsaveJob(userId: string, jobId: string): boolean {
    const idx = this.data.savedJobs.findIndex((s) => s.userId === userId && s.jobId === jobId);
    if (idx !== -1) {
      this.data.savedJobs.splice(idx, 1);
      this.persist();
      return true;
    }
    return false;
  }

  // --- DYNAMIC SYLLABUS ---
  public getSyllabusTree(examinationId: string) {
    const subjects = this.data.syllabusSubjects
      .filter((s) => s.examinationId === examinationId)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    return subjects.map((subject) => {
      const topics = this.data.syllabusTopics
        .filter((t) => t.subjectId === subject.id)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((topic) => {
          const subtopics = this.data.syllabusSubtopics
            .filter((st) => st.topicId === topic.id)
            .sort((a, b) => a.displayOrder - b.displayOrder);
          return { ...topic, subtopics };
        });
      return { ...subject, topics };
    });
  }

  public createSubject(subject: SyllabusSubject): SyllabusSubject {
    this.data.syllabusSubjects.push(subject);
    this.persist();
    return subject;
  }

  public updateSubject(id: string, updates: Partial<SyllabusSubject>): SyllabusSubject | null {
    const idx = this.data.syllabusSubjects.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.data.syllabusSubjects[idx] = { ...this.data.syllabusSubjects[idx], ...updates };
    this.persist();
    return this.data.syllabusSubjects[idx];
  }

  public deleteSubject(id: string): boolean {
    const idx = this.data.syllabusSubjects.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    const topicIds = this.data.syllabusTopics.filter((t) => t.subjectId === id).map((t) => t.id);
    this.data.syllabusSubtopics = this.data.syllabusSubtopics.filter((st) => !topicIds.includes(st.topicId));
    this.data.syllabusTopics = this.data.syllabusTopics.filter((t) => t.subjectId !== id);
    this.data.syllabusSubjects.splice(idx, 1);
    this.persist();
    return true;
  }

  public createTopic(topic: SyllabusTopic): SyllabusTopic {
    this.data.syllabusTopics.push(topic);
    this.persist();
    return topic;
  }

  public updateTopic(id: string, updates: Partial<SyllabusTopic>): SyllabusTopic | null {
    const idx = this.data.syllabusTopics.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.data.syllabusTopics[idx] = { ...this.data.syllabusTopics[idx], ...updates };
    this.persist();
    return this.data.syllabusTopics[idx];
  }

  public deleteTopic(id: string): boolean {
    const idx = this.data.syllabusTopics.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    this.data.syllabusSubtopics = this.data.syllabusSubtopics.filter((st) => st.topicId !== id);
    this.data.syllabusTopics.splice(idx, 1);
    this.persist();
    return true;
  }

  public createSubtopic(subtopic: SyllabusSubtopic): SyllabusSubtopic {
    this.data.syllabusSubtopics.push(subtopic);
    this.persist();
    return subtopic;
  }

  public updateSubtopic(id: string, updates: Partial<SyllabusSubtopic>): SyllabusSubtopic | null {
    const idx = this.data.syllabusSubtopics.findIndex((st) => st.id === id);
    if (idx === -1) return null;
    this.data.syllabusSubtopics[idx] = { ...this.data.syllabusSubtopics[idx], ...updates };
    this.persist();
    return this.data.syllabusSubtopics[idx];
  }

  public deleteSubtopic(id: string): boolean {
    const idx = this.data.syllabusSubtopics.findIndex((st) => st.id === id);
    if (idx === -1) return false;
    this.data.syllabusSubtopics.splice(idx, 1);
    this.persist();
    return true;
  }

  // --- DYNAMIC EXAM PATTERNS ---
  public getExamPatterns(examinationId: string, onlyPublished = true) {
    let patterns = this.data.examPatterns.filter((p) => p.examinationId === examinationId);
    if (onlyPublished) {
      patterns = patterns.filter((p) => p.status === 'PUBLISHED');
    }

    return patterns.map((pattern) => {
      const columns = this.data.examPatternColumns
        .filter((c) => c.examPatternId === pattern.id)
        .sort((a, b) => a.displayOrder - b.displayOrder);

      const rows = this.data.examPatternRows
        .filter((r) => r.examPatternId === pattern.id)
        .sort((a, b) => a.displayOrder - b.displayOrder);

      const cells = this.data.examPatternCells.filter((cell) =>
        rows.some((r) => r.id === cell.rowId)
      );

      return {
        ...pattern,
        columns,
        rows,
        cells,
      };
    });
  }

  public getExamPatternById(id: string) {
    const pattern = this.data.examPatterns.find((p) => p.id === id);
    if (!pattern) return null;

    const columns = this.data.examPatternColumns
      .filter((c) => c.examPatternId === pattern.id)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const rows = this.data.examPatternRows
      .filter((r) => r.examPatternId === pattern.id)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const cells = this.data.examPatternCells.filter((cell) =>
      rows.some((r) => r.id === cell.rowId)
    );

    return { ...pattern, columns, rows, cells };
  }

  public createExamPattern(pattern: ExamPattern): ExamPattern {
    this.data.examPatterns.push(pattern);
    this.persist();
    return pattern;
  }

  public updateExamPattern(id: string, updates: Partial<ExamPattern>): ExamPattern | null {
    const idx = this.data.examPatterns.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.examPatterns[idx] = { ...this.data.examPatterns[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    return this.data.examPatterns[idx];
  }

  public addExamPatternColumn(col: ExamPatternColumn): ExamPatternColumn {
    this.data.examPatternColumns.push(col);
    this.persist();
    return col;
  }

  public updateExamPatternColumn(id: string, updates: Partial<ExamPatternColumn>): ExamPatternColumn | null {
    const idx = this.data.examPatternColumns.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.data.examPatternColumns[idx] = { ...this.data.examPatternColumns[idx], ...updates };
    this.persist();
    return this.data.examPatternColumns[idx];
  }

  public deleteExamPatternColumn(id: string): boolean {
    const idx = this.data.examPatternColumns.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.data.examPatternCells = this.data.examPatternCells.filter((cell) => cell.columnId !== id);
    this.data.examPatternColumns.splice(idx, 1);
    this.persist();
    return true;
  }

  public addExamPatternRow(row: ExamPatternRow): ExamPatternRow {
    this.data.examPatternRows.push(row);
    this.persist();
    return row;
  }

  public updateExamPatternRow(id: string, updates: Partial<ExamPatternRow>): ExamPatternRow | null {
    const idx = this.data.examPatternRows.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.data.examPatternRows[idx] = { ...this.data.examPatternRows[idx], ...updates };
    this.persist();
    return this.data.examPatternRows[idx];
  }

  public deleteExamPatternRow(id: string): boolean {
    const idx = this.data.examPatternRows.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    this.data.examPatternCells = this.data.examPatternCells.filter((cell) => cell.rowId !== id);
    this.data.examPatternRows.splice(idx, 1);
    this.persist();
    return true;
  }

  public upsertCell(rowId: string, columnId: string, cellValue: string): ExamPatternCell {
    const existingIdx = this.data.examPatternCells.findIndex((c) => c.rowId === rowId && c.columnId === columnId);
    if (existingIdx !== -1) {
      this.data.examPatternCells[existingIdx].cellValue = cellValue;
      this.persist();
      return this.data.examPatternCells[existingIdx];
    } else {
      const newCell: ExamPatternCell = {
        id: 'cell_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        rowId,
        columnId,
        cellValue,
      };
      this.data.examPatternCells.push(newCell);
      this.persist();
      return newCell;
    }
  }

  // --- PREPARATION ROADMAPS ---
  public getRoadmap(examinationId: string): PreparationRoadmapPhase[] {
    return this.data.preparationRoadmaps
      .filter((r) => r.examinationId === examinationId)
      .sort((a, b) => a.phaseNumber - b.phaseNumber);
  }

  public createRoadmapPhase(phase: PreparationRoadmapPhase): PreparationRoadmapPhase {
    this.data.preparationRoadmaps.push(phase);
    this.persist();
    return phase;
  }

  public updateRoadmapPhase(id: string, updates: Partial<PreparationRoadmapPhase>): PreparationRoadmapPhase | null {
    const idx = this.data.preparationRoadmaps.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.data.preparationRoadmaps[idx] = { ...this.data.preparationRoadmaps[idx], ...updates };
    this.persist();
    return this.data.preparationRoadmaps[idx];
  }

  public deleteRoadmapPhase(id: string): boolean {
    const idx = this.data.preparationRoadmaps.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    this.data.preparationRoadmaps.splice(idx, 1);
    this.persist();
    return true;
  }

  // --- NOTICES & ANNOUNCEMENTS ---
  public getNotices(): Notice[] {
    return this.data.notices;
  }

  public createNotice(notice: Notice): Notice {
    this.data.notices.unshift(notice);
    this.persist();
    return notice;
  }

  public updateNotice(id: string, updates: Partial<Notice>): Notice | null {
    const idx = this.data.notices.findIndex((n) => n.id === id);
    if (idx === -1) return null;
    this.data.notices[idx] = { ...this.data.notices[idx], ...updates };
    this.persist();
    return this.data.notices[idx];
  }

  public deleteNotice(id: string): boolean {
    const idx = this.data.notices.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    this.data.notices.splice(idx, 1);
    this.persist();
    return true;
  }

  public getAnnouncements(): Announcement[] {
    return this.data.announcements;
  }

  public createAnnouncement(announcement: Announcement): Announcement {
    this.data.announcements.unshift(announcement);
    this.persist();
    return announcement;
  }

  public updateAnnouncement(id: string, updates: Partial<Announcement>): Announcement | null {
    const idx = this.data.announcements.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    this.data.announcements[idx] = { ...this.data.announcements[idx], ...updates };
    this.persist();
    return this.data.announcements[idx];
  }

  // --- NOTIFICATIONS ---
  public getNotifications(): Notification[] {
    return this.data.notifications;
  }

  public createNotification(notification: Notification): Notification {
    this.data.notifications.unshift(notification);
    this.persist();
    return notification;
  }

  public deleteNotification(id: string): boolean {
    const idx = this.data.notifications.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    this.data.notifications.splice(idx, 1);
    this.persist();
    return true;
  }

  // --- ANALYTICS ---
  public getAnalytics() {
    const totalStudents = this.data.users.filter((u) => u.role === 'STUDENT').length;
    const activeStudents = this.data.users.filter((u) => u.role === 'STUDENT' && u.isActive).length;
    const totalOrganizations = this.data.organizations.length;
    const totalExaminations = this.data.examinations.length;
    const totalGovJobs = this.data.jobs.filter((j) => j.jobType === 'GOVERNMENT').length;
    const totalPrivateJobs = this.data.jobs.filter((j) => j.jobType === 'PRIVATE').length;
    const publishedJobs = this.data.jobs.filter((j) => j.status === 'PUBLISHED').length;
    const draftJobs = this.data.jobs.filter((j) => j.status === 'DRAFT').length;

    const now = new Date();
    const expiringSoon = this.data.jobs.filter((j) => {
      if (!j.applicationEndDate || j.status !== 'PUBLISHED') return false;
      const end = new Date(j.applicationEndDate);
      const diffDays = (end.getTime() - now.getTime()) / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 15;
    }).length;

    const totalViews = this.data.jobs.reduce((acc, j) => acc + (j.viewsCount || 0), 0);
    const totalSavedJobs = this.data.savedJobs.length;

    // Popular exams
    const popularExams = this.data.examinations.slice(0, 5).map((e) => {
      const relatedJobs = this.data.jobs.filter((j) => j.examinationId === e.id);
      const views = relatedJobs.reduce((acc, j) => acc + (j.viewsCount || 0), 0);
      return { id: e.id, name: e.shortName || e.name, views };
    });

    // Popular organizations
    const popularOrganizations = this.data.organizations.slice(0, 6).map((o) => {
      const relatedJobs = this.data.jobs.filter((j) => j.organizationId === o.id);
      const views = relatedJobs.reduce((acc, j) => acc + (j.viewsCount || 0), 0);
      return { id: o.id, name: o.shortName || o.name, count: relatedJobs.length, views };
    });

    return {
      totalStudents,
      activeStudents,
      totalOrganizations,
      totalExaminations,
      totalGovJobs,
      totalPrivateJobs,
      publishedJobs,
      draftJobs,
      expiringSoon,
      totalViews,
      totalSavedJobs,
      popularExams,
      popularOrganizations,
    };
  }

  // ==========================================
  // CAREER ROADMAPS METHODS
  // ==========================================

  getRoadmaps(sector?: string, category?: string, query?: string): CareerRoadmap[] {
    return this.data.careerRoadmaps.filter((r) => {
      if (r.status !== 'PUBLISHED') return false;
      if (sector && sector !== 'ALL' && r.sector !== 'BOTH' && r.sector !== sector) return false;
      if (category && category !== 'ALL' && r.category !== category) return false;
      if (query) {
        const q = query.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesSkills = r.importantSkills.some((s) => s.toLowerCase().includes(q));
        const matchesRoles = r.suitableJobRoles.some((role) => role.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSkills && !matchesRoles) return false;
      }
      return true;
    });
  }

  getAllRoadmapsAdmin(): CareerRoadmap[] {
    return [...this.data.careerRoadmaps];
  }

  getRoadmapById(id: string): CareerRoadmap | undefined {
    return this.data.careerRoadmaps.find((r) => r.id === id);
  }

  saveRoadmap(roadmap: CareerRoadmap): CareerRoadmap {
    const index = this.data.careerRoadmaps.findIndex((r) => r.id === roadmap.id);
    if (index >= 0) {
      this.data.careerRoadmaps[index] = { ...roadmap, updatedAt: new Date().toISOString() };
    } else {
      this.data.careerRoadmaps.push({
        ...roadmap,
        createdAt: roadmap.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    this.persist();
    return roadmap;
  }

  deleteRoadmap(id: string): boolean {
    const initialLen = this.data.careerRoadmaps.length;
    this.data.careerRoadmaps = this.data.careerRoadmaps.filter((r) => r.id !== id);
    if (this.data.careerRoadmaps.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  getStudentRoadmapProgress(userId: string, roadmapId: string): StudentRoadmapProgress | undefined {
    return this.data.studentRoadmapProgress.find((p) => p.userId === userId && p.roadmapId === roadmapId);
  }

  getStudentAllRoadmaps(userId: string): StudentRoadmapProgress[] {
    return this.data.studentRoadmapProgress.filter((p) => p.userId === userId);
  }

  saveStudentRoadmapProgress(progress: StudentRoadmapProgress): StudentRoadmapProgress {
    const index = this.data.studentRoadmapProgress.findIndex(
      (p) => p.userId === progress.userId && p.roadmapId === progress.roadmapId
    );
    const now = new Date().toISOString();
    if (index >= 0) {
      this.data.studentRoadmapProgress[index] = {
        ...this.data.studentRoadmapProgress[index],
        ...progress,
        lastActiveAt: now,
        updatedAt: now,
      };
    } else {
      this.data.studentRoadmapProgress.push({
        ...progress,
        createdAt: now,
        lastActiveAt: now,
        updatedAt: now,
      });
    }
    this.persist();
    return progress;
  }

  deleteStudentRoadmap(userId: string, roadmapId: string): boolean {
    const lenBefore = this.data.studentRoadmapProgress.length;
    this.data.studentRoadmapProgress = this.data.studentRoadmapProgress.filter(
      (p) => !(p.userId === userId && p.roadmapId === roadmapId)
    );
    if (this.data.studentRoadmapProgress.length !== lenBefore) {
      this.persist();
      return true;
    }
    return false;
  }

  // ==========================================
  // AI MOCK INTERVIEW METHODS
  // ==========================================

  createMockInterview(interview: MockInterview): MockInterview {
    this.data.mockInterviews.push(interview);
    this.persist();
    return interview;
  }

  getMockInterview(id: string): MockInterview | undefined {
    return this.data.mockInterviews.find((i) => i.id === id);
  }

  updateMockInterview(interview: MockInterview): MockInterview {
    const index = this.data.mockInterviews.findIndex((i) => i.id === interview.id);
    if (index >= 0) {
      this.data.mockInterviews[index] = interview;
      this.persist();
    }
    return interview;
  }

  getStudentMockInterviews(userId: string): MockInterview[] {
    return this.data.mockInterviews
      .filter((i) => i.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  deleteStudentMockInterview(userId: string, interviewId: string): boolean {
    const initialLen = this.data.mockInterviews.length;
    this.data.mockInterviews = this.data.mockInterviews.filter(
      (i) => !(i.id === interviewId && i.userId === userId)
    );
    if (this.data.mockInterviews.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // ==========================================
  // GOVERNMENT EXAM PREPARATION METHODS
  // ==========================================

  getGovernmentExams(category?: string, query?: string): GovernmentExamDetail[] {
    return this.data.governmentExams.filter((e) => {
      if (e.status !== 'PUBLISHED') return false;
      if (category && category !== 'ALL' && e.category !== category) return false;
      if (query) {
        const q = query.toLowerCase();
        const matchesName = e.examName.toLowerCase().includes(q) || e.shortName.toLowerCase().includes(q);
        const matchesOrg = e.conductingOrganization.toLowerCase().includes(q);
        const matchesSubj = e.subjects.some((s) => s.toLowerCase().includes(q));
        if (!matchesName && !matchesOrg && !matchesSubj) return false;
      }
      return true;
    });
  }

  getAllGovernmentExamsAdmin(): GovernmentExamDetail[] {
    return [...this.data.governmentExams];
  }

  getGovernmentExamById(id: string): GovernmentExamDetail | undefined {
    return this.data.governmentExams.find((e) => e.id === id);
  }

  saveGovernmentExam(exam: GovernmentExamDetail): GovernmentExamDetail {
    const index = this.data.governmentExams.findIndex((e) => e.id === exam.id);
    const now = new Date().toISOString();
    if (index >= 0) {
      this.data.governmentExams[index] = { ...exam, updatedAt: now };
    } else {
      this.data.governmentExams.push({ ...exam, createdAt: exam.createdAt || now, updatedAt: now });
    }
    this.persist();
    return exam;
  }

  deleteGovernmentExam(id: string): boolean {
    const initialLen = this.data.governmentExams.length;
    this.data.governmentExams = this.data.governmentExams.filter((e) => e.id !== id);
    if (this.data.governmentExams.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  getStudentStudyPlan(userId: string, examId: string): StudentExamStudyPlan | undefined {
    return this.data.studentExamStudyPlans.find((p) => p.userId === userId && p.examId === examId);
  }

  saveStudentStudyPlan(plan: StudentExamStudyPlan): StudentExamStudyPlan {
    const index = this.data.studentExamStudyPlans.findIndex(
      (p) => p.userId === plan.userId && p.examId === plan.examId
    );
    const now = new Date().toISOString();
    if (index >= 0) {
      this.data.studentExamStudyPlans[index] = { ...plan, updatedAt: now };
    } else {
      this.data.studentExamStudyPlans.push({ ...plan, createdAt: now, updatedAt: now });
    }
    this.persist();
    return plan;
  }

  getStudentSyllabusProgress(userId: string, examId: string): StudentExamSyllabusProgress | undefined {
    return this.data.studentExamSyllabusProgress.find((p) => p.userId === userId && p.examId === examId);
  }

  saveStudentSyllabusProgress(progress: StudentExamSyllabusProgress): StudentExamSyllabusProgress {
    const index = this.data.studentExamSyllabusProgress.findIndex(
      (p) => p.userId === progress.userId && p.examId === progress.examId
    );
    const now = new Date().toISOString();
    if (index >= 0) {
      this.data.studentExamSyllabusProgress[index] = { ...progress, updatedAt: now };
    } else {
      this.data.studentExamSyllabusProgress.push({ ...progress, updatedAt: now });
    }
    this.persist();
    return progress;
  }

  getPracticeQuestions(params: {
    examId?: string;
    subject?: string;
    topic?: string;
    difficulty?: string;
    limit?: number;
  }): PracticeQuestion[] {
    let questions = this.data.practiceQuestions.filter((q) => q.status === 'PUBLISHED');
    if (params.examId && params.examId !== 'ALL') {
      questions = questions.filter((q) => q.examId === params.examId);
    }
    if (params.subject && params.subject !== 'ALL') {
      questions = questions.filter((q) => q.subject.toLowerCase() === params.subject!.toLowerCase());
    }
    if (params.topic && params.topic !== 'ALL') {
      questions = questions.filter((q) => q.topic.toLowerCase() === params.topic!.toLowerCase());
    }
    if (params.difficulty && params.difficulty !== 'ALL') {
      questions = questions.filter((q) => q.difficulty === params.difficulty);
    }
    if (params.limit && params.limit > 0) {
      return questions.slice(0, params.limit);
    }
    return questions;
  }

  getAllPracticeQuestionsAdmin(): PracticeQuestion[] {
    return [...this.data.practiceQuestions];
  }

  getPracticeQuestionById(id: string): PracticeQuestion | undefined {
    return this.data.practiceQuestions.find((q) => q.id === id);
  }

  savePracticeQuestion(question: PracticeQuestion): PracticeQuestion {
    const index = this.data.practiceQuestions.findIndex((q) => q.id === question.id);
    if (index >= 0) {
      this.data.practiceQuestions[index] = question;
    } else {
      this.data.practiceQuestions.push(question);
    }
    this.persist();
    return question;
  }

  deletePracticeQuestion(id: string): boolean {
    const initialLen = this.data.practiceQuestions.length;
    this.data.practiceQuestions = this.data.practiceQuestions.filter((q) => q.id !== id);
    if (this.data.practiceQuestions.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  getMockTests(examId?: string): MockTest[] {
    let tests = this.data.mockTests.filter((t) => t.status === 'PUBLISHED');
    if (examId && examId !== 'ALL') {
      tests = tests.filter((t) => t.examId === examId);
    }
    return tests.map((t) => {
      const qs = this.data.practiceQuestions.filter((q) => t.questionIds.includes(q.id));
      return { ...t, questions: qs };
    });
  }

  getMockTestById(id: string): MockTest | undefined {
    const test = this.data.mockTests.find((t) => t.id === id);
    if (!test) return undefined;
    const questions = this.data.practiceQuestions.filter((q) => test.questionIds.includes(q.id));
    return { ...test, questions };
  }

  saveMockTest(test: MockTest): MockTest {
    const index = this.data.mockTests.findIndex((t) => t.id === test.id);
    if (index >= 0) {
      this.data.mockTests[index] = test;
    } else {
      this.data.mockTests.push({ ...test, createdAt: test.createdAt || new Date().toISOString() });
    }
    this.persist();
    return test;
  }

  deleteMockTest(id: string): boolean {
    const initialLen = this.data.mockTests.length;
    this.data.mockTests = this.data.mockTests.filter((t) => t.id !== id);
    if (this.data.mockTests.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  recordMockTestAttempt(attempt: StudentMockTestAttempt): StudentMockTestAttempt {
    this.data.studentMockTestAttempts.push(attempt);
    this.persist();
    return attempt;
  }

  getStudentMockTestAttempts(userId: string, examName?: string): StudentMockTestAttempt[] {
    return this.data.studentMockTestAttempts
      .filter((a) => a.userId === userId && (!examName || a.examName.toLowerCase().includes(examName.toLowerCase())))
      .sort((a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime());
  }

  // Confirmed Resume Storage linked to authenticated student ID
  getResumeByUserId(userId: string): StudentResumeAnalysis | undefined {
    if (!this.data.studentResumes) this.data.studentResumes = [];
    return this.data.studentResumes.find((r) => r.userId === userId);
  }

  getResumeById(id: string): StudentResumeAnalysis | undefined {
    if (!this.data.studentResumes) this.data.studentResumes = [];
    return this.data.studentResumes.find((r) => r.id === id);
  }

  saveResume(userId: string, resumeData: Partial<StudentResumeAnalysis>): StudentResumeAnalysis {
    if (!this.data.studentResumes) this.data.studentResumes = [];
    const idx = this.data.studentResumes.findIndex((r) => r.userId === userId);
    const now = new Date().toISOString();

    let saved: StudentResumeAnalysis;
    if (idx >= 0) {
      saved = {
        ...this.data.studentResumes[idx],
        ...resumeData,
        userId,
        updatedAt: now,
      };
      this.data.studentResumes[idx] = saved;
    } else {
      saved = {
        id: resumeData.id || `res_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId,
        fullName: resumeData.fullName || 'Not mentioned in resume',
        email: resumeData.email || 'Not mentioned in resume',
        mobileNumber: resumeData.mobileNumber || 'Not mentioned in resume',
        location: resumeData.location || 'Not mentioned in resume',
        state: resumeData.state || 'Not mentioned in resume',
        districtOrCity: resumeData.districtOrCity || 'Not mentioned in resume',
        highestQualification: resumeData.highestQualification || 'Graduation',
        degree: resumeData.degree || 'Not mentioned in resume',
        branch: resumeData.branch || 'Not mentioned in resume',
        collegeOrUniversity: resumeData.collegeOrUniversity || 'Not mentioned in resume',
        graduationYear: resumeData.graduationYear || 'Not mentioned in resume',
        educationDetails: resumeData.educationDetails || 'Not mentioned in resume',
        academicQualifications: resumeData.academicQualifications || 'Not mentioned in resume',
        technicalSkills: resumeData.technicalSkills || [],
        programmingLanguages: resumeData.programmingLanguages || [],
        softwareTools: resumeData.softwareTools || [],
        softSkills: resumeData.softSkills || [],
        domainSkills: resumeData.domainSkills || [],
        otherSkills: resumeData.otherSkills || [],
        workExperience: resumeData.workExperience || 'Not mentioned in resume',
        companyNames: resumeData.companyNames || [],
        jobRoles: resumeData.jobRoles || [],
        internshipExperience: resumeData.internshipExperience || 'Not mentioned in resume',
        internshipOrganizations: resumeData.internshipOrganizations || [],
        duration: resumeData.duration || 'Not mentioned in resume',
        responsibilities: resumeData.responsibilities || [],
        projects: resumeData.projects || [],
        certifications: resumeData.certifications || [],
        languagesKnown: resumeData.languagesKnown || [],
        careerInterests: resumeData.careerInterests || 'Not mentioned in resume',
        achievements: resumeData.achievements || [],
        awards: resumeData.awards || [],
        publications: resumeData.publications || [],
        relevantTraining: resumeData.relevantTraining || [],
        completeness: resumeData.completeness || {
          education: 'Available',
          skills: 'Available',
          projects: 'Not mentioned',
          experience: 'Not mentioned',
          careerInterests: 'Not mentioned',
          scorePercent: 60,
          missingNotes: [],
        },
        rawText: resumeData.rawText,
        isConfirmed: true,
        confirmedAt: resumeData.confirmedAt || now,
        updatedAt: now,
      };
      this.data.studentResumes.push(saved);
    }
    this.persist();
    return saved;
  }
}

export const db = new Database();
