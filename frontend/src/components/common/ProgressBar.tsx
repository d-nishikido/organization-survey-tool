

interface ProgressBarProps {
  current: number;
  total: number;
  showPercentage?: boolean;
  showNumbers?: boolean;
  className?: string;
}

export function ProgressBar({
  current,
  total,
  showPercentage = true,
  showNumbers = true,
  className = ''
}: ProgressBarProps): JSX.Element {
  const percentage = Math.round((current / total) * 100);
  const isCompleted = current >= total;

  return (
    <div className={`space-y-2 ${className}`}>
      {(showNumbers || showPercentage) && (
        <div className="flex justify-between items-center text-sm">
          {showNumbers && (
            <span className="text-gray-600 font-medium">
              質問 {current} / {total}
            </span>
          )}
          {showPercentage && (
            <span className={`font-semibold ${isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
              {percentage}% 完了
            </span>
          )}
        </div>
      )}
      
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${
            isCompleted 
              ? 'bg-green-500' 
              : 'bg-blue-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {isCompleted && (
        <div className="flex items-center text-green-600 text-sm font-medium">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          すべての質問が完了しました
        </div>
      )}
    </div>
  );
}