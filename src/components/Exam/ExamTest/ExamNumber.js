import { useEffect, useRef } from "react";

const ExamNumber = ({
  onSelect,
  hasStarted,
  answers = {},
  currentQuestion,
  questionList = [],
  resultMode = false,
  resultMap = {}
}) => {
  const containerRef = useRef(null);
  
  const getButtonClass = (index) => {
    const questionKey = questionList?.[index]?.question;

    if (resultMode) {
      const isCorrect = resultMap?.[questionKey];
      const isCurrent = questionKey === currentQuestion;

      // Base classes
      let classes = "border shadow-sm font-bold ";
      if (isCurrent) {
        classes += "ring-2 ring-red-400 ring-offset-1 ";
      }

      // only explicit true counts as correct, everything else is treated as wrong (including unanswered)
      if (isCorrect === true) {
        return classes + "bg-green-100 text-green-700 border-green-200 hover:bg-green-200";
      }
      // incorrect or missing
      return classes + "bg-red-50 text-red-700 border-red-200 hover:bg-red-100";
    }

    // Existing Logic...
    const isCurrent = questionKey === currentQuestion;
    const isAnswered = answers?.[questionKey];

    if (isCurrent) {
        return "bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-200";
    }
    if (isAnswered) {
        return "bg-red-50 text-red-700 border-red-200 hover:bg-red-100";
    }
    return "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50";
  };

  useEffect(() => {
    if (!containerRef.current || !questionList?.length) return;

    const index = questionList?.findIndex(
      (q) => q?.question === currentQuestion
    );
    if (index === -1) return;

    const rowIndex = Math.floor(index / 5); // still assume 5 cols
    const buttonHeight = 40;
    const gap = 8;
    const scrollTop = rowIndex * (buttonHeight + gap);

    containerRef.current.scrollTo({
      top: scrollTop,
      behavior: "smooth",
    });
  }, [currentQuestion, questionList]);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center gap-4 text-xs text-gray-500 px-1">
          {resultMode ? (
            <>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-green-100 border border-green-200"></span> Đúng
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-50 border border-red-200"></span> Sai/Trống
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-600"></span> Đang làm
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-50 border border-red-200"></span> Đã làm
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-white border border-gray-200"></span> Chưa làm
              </div>
            </>
          )}
      </div>

      <div
        ref={containerRef}
        className="max-h-[350px] overflow-y-auto custom-scrollbar p-1 pb-4"
      >
        {/** group by section preserving original order */}
        {(() => {
          const groups = {}; // sec -> array of {q, idx, number}
          questionList.forEach((q, idx) => {
            const sec = q.section || "READING";
            if (!groups[sec]) groups[sec] = [];
            groups[sec].push({ q, idx, number: idx + 1 });
          });
          return Object.entries(groups).map(([sec, items]) => (
            <div key={sec} className="mb-4">
              <div className="mb-2 font-semibold text-sm capitalize">
                {sec === 'READING' ? 'Reading' : sec === 'LISTENING' ? 'Listening' : 'Writing'}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {items.map(({ q, idx, number }) => (
                  <button
                    key={idx}
                    onClick={() => onSelect?.(idx)}
                    disabled={!hasStarted}
                    className={`
                      h-9 w-full rounded-lg text-sm font-semibold border transition-all duration-200 flex items-center justify-center
                      ${getButtonClass(idx)}
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {number}
                  </button>
                ))}
              </div>
            </div>
          ));
        })()}
      </div>
    </div>
  );
};

export default ExamNumber;
