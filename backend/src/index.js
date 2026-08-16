const express = require('express');
const cors = require('cors');
const coursesRouter = require('./routes/courses');
const { courseLessonsRouter, lessonsRouter } = require('./routes/lessons');

const app = express();
const PORT = 4000;

app.use(express.json());
app.use(cors());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/courses', coursesRouter);
app.use('/courses/:courseId/lessons', courseLessonsRouter);
app.use('/lessons', lessonsRouter);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
