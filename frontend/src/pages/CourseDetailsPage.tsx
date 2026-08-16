import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ApiError,
  createLesson,
  deleteLesson,
  getCourse,
  updateLesson,
} from '../api';
import ErrorMessage from '../components/ErrorMessage';
import LessonForm from '../components/LessonForm';
import LessonList from '../components/LessonList';
import LoadingMessage from '../components/LoadingMessage';
import ProgressBar from '../components/ProgressBar';
import type { CourseDetail } from '../types';

function CourseDetailsPage() {
  const { id } = useParams();
  const courseId = Number(id);

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);

  const loadCourse = useCallback(async () => {
    if (!Number.isInteger(courseId) || courseId <= 0) {
      setLoadError('Invalid course id');
      setCourse(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const data = await getCourse(courseId);
      setCourse(data);
      setHasLoaded(true);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to load course';

      setHasLoaded((loaded) => {
        if (loaded) {
          setActionError(message);
        } else {
          setLoadError(message);
          setCourse(null);
        }
        return loaded;
      });
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void loadCourse();
  }, [loadCourse]);

  function handleLoadRetry() {
    void loadCourse();
  }

  function handleActionRetry() {
    setActionError(null);
    void loadCourse();
  }

  async function runAction(action: () => Promise<unknown>) {
    setActionError(null);

    try {
      await action();
      await loadCourse();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Something went wrong';
      setActionError(message);
    }
  }

  async function handleAddLesson(data: { title: string; description?: string }) {
    await runAction(() => createLesson(courseId, data));
  }

  async function handleToggleLesson(lessonId: number, isCompleted: boolean) {
    await runAction(() => updateLesson(lessonId, { isCompleted }));
  }

  async function handleDeleteLesson(lessonId: number) {
    if (!window.confirm('Delete this lesson?')) {
      return;
    }

    await runAction(() => deleteLesson(lessonId));
  }

  async function handleUpdateLesson(lessonId: number, data: { title: string }) {
    await runAction(async () => {
      await updateLesson(lessonId, data);
      setEditingLessonId(null);
    });
  }

  if (loading && !hasLoaded) {
    return (
      <section className="page">
        <Link to="/" className="back-link">
          ← Back to courses
        </Link>
        <LoadingMessage />
      </section>
    );
  }

  if (loadError && !course) {
    return (
      <section className="page">
        <Link to="/" className="back-link">
          ← Back to courses
        </Link>
        <h2 className="page-title">Course unavailable</h2>
        <ErrorMessage message={loadError} onRetry={handleLoadRetry} />
      </section>
    );
  }

  if (!course) {
    return (
      <section className="page">
        <Link to="/" className="back-link">
          ← Back to courses
        </Link>
        <h2 className="page-title">Course unavailable</h2>
        <ErrorMessage message="Course not found" onRetry={handleLoadRetry} />
      </section>
    );
  }

  const totalLessons = course.totalLessons ?? course.lessons.length;
  const completedLessons =
    course.completedLessons ??
    course.lessons.filter((lesson) => lesson.isCompleted).length;
  const progress = course.progress ?? 0;

  return (
    <section className="page">
      <Link to="/" className="back-link">
        ← Back to courses
      </Link>

      {actionError && (
        <ErrorMessage message={actionError} onRetry={handleActionRetry} />
      )}

      <header className="course-details-header">
        <h2 className="page-title">{course.title}</h2>
        {course.description && (
          <p className="course-details-description">{course.description}</p>
        )}
      </header>

      <div className="course-details-progress">
        <ProgressBar progress={progress} />
        <div className="progress-summary">
          <span className="progress-text">{progress}%</span>
          <span className="progress-count">
            {completedLessons} / {totalLessons} completed
          </span>
        </div>
      </div>

      <h3 className="section-title">Add lesson</h3>
      <LessonForm onSubmit={handleAddLesson} />

      <h3 className="section-title">Lessons</h3>
      <LessonList
        lessons={course.lessons}
        editingId={editingLessonId}
        onToggle={handleToggleLesson}
        onDelete={handleDeleteLesson}
        onStartEdit={setEditingLessonId}
        onCancelEdit={() => setEditingLessonId(null)}
        onUpdate={handleUpdateLesson}
      />
    </section>
  );
}

export default CourseDetailsPage;
