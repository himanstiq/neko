export default function AudioLevelIndicator({ level, isSpeaking }) {
  // level: 0-100
  const bars = 5;
  const activeBars = Math.ceil((level / 100) * bars);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: bars }).map((_, idx) => (
        <div
          key={idx}
          className={`w-1 h-3 rounded-sm transition-all ${
            idx < activeBars
              ? isSpeaking
                ? "bg-green-500"
                : "bg-blue-500"
              : "bg-gray-600"
          }`}
        />
      ))}
    </div>
  );
}
