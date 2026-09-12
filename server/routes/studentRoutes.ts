import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticateToken, requireStudent, AuthenticatedRequest } from '../auth.ts';

const router = Router();

// Apply auth to all student routes
router.use(authenticateToken as any);
router.use(requireStudent as any);

// Get Student Profile
router.get('/profile', (req: AuthenticatedRequest, res: Response) => {
  const profile = db.getProfileByUserId(req.user!.id);
  if (!profile) {
    const newProf = db.upsertProfile(req.user!.id, {
      fullName: req.user!.fullName,
      email: req.user!.email,
      mobileNumber: req.user!.mobileNumber,
      interests: [],
      skills: [],
      preferredCategories: ['CENTRAL', 'STATE'],
    });
    return res.json({ success: true, profile: newProf });
  }
  return res.json({ success: true, profile });
});

// Update Full Candidate Profile (Used by Candidate Portal / My Profile)
router.put('/profile', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const body = req.body;

    const rawFullName = body.name || body.fullName || req.user!.fullName;
    const rawMobile = body.phone || body.mobileNumber || req.user!.mobileNumber;

    // Update user record if name or mobile changed
    const userUpdates: any = {};
    if (rawFullName && rawFullName.trim()) userUpdates.fullName = rawFullName.trim();
    if (rawMobile !== undefined) userUpdates.mobileNumber = String(rawMobile).trim();
    if (Object.keys(userUpdates).length > 0) {
      db.updateUser(userId, userUpdates);
    }

    const highestQualification = body.qualification || body.highestQualification;
    const branchStream = body.branch || body.branchStream;
    const institution = body.institution || body.college;
    const passingYear = body.passingYear || body.graduationYear 
      ? Number(body.passingYear || body.graduationYear) 
      : undefined;
    const state = body.state || body.stateId;

    let interests = undefined;
    if (Array.isArray(body.interests)) {
      interests = body.interests;
    } else if (Array.isArray(body.careerInterests)) {
      interests = body.careerInterests;
    } else if (typeof body.interests === 'string' && body.interests.trim()) {
      interests = body.interests.split(',').map((s: string) => s.trim()).filter(Boolean);
    } else if (typeof body.careerInterests === 'string' && body.careerInterests.trim()) {
      interests = body.careerInterests.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    const profileData: any = {};
    if (rawFullName) profileData.fullName = rawFullName.trim();
    if (rawMobile) {
      profileData.mobileNumber = String(rawMobile).trim();
      profileData.phone = String(rawMobile).trim();
    }
    if (body.dateOfBirth !== undefined) profileData.dateOfBirth = body.dateOfBirth;
    if (body.age !== undefined) profileData.age = Number(body.age);
    if (body.gender !== undefined) profileData.gender = body.gender;
    if (body.category !== undefined) profileData.category = body.category;
    if (state !== undefined) {
      profileData.state = state;
      profileData.stateId = state;
    }
    if (highestQualification !== undefined) {
      profileData.highestQualification = highestQualification;
      profileData.qualification = highestQualification;
    }
    if (branchStream !== undefined) {
      profileData.branchStream = branchStream;
      profileData.branch = branchStream;
    }
    if (institution !== undefined) profileData.institution = institution;
    if (passingYear !== undefined) profileData.passingYear = passingYear;
    if (body.percentageCgpa !== undefined) profileData.percentageCgpa = body.percentageCgpa;
    if (interests !== undefined) profileData.interests = interests;
    if (Array.isArray(body.skills)) profileData.skills = body.skills;
    if (body.emailNotifications !== undefined) profileData.emailNotifications = Boolean(body.emailNotifications);
    if (body.preferredSector !== undefined) profileData.preferredSector = body.preferredSector;
    if (body.preferredJobType !== undefined) profileData.preferredJobType = body.preferredJobType;
    if (body.preferredLocation !== undefined) profileData.preferredLocation = body.preferredLocation;
    if (Array.isArray(body.preferredCategories)) profileData.preferredCategories = body.preferredCategories;

    const updatedProfile = db.upsertProfile(userId, profileData);
    const updatedUser = db.getUserById(userId);

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile,
      user: updatedUser ? {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        mobileNumber: updatedUser.mobileNumber,
        role: updatedUser.role,
      } : undefined,
    });
  } catch (err: any) {
    console.error('Error updating student profile:', err);
    return res.status(500).json({ success: false, message: 'Failed to update candidate profile' });
  }
});

