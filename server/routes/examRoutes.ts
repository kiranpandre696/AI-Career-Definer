import { Router } from 'express';
import { db } from '../db.ts';

const router = Router();

// Get Dynamic Syllabus for an Exam
router.get('/exams/:id/syllabus', (req, res) => {
  const { id } = req.params;
  const exam = db.getExaminationById(id);
  if (!exam) {
    return res.status(404).json({ success: false, message: 'Examination not found' });
  }

  const syllabusTree = db.getSyllabusTree(id);
  return res.json({
    success: true,
    examination: { id: exam.id, name: exam.name, shortName: exam.shortName },
    syllabus: syllabusTree,
  });
});

// Get Dynamic Exam Patterns for an Exam (published only for public)
router.get('/exams/:id/exam-patterns', (req, res) => {
  const { id } = req.params;
  const exam = db.getExaminationById(id);
  if (!exam) {
    return res.status(404).json({ success: false, message: 'Examination not found' });
  }

  const patterns = db.getExamPatterns(id, true);
  return res.json({
    success: true,
    examination: { id: exam.id, name: exam.name, shortName: exam.shortName },
    examPatterns: patterns,
  });
});

// Get Preparation Roadmap for an Exam
router.get('/exams/:id/roadmap', (req, res) => {
  const { id } = req.params;
  const exam = db.getExaminationById(id);
  if (!exam) {
    return res.status(404).json({ success: false, message: 'Examination not found' });
  }

  const roadmap = db.getRoadmap(id);
  return res.json({
    success: true,
    examination: { id: exam.id, name: exam.name, shortName: exam.shortName },
    roadmap,
  });
});

export default router;
