function calculateProgress(lessons) {
  if (lessons.length === 0) return 0;
  const completed = lessons.filter((lesson) => lesson.isCompleted).length;
  return Math.round((completed / lessons.length) * 100);
}

module.exports = { calculateProgress };
