'use client';

interface ExamSetupProps {
  courseSlug: string | null;
  setCourseSlug: (slug: string | null) => void;
  lectureNumber: number | null;
  setLectureNumber: (n: number | null) => void;
  questionType: string;
  setQuestionType: (t: string) => void;
  onGenerate: () => void;
  loading: boolean;
  sessionScore: { total: number; count: number };
}

const COURSES = [
  { slug: null, label: 'All Courses' },
  { slug: 'foundations', label: 'Foundations' },
  { slug: 'strategy', label: 'Strategy' },
  { slug: 'threat-landscape', label: 'Threats' },
];

const QUESTION_TYPES = [
  { value: 'open-ended', label: 'Open-ended' },
  { value: 'scenario', label: 'Scenario' },
  { value: 'compare-contrast', label: 'Compare & Contrast' },
];

export function ExamSetup({
  courseSlug, setCourseSlug, lectureNumber, setLectureNumber,
  questionType, setQuestionType, onGenerate, loading, sessionScore,
}: ExamSetupProps) {
  return (
    <div className="flex-1 p-6 max-w-lg mx-auto w-full">
      <div className="mb-5">
        <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Course</div>
        <div className="flex gap-2 flex-wrap">
          {COURSES.map(c => (
            <button
              key={c.slug ?? 'all'}
              onClick={() => { setCourseSlug(c.slug); setLectureNumber(null); }}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold border-2 transition-colors ${
                courseSlug === c.slug
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-500'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {courseSlug && (
        <div className="mb-5">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Lecture</div>
          <div className="flex gap-2">
            <button
              onClick={() => setLectureNumber(null)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold border-2 transition-colors ${
                lectureNumber === null
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-500'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              All
            </button>
            {[1, 2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                onClick={() => setLectureNumber(n)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold border-2 transition-colors ${
                  lectureNumber === n
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-500'
                    : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Question Type</div>
        <div className="flex gap-2 flex-wrap">
          {QUESTION_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setQuestionType(t.value)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold border-2 transition-colors ${
                questionType === t.value
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-500'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={loading}
        className="w-full bg-indigo-500 text-white rounded-lg py-3 font-semibold text-sm hover:bg-indigo-600 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Generating...' : 'Generate Question'}
      </button>

      {sessionScore.count > 0 && (
        <div className="mt-6 bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center">
          <span className="text-sm text-slate-500">Session Score</span>
          <div className="flex gap-4 items-center">
            <span className="text-sm text-slate-500">{sessionScore.count} questions</span>
            <span className="text-lg font-bold text-emerald-600">
              {(sessionScore.total / sessionScore.count).toFixed(1)} / 10
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
