type ErrorMessageProps = {
  message: string;
  onRetry: () => void;
};

function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="message message-error error-message">
      <p>{message}</p>
      <button type="button" className="btn btn-secondary" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

export default ErrorMessage;
