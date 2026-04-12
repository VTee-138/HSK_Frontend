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
const SESSION_EXAM_KEY = "exam"; // key used for exam session data in sessionStorage

// ─── Mock Data for D4 exam (used when server is offline) ───────────────────────
const MOCK_D4_DATA = {
  _id: "mock_d4_123",
  title: { text: "ĐỀ THI THỬ D4 TIẾNG TRUNG MẪU" },
  type: "D4",
  time: 60,
  numberOfQuestions: 10,
  access: "PUBLIC",
  audioUrl: "",
  skillTimes: { listening: 0, reading: 60, writing: 0 },
  questions: [
    {
      question: "Bài đọc 1",
      type: "DL",
      section: "READING",
      contentQuestions:
        "（一）\n\n中国是一个历史悠久的国家，拥有五千年的文明史。中国的传统文化博大精深，包括儒家思想、道家哲学、佛教文化等多种思想流派。\n\n中国的饮食文化举世闻名。各地的美食各具特色，如北京的烤鸭、四川的火锅、广东的早茶等都是中国饮食文化的重要组成部分。中国人非常重视饮食，认为\"民以食为天\"，意思是吃饭是老百姓最重要的事情。\n\n除了饮食之外，中国的传统节日也是文化的重要体现。春节是中国最重要的传统节日，人们会回家与家人团聚，一起吃年夜饭，放鞭炮，贴春联，互相祝福新年快乐。中秋节时，人们会赏月，吃月饼，象征团圆和美满。\n\n中国的书法和绘画艺术也有着悠久的历史。毛笔书法被认为是中国文化的重要象征之一，练习书法不仅能提高审美能力，还能培养人的耐心和专注力。\n\n在现代中国，经济的快速发展带来了人们生活水平的显著提高。越来越多的年轻人走出国门，去世界各地学习和工作，同时也把中国文化带到了世界各个角落。中国的文化输出，包括电影、音乐、美食，正在全球范围内产生越来越大的影响力。",
      subQuestions: [
        {
          question: "Câu 1",
          contentQuestions: "中国有多少年的文明史？",
          contentAnswerA: "三千年",
          contentAnswerB: "四千年",
          contentAnswerC: "五千年",
          contentAnswerD: "六千年",
          correctAnswer: "C",
        },
        {
          question: "Câu 2",
          contentQuestions: "下列哪项不属于中国传统文化思想流派？",
          contentAnswerA: "儒家思想",
          contentAnswerB: "道家哲学",
          contentAnswerC: "神道教",
          contentAnswerD: "佛教文化",
          correctAnswer: "C",
        },
        {
          question: "Câu 3",
          contentQuestions: "北京有名的传统食物是什么？",
          contentAnswerA: "火锅",
          contentAnswerB: "早茶",
          contentAnswerC: "烤鸭",
          contentAnswerD: "月饼",
          correctAnswer: "C",
        },
        {
          question: "Câu 4",
          contentQuestions: "\"民以食为天\"这句话的意思是什么？",
          contentAnswerA: "天空是人民的食物",
          contentAnswerB: "人民喜欢吃东西",
          contentAnswerC: "饮食对老百姓来说最重要",
          contentAnswerD: "老百姓在天上吃饭",
          correctAnswer: "C",
        },
        {
          question: "Câu 5",
          contentQuestions: "中国最重要的传统节日是什么？",
          contentAnswerA: "中秋节",
          contentAnswerB: "清明节",
          contentAnswerC: "端午节",
          contentAnswerD: "春节",
          correctAnswer: "D",
        },
        {
          question: "Câu 6",
          contentQuestions: "春节期间，人们通常不会做什么活动？",
          contentAnswerA: "回家与家人团聚",
          contentAnswerB: "吃年夜饭",
          contentAnswerC: "在海边游泳",
          contentAnswerD: "放鞭炮",
          correctAnswer: "C",
        },
        {
          question: "Câu 7",
          contentQuestions: "中秋节时，人们吃什么食物来象征团圆？",
          contentAnswerA: "饺子",
          contentAnswerB: "粽子",
          contentAnswerC: "汤圆",
          contentAnswerD: "月饼",
          correctAnswer: "D",
        },
        {
          question: "Câu 8",
          contentQuestions: "练习书法有哪些好处？",
          contentAnswerA: "能提高计算能力",
          contentAnswerB: "能提高审美能力并培养耐心和专注力",
          contentAnswerC: "能增强体力",
          contentAnswerD: "能快速学习外语",
          correctAnswer: "B",
        },
        {
          question: "Câu 9",
          contentQuestions: "毛笔书法被认为是什么的重要象征？",
          contentAnswerA: "中国经济",
          contentAnswerB: "中国军事",
          contentAnswerC: "中国文化",
          contentAnswerD: "中国科技",
          correctAnswer: "C",
        },
        {
          question: "Câu 10",
          contentQuestions: "这篇文章最主要介绍的是什么？",
          contentAnswerA: "中国的经济发展",
          contentAnswerB: "中国的传统文化",
          contentAnswerC: "中国的地理环境",
          contentAnswerD: "中国的政治制度",
          correctAnswer: "B",
        },
      ],
    },
  ],
};

const ExamTestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [examData, setExamData] = useState(null);

  // States specific to test taking
  const [answers, setAnswers] = useState({});
  const [isOpen, setIsOpen] = useState(false); // Sidebar state for mobile

  // mirror of session storage exam object
  const [sessionExam, setSessionExam] = useState(() => {
    const item = sessionStorage.getItem(SESSION_EXAM_KEY);
    return item ? JSON.parse(item) : null;
  });

  const [loadingAPI, setLoadingAPI] = useState(false);

  const [showExitModal, setShowExitModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // current section being shown: READING / LISTENING / WRITING
  const [currentSection, setCurrentSection] = useState("READING");

  const [searchParams] = useSearchParams();
  const selectedSectionsParam = searchParams.get("sections");
  const modeParam = searchParams.get("mode"); // Extract mode: 'testing' or 'training'
  const timeParam = searchParams.get("time"); // Custom time for training mode

  // For preventing audio seeking in testing mode
  const [lastAudioTime, setLastAudioTime] = useState(0);

  // Fetch Exam Data
  const handleFetch = async () => {
    try {
      setLoading(true);
      // Use mock data for D4 exam when server is offline
      if (id === "mock_d4_123") {
        setExamData(MOCK_D4_DATA);
        setLoading(false);
        return;
      }
      const responseExam = await getExamDetail(id);
      const data = responseExam?.data;
      if (data) {
        // Normalize audio URL if it's relative (from DB)
        const audioUrl = data?.audioUrl && !data.audioUrl.startsWith("http")
          ? `${process.env.REACT_APP_API_BASE_URL?.replace("/api/v2", "") || "http://localhost:4000"}${data.audioUrl}`
          : data?.audioUrl;

        const normalizedData = { ...data, audioUrl };

        if (selectedSectionsParam) {
          const sectionsToKeep = selectedSectionsParam.split(",");
          const filteredQuestions = normalizedData.questions.filter((q) =>
            sectionsToKeep.includes(q.section)
          );
          setExamData({ ...normalizedData, questions: filteredQuestions });
        } else {
          setExamData(normalizedData);
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
        const trainingTime = modeParam === "training" ? (timeParam ? parseInt(timeParam, 10) : 0) : examData.time;
        const init = {
          _id: examData._id,
          time: trainingTime,
          skillTimes: modeParam === "testing" ? (examData.skillTimes || { listening: 0, reading: 0, writing: 0 }) : { listening: 0, reading: 0, writing: 0 },
          start: moment(new Date()),
          currentSection: "LISTENING", // Start with first section
          sectionStartTime: moment(new Date()), // Track when current section started
        };
        sessionStorage.setItem(SESSION_EXAM_KEY, JSON.stringify(init));
        setSessionExam(init);
      }

      // if URL param requests specific sections, pick first one as current
      if (selectedSectionsParam) {
        const arr = selectedSectionsParam.split(",");
        if (arr.length) setCurrentSection(arr[0]);
      } else if (visibleSections.length) {
        setCurrentSection(visibleSections[0]);
      } else {
        setCurrentSection("READING");
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

  // complete flattened list in original order — DL questions expanded to their sub-questions
  const allQuestions = useMemo(() => {
    if (!examData) return [];
    const flat = [];
    examData.questions.forEach((q) => {
      if (q.type === "MQ") return;
      if (q.type === "DL" && Array.isArray(q.subQuestions)) {
        flat.push(...q.subQuestions);
      } else {
        flat.push(q);
      }
    });
    return flat;
  }, [examData]);

  // Determine which sections should show in the tab bar
  const visibleSections = useMemo(() => {
    const order = ["LISTENING", "READING", "WRITING"];
    const available = order.filter((s) => (sections[s] || []).length > 0);

    if (selectedSectionsParam) {
      const selected = selectedSectionsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const filtered = order.filter((s) => selected.includes(s) && available.includes(s));
      return filtered.length ? filtered : available;
    }

    return available;
  }, [sections, selectedSectionsParam]);

  // Helper: Get section order (depends on visibleSections)
  const getSectionOrder = () => visibleSections;

  // Helper: Check if all questions in a section are answered
  const isSectionComplete = (section) => {
    const questionsInSection = sections[section] || [];
    if (questionsInSection.length === 0) return true;
    return questionsInSection.every((q) => {
      if (q.type === "DL" && Array.isArray(q.subQuestions)) {
        return q.subQuestions.every(
          (sq) => answers[sq.question] !== undefined && answers[sq.question] !== ""
        );
      }
      return answers[q.question] !== undefined && answers[q.question] !== "";
    });
  };

  // Helper: Check if a section can be accessed in testing mode
  const canAccessSection = (section) => {
    if (modeParam !== "testing") return true; // All sections accessible in training mode

    const sectionOrder = getSectionOrder();
    const currentIndex = sectionOrder.indexOf(section);

    // Can't go back to previous sections
    if (currentIndex < sectionOrder.indexOf(currentSection)) {
      return false;
    }

    // Can only access if previous sections are completed
    for (let i = 0; i < currentIndex; i++) {
      const prevSection = sectionOrder[i];
      if (sections[prevSection] && sections[prevSection].length > 0 && !isSectionComplete(prevSection)) {
        return false;
      }
    }

    return true;
  };

  // Handle Section Change with Validation
  const handleSectionChange = (newSection, forceChange = false) => {
    // In testing mode, allow forced changes (e.g., when section times out)
    if (!forceChange && modeParam === "testing") {
      const sectionOrder = getSectionOrder();
      const currentIndex = sectionOrder.indexOf(currentSection);
      const newIndex = sectionOrder.indexOf(newSection);

      if (newIndex < currentIndex) {
        toast.error("Bạn không thể quay lại phần thi trước");
        return;
      }

      // Can only access if previous sections are completed
      for (let i = 0; i < currentIndex; i++) {
        const prevSection = sectionOrder[i];
        if (sections[prevSection] && sections[prevSection].length > 0 && !isSectionComplete(prevSection)) {
          toast.error("Vui lòng hoàn thành tất cả câu hỏi của phần hiện tại trước");
          return;
        }
      }
    }

    // Update session with new section and reset section timer
    const sessionData = JSON.parse(sessionStorage.getItem(SESSION_EXAM_KEY));
    const updatedSession = {
      ...sessionData,
      currentSection: newSection,
      sectionStartTime: moment(new Date()),
    };
    sessionStorage.setItem(SESSION_EXAM_KEY, JSON.stringify(updatedSession));
    setSessionExam(updatedSession);

    setCurrentSection(newSection);
  };

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

  // Handle section timeout - auto move to next section
  const handleSectionTimeout = () => {
    const sectionOrder = getSectionOrder();
    const currentIndex = sectionOrder.indexOf(currentSection);

    if (currentIndex < sectionOrder.length - 1) {
      const nextSection = sectionOrder[currentIndex + 1];
      toast.warning(`⏰ Hết thời gian phần ${currentSection === 'LISTENING' ? 'Nghe' : currentSection === 'READING' ? 'Đọc' : 'Viết'}! Chuyển sang phần tiếp theo.`);
      handleSectionChange(nextSection, true); // Force change when section times out
    } else {
      // Last section, submit exam immediately without forced submit flow
      confirmSubmit(true);
    }
  };

  // Find first unanswered question in current section
  const findFirstUnansweredQuestion = () => {
    for (const q of sectionQuestionList) {
      if (q.type === "DL" && Array.isArray(q.subQuestions)) {
        for (const sq of q.subQuestions) {
          if (answers[sq.question] === undefined || answers[sq.question] === "") {
            return sq;
          }
        }
        continue;
      }
      if (answers[q.question] === undefined || answers[q.question] === '' ||
        (Array.isArray(answers[q.question]) && answers[q.question].length === 0)) {
        return q;
      }
    }
    return null;
  };

  // Handle continue to next section or final submit when on last section
  const handleContinue = () => {
    const unansweredQuestion = findFirstUnansweredQuestion();

    if (unansweredQuestion && modeParam === "testing") {
      toast.error("Vui lòng hoàn thành tất cả các câu hỏi trước khi chuyển sang phần tiếp theo");
      const el = document.getElementById(unansweredQuestion.question);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (unansweredQuestion && modeParam !== "testing") {
      toast.info("Chế độ luyện thi: Có thể chuyển tiếp khi chưa hoàn thành hết câu hỏi");
    }

    const sectionOrder = getSectionOrder();
    const currentIndex = sectionOrder.indexOf(currentSection);

    if (currentIndex < sectionOrder.length - 1) {
      const nextSection = sectionOrder[currentIndex + 1];
      handleSectionChange(nextSection, true);
      return;
    }

    // Nếu đang ở section cuối cùng (hoặc chỉ duy nhất section được chọn), bấm tiếp tục => mở nộp
    confirmSubmit();
  };

  // Handle prevent audio seeking in testing mode
  const handleAudioLoadedMetadata = (e) => {
    const audio = e.currentTarget;
    setLastAudioTime(audio.currentTime);
  };

  const handleAudioTimeUpdate = (e) => {
    const audio = e.currentTarget;
    if (modeParam === "testing") {
      const timeDiff = Math.abs(audio.currentTime - lastAudioTime);
      // If difference is more than 1 second, user tried to seek
      if (timeDiff > 1) {
        audio.currentTime = lastAudioTime;
        toast.error("Bạn không thể tua audio trong chế độ kiểm tra");
      }
      setLastAudioTime(audio.currentTime);
    }
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

  const confirmSubmit = async (force = false) => {
    // Final check: ensure all questions are answered unless forced timeout submit
    if (!force) {
      for (const q of allQuestions) {
        if (answers[q.question] === undefined || answers[q.question] === '' ||
          (Array.isArray(answers[q.question]) && answers[q.question].length === 0)) {
          toast.error("Vui lòng hoàn thành tất cả các câu hỏi trước khi nộp bài");
          setShowSubmitModal(false);
          return;
        }
      }
    } else {
      const incomplete = allQuestions.some((q) =>
        answers[q.question] === undefined || answers[q.question] === '' ||
        (Array.isArray(answers[q.question]) && answers[q.question].length === 0)
      );
      if (incomplete) {
        toast.warning("Ghi chú: bài thi sẽ được nộp tự động mặc dù một số câu chưa được trả lời.");
      }
    }

    try {
      setLoadingAPI(true);
      const savedAnswers = sessionStorage.getItem("exam-answers");
      const examCompledTime = sessionStorage.getItem("exam_completing_time");
      const res = await postTest(id, {
        userAnswers: JSON.parse(savedAnswers) || {},
        examCompledTime: JSON.parse(examCompledTime),
        examId: id,
        access: examData.access,
        selectedSections: visibleSections,
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
    // Check if all questions in the entire exam are answered
    for (const q of allQuestions) {
      if (answers[q.question] === undefined || answers[q.question] === '' ||
        (Array.isArray(answers[q.question]) && answers[q.question].length === 0)) {
        toast.error("Vui lòng hoàn thành tất cả các câu hỏi trước khi nộp bài");
        // Scroll to unanswered question and navigate to that section
        const el = document.getElementById(q.question);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
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

    // Word Arrangement: detect "/" in question content
    const questionText = current.contentQuestions || current.question || "";
    if (questionText.includes("/") && current.type === "WR") {
      const parts = questionText.split("/").map(p => p.trim()).filter(p => p.length > 0);
      const answerKey = current.question;
      const currentArrangement = answers[answerKey] || [];
      const selectedSet = new Set(
        Array.isArray(currentArrangement) ? currentArrangement : []
      );

      return (
        <div className="space-y-4">
          {/* No question text display for WA - only word tiles and arrangement area */}
          <div className="flex flex-wrap gap-2">
            {parts.map((part, idx) => {
              const isSelected = selectedSet.has(idx);
              return (
                <button
                  key={idx}
                  onClick={() => {
                    const newArrangement = Array.isArray(currentArrangement)
                      ? [...currentArrangement]
                      : [];
                    if (isSelected) {
                      // Unselect: remove from arrangement
                      handleAnswerChange(
                        answerKey,
                        newArrangement.filter(i => i !== idx)
                      );
                    } else {
                      // Select: add to arrangement
                      newArrangement.push(idx);
                      handleAnswerChange(answerKey, newArrangement);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold border-2 transition-all ${isSelected
                      ? "bg-red-100 border-red-500 text-red-700"
                      : "bg-white border-gray-300 text-gray-800 hover:border-red-400"
                    }`}
                >
                  {part}
                </button>
              );
            })}
          </div>

          {/* Arrangement result area */}
          <div className="border-2 border-gray-300 rounded-lg p-4 min-h-[60px] bg-gray-50">
            <p className="text-sm text-gray-600 mb-2">Sắp xếp lại:</p>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(currentArrangement) && currentArrangement.length > 0 ? (
                currentArrangement.map((idx, pos) => (
                  <span key={pos} className="px-3 py-2 bg-red-100 border border-red-400 rounded text-red-800 font-medium">
                    {parts[idx]}
                  </span>
                ))
              ) : (
                <span className="text-gray-400 italic">Chọn các từ để sắp xếp</span>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500">
            * Click vào từ để thêm, click lại để loại bỏ
          </p>
        </div>
      );
    }

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
        // left panel text/image
        const leftText = current.contentQuestions || current.contentQuestion || current.question || "";
        const leftImage = current.imageUrl;
        const hasLeft = leftText || leftImage;
        return (
          <div className="flex flex-col lg:flex-row gap-4">
            {/* left side with text and/or image */}
            <div className="w-full lg:w-1/3 p-2 border rounded-lg flex flex-col items-center justify-center">
              {hasLeft ? (
                <>
                  {leftText && (
                    <div className="mb-2 text-gray-800">
                      <MathRenderer content={leftText} />
                    </div>
                  )}
                  {leftImage && (
                    <img
                      src={leftImage}
                      alt="matching-context"
                      className="max-w-full h-auto rounded-lg border border-gray-200"
                    />
                  )}
                </>
              ) : (
                <div className="text-gray-400 italic">Không có dữ liệu</div>
              )}
            </div>

            {/* right side: answer inputs */}
            <div className="flex-1 space-y-3">
              {matchItems.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                  <div className="font-semibold text-red-600">{item.id || idx + 1}.</div>
                  <div className="flex-1 flex justify-center">
                    <input
                      type="text"
                      className="border rounded p-2 w-16 text-center font-bold uppercase mx-auto self-center"
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
                  </div>
                  <div className="flex-1">
                    <MathRenderer content={item.content} />
                  </div>
                </div>
              ))}
              <p className="text-sm text-gray-500 italic mt-2">
                * Nhập ký tự tương ứng với đáp án ghép nối
              </p>
            </div>
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
            // For True/False questions (DS/TN), use radio button style (circle)
            const isTrueFalseQuestion = ["DS", "TN"].includes(current.type);
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
                  className={`mt-1 w-6 h-6 ${isTrueFalseQuestion ? "rounded-full" : "rounded-md"} border-2 flex items-center justify-center flex-shrink-0 transition-colors
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

  // Check Helper
  const isSelected = (questionKey, val) => {
    const currentAns = answers[questionKey];
    return currentAns === val;
  };

  if (loading || !examData) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative text-base md:text-lg">
      {/* Testing Mode Banner */}
      {modeParam === "testing" && (
        <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-center gap-2 font-semibold">
          <span>🔒</span>
          <span>Chế độ kiểm tra - Bạn phải hoàn thành từng phần theo thứ tự</span>
        </div>
      )}

      <div className="flex-1 max-w-[1920px] mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-8">
        {/* LEFT COLUMN: Question Area */}
        <div className="flex-1 w-full lg:min-w-0">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10 min-h-[85vh] flex flex-col relative overflow-hidden">
            <div className="flex flex-col gap-6 flex-1">
              {/* Section Tabs with Time Allocation Info — LISTENING first */}
              <div className="space-y-4">
                <div className="flex gap-4 mb-4 flex-wrap">
                  {visibleSections.map((sec) => {
                    const isAccessible = canAccessSection(sec);
                    const isComplete = isSectionComplete(sec);
                    const hasQuestions = (sections[sec] || []).length > 0;

                    return (
                      <button
                        key={sec}
                        onClick={() => handleSectionChange(sec)}
                        disabled={!isAccessible && modeParam === "testing"}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors relative
                          ${currentSection === sec
                            ? 'bg-red-600 text-white'
                            : isAccessible
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                          }`}
                        title={!isAccessible && modeParam === "testing" ? "Phần này chưa có thể truy cập" : ""}
                      >
                        <span className="flex items-center gap-2">
                          {sec === 'READING' ? 'Đọc' : sec === 'LISTENING' ? 'Nghe' : 'Viết'}
                          {modeParam === "testing" && hasQuestions && (
                            <span className={`w-2 h-2 rounded-full ${isComplete ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Audio Player for LISTENING section - show at top */}
              {currentSection === 'LISTENING' && examData?.audioUrl && (
                <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-3">🔊 Nghe audio và điền đáp án:</p>
                  <audio

                    controls
                    className="w-full"
                    key={examData.audioUrl}
                    controlsList="nodownload"
                    onLoadedMetadata={handleAudioLoadedMetadata}
                    onTimeUpdate={handleAudioTimeUpdate}
                  >
                    <source src={examData.audioUrl} type="audio/mpeg" />
                    Trình duyệt của bạn không hỗ trợ thẻ audio.
                  </audio>
                  {modeParam === "testing" && (
                    <p className="text-xs text-blue-700 mt-2 italic">⚠️ Chế độ kiểm tra: Không được phép tua audio</p>
                  )}
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

                      // ── DL (Gap Filling) : split-view passage + 10 sub-questions ──
                      if (q.type === "DL" && Array.isArray(q.subQuestions)) {
                        const dlStartIdx = allQuestions.indexOf(q.subQuestions[0]);
                        const dlStartNum = dlStartIdx + 1;
                        const dlEndNum = dlStartIdx + q.subQuestions.length;
                        rendered.push(
                          <div key={q.question} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="flex flex-col lg:flex-row" style={{ height: "78vh" }}>
                              {/* LEFT — Reading Passage (sticky scroll) */}
                              <div className="w-full lg:w-1/2 bg-blue-50 border-r border-gray-200 p-6 overflow-y-auto">
                                <p className="text-xs font-bold uppercase text-red-600 tracking-wide mb-4 flex items-center gap-1">
                                  Bài đọc ({dlStartNum}–{dlEndNum})
                                </p>
                                <div className="text-gray-800 leading-relaxed whitespace-pre-wrap text-base font-medium">
                                  {q.contentQuestions}
                                </div>
                              </div>
                              {/* RIGHT — Sub-questions */}
                              <div className="w-full lg:w-1/2 p-6 overflow-y-auto space-y-5 bg-white">
                            
                                {q.subQuestions.map((sq) => (
                                  <div key={sq.question} id={sq.question} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                                    <div className="flex items-start gap-2 mb-3">
                                      <span className="font-bold text-red-600 flex-shrink-0 text-base">{sq.question}.</span>
                                      <span className="text-gray-800 text-base leading-relaxed">{sq.contentQuestions}</span>
                                    </div>
                                    <div className="space-y-2">
                                      {["A", "B", "C", "D"].map((opt) => {
                                        const optContent = sq[`contentAnswer${opt}`];
                                        if (!optContent) return null;
                                        const isChecked = answers[sq.question] === opt;
                                        return (
                                          <div
                                            key={opt}
                                            onClick={() => handleAnswerChange(sq.question, opt)}
                                            className={`cursor-pointer p-3 rounded-xl border-2 flex items-center gap-3 transition-all duration-200 ${isChecked
                                                ? "border-red-500 bg-red-50/80 shadow-sm"
                                                : "border-gray-100 bg-white hover:border-red-200 hover:bg-red-50/30"
                                              }`}
                                          >
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isChecked ? "bg-red-500 border-red-500" : "border-gray-300"
                                              }`}>
                                              {isChecked && <CheckCircle2 className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className={`text-sm ${isChecked ? "text-red-900 font-semibold" : "text-gray-700"}`}>
                                              <span className="font-bold mr-1 text-red-600">{opt}.</span>
                                              {optContent}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                        i++;
                      } else if (q.type === "MT" && q.matchGroup) {
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
                        const allMtOptions = Array.isArray(firstQ.mtOptions) ? firstQ.mtOptions : [];
                        const hasMtOptions = allMtOptions.length > 0;
                        const showOptionList = allMtOptions.length > group.length;

                        if (hasMtOptions) {
                          // MT Reading with propositions: text+image left, propositions+inputs right
                          const leftText = firstQ.contentQuestions || "";
                          const hasLeftContent = leftText || firstQ.imageUrl;
                          rendered.push(
                            <div key={firstQ.question} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm h-full">
                              {/* Split Layout: Left=Text+Image, Right=Propositions+Inputs */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">
                                {/* LEFT: Text and/or Image merged */}
                                <div className="bg-gray-50 border-r border-gray-200 p-8 flex flex-col justify-between items-start h-full gap-4">
                                  {hasLeftContent ? (
                                    <>
                                      {leftText && (
                                        <div className="mb-4 text-gray-800 leading-relaxed font-medium text-left w-full">
                                          <MathRenderer content={leftText} />
                                        </div>
                                      )}
                                      {firstQ.imageUrl && (
                                        <img
                                          src={firstQ.imageUrl}
                                          alt="reading-context"
                                          className="max-w-full h-auto rounded-lg border border-gray-200"
                                        />
                                      )}
                                    </>
                                  ) : (
                                    <div className="text-gray-400 italic text-center">Không có dữ liệu</div>
                                  )}
                                </div>

                                {/* RIGHT: Propositions + answer inputs */}
                                <div className="p-6 h-full gap-2 text-base">
                                  {showOptionList && (
                                    <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-white">
                                      <div className="text-sm font-semibold text-gray-700 mb-2">Danh sách lựa chọn</div>
                                      {allMtOptions.map((opt, i) => (
                                        <div key={`opt-${i}`} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
                                          <span className="w-6 font-bold text-red-600">{String.fromCharCode(65 + i)}.</span>
                                          <span>{opt}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <div className="flex flex-col justify-between h-full gap-2">
                                    {group.map((subQ, idx) => {
                                      const propText = !showOptionList ? allMtOptions[idx] || "" : "";
                                      return (
                                        <div key={subQ.question} className="flex flex-col gap-2 p-2 rounded hover:bg-red-50/30 transition-colors">
                                          <div className="flex flex-wrap gap-2 items-center">
                                            <span className="text-base font-bold text-red-600 whitespace-nowrap">
                                              {subQ.question}.
                                            </span>
                                            {propText && (
                                              <div className="text-base text-gray-700 leading-relaxed flex-1">
                                                <MathRenderer content={propText} />
                                              </div>
                                            )}
                                          </div>
                                          <input
                                            type="text"
                                            maxLength={1}
                                            className={`border-2 rounded-lg p-1 w-20 text-center font-bold uppercase text-base transition-colors ${answers[subQ.question]
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
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          // MT without propositions (old format): align layout with MT with propositions
                          const leftText = firstQ.contentQuestions || "";
                          const hasLeftContent = leftText || firstQ.imageUrl;
                          rendered.push(
                            <div key={firstQ.question} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm h-full">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">
                                {/* LEFT: Text and/or Image merged */}
                                <div className="bg-gray-50 border-r border-gray-200 p-8 flex flex-col justify-between items-start h-full gap-4">
                                  {hasLeftContent ? (
                                    <>
                                      {leftText && (
                                        <div className="mb-4 text-gray-800 leading-relaxed font-medium text-left w-full">
                                          <MathRenderer content={leftText} />
                                        </div>
                                      )}
                                      {firstQ.imageUrl && (
                                        <img
                                          src={firstQ.imageUrl}
                                          alt="matching"
                                          className="max-w-full h-auto rounded-lg border border-gray-200"
                                        />
                                      )}
                                    </>
                                  ) : (
                                    <div className="text-gray-400 italic text-center">Không có dữ liệu</div>
                                  )}
                                </div>

                                {/* RIGHT: Inputs in card list like MT with propositions */}
                                <div className="p-6 flex flex-col justify-between h-full gap-2 text-base">
                                  {group.map((subQ) => (
                                    <div key={subQ.question} id={subQ.question} className="flex flex-col gap-2 p-2 border border-gray-200 rounded-lg bg-white">
                                      <div className="text-2xl font-extrabold text-red-600 tracking-tight">
                                        {subQ.question}.
                                      </div>
                                      <input
                                        type="text"
                                        maxLength={1}
                                        className={`border-2 rounded-lg p-2 w-24 text-center font-extrabold uppercase text-base transition-colors ${answers[subQ.question]
                                            ? "border-red-500 bg-red-50 text-red-700"
                                            : "border-gray-300 focus:border-red-500"
                                          } focus:outline-none`}
                                        placeholder="A-F"
                                        value={typeof answers[subQ.question] === "string" ? answers[subQ.question] : ""}
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
                        if (q.type === "Matching") {
                          // matching handled inside renderQuestion which already
                          // contains its own header/left panel so avoid duplicate
                          rendered.push(
                            <div key={i} id={q.question} className="p-4 border rounded-lg">
                              {renderQuestion(q)}
                            </div>
                          );
                          i++;
                        } else {
                          const globalNum = allQuestions.indexOf(q) + 1;
                          rendered.push(
                            <div key={i} id={q.question} className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xl md:text-2xl font-bold text-red-600">{globalNum > 0 ? `Câu ${globalNum}` : q.question}</span>
                              </div>
                              {q.imageUrl && (
                                <div className="mb-3 flex justify-center">
                                  <img src={q.imageUrl} alt={q.question} className="max-w-full h-56 object-contain rounded-lg" />
                                </div>
                              )}
                              {q.contentQuestions && !(q.type === 'WR' && q.contentQuestions.includes("/")) && (
                                <div className="mb-4 text-gray-800 leading-relaxed text-lg md:text-xl break-words">
                                  <MathRenderer content={q.contentQuestions} />
                                </div>
                              )}
                              <div className="border-t border-gray-100 pt-4">
                                <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-red-600" />
                                  {q.type === 'WR' && (q.contentQuestions || "").includes("/") ? 'Sắp xếp lại câu:' : q.type === 'WR' ? 'Nhập đáp án:' : 'Chọn đáp án:'}
                                </h3>
                                {renderQuestion(q)}
                              </div>
                            </div>
                          );
                          i++;
                        }
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
                  <Countdown exam={sessionExam} onComplete={handleSubmit} currentSection={currentSection} onSectionTimeout={handleSectionTimeout} />
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
                  onClick={currentSection === 'WRITING' ? handleSubmit : handleContinue}
                  disabled={loadingAPI}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold mb-5 py-3 px-4 rounded-xl shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAPI ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      {currentSection === 'WRITING' ? 'Nộp bài thi' : 'Tiếp tục'} <CheckCircle2 size={18} />
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
                  <Countdown exam={sessionExam} onComplete={handleSubmit} currentSection={currentSection} onSectionTimeout={handleSectionTimeout} />
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
                  onClick={currentSection === 'WRITING' ? handleSubmit : handleContinue}
                  disabled={loadingAPI}
                  className="w-full bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-transform"
                >
                  {loadingAPI ? "Đang nộp..." : (currentSection === 'WRITING' ? "Nộp bài" : "Tiếp tục")}
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
