const express = require('express');
const prisma = require('../prisma');

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

const courseLessonsRouter = express.Router({ mergeParams: true });

courseLessonsRouter.get('/', async (req, res) => {
  const courseId = parseId(req.params.courseId);
  if (courseId === null) {
    return res.status(400).json({ error: 'Invalid course id' });
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const lessons = await prisma.lesson.findMany({
    where: { courseId },
    orderBy: { createdAt: 'asc' },
  });

  res.json(lessons);
});

courseLessonsRouter.post('/', async (req, res) => {
  const courseId = parseId(req.params.courseId);
  if (courseId === null) {
    return res.status(400).json({ error: 'Invalid course id' });
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const { title, description } = req.body;

  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }

  const lesson = await prisma.lesson.create({
    data: {
      courseId,
      title: title.trim(),
      description: description ?? null,
    },
  });

  res.status(201).json(lesson);
});

const lessonsRouter = express.Router();

lessonsRouter.patch('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Invalid lesson id' });
  }

  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found' });
  }

  const { isCompleted, title, description } = req.body;
  const data = {};

  if (isCompleted !== undefined) {
    if (typeof isCompleted !== 'boolean') {
      return res.status(400).json({ error: 'isCompleted must be a boolean' });
    }
    data.isCompleted = isCompleted;
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }
    data.title = title.trim();
  }

  if (description !== undefined) {
    data.description = description;
  }

  const updated = await prisma.lesson.update({
    where: { id },
    data,
  });

  res.json(updated);
});

lessonsRouter.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Invalid lesson id' });
  }

  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found' });
  }

  await prisma.lesson.delete({ where: { id } });
  res.status(204).send();
});

module.exports = { courseLessonsRouter, lessonsRouter };
