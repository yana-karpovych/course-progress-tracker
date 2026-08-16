import { useState, type FormEvent } from 'react';

type LessonFormProps = {
  onSubmit: (data: { title: string; description?: string }) => void | Promise<void>;
  submitLabel?: string;
  initialTitle?: string;
  initialDescription?: string;
  onCancel?: () => void;
};

function LessonForm({
  onSubmit,
  submitLabel = 'Add lesson',
  initialTitle = '',
  initialDescription = '',
  onCancel,
}: LessonFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    try {
      await onSubmit({
        title,
        description: description.trim() === '' ? undefined : description,
      });
      if (!onCancel) {
        setTitle('');
        setDescription('');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const titleId = onCancel ? 'edit-lesson-title' : 'lesson-title';
  const descriptionId = onCancel ? 'edit-lesson-description' : 'lesson-description';

  return (
    <form className="lesson-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor={titleId}>Title</label>
        <input
          id={titleId}
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </div>
      {!onCancel && (
        <div className="form-field">
          <label htmlFor={descriptionId}>Description</label>
          <textarea
            id={descriptionId}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
          />
        </div>
      )}
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

export default LessonForm;
