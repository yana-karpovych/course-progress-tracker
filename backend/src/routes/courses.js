const express = require('express');
const prisma = require('../prisma');
const { calculateProgress } = require('../utils/progress');

const router = express.Router();

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

function enrichCourseWithProgress(course) {
  const lessons = course.lessons ?? [];
  const totalLessons = lessons.length;
  const completedLessons = lessons.filter((lesson) => lesson.isCompleted).length;

  return {
    ...course,
    totalLessons,
    completedLessons,
    progress: calculateProgress(lessons),
  };
}

router.get('/', async (req, res) => {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: 'desc' },
    include: { lessons: true },
  });

  res.json(courses.map(enrichCourseWithProgress));
});

router.get('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Invalid course id' });
  }

  const course = await prisma.course.findUnique({
    where: { id },
    include: { lessons: true },
  });

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  res.json(enrichCourseWithProgress(course));
});

router.post('/', async (req, res) => {
  const { title, description } = req.body;

  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }

  const course = await prisma.course.create({
    data: { title: title.trim(), description: description ?? '' },
    include: { lessons: true },
  });

  res.status(201).json(enrichCourseWithProgress(course));
});

router.patch('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Invalid course id' });
  }

  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const { title, description } = req.body;
  const data = {};

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }
    data.title = title.trim();
  }

  if (description !== undefined) {
    data.description = description ?? '';
  }

  const course = await prisma.course.update({
    where: { id },
    data,
    include: { lessons: true },
  });

  res.json(enrichCourseWithProgress(course));
});

router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Invalid course id' });
  }

  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: 'Course not found' });
  }

  await prisma.course.delete({ where: { id } });
  res.status(204).send();
});

module.exports = router;
module.exports.parseId = parseId;
