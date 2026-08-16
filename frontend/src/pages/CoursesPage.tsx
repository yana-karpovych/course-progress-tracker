import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ApiError,
  createCourse,
  deleteCourse,
  getCourses,
  updateCourse,
} from '../api';
import CourseForm from '../components/CourseForm';
import ErrorMessage from '../components/ErrorMessage';
import LoadingMessage from '../components/LoadingMessage';
import ProgressBar from '../components/ProgressBar';
import type { Course } from '../types';

function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const data = await getCourses();
      setCourses(data);
      setHasLoaded(true);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to load courses';

      setHasLoaded((loaded) => {
        if (loaded) {
          setActionError(message);
        } else {
          setLoadError(message);
        }
        return loaded;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  function handleLoadRetry() {
    void loadCourses();
  }

  function handleActionRetry() {
    setActionError(null);
    void loadCourses();
  }

  async function handleCreate(data: { title: string; description: string }) {
    setActionError(null);

    try {
      await createCourse(data);
      await loadCourses();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to create course';
      setActionError(message);
    }
  }

  async function handleUpdate(
    id: number,
    data: { title: string; description: string },
  ) {
    setActionError(null);

    try {
      await updateCourse(id, data);
      setEditingId(null);
      await loadCourses();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to update course';
      setActionError(message);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this course and all its lessons?')) {
      return;
    }

    setActionError(null);

    try {
      await deleteCourse(id);
      await loadCourses();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to delete course';
      setActionError(message);
    }
  }

  const showForm = hasLoaded && !loadError && editingId === null;

  if (loading && !hasLoaded) {
    return (
      <section className="page">
        <h2 className="page-title">Courses</h2>
        <LoadingMessage />
      </section>
    );
  }

  if (loadError && !hasLoaded) {
    return (
      <section className="page">
        <h2 className="page-title">Courses</h2>
        <ErrorMessage message={loadError} onRetry={handleLoadRetry} />
      </section>
    );
  }

  return (
    <section className="page">
      <h2 className="page-title">Courses</h2>

      {actionError && (
        <ErrorMessage message={actionError} onRetry={handleActionRetry} />
      )}

      {showForm && <CourseForm onSubmit={handleCreate} />}

      {hasLoaded && !loadError && courses.length === 0 && (
        <p className="empty-state">No courses yet</p>
      )}

      {courses.length > 0 && (
        <ul className="course-list">
          {courses.map((course) => (
            <li key={course.id} className="course-card">
              {editingId === course.id ? (
                <CourseForm
                  initialTitle={course.title}
                  initialDescription={course.description}
                  submitLabel="Save changes"
                  onSubmit={(data) => handleUpdate(course.id, data)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <div className="course-card-header">
                    <h3 className="course-card-title">{course.title}</h3>
                    {course.description && (
                      <p className="course-card-description">{course.description}</p>
                    )}
                  </div>

                  <div className="course-card-progress">
                    <ProgressBar progress={course.progress ?? 0} />
                    <span className="progress-text">{course.progress ?? 0}%</span>
                  </div>

                  <div className="course-card-actions">
                    <Link to={`/courses/${course.id}`} className="btn btn-secondary">
                      Open
                    </Link>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setEditingId(course.id)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => void handleDelete(course.id)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default CoursesPage;