// Update Personal Info
router.put('/profile/personal', (req: AuthenticatedRequest, res: Response) => {
  const { fullName, mobileNumber, dateOfBirth, gender, state, district } = req.body;
  if (!fullName) {
    return res.status(400).json({ success: false, message: 'Full name is required' });
  }

  // Update user name as well
  db.updateUser(req.user!.id, { fullName, mobileNumber });

  const updated = db.upsertProfile(req.user!.id, {
    fullName,
    mobileNumber,
    dateOfBirth,
    gender,
    state,
    district,
  });

  return res.json({ success: true, message: 'Personal information updated', profile: updated });
});

// Update Education
router.put('/profile/education', (req: AuthenticatedRequest, res: Response) => {
  const { highestQualification, courseDegree, branchStream, institution, passingYear, percentageCgpa } = req.body;

  const updated = db.upsertProfile(req.user!.id, {
    highestQualification,
    courseDegree,
    branchStream,
    institution,
    passingYear: passingYear ? Number(passingYear) : undefined,
    percentageCgpa,
  });

  return res.json({ success: true, message: 'Education details updated', profile: updated });
});

// Update Interests
router.put('/profile/interests', (req: AuthenticatedRequest, res: Response) => {
  const { interests } = req.body;
  if (!Array.isArray(interests)) {
    return res.status(400).json({ success: false, message: 'Interests must be an array' });
  }

  const updated = db.upsertProfile(req.user!.id, { interests });
  return res.json({ success: true, message: 'Interests updated', profile: updated });
});

// Update Skills
router.put('/profile/skills', (req: AuthenticatedRequest, res: Response) => {
  const { skills } = req.body;
  if (!Array.isArray(skills)) {
    return res.status(400).json({ success: false, message: 'Skills must be an array' });
  }

  const updated = db.upsertProfile(req.user!.id, { skills });
  return res.json({ success: true, message: 'Skills updated', profile: updated });
});

// Update Career Preferences
router.put('/profile/preferences', (req: AuthenticatedRequest, res: Response) => {
  const { preferredSector, preferredJobType, preferredLocation, preferredCategories } = req.body;

  const updated = db.upsertProfile(req.user!.id, {
    preferredSector,
    preferredJobType,
    preferredLocation,
    preferredCategories: Array.isArray(preferredCategories) ? preferredCategories : ['CENTRAL', 'STATE'],
  });

  return res.json({ success: true, message: 'Career preferences updated', profile: updated });
});

// Sync Profile from Confirmed Scanned Resume
router.post('/profile/sync-resume', (req: AuthenticatedRequest, res: Response) => {
  const { qualification, degree, branch, institution, passingYear, skills, interests } = req.body;
  const current = db.getProfileByUserId(req.user!.id);
  
  const existingSkills = current?.skills || [];
  const newSkills = Array.isArray(skills) ? skills : [];
  const mergedSkills = Array.from(new Set([...existingSkills, ...newSkills]));

  const updated = db.upsertProfile(req.user!.id, {
    highestQualification: qualification || current?.highestQualification,
    courseDegree: degree || current?.courseDegree,
    branchStream: branch || current?.branchStream,
    institution: institution || current?.institution,
    passingYear: passingYear ? Number(passingYear) : current?.passingYear,
    skills: mergedSkills,
    interests: Array.isArray(interests) && interests.length > 0 ? interests : current?.interests,
  });

  return res.json({
    success: true,
    message: 'Profile successfully updated with verified resume credentials',
    profile: updated,
  });
});

// Get Saved Jobs
router.get('/saved-jobs', (req: AuthenticatedRequest, res: Response) => {
  const saved = db.getSavedJobs(req.user!.id);
  const allJobs = db.getJobs();
  const allOrgs = db.getOrganizations();
  const allExams = db.getExaminations();

  const enriched = saved
    .map((s) => {
      const job = allJobs.find((j) => j.id === s.jobId);
      if (!job) return null;
      const organization = allOrgs.find((o) => o.id === job.organizationId);
      const examination = job.examinationId ? allExams.find((e) => e.id === job.examinationId) : undefined;
      return {
        ...s,
        job: {
          ...job,
          organization,
          examination,
        },
      };
    })
    .filter(Boolean);

  return res.json({ success: true, savedJobs: enriched });
});

