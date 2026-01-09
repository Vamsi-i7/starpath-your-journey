interface CharacterCountProps {
  current: number;
  max?: number;
  showWords?: boolean;
}

export function CharacterCount({ current, max, showWords = true }: CharacterCountProps) {
  const words = current > 0 ? current.split(/\s+/).filter(word => word.length > 0).length : 0;
  const percentage = max ? (current / max) * 100 : 0;
  const isNearLimit = percentage > 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      {showWords && (
        <span>
          {words} {words === 1 ? 'word' : 'words'}
        </span>
      )}
      <span className={isAtLimit ? 'text-destructive' : isNearLimit ? 'text-orange-500' : ''}>
        {current}
        {max && ` / ${max}`} characters
      </span>
      {max && (
        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isAtLimit ? 'bg-destructive' : isNearLimit ? 'bg-orange-500' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
