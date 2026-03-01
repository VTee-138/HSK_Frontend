/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import moment from "moment";
import {
  X,
  Clock,
  ListChecks,
  CheckCircle2,
} from "lucide-react";
import { getExamDetail } from "../../../services/ExamService";
import {
  postTest,
  saveExamProgress,
  deletePausedProgress,
} from "../../../services/TestService";
import Loading from "../../Loading";

import Countdown from "./Countdown";
import ExamNumber from "./ExamNumber";
import MathRenderer from "../../../common/MathRenderer";
import ConfirmModal from "../../ConfirmModal";

const STORAGE_KEY = "exam-answers";

const ExamTestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [examData, setExamData] = useState(null);

  // States specific to test taking
  const [answers, setAnswers] = useState({});
  const [isOpen, setIsOpen] = useState(false); // Sidebar state for mobile

  const [loadingAPI, setLoadingAPI] = useState(false);

  const [showExitModal, setShowExitModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // current section being shown: READING / LISTENING / WRITING
  const [currentSection, setCurrentSection] = useState("READING");

  const [searchParams] = useSearchParams();
  const selectedSectionsParam = searchParams.get("sections");

  // Fetch Exam Data
  const handleFetch = async () => {
    try {
      setLoading(true);
      const responseExam = await getExamDetail(id);
      const data = responseExam?.data;
      if (data) {
        if (selectedSectionsParam) {
          const sectionsToKeep = selectedSectionsParam.split(",");
          const filteredQuestions = data.questions.filter((q) =>
            sectionsToKeep.includes(q.section)
          );
          setExamData({ ...data, questions: filteredQuestions });
        } else {
          setExamData(data);
        }
      }
    } catch (error) {
      console.log(" handleFetch ~ error:", error);
      const message = error?.response?.data?.message;
      toast.error(message);
      navigate(`/exam/${id}`); // Go back to detail if error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetch();
  }, [id]);

  // Initialize Exam Session and section state
  useEffect(() => {
    if (examData) {
      const existingSession = sessionStorage.getItem("exam");
      if (!existingSession) {
        sessionStorage.setItem(
          "exam",
          JSON.stringify({
            _id: examData._id,
            time: examData.time,
            start: moment(new Date()),
          }),
        );
      }

      // if URL param requests specific sections, pick first one as current
      if (selectedSectionsParam) {
        const arr = selectedSectionsParam.split(",");
        if (arr.length) setCurrentSection(arr[0]);
      } else {
        // choose first section that actually has questions — LISTENING first
        const secs = ['LISTENING', 'READING', 'WRITING'];
        for (let s of secs) {
          if (examData.questions?.some(q => (q.section || 'READING') === s)) {
            setCurrentSection(s);
            break;
          }
        }
      }
    }
  }, [examData]);

  // Load answers from session
  useEffect(() => {
    const savedAnswers = sessionStorage.getItem(STORAGE_KEY);
    setAnswers(savedAnswers ? JSON.parse(savedAnswers) : {});
  }, [id]);

  const sections = useMemo(() => {
    if (!examData) return { READING: [], LISTENING: [], WRITING: [] };
    const grouped = { READING: [], LISTENING: [], WRITING: [] };
    examData.questions.forEach((q) => {
      const sec = q.section || "READING";
      if (!grouped[sec]) grouped[sec] = [];
      grouped[sec].push(q);
    });
    return grouped;
  }, [examData]);

  // list of questions for the currently selected section (display area)
  const sectionQuestionList = useMemo(() => {
    return sections[currentSection] || [];
  }, [sections, currentSection]);

  // complete flattened list in original order
  const allQuestions = useMemo(() => {
    if (!examData) return [];
    return examData.questions.filter((q) => q.type !== "MQ");
  }, [examData]);

  const handleSelectQuestion = (index) => {
    const q = allQuestions[index];
    if (q) {
      const el = document.getElementById(q.question);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  // Handle Answer Change for a given question key
  const handleAnswerChange = (questionKey, value) => {
    setAnswers((prev) => {
      const newAnswers = { ...prev, [questionKey]: value };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newAnswers));
      return newAnswers;
    });
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Handle Browser Back Button (Mobile & Desktop)
  useEffect(() => {
    // Push a dummy state so that the back button event can be intercepted
    window.history.pushState(null, document.title, window.location.href);

    const handlePopState = (event) => {
      // Prevent automatic navigation by pushing state again
      window.history.pushState(null, document.title, window.location.href);
      // Show confirmation modal
      setShowExitModal(true);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const confirmSubmit = async () => {
    try {
      setLoadingAPI(true);
      const savedAnswers = sessionStorage.getItem("exam-answers");
      const examCompledTime = sessionStorage.getItem("exam_completing_time");
      const res = await postTest(id, {
        userAnswers: JSON.parse(savedAnswers) || {},
        examCompledTime: JSON.parse(examCompledTime),
        examId: id,
        access: examData.access,
      });

      toast.success(res.message);

      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem("exam");
      sessionStorage.removeItem("time-left");
      sessionStorage.removeItem("exam_completing_time");

      // Extract resultId from response and include in navigation
      const resultId = res.data?._id;
      navigate(`/exam/result/${id}${resultId ? `?resultId=${resultId}` : ""}`);

      setLoadingAPI(false);
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(message);
      setLoadingAPI(false);
    }
  };

  const handleSubmit = () => {
    setShowSubmitModal(true);
  };

  const handleSave = async () => {
    setShowExitModal(true);
  };

  const handleExit = async (save = false) => {
    if (save) {
      try {
        setLoadingAPI(true);
        const savedAnswers = sessionStorage.getItem("exam-answers");
        let examCompledTime = sessionStorage.getItem("exam_completing_time");
        examCompledTime = examCompledTime ? JSON.parse(examCompledTime) : 0;

        await saveExamProgress(id, {
          userAnswers: JSON.parse(savedAnswers) || {},
          examCompledTime: examCompledTime,
          examId: id,
        });
        toast.success("Đã lưu tiến độ bài thi");

        sessionStorage.removeItem("exam-answers");
        sessionStorage.removeItem("exam");
        sessionStorage.removeItem("time-left");
        sessionStorage.removeItem("exam_completing_time");

        navigate(`/exam/${id}`);
      } catch (error) {
        toast.error("Lỗi khi lưu bài: " + error.message);
      } finally {
        setLoadingAPI(false);
      }
    } else {
      try {
        await deletePausedProgress(id);
      } catch (error) {
        console.log("Error deleting paused progress", error);
      }
      sessionStorage.removeItem("exam-answers");
      sessionStorage.removeItem("exam");
      sessionStorage.removeItem("time-left");
      sessionStorage.removeItem("exam_completing_time");
      navigate(`/exam/${id}`);
    }
  };


  // render a single question block (used in section view)
  const renderQuestion = (current) => {
    if (!current) return null;

    // MT sub-question: render a single text input box (numbered by parent)
    if (current.type === "MT") {
      return (
        <input
          type="text"
          maxLength={1}
          className="border-2 border-gray-300 rounded-lg p-1 w-32 text-center font-semibold uppercase text-base focus:border-red-500 focus:outline-none transition-colors"
          placeholder="A-F"
          value={typeof answers[current.question] === "string" ? answers[current.question] : ""}
          onChange={(e) => handleAnswerChange(current.question, e.target.value.toUpperCase())}
        />
      );
    }

    // Old Matching type (legacy)
    if (current.type === "Matching") {
      const matchItems = current.questions || current.items || [];
      if (matchItems.length > 0) {
        return (
          <div className="space-y-3">
            {matchItems.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-center">
                <div className="font-semibold text-red-600">{item.id || idx + 1}.</div>
                <input
                  type="text"
                  className="border rounded p-2 w-16 text-center font-bold uppercase"
                  placeholder="A,B..."
                  value={answers[current.question]?.[item.id] || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const currentAnsObj =
                      typeof answers[current.question] === "object"
                        ? answers[current.question]
                        : {};
                    handleAnswerChange(current.question, {
                      ...currentAnsObj,
                      [item.id]: val,
                    });
                  }}
                />
                <div className="flex-1">
                  <MathRenderer content={item.content} />
                </div>
              </div>
            ))}
            <p className="text-sm text-gray-500 italic mt-2">
              * Nhập ký tự tương ứng với đáp án ghép nối
            </p>
          </div>
        );
      }
    }

    // Options (Multiple Choice / True-False)
    const options =
      current.contentOptions || current.options || current.answers;
    let displayOptions = [];
    if (current.type === "DS") {
      displayOptions = [
        { id: "True", content: "Đúng" },
        { id: "False", content: "Sai" },
      ];
    } else if (current.type === "TN") {
      if (current.contentAnswerA)
        displayOptions.push({ id: "A", content: current.contentAnswerA });
      if (current.contentAnswerB)
        displayOptions.push({ id: "B", content: current.contentAnswerB });
      if (current.contentAnswerC)
        displayOptions.push({ id: "C", content: current.contentAnswerC });
      if (current.contentAnswerD)
        displayOptions.push({ id: "D", content: current.contentAnswerD });
      if (displayOptions.length === 0 && options) {
        if (Array.isArray(options)) {
          displayOptions = options.map((opt, idx) => ({
            id: String.fromCharCode(65 + idx),
            content: opt,
          }));
        }
      }
    } else if (options) {
      if (Array.isArray(options)) {
        displayOptions = options.map((opt, idx) => {
          if (typeof opt === "string" || typeof opt === "number") {
            return { id: String.fromCharCode(65 + idx), content: opt };
          }
          return {
            id: opt.id || String.fromCharCode(65 + idx),
            content: opt.content || opt.text || opt,
          };
        });
      } else if (typeof options === "object") {
        displayOptions = Object.entries(options).map(([key, value]) => ({
          id: key,
          content: value,
        }));
      }
    }

    if (displayOptions.length > 0) {
      return (
        <div className="grid grid-cols-1 gap-3">
          {displayOptions.map((opt, idx) => {
            const optId = opt.id;
            const optContent = opt.content;
            const isChecked = isSelected(current.question, optId);
            return (
              <div
                key={idx}
                onClick={() => handleAnswerChange(current.question, optId)}
                className={`
                  group relative cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4
                  ${isChecked
                    ? "border-red-500 bg-red-50/50 shadow-sm"
                    : "border-gray-100 bg-white hover:border-red-200 hover:bg-red-50/30"
                  }
                `}
              >
                <div
                  className={`mt-1 w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors
                    ${isChecked ? "bg-red-500 border-red-500" : "border-gray-300 group-hover:border-red-400 bg-white"}
                  `}
                >
                  {isChecked && (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  )}
                </div>
                <div
                  className={`flex-1 text-base ${isChecked ? "text-red-900 font-medium" : "text-gray-700"
                    }`}
                >
                  <span className="font-bold mr-2 text-red-600">{optId}.</span>
                  <span className="inline-block">
                    <MathRenderer
                      content={
                        typeof optContent === "string" ||
                          typeof optContent === "number"
                          ? optContent
                          : optContent?.text || optContent
                      }
                    />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Fallback text area
    return (
      <div className="relative">
        <textarea
          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 outline-none transition-all resize-none min-h-[120px] text-lg text-gray-700"
          placeholder="Nhập câu trả lời của bạn vào đây..."
          value={
            typeof answers[current.question] === "string"
              ? answers[current.question]
              : ""
          }
          onChange={(e) =>
            handleAnswerChange(current.question, e.target.value)
          }
        />
        <div className="absolute bottom-4 right-4 text-xs text-gray-400 pointer-events-none">
          Văn bản
        </div>
      </div>
    );
  };


  const sessionExam = JSON.parse(sessionStorage.getItem("exam"));

  // Check Helper
  const isSelected = (questionKey, val) => {
    const currentAns = answers[questionKey];
    return currentAns === val;
  };

  if (loading || !examData) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      <div className="flex-1 max-w-[1920px] mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-8">
        {/* LEFT COLUMN: Question Area */}
        <div className="flex-1 w-full lg:min-w-0">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10 min-h-[85vh] flex flex-col relative overflow-hidden">
            <div className="flex flex-col gap-6 flex-1">
              {/* Section Tabs — LISTENING first */}
              <div className="flex gap-4 mb-4">
                {['LISTENING', 'READING', 'WRITING'].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setCurrentSection(sec)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors
                      ${currentSection === sec ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {sec === 'READING' ? 'Đọc' : sec === 'LISTENING' ? 'Nghe' : 'Viết'}
                  </button>
                ))}
              </div>

              {/* Audio Player for LISTENING section - show at top */}
              {currentSection === 'LISTENING' && examData?.audioUrl && (
                <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-3">🔊 Nghe tài liệu âm thanh:</p>
                  <audio controls className="w-full" key={examData.audioUrl}>
                    <source src={examData.audioUrl} type="audio/mpeg" />
                    Trình duyệt của bạn không hỗ trợ thẻ audio.
                  </audio>
                </div>
              )}

              {/* Questions for current section */}
              <div className="flex-1 overflow-y-auto space-y-8">
                {sectionQuestionList.length === 0 ? (
                  <p className="text-center text-gray-500 italic">
                    Không có câu hỏi cho phần này.
                  </p>
                ) : (
                  // Group consecutive MT questions with the same matchGroup into one block
                  (() => {
                    const rendered = [];
                    let i = 0;
                    while (i < sectionQuestionList.length) {
                      const q = sectionQuestionList[i];
                      if (q.type === "MT" && q.matchGroup) {
                        // Collect the whole group
                        const group = [q];
                        let j = i + 1;
                        while (j < sectionQuestionList.length &&
                          sectionQuestionList[j].type === "MT" &&
                          sectionQuestionList[j].matchGroup === q.matchGroup) {
                          group.push(sectionQuestionList[j]);
                          j++;
                        }
                        // First item in group has imageUrl and contentQuestions
                        const firstQ = group[0];
                        const hasMtOptions = Array.isArray(firstQ.mtOptions) && firstQ.mtOptions.length > 0;

                        if (hasMtOptions) {
                          // MT Reading with propositions: pair each proposition with its answer
                          rendered.push(
                            <div key={firstQ.question} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                              {/* Header with description */}
                              {firstQ.contentQuestions && (
                                <div className="bg-gray-50 border-b border-gray-200 p-4 text-gray-800 leading-relaxed font-medium">
                                  <MathRenderer content={firstQ.contentQuestions} />
                                </div>
                              )}

                              {/* Split Layout: Left=Image, Right=Propositions+Inputs */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 h-auto">
                                {/* LEFT: Image/Context Section */}
                                <div className="bg-gray-50 border-r border-gray-200 p-6 flex items-center justify-center">
                                  {firstQ.imageUrl ? (
                                    <img
                                      src={firstQ.imageUrl}
                                      alt="reading-context"
                                      className="max-w-full h-auto rounded-lg border border-gray-200"
                                    />
                                  ) : (
                                    <p className="text-gray-400 italic text-center">Không có hình ảnh</p>
                                  )}
                                </div>

                                {/* RIGHT: Combined propositions + answer inputs */}
                                <div className="p-2 flex flex-col gap-1">
                                  {group.map((subQ, idx) => {
                                    const propText = firstQ.mtOptions[idx] || "";
                                    return (
                                      <div key={subQ.question} className="space-y-1">
                                        {propText && (
                                          <div className="text-sm text-gray-700 leading-relaxed p-1 bg-gray-50 rounded border border-gray-200 text-center">
                                            <MathRenderer content={propText} />
                                          </div>
                                        )}
                                        <div
                                          id={subQ.question}
                                          className="flex items-center gap-1 p-0.5 bg-gray-50 rounded hover:bg-red-50/30 transition-colors"
                                        >
                                          <span className="text-sm font-bold text-red-600 flex-shrink-0 whitespace-nowrap mr-2">
                                            {subQ.question}.
                                          </span>
                                          <input
                                            type="text"
                                            maxLength={1}
                                            className={`border-2 rounded-lg p-0.5 w-20 text-center font-bold uppercase text-base transition-colors ${
                                              answers[subQ.question]
                                                ? "border-red-500 bg-red-50 text-red-700"
                                                : "border-gray-300 focus:border-red-500"
                                            } focus:outline-none`}
                                            placeholder="A-F"
                                            value={
                                              typeof answers[subQ.question] === "string"
                                                ? answers[subQ.question]
                                                : ""
                                            }
                                            onChange={(e) =>
                                              handleAnswerChange(
                                                subQ.question,
                                                e.target.value.toUpperCase()
                                              )
                                            }
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          // MT without propositions (old format): use original layout
                          rendered.push(
                            <div key={firstQ.question} className="p-4 border rounded-lg">
                              {/* Description if any */}
                              {firstQ.contentQuestions && (
                                <div className="mb-4 text-gray-800 leading-relaxed font-medium">
                                  <MathRenderer content={firstQ.contentQuestions} />
                                </div>
                              )}
                              {/* Image on top, inputs below */}
                              <div className="flex flex-col gap-6">
                                {/* Image side */}
                                {firstQ.imageUrl && (
                                  <div className="flex justify-center">
                                    <img
                                      src={firstQ.imageUrl}
                                      alt="matching"
                                      className="max-w-full h-auto rounded-lg border border-gray-100"
                                    />
                                  </div>
                                )}
                                {/* Numbered input boxes */}
                                <div className="flex flex-col gap-0 w-full">
                                  {group.map((subQ) => (
                                    <div key={subQ.question} id={subQ.question} className="flex items-center gap-1">
                                      <span className="text-sm font-bold text-red-600 flex-shrink-0 whitespace-nowrap mr-2">
                                        {subQ.question}
                                      </span>
                                      <input
                                        type="text"
                                        maxLength={1}
                                        className={`border-2 rounded-lg p-0.5 w-16 text-center font-bold uppercase text-base transition-colors ${answers[subQ.question]
                                            ? 'border-red-500 bg-red-50 text-red-700'
                                            : 'border-gray-300 focus:border-red-500'
                                          } focus:outline-none`}
                                        placeholder="A-F"
                                        value={typeof answers[subQ.question] === 'string' ? answers[subQ.question] : ''}
                                        onChange={(e) => handleAnswerChange(subQ.question, e.target.value.toUpperCase())}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        }
                        i = j;
                      } else {
                        // Normal question rendering
                        rendered.push(
                          <div key={i} id={q.question} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-lg font-bold text-red-600">{q.question}</span>
                            </div>
                            {q.imageUrl && (
                              <div className="mb-3 flex justify-center">
                                <img src={q.imageUrl} alt={q.question} className="max-w-full h-56 object-contain rounded-lg" />
                              </div>
                            )}
                            {q.contentQuestions && (
                              <div className="mb-4 text-gray-800 leading-relaxed">
                                <MathRenderer content={q.contentQuestions} />
                              </div>
                            )}
                            <div className="border-t border-gray-100 pt-4">
                              <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-red-600" />
                                Chọn đáp án:
                              </h3>
                              {renderQuestion(q)}
                            </div>
                          </div>
                        );
                        i++;
                      }
                    }
                    return rendered;
                  })()
                )}
              </div>

              {/* navigation removed - section handles full canvas */}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar (Timer & Palette) */}

        <>
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]">
              {/* Countdown Header */}
              <div className="p-4 bg-gradient-to-r from-red-600 to-indigo-600 text-white shadow-sm z-10">
                <div className="flex items-center justify-center gap-2 text-lg font-bold mb-1">
                  <Clock size={20} />
                  <Countdown exam={sessionExam} onComplete={handleSubmit} />
                </div>
                <p className="text-center text-red-100 text-xs">
                  Thời gian còn lại
                </p>
              </div>

              {/* Questions Grid */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <ExamNumber
                  onSubmit={handleSubmit}
                  onSelect={handleSelectQuestion}
                  hasStarted={true}
                  answers={answers}
                  questionList={allQuestions}
                  loadingAPI={loadingAPI}
                />
              </div>

              {/* Footer with Submit Button */}
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={handleSubmit}
                  disabled={loadingAPI}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold mb-5 py-3 px-4 rounded-xl shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAPI ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      Nộp bài thi <CheckCircle2 size={18} />
                    </>
                  )}
                </button>

                <button
                  onClick={handleSave}
                  disabled={loadingAPI}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAPI ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      Lưu và thoát <CheckCircle2 size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Drawer (Overlay) */}
          <div
            className={`
                    lg:hidden fixed inset-0 z-50 transition-opacity duration-300
                    ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
                `}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            ></div>

            {/* Drawer Content */}
            <div
              className={`
                        absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 flex flex-col
                        ${isOpen ? "translate-x-0" : "translate-x-full"}
                     `}
            >
              <div className="p-4 bg-red-600 text-white flex items-center justify-between">
                <div className="font-bold flex items-center gap-2">
                  <ListChecks size={20} /> Danh sách câu hỏi
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 flex items-center justify-center gap-2 text-red-600 font-bold">
                  <Clock size={18} />
                  <Countdown exam={sessionExam} onComplete={handleSubmit} />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <ExamNumber
                  onSubmit={handleSubmit}
                  onSelect={handleSelectQuestion}
                  hasStarted={true}
                  answers={answers}
                  questionList={allQuestions}
                  loadingAPI={loadingAPI}
                />
              </div>

              <div className="p-4 bg-white border-t border-gray-100">
                <button
                  onClick={handleSubmit}
                  disabled={loadingAPI}
                  className="w-full bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-transform"
                >
                  {loadingAPI ? "Đang nộp..." : "Nộp bài"}
                </button>
              </div>
            </div>
          </div>
        </>
      </div>

      {/* Exit Confirmation Modal */}
      <ConfirmModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Bạn muốn thoát bài thi?"
        message="Kết quả bài làm hiện tại sẽ bị hủy nếu bạn không lưu lại. Bạn có chắc chắn muốn thoát?"
        actions={[
          {
            label: "Lưu & Thoát (Để sau làm tiếp)",
            primary: true,
            onClick: () => handleExit(true)
          },
          {
            label: "Thoát mà không lưu",
            danger: true,
            onClick: () => handleExit(false)
          },
        ]}
      />

      {/* Submit Confirmation Modal */}
      <ConfirmModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Nộp bài thi?"
        message="Bạn có chắc chắn muốn nộp bài? Sau khi nộp, bạn sẽ không thể thay đổi đáp án."
        actions={[
          {
            label: "Nộp bài ngay",
            primary: true,
            onClick: confirmSubmit
          },
          {
            label: "Kiểm tra lại",
            secondary: true,
            onClick: () => setShowSubmitModal(false)
          }
        ]}
      />
    </div>
  );
};

export default ExamTestPage;