// Save a Job
router.post('/saved-jobs/:jobId', (req: AuthenticatedRequest, res: Response) => {
  const { jobId } = req.params;
  const job = db.getJobById(jobId);
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }
  const saved = db.saveJob(req.user!.id, jobId);
  return res.json({ success: true, message: 'Job saved to your profile', savedJob: saved });
});

// Unsave a Job
router.delete('/saved-jobs/:jobId', (req: AuthenticatedRequest, res: Response) => {
  const { jobId } = req.params;
  const removed = db.unsaveJob(req.user!.id, jobId);
  return res.json({ success: true, message: removed ? 'Job removed from saved list' : 'Job was not saved' });
});

// Get Notifications for Student
router.get('/notifications', (req: AuthenticatedRequest, res: Response) => {
  const profile = db.getProfileByUserId(req.user!.id);
  const allNotifications = db.getNotifications();

  // Filter based on audience
  const filtered = allNotifications.filter((n) => {
    if (n.targetAudience === 'ALL') return true;
    if (!profile) return true;

    if (n.targetAudience === '10th' && profile.highestQualification === '10th') return true;
    if (n.targetAudience === '12th' && ['12th', 'Diploma', 'Graduation', 'B.Tech'].includes(profile.highestQualification || '')) return true;
    if (n.targetAudience === 'Diploma' && profile.highestQualification === 'Diploma') return true;
    if (n.targetAudience === 'Graduates' && ['Graduation', 'B.A', 'B.Com', 'B.Sc', 'B.Tech', 'B.E', 'Post Graduation'].includes(profile.highestQualification || '')) return true;
    if (n.targetAudience === 'B.Tech' && (profile.highestQualification === 'B.Tech' || profile.highestQualification === 'B.E')) return true;
    if (n.targetAudience === 'State' && n.targetValue && profile.state?.toLowerCase().includes(n.targetValue.toLowerCase())) return true;
    if (n.targetAudience === 'Interest' && n.targetValue && profile.interests?.includes(n.targetValue)) return true;

    return false;
  });

  return res.json({ success: true, notifications: filtered });
});

// Recommended Jobs
router.get('/recommended-jobs', (req: AuthenticatedRequest, res: Response) => {
  const profile = db.getProfileByUserId(req.user!.id);
  const allJobs = db.getJobs().filter((j) => j.status === 'PUBLISHED');
  const allOrgs = db.getOrganizations();
  const allExams = db.getExaminations();

  let recommended = allJobs;

  if (profile && profile.highestQualification) {
    const qual = profile.highestQualification;
    // Score each job
    const scored = allJobs.map((job) => {
      let score = 0;
      if (job.qualification === qual) score += 5;
      if (qual === 'Graduation' && ['Graduation', 'B.Tech', 'B.E', 'B.Sc', 'B.A', 'B.Com'].includes(job.qualification)) score += 3;
      if (qual === 'B.Tech' && (job.qualification === 'Graduation' || job.qualification === 'B.Tech')) score += 5;

      if (profile.state && job.stateId) {
        const stateMatch = db.getStates().find((s) => s.id === job.stateId);
        if (stateMatch && stateMatch.name.toLowerCase() === profile.state.toLowerCase()) {
          score += 4;
        }
      }

      if (profile.preferredSector) {
        if (profile.preferredSector === 'Government' && job.jobType === 'GOVERNMENT') score += 3;
        if (profile.preferredSector === 'Private' && job.jobType === 'PRIVATE') score += 3;
        if (profile.preferredSector === 'Both') score += 2;
      }

      return { job, score };
    });

    scored.sort((a, b) => b.score - a.score);
    recommended = scored.map((s) => s.job);
  }

  const enriched = recommended.slice(0, 6).map((job) => {
    const organization = allOrgs.find((o) => o.id === job.organizationId);
    const examination = job.examinationId ? allExams.find((e) => e.id === job.examinationId) : undefined;
    return { ...job, organization, examination };
  });

  return res.json({ success: true, jobs: enriched, recommendedJobs: enriched });
});

export default router;
