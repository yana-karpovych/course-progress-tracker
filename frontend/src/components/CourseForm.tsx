import { useState, type FormEvent } from 'react';

type CourseFormProps = {
  onSubmit: (data: { title: string; description: string }) => void | Promise<void>;
  submitLabel?: string;
  initialTitle?: string;
  initialDescription?: string;
  onCancel?: () => void;
};

function CourseForm({
  onSubmit,
  submitLabel = 'Create course',
  initialTitle = '',
  initialDescription = '',
  onCancel,
}: CourseFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    try {
      await onSubmit({ title, description });
      if (!onCancel) {
        setTitle('');
        setDescription('');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="course-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor={onCancel ? 'edit-course-title' : 'course-title'}>Title</label>
        <input
          id={onCancel ? 'edit-course-title' : 'course-title'}
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </div>
      <div className="form-field">
        <label htmlFor={onCancel ? 'edit-course-description' : 'course-description'}>
          Description
        </label>
        <textarea
          id={onCancel ? 'edit-course-description' : 'course-description'}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
        />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default CourseForm;
