import LessonForm from './LessonForm';
import type { Lesson } from '../types';

type LessonListProps = {
  lessons: Lesson[];
  editingId: number | null;
  onToggle: (lessonId: number, isCompleted: boolean) => void | Promise<void>;
  onDelete: (lessonId: number) => void | Promise<void>;
  onStartEdit: (lessonId: number) => void;
  onCancelEdit: () => void;
  onUpdate: (lessonId: number, data: { title: string }) => void | Promise<void>;
};

function LessonList({
  lessons,
  editingId,
  onToggle,
  onDelete,
  onStartEdit,
  onCancelEdit,
  onUpdate,
}: LessonListProps) {
  if (lessons.length === 0) {
    return <p className="empty-state">No lessons yet</p>;
  }

  return (
    <ul className="lesson-list">
      {lessons.map((lesson) => (
        <li key={lesson.id} className="lesson-item">
          {editingId === lesson.id ? (
            <LessonForm
              initialTitle={lesson.title}
              initialDescription={lesson.description ?? ''}
              submitLabel="Save changes"
              onSubmit={(data) => onUpdate(lesson.id, { title: data.title })}
              onCancel={onCancelEdit}
            />
          ) : (
            <>
              <label className="lesson-checkbox-label">
                <input
                  type="checkbox"
                  checked={lesson.isCompleted}
                  onChange={(event) =>
                    void onToggle(lesson.id, event.target.checked)
                  }
                />
                <span className={lesson.isCompleted ? 'lesson-title completed' : 'lesson-title'}>
                  {lesson.title}
                </span>
              </label>

              {lesson.description && (
                <p className="lesson-description">{lesson.description}</p>
              )}

              <div className="lesson-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onStartEdit(lesson.id)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => void onDelete(lesson.id)}
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

export default LessonList;
