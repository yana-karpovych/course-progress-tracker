type ProgressBarProps = {
  progress: number;
};

function ProgressBar({ progress }: ProgressBarProps) {
  const value = Math.min(100, Math.max(0, progress));

  return (
    <div className="progress-bar" aria-label={`Progress ${value}%`}>
      <div className="progress-bar-fill" style={{ width: `${value}%` }} />
    </div>
  );
}

export default ProgressBar;
