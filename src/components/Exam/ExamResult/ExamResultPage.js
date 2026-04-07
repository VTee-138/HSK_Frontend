/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { CheckCircle2, XCircle, Award, History, ListChecks } from "lucide-react";
import moment from "moment";
import { getResultById, checkCorrectAnswers } from "../../../services/TestService";
import { getExamDetail } from "../../../services/ExamService";
import Loading from "../../Loading";
import MathRenderer from "../../../common/MathRenderer";
import ExamNumber from "../ExamTest/ExamNumber";

// Helper: Group consecutive matching questions
function buildDisplayItems(questions) {
  const items = [];
  let i = 0;
  while (i < questions.length) {
    const q = questions[i];
    if (q.matchGroup) {
      // gather contiguous same-group entries
      const group = [];
      let j = i;
      while (j < questions.length && questions[j].matchGroup === q.matchGroup) {
        group.push(questions[j]);
        j++;
      }
      items.push({ type: "group", questions: group, startIndex: i });
      i = j;
    } else {
      items.push({ type: "single", question: q, index: i });
      i++;
    }
  }
  return items;
}

function ExamResultPage() {
  const { id: examId } = useParams(); // examId from path param
  const [searchParams] = useSearchParams(); // Get query params
  const resultId = searchParams.get("resultId"); // resultId from query string
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resultDetail, setResultDetail] = useState(null); // User info, score, etc.
  const [examData, setExamData] = useState(null); // Questions content
  const [resultMap, setResultMap] = useState({}); // { "Câu 1": true, "Câu 2": false }
  const [answerDisplay, setAnswerDisplay] = useState({}); // { "Câu 1": "True", "Câu 2": "D" } - for display
  const [examMissing, setExamMissing] = useState(false); // flag when exam record isn't available
  
  const [currentQuestionReview, setCurrentQuestionReview] = useState(null); // Scroll to or highlight
  const [error, setError] = useState(null); // Track errors

  // helpers used only in this component
  const convertForDisplay = (val, questionType) => {
      if (val === undefined || val === null || val === "") return "";
      if (Array.isArray(val)) {
          // generic array handling (indexes or values)
          return val.join(",");
      }
      if (questionType === "TS" || questionType === "DS") {
          const str = String(val).trim();
          const upper = str.toUpperCase();
          const lower = str.toLowerCase();
          if (upper === "A" || lower === "true") return "True";
          if (upper === "B" || lower === "false") return "False";
      }
      if (questionType === "WR") {
          // strip slashes for display
          return String(val).replace(/\//g, "");
      }
      return String(val);
  };

  const handleFetch = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching with examId:", examId, "resultId:", resultId);

      // first fetch result details – backend will resolve examId and set examMissing flag
      const resResult = await getResultById(examId, resultId);
      console.log("Result response:", resResult);
      setResultDetail(resResult?.data);
      const missing = !!resResult?.examMissing;
      setExamMissing(missing);
      // if the examId in result differs from url param, correct the route
      if (resResult?.data?.examId && resResult.data.examId !== examId) {
        navigate(`/exam/result/${resResult.data.examId}${resultId ? `?resultId=${resultId}` : ""}`, { replace: true });
      }

      let examResponse = { data: null };
      if (!missing) {
        try {
          examResponse = await getExamDetail(examId);
          const data = examResponse?.data;
          // Normalize audio URL if it's relative (from DB)
          if (data && data.audioUrl && !data.audioUrl.startsWith("http")) {
            const baseUrl = process.env.REACT_APP_API_BASE_URL?.replace("/api/v2", "") || "http://localhost:4000";
            data.audioUrl = `${baseUrl}${data.audioUrl}`;
          }
          setExamData(data);
        } catch (e) {
          console.warn("Failed to fetch exam detail, marking missing", e);
          setExamData(null);
          setExamMissing(true);
        }
      } else {
        setExamData(null);
      }

      let correctnessResp = { data: {} };
      if (!missing) {
        try {
          correctnessResp = await checkCorrectAnswers(resultId);
          const map = correctnessResp?.data || {};
          const display = correctnessResp?.answerDisplay || {};
          setResultMap(map);
          setAnswerDisplay(display);

          // calculate how many correct answers we found
          const correctCount =
            correctnessResp?.numberOfCorrectAnswers !== undefined
              ? correctnessResp.numberOfCorrectAnswers
              : Object.values(map).filter((v) => v === true).length;

          setResultDetail((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              numberOfCorrectAnswers: correctCount,
              // try to keep original score if nonzero, otherwise approximate using proportion
              total_score:
                prev.total_score && prev.total_score !== 0
                  ? prev.total_score
                  : examResponse?.data
                  ? parseFloat(
                      (
                        (correctCount / ((examResponse.data.questions || []).reduce((t, q) => q.type === "DL" && Array.isArray(q.subQuestions) ? t + q.subQuestions.length : t + 1, 0) || examResponse.data.numberOfQuestions || 1)) *
                        (examResponse.data.totalScore || 10)
                      ).toFixed(2)
                    )
                  : 0,
            };
          });
        } catch (e) {
          console.warn("checkCorrectAnswers failed", e);
          setResultMap({});
          setAnswerDisplay({});
        }
      } else {
        setResultMap({});
        setAnswerDisplay({});
      }
    } catch (error) {
      console.error("Error fetching result:", error);
      const message = error?.response?.data?.message || "Có lỗi xảy ra khi tải kết quả";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examId && resultId) {
      handleFetch();
    }
  }, [examId, resultId]);

  const questionList = useMemo(() => {
    if (!examData) return [];
    let questions = examData?.questions.filter((q) => q.type !== "MQ") || [];
    
    // Filter questions based on selected sections (for training mode)
    if (resultDetail?.selectedSections && Array.isArray(resultDetail.selectedSections) && resultDetail.selectedSections.length > 0) {
      questions = questions.filter(q => resultDetail.selectedSections.includes(q.section || 'READING'));
    }
    
    return questions;
  }, [examData, resultDetail]);

  const actualTotalQuestions = useMemo(() => {
    return questionList.reduce((total, q) => {
      if (q.type === "DL" && Array.isArray(q.subQuestions)) return total + q.subQuestions.length;
      return total + 1;
    }, 0);
  }, [questionList]);

  // Flattened list: DL sub-questions expanded individually — used for ExamNumber sidebar
  const flatQuestionList = useMemo(() => {
    const flat = [];
    questionList.forEach(q => {
      if (q.type === "DL" && Array.isArray(q.subQuestions)) {
        q.subQuestions.forEach(sq => flat.push({ ...sq, _parentDLKey: q.question, section: q.section }));
      } else {
        flat.push(q);
      }
    });
    return flat;
  }, [questionList]);

  // Map top-level question key -> numbering info (keyed by PARENT, never sub-question keys, so no collision)
  // DL: { type:'dl', startNum } — sub-question at index i gets number startNum+i
  // Standalone: { type:'single', num }
  const questionNumberMap = useMemo(() => {
    const map = {};
    let counter = 1;
    questionList.forEach(q => {
      if (q.type === "DL" && Array.isArray(q.subQuestions)) {
        map[q.question] = { type: 'dl', startNum: counter };
        counter += q.subQuestions.length;
      } else {
        map[q.question] = { type: 'single', num: counter };
        counter++;
      }
    });
    return map;
  }, [questionList]);

  const derivedCorrectCount = useMemo(() => {
    return Object.values(resultMap).filter((v) => v === true).length;
  }, [resultMap]);

  const displayCorrectCount =
    resultDetail?.numberOfCorrectAnswers || derivedCorrectCount;

  const displayScore =
    resultDetail && resultDetail.total_score && resultDetail.total_score !== 0
      ? resultDetail.total_score
      : actualTotalQuestions
      ? parseFloat(
          ((derivedCorrectCount / actualTotalQuestions) *
            (examData?.totalScore || 10)).toFixed(2)
        )
      : 0;


  const scrollToQuestion = (flatIndex) => {
      const q = flatQuestionList[flatIndex];
      if (!q) return;
      const parentKey = q._parentDLKey;
      const domIdx = parentKey
        ? questionList.findIndex(p => p.question === parentKey)
        : questionList.findIndex(p => p.question === q.question);
      const element = document.getElementById(`question-${domIdx >= 0 ? domIdx : flatIndex}`);
      if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setCurrentQuestionReview(q.question);
      }
  };

  console.log(examId, resultId);
  console.log("Result Detail:", resultDetail);
  console.log("Exam Data:", examData);
  console.log("Result Map:", resultMap);

  if (loading) {
    return <Loading />;
  }

  // if error other than missing exam, show error UI
  if (error && !examMissing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Lỗi tải kết quả</h1>
          <p className="text-gray-600 mb-4">{error || "Không thể tải dữ liệu kết quả"}</p>
          <button 
            onClick={() => navigate('/exam')}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  // if exam is missing, show warning but still display whatever we can below
  if (examMissing && !examData) {
    // render simplified result header and stop; questions not available
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <h1 className="text-xl font-bold text-red-600 mb-4">Đề thi không tồn tại</h1>
        <p className="text-gray-700 mb-6">Kết quả của bạn vẫn được lưu nhưng nội dung đề thi hiện không còn.</p>
        <button
          onClick={() => navigate('/exam')}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >Quay lại trang đề thi</button>
      </div>
    );
  }

  // if we don't have result details, show loading or error
  if (!resultDetail) {
    return <Loading />;
  }

  // if exam data is missing, show warning
  if (!examData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <h1 className="text-xl font-bold text-red-600 mb-4">Không thể tải đề thi</h1>
        <p className="text-gray-700 mb-6">Kết quả của bạn vẫn được lưu nhưng nội dung đề thi hiện không còn.</p>
        <button
          onClick={() => navigate('/exam')}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >Quay lại trang đề thi</button>
      </div>
    );
  }
  
  // Helpers
  const formatTime = (seconds) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m} phút ${s} giây`;
  };

  const getScoreColor = (score) => {
      if (score >= 9) return "text-green-600";
      if (score >= 5) return "text-yellow-600";
      return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* HEADER SUMMARY */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
           <div className="max-w-[1920px] mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-50 rounded-xl">
                        <Award className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{examData?.title?.text || examData?.title || "Kết quả thi"}</h1>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                            <History className="w-4 h-4" /> 
                            Nộp bài lúc: {moment(resultDetail?.createdAt).format("HH:mm DD/MM/YYYY")}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6 md:gap-12 bg-gray-50 px-6 py-3 rounded-xl border border-gray-100">
                     <div className="text-center">
                         <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Điểm số</p>
                         <p className={`text-2xl font-black ${getScoreColor(displayScore)}`}>{displayScore}</p>
                     </div>
                     <div className="w-px h-10 bg-gray-200"></div>
                     <div className="text-center">
                         <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Số câu đúng</p>
                         <p className="text-2xl font-black text-gray-800">{displayCorrectCount}/{actualTotalQuestions}</p>
                     </div>
                      <div className="w-px h-10 bg-gray-200"></div>
                     <div className="text-center">
                         <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Thời gian</p>
                         <p className="text-xl font-bold text-gray-800">{formatTime(resultDetail?.examCompledTime || 0)}</p>
                     </div>
                </div>
                
                <div className="flex gap-2">
                     <button onClick={() => navigate('/exam')} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors">
                        Thoát
                     </button>
                      <button onClick={() => navigate(`/exam/test/${examId}`)} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm shadow-lg shadow-red-200 transition-all">
                        Làm lại
                     </button>
                </div>
           </div>
      </div>

      <div className="flex-1 max-w-[1920px] mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-8">
         {/* LEFT: DETAIL REVIEW */}
         <div className="flex-1 space-y-6">
             {buildDisplayItems(questionList).map((item, dispIdx) => {
               if (item.type === "single") {
                 // Single question rendering
                 const question = item.question;
                 const index = item.index;
                 const qKey = question.question;
                 const isCorrect = resultMap[qKey];
                 const userAnswer = resultDetail.userAnswers?.[qKey];
                 const correctAnswer = question.correctAnswer || question.answer;
                 const isCurrentHighlight = currentQuestionReview === qKey;

                 // ── DL (Gap Filling / Reading Comprehension) ──
                 if (question.type === "DL" && Array.isArray(question.subQuestions)) {
                   const dlNum = questionNumberMap[question.question];
                   const startNum = dlNum?.startNum ?? 1;
                   const endNum = startNum + question.subQuestions.length - 1;
                   return (
                     <div id={`question-${index}`} key={index} className="bg-white rounded-2xl border border-gray-200 overflow-hidden scroll-mt-32">
                       <div className="flex flex-col lg:flex-row" style={{ height: "78vh" }}>
                         {/* LEFT: Reading Passage */}
                         <div className="w-full lg:w-1/2 bg-blue-50 border-r border-gray-200 p-6 overflow-y-auto">
                           <p className="text-xs font-bold uppercase text-red-600 tracking-wide mb-4">
                             Bài đọc ({startNum}–{endNum})
                           </p>
                           <div className="text-gray-800 leading-relaxed whitespace-pre-wrap text-base font-medium">
                             {question.contentQuestions}
                           </div>
                         </div>
                         {/* RIGHT: Sub-questions */}
                         <div className="w-full lg:w-1/2 p-6 overflow-y-auto space-y-4 bg-white">
                           <p className="text-xs font-bold uppercase text-gray-500 tracking-wide mb-2">
                             ✏️ Câu hỏi ({startNum}–{endNum})
                           </p>
                           {question.subQuestions.map((sq, sqIdx) => {
                             const sqNum = startNum + sqIdx;
                             const sqCorrect = resultMap[sq.question];
                             const sqUserAnswer = resultDetail.userAnswers?.[sq.question];
                             const sqCorrectAnswer = sq.correctAnswer;
                             const sqIsHighlighted = currentQuestionReview === sq.question;
                             const sqIsBlank = sqUserAnswer === undefined || sqUserAnswer === null || sqUserAnswer === "";
                             return (
                               <div
                                 key={sq.question}
                                 className={`border-2 rounded-xl p-4 transition-all ${
                                   sqCorrect === true ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/20'
                                 } ${sqIsHighlighted ? 'ring-2 ring-red-400 ring-offset-1' : ''}`}
                               >
                                 <div className="flex items-start gap-3 mb-3">
                                   <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${
                                     sqCorrect === true ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                   }`}>{sqNum}</span>
                                   <span className="text-gray-800 text-sm leading-relaxed flex-1">{sq.contentQuestions}</span>
                                   <span className="flex-shrink-0">
                                     {sqCorrect === true ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                                   </span>
                                 </div>
                                 <div className="space-y-1 mb-2">
                                   {["A", "B", "C", "D"].map(opt => {
                                     const optContent = sq[`contentAnswer${opt}`];
                                     if (!optContent) return null;
                                     const isUserChoice = sqUserAnswer === opt;
                                     const isCorrectChoice = (answerDisplay[sq.question] || sqCorrectAnswer) === opt;
                                     return (
                                       <div key={opt} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                                         isCorrectChoice ? 'bg-green-100 text-green-800 font-semibold' :
                                         isUserChoice ? 'bg-red-100 text-red-800' : 'text-gray-600'
                                       }`}>
                                         <span className="font-bold">{opt}.</span>
                                         <span>{optContent}</span>
                                         {isCorrectChoice && <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />}
                                         {isUserChoice && !isCorrectChoice && <XCircle className="w-4 h-4 text-red-500 ml-auto" />}
                                       </div>
                                     );
                                   })}
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                       </div>
                     </div>
                   );
                 }

                 // ── Regular single question ──
                 const globalNum = questionNumberMap[qKey]?.num ?? (index + 1);

                 return (
                     <div 
                        id={`question-${index}`} 
                        key={index} 
                        className={`bg-white rounded-2xl p-6 border-2 transition-all duration-300 scroll-mt-32
                            ${isCorrect === true ? 'border-green-100 shadow-sm' : isCorrect === false ? 'border-red-100 shadow-sm' : 'border-gray-100'}
                            ${isCurrentHighlight ? 'ring-2 ring-red-400 ring-offset-2' : ''}
                        `}
                    >
                         <div className="flex items-start gap-4 mb-4">
                             <div className={`
                                flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                                ${isCorrect === true ? 'bg-green-100 text-green-600' : isCorrect === false ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}
                             `}>
                                 {globalNum}
                             </div>
                             <div className="flex-1 pt-1">
                                 <h3 className="text-gray-900 font-medium text-lg leading-relaxed">
                                     <MathRenderer content={question.contentQuestions || question.question} />
                                 </h3>
                                 {question.imageUrl && (
                                     <img src={question.imageUrl} alt="Question" className="mt-4 rounded-lg max-h-60 object-contain border" />
                                 )}
                             </div>
                             <div className="flex-shrink-0">
                                 {isCorrect === true && <CheckCircle2 className="w-8 h-8 text-green-500" />}
                                 {isCorrect === false && <XCircle className="w-8 h-8 text-red-500" />}
                             </div>
                         </div>

                         {/* Answer Section */}
                         <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                             <div className="flex gap-2 text-sm">
                                 <span className="font-semibold text-gray-500 uppercase tracking-wider w-24">Bạn chọn:</span>
                                 {(() => {
                                     const isBlank =
                                         userAnswer === undefined ||
                                         userAnswer === null ||
                                         userAnswer === "";
                                     let displayUser;
                                     if (isBlank) {
                                         displayUser = "Không trả lời";
                                     } else if (question.type === 'WR' && Array.isArray(userAnswer)) {
                                         const parts = String(question.contentQuestions || "")
                                             .split("/")
                                             .map(p => p.trim())
                                             .filter(p => p.length > 0);
                                         displayUser = userAnswer
                                             .map(i => parts[parseInt(i)] || "")
                                             .join("");
                                     } else {
                                         displayUser = convertForDisplay(userAnswer, question.type);
                                     }
                                     return (
                                         <span
                                             className={`font-bold ${
                                                 isCorrect === true
                                                     ? 'text-green-700'
                                                     : 'text-red-600'
                                             }`}
                                         >
                                             {displayUser}
                                         </span>
                                     );
                                 })()}
                             </div>
                             
                             {isCorrect === false && (
                                 <div className="flex gap-2 text-sm border-t border-gray-200 pt-2 mt-2">
                                     <span className="font-semibold text-gray-500 uppercase tracking-wider w-24">Đáp án đúng:</span>
                                     <span className="font-bold text-red-600">
                                         {answerDisplay[qKey] && answerDisplay[qKey].trim()
                                             ? answerDisplay[qKey]
                                             : (question.type === 'WR' && Array.isArray(correctAnswer)
                                                 ? convertForDisplay(correctAnswer, question.type)
                                                 : convertForDisplay(correctAnswer, question.type))}
                                     </span>
                                 </div>
                             )}

                             {question.explain && (
                                 <div className="mt-4 bg-red-50 p-3 rounded-lg text-sm text-red-900">
                                     <span className="font-bold block mb-1">Giải thích:</span>
                                     <MathRenderer content={question.explain} />
                                 </div>
                             )}
                         </div>
                     </div>
                 );
               }
               
               // Matching group rendering
               const group = item.questions;
               const startIdx = item.startIndex;
               const endIdx = startIdx + group.length - 1;
               const groupId = group[0]?.matchGroup;
               const hasMtOptions = Array.isArray(group[0]?.mtOptions) && group[0].mtOptions.length > 0;
               
               // Check if ANY answer in the group is correct
               let groupIsCorrect = null; // null = mixed/unknown, true = all correct, false = any wrong
               let allCorrect = true;
               let anyCorrect = false;
               
               group.forEach(q => {
                 const isCorrect = resultMap[q.question];
                 if (isCorrect === true) anyCorrect = true;
                 if (isCorrect === false) allCorrect = false;
               });
               
               groupIsCorrect = allCorrect ? true : anyCorrect ? null : false;

               // For MT with propositions: split-screen layout
               if (hasMtOptions) {
                 return (
                   <div 
                      id={`question-${startIdx}`} 
                      key={groupId} 
                      className={`bg-white rounded-2xl border-2 transition-all duration-300 scroll-mt-32 overflow-hidden
                          ${groupIsCorrect === true ? 'border-green-100 shadow-sm' : groupIsCorrect === false ? 'border-red-100 shadow-sm' : 'border-yellow-100'}
                      `}
                  >
                       {/* Header with description */}
                       {group[0]?.contentQuestions && (
                         <div className="bg-gray-50 border-b border-gray-200 p-6 text-gray-800 leading-relaxed font-medium">
                           <MathRenderer content={group[0].contentQuestions} />
                         </div>
                       )}

                       {/* Split Layout: Left=Image, Right=Propositions+Answers */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                         {/* LEFT: Image/Context */}
                         <div className="bg-gray-50 border-r border-gray-200 p-6 flex items-center justify-center min-h-[400px]">
                           {group[0]?.imageUrl ? (
                             <img
                               src={group[0].imageUrl}
                               alt="reading-context"
                               className="max-w-full h-auto rounded-lg border border-gray-200"
                             />
                           ) : (
                             <p className="text-gray-400 italic text-center">Không có hình ảnh</p>
                           )}
                         </div>

                         {/* RIGHT: Combined propositions & answers */}
                         <div className="p-6 flex flex-col gap-4">
                           {group.map((subQ, subIdx) => {
                             const prop = group[0].mtOptions[subIdx] || "";
                             const isCorrect = resultMap[subQ.question];
                             const userAnswer = resultDetail.userAnswers?.[subQ.question];
                             const correctAnswer = subQ.correctAnswer;
                             const isBlank = userAnswer === undefined || userAnswer === null || userAnswer === "";
                             const displayUser = isBlank ? "✕ Không trả lời" : convertForDisplay(userAnswer, subQ.type);
                             const displayCorrectAns = answerDisplay[subQ.question] && answerDisplay[subQ.question].trim()
                               ? answerDisplay[subQ.question]
                               : convertForDisplay(correctAnswer, subQ.type);

                             return (
                               <div
                                 key={subIdx}
                                 className={`p-3 rounded-lg border-2 transition-all ${
                                   isCorrect === true
                                     ? 'bg-green-50 border-green-200'
                                     : 'bg-red-50 border-red-200'
                                 }`}
                               >
                                 {prop && (
                                   <div className="text-sm text-gray-700 leading-relaxed p-2 bg-gray-50 rounded border border-gray-200 mb-2">
                                     <MathRenderer content={prop} />
                                   </div>
                                 )}
                                 <div className="flex items-center justify-between mb-2">
                                   <span className="font-bold text-blue-600">{subQ.question}.</span>
                                   <div>
                                     {isCorrect === true && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                     {isCorrect === false && <XCircle className="w-5 h-5 text-red-500" />}
                                   </div>
                                 </div>
                                 <div className="text-sm text-gray-700">
                                   <span className="text-gray-600">Bạn chọn:</span>{" "}
                                   <span className="font-bold" style={{ color: isCorrect === true ? '#16a34a' : '#dc2626' }}>
                                     {displayUser}
                                   </span>
                                 </div>
                                 {isCorrect !== true && (
                                   <div className="text-sm text-gray-700 mt-1">
                                     <span className="text-gray-600">Đáp án:</span>{" "}
                                     <span className="font-bold text-red-600">{displayCorrectAns}</span>
                                   </div>
                                 )}
                               </div>
                             );
                           })}

                           {group[0]?.explain && (
                             <div className="mt-4 bg-red-50 p-3 rounded-lg text-sm text-red-900 border-t border-gray-200 pt-4">
                               <span className="font-bold block mb-1">Giải thích:</span>
                               <MathRenderer content={group[0].explain} />
                             </div>
                           )}
                         </div>
                       </div>
                     </div>
                 );
               }
               // Original matching group layout (without propositions)
               return (
                   <div 
                      id={`question-${startIdx}`} 
                      key={groupId} 
                      className={`bg-white rounded-2xl p-6 border-2 transition-all duration-300 scroll-mt-32
                          ${groupIsCorrect === true ? 'border-green-100 shadow-sm' : groupIsCorrect === false ? 'border-red-100 shadow-sm' : 'border-yellow-100'}
                      `}
                  >
                       <div className="flex items-start gap-4 mb-4">
                           <div className={`
                              flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center font-bold text-sm
                              ${groupIsCorrect === true ? 'bg-green-100 text-green-600' : groupIsCorrect === false ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}
                           `}>
                               <div className="text-center">
                                   <div>{startIdx + 1}</div>
                                   <div className="text-xs">-</div>
                                   <div>{endIdx + 1}</div>
                               </div>
                           </div>
                           <div className="flex-1 pt-1">
                               <h3 className="text-gray-900 font-medium text-lg leading-relaxed mb-4">
                                   {group[0]?.contentQuestions && <MathRenderer content={group[0].contentQuestions} />}
                               </h3>
                               {group[0]?.imageUrl && (
                                   <img src={group[0].imageUrl} alt="Question" className="mt-4 rounded-lg max-h-60 object-contain border mb-4" />
                               )}
                               
                               {/* Matching sub-questions */}
                               <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                                   {group.map((subQ, subIdx) => {
                                     const isCorrect = resultMap[subQ.question];
                                     const userAnswer = resultDetail.userAnswers?.[subQ.question];
                                     const correctAnswer = subQ.correctAnswer;
                                     const displayCorrectAnswer = answerDisplay[subQ.question] && answerDisplay[subQ.question].trim() ? answerDisplay[subQ.question] : convertForDisplay(correctAnswer, subQ.type);
                                     const isBlank =
                                         userAnswer === undefined ||
                                         userAnswer === null ||
                                         userAnswer === "";
                                     const displayUser = isBlank
                                         ? "Không trả lời"
                                         : convertForDisplay(userAnswer, subQ.type);
                                     
                                     return (
                                       <div key={subIdx} className="flex items-center gap-3 pb-3 border-b border-gray-200 last:border-b-0">
                                           <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-white border-2
                                             ${isCorrect === true ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600'}
                                           `}>
                                               {subIdx + 1}
                                           </div>
                                           <div className="flex-1">
                                               <div className="text-sm text-gray-600">Bạn chọn: <span className="font-bold" style={{color: isCorrect === true ? '#16a34a' : '#dc2626'}}>{ displayUser }</span></div>
                                             {isCorrect !== true && <div className="text-sm text-gray-600">Đáp án: <span className="font-bold text-red-600">{displayCorrectAnswer}</span></div>}
                                           </div>
                                           <div className="flex-shrink-0">
                                               {isCorrect === true && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                               {isCorrect !== true && <XCircle className="w-5 h-5 text-red-500" />}
                                           </div>
                                       </div>
                                     );
                                   })}
                               </div>
                               
                               {group[0]?.explain && (
                                   <div className="mt-4 bg-red-50 p-3 rounded-lg text-sm text-red-900">
                                       <span className="font-bold block mb-1">Giải thích:</span>
                                       <MathRenderer content={group[0].explain} />
                                   </div>
                               )}
                           </div>
                           <div className="flex-shrink-0">
                               {groupIsCorrect === true && <CheckCircle2 className="w-8 h-8 text-green-500" />}
                               {groupIsCorrect === false && <XCircle className="w-8 h-8 text-red-500" />}
                           </div>
                       </div>
                   </div>
               );
             })}
         </div>

         {/* RIGHT: NAVIGATION SIDEBAR */}
         <div className="w-full lg:w-[320px] lg:flex-shrink-0">
             <div className="sticky top-28 space-y-6">
                 <div className="bg-white rounded-2xl shadow-lg shadow-gray-100 border border-gray-100 p-6">
                     <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                         <ListChecks className="w-5 h-5 text-red-600" />
                         Danh sách câu hỏi
                     </h3>
                     
                     <ExamNumber 
                        totalQuestions={flatQuestionList.length}
                        questionList={flatQuestionList}
                        hasStarted={true}
                        resultMode={true}
                        resultMap={resultMap}
                        currentQuestion={currentQuestionReview}
                        onSelect={(index) => scrollToQuestion(index)}
                     />

                     <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4 text-xs font-medium text-gray-600">
                         <div className="flex items-center gap-2">
                             <span className="w-3 h-3 bg-green-100 border border-green-200 rounded"></span> Đúng ({displayCorrectCount})
                         </div>
                         <div className="flex items-center gap-2">
                             <span className="w-3 h-3 bg-red-50 border border-red-200 rounded"></span> Sai ({actualTotalQuestions - (resultDetail?.numberOfCorrectAnswers || derivedCorrectCount)})
                         </div>
                     </div>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
}

export default ExamResultPage;
