/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getExamDetail } from "../../services/ExamService";
import {
  getPausedExam,
  deletePausedProgress,
} from "../../services/TestService";
import Loading from "../Loading";
import { checkJwtExistsAndExpired } from "../../services/AuthService";
import ConfirmModal from "../ConfirmModal";
import moment from "moment";
import {
  Clock,
  BookOpen,
  Layout,
  History,
  Play,
  BrainCircuit,
  Timer,
  Layers,
  Info,
  Settings,
  ChevronLeft,
} from "lucide-react";

const ExamDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [examData, setExamData] = useState(null);

  const [pausedExam, setPausedExam] = useState(null);

  useEffect(() => {
    const fetchPaused = async () => {
      if (checkJwtExistsAndExpired()) {
        try {
          const res = await getPausedExam(id);
          if (res && res.data) {
            setPausedExam(res.data);
          }
        } catch (e) {
          console.log(e);
        }
      }
    };
    fetchPaused();
  }, [id]);

  const handleResume = () => {
    if (!pausedExam || !examData) return;

    const elapsed = pausedExam.examCompletedTime || 0;

    const items = {
      _id: examData._id,
      time: examData.time,
      start: moment().subtract(elapsed, "seconds"),
    };

    sessionStorage.setItem("exam", JSON.stringify(items));
    sessionStorage.setItem(
      "exam-answers",
      JSON.stringify(pausedExam.userAnswers || {}),
    );
    sessionStorage.setItem("exam_completing_time", elapsed);

    sessionStorage.removeItem("current-question");

    const queryParams = new URLSearchParams({
      mode: mode,
      scope: scope,
      sections: scope === "sections" ? selectedSections.join(",") : "",
    }).toString();

    navigate(`/exam/test/${id}?${queryParams}`);
  };

  // Setting States
  const [mode, setMode] = useState("testing"); // 'testing' | 'training'
  const [scope, setScope] = useState("full"); // 'full' | 'sections'
  const [selectedSections, setSelectedSections] = useState([]);
  const [showStartModal, setShowStartModal] = useState(false);
  const [customTime, setCustomTime] = useState(0); // 0 means unlimited

  const handleFetch = async () => {
    try {
      setLoading(true);
      const responseExam = await getExamDetail(id);
      const data = responseExam?.data;
      if (data) {
        // Normalize audio URL if it's relative (from DB)
        if (data.audioUrl && !data.audioUrl.startsWith("http")) {
          const baseUrl = process.env.REACT_APP_API_BASE_URL?.replace("/api/v2", "") || "http://localhost:4000";
          data.audioUrl = `${baseUrl}${data.audioUrl}`;
        }
        setExamData(data);
        // Pre-select all sections if available
        if (data.questions && data.questions.length > 0) {
          const sections = [
            ...new Set(data.questions.map((q) => q.section).filter(Boolean)),
          ];
          setSelectedSections(sections);
        }
      }
    } catch (error) {
      console.log(" handleFetch ~ error:", error);
      const message = error?.response?.data?.message;
      toast.error(message);
      navigate(`/exam`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetch();
  }, [id]);

  // Force full scope for testing mode
  useEffect(() => {
    if (mode === "testing") {
      setScope("full");
    }
  }, [mode]);

  // Handle Browser Back Button to redirect to /exam
  useEffect(() => {
    const handlePopState = (event) => {
      // When back button is pressed, navigate to /exam regardless of history
      navigate("/exam");
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleStartExam = () => {
    if (checkJwtExistsAndExpired()) {
      if (scope === "sections" && selectedSections.length === 0) {
        toast.warn("Vui lòng chọn ít nhất một phần thi!");
        return;
      }
      setShowStartModal(true);
    } else {
      toast.error("Vui lòng đăng nhập để bắt đầu bài thi");
      navigate("/login");
    }
  };

  const confirmStartExam = async () => {
    // If there is a paused exam, we must delete it because we are starting NEW
    if (pausedExam) {
      try {
        await deletePausedProgress(id);
      } catch (error) {
        console.error("Failed to delete paused progress", error);
      }
    }

    const queryParams = new URLSearchParams({
      mode: mode,
      scope: scope,
      sections: scope === "sections" ? selectedSections.join(",") : "",
      ...(mode === "training" && customTime > 0 && { time: customTime }),
    }).toString();

    navigate(`/exam/test/${id}?${queryParams}`);
  };

  const handleViewHistory = () => {
    if (checkJwtExistsAndExpired()) {
      navigate(`/exam/history/${id}`);
    } else {
      toast.error("Vui lòng đăng nhập để xem lịch sử");
      navigate("/login");
    }
  };

  const toggleSection = (sectionId) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId],
    );
  };

  if (loading || !examData) return <Loading />;

  const availableSections = examData?.questions
    ? [
        ...new Set(examData.questions.map((q) => q.section).filter(Boolean)),
      ].map((sec) => ({ id: sec, name: sec }))
    : [];

  console.log("Exam Data:", examData);
  console.log("Questions:", examData.questions);
  console.log("Available Sections:", availableSections);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-[30px]">
      <div className="max-w-7xl mx-auto w-full">
        <button
          onClick={() => navigate("/exam")}
          className="mb-6 flex items-center gap-2 text-gray-500 hover:text-red-600 font-medium transition-colors w-fit group"
        >
          <div className="p-2 rounded-full bg-white border border-gray-200 group-hover:border-red-200 group-hover:bg-red-50 transition-colors">
            <ChevronLeft size={20} />
          </div>
          Quay lại danh sách
        </button>
        {/* Header Section */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-10 mb-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            <div className="w-full md:w-3/4">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-gray-400 text-sm font-medium flex items-center gap-1">
                  <Clock size={14} /> {examData.time} phút
                </span>
                <span className="text-gray-400 text-sm font-medium flex items-center gap-1">
                  <BookOpen size={14} /> {examData.numberOfQuestions} câu hỏi
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                {examData.title?.text || "Tiêu đề bài thi"}
              </h1>

              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {examData.type || "Exam"}
              </span>

              <div className="flex flex-wrap gap-4 pt-5">
                <button
                  onClick={handleViewHistory}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  <History size={18} /> Lịch sử làm bài
                </button>
              </div>
            </div>

            {/* Stats / Score Card (Optional) */}
            <div className="w-full md:w-1/4 bg-red-50/50 rounded-2xl p-5 border border-red-100">
              <div className="text-center">
                <div className="text-sm text-gray-500 font-medium mb-1">
                  Số lượt thi
                </div>
                <div className="text-3xl font-bold text-red-600">
                  {examData.numberOfTest || 0}
                </div>
              </div>
              <div className="my-4 border-t border-red-200/50"></div>
              <div className="text-center">
                <div className="text-sm text-gray-500 font-medium mb-1">
                  Kết quả tốt nhất
                </div>
                <div className="text-xl font-bold text-green-600">-</div>
                {/* Need API for best score or populate from history */}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Mode Selection */}
            <section>
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Settings className="text-red-600" size={24} /> Chế độ làm bài
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Testing Mode */}
                <div
                  onClick={() => setMode("testing")}
                  className={`
                                cursor-pointer relative p-6 rounded-2xl border-2 transition-all duration-300
                                ${
                                  mode === "testing"
                                    ? "border-red-500 bg-red-50/50 shadow-md ring-1 ring-red-500"
                                    : "border-gray-100 bg-white hover:border-red-200 hover:shadow-sm"
                                }
                            `}
                >
                  <div className="flex items-start justify-start mb-3 gap-3">
                    <div
                      className={`p-4 rounded-xl ${mode === "testing" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-500"}`}
                    >
                      <Timer size={24} />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-lg font-bold text-gray-900 mb-1">
                        Chế độ Kiểm tra
                      </h4>
                      <span className="text-sm text-gray-500">
                        Giới hạn thời gian, xem đáp án sau khi xong
                      </span>
                    </div>
                  </div>
                </div>

                {/* Training Mode */}
                <div
                  onClick={() => setMode("training")}
                  className={`
                                cursor-pointer relative p-6 rounded-2xl border-2 transition-all duration-300
                                ${
                                  mode === "training"
                                    ? "border-green-500 bg-green-50/50 shadow-md ring-1 ring-green-500"
                                    : "border-gray-100 bg-white hover:border-green-200 hover:shadow-sm"
                                }
                            `}
                >
                  <div className="flex items-start justify-start mb-3 gap-3">
                    <div
                      className={`p-4 rounded-xl ${mode === "training" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-500"}`}
                    >
                      <BrainCircuit size={24} />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-lg font-bold text-gray-900 mb-1">
                        Chế độ Luyện tập
                      </h4>
                      <span className="text-sm text-gray-500">
                        Không giới hạn thời gian, xem đáp án ngay
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Scope Selection */}
            <section>
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Layout className="text-red-600" size={24} /> Phạm vi bài thi
              </h3>

              <div className="bg-white rounded-2xl border border-gray-100 p-1">
                <div className="flex">
                  <button
                    onClick={() => setScope("full")}
                    className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-200
                                    ${scope === "full" ? "bg-red-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"}
                                `}
                  >
                    Full Test ({examData.numberOfQuestions} câu)
                  </button>
                  <button
                    onClick={() => setScope("sections")}
                    disabled={mode === "testing"}
                    className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-200
                                    ${scope === "sections" ? "bg-red-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"}
                                    ${mode === "testing" ? "opacity-50 cursor-not-allowed" : ""}
                                `}
                  >
                    Chọn phần thi (Sections)
                  </button>
                </div>
              </div>

              {/* Section Selector (Collapsible) */}
              {scope === "sections" && (
                <div className="mt-4 bg-white rounded-2xl border border-gray-200 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                  <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Layers size={18} /> Chọn các phần muốn thi:
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableSections.map((section) => (
                      <label
                        key={section.id}
                        className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${selectedSections.includes(section.id) ? "border-red-500 bg-red-50/30" : "border-gray-200"}`}
                      >
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                          checked={selectedSections.includes(section.id)}
                          onChange={() => toggleSection(section.id)}
                        />
                        <span
                          className={`font-medium ${selectedSections.includes(section.id) ? "text-red-700" : "text-gray-700"}`}
                        >
                          {section.name}
                        </span>
                      </label>
                    ))}
                  </div>
                  {availableSections.length === 0 && (
                    <p className="text-center text-gray-500 italic py-4">
                      Không tìm thấy thông tin các phần thi. Vui lòng chọn Full
                      Test.
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* 3. Time Selection for Training */}
            {mode === "training" && (
              <section>
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="text-red-600" size={24} /> Thời gian luyện tập
                </h3>
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={customTime}
                      onChange={(e) => {
                        let val = parseInt(e.target.value) || 0;
                        if (val > 0) {
                          val = Math.ceil(val / 5) * 5; // round up to nearest 5
                        }
                        setCustomTime(val);
                      }}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <span className="text-gray-600">phút (0 = không giới hạn)</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Thời gian sẽ được làm tròn lên số chia hết cho 5.</p>
                </div>
              </section>
            )}
          </div>

          {/* Sticky Action Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-br from-red-600 to-indigo-700 p-6 text-white text-center">
                  <h4 className="text-xl font-bold mb-2">Đã sẵn sàng?</h4>
                  <p className="text-red-100 text-sm">
                    {mode === "testing"
                      ? "Bạn sắp bắt đầu bài kiểm tra tính giờ."
                      : "Bạn sắp bắt đầu chế độ luyện tập."}
                  </p>
                </div>
                <div className="p-6">
                  <ul className="space-y-4 mb-6">
                    <li className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Chế độ:</span>
                      <span className="font-bold text-gray-900 capitalize">
                        {mode === "testing" ? "Kiểm tra" : "Luyện tập"}
                      </span>
                    </li>
                    <li className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Phạm vi:</span>
                      <span className="font-bold text-gray-900">
                        {scope === "full"
                          ? "Toàn bộ bài thi"
                          : `${selectedSections.length} phần thi`}
                      </span>
                    </li>
                    <li className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Thời gian:</span>
                      <span className="font-bold text-gray-900">
                        {mode === "testing"
                          ? `${examData.time} phút`
                          : customTime > 0 ? `${customTime} phút` : "Không giới hạn"}
                      </span>
                    </li>
                  </ul>

                  {pausedExam ? (
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={handleResume}
                        className="w-full group bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
                      >
                        Tiếp tục bài thi cũ{" "}
                        <Play className="w-5 h-5 fill-current" />
                      </button>
                      <button
                        onClick={handleStartExam}
                        className="w-full group bg-white border-2 border-red-600 text-red-600 hover:bg-red-50 font-bold py-3 px-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-3"
                      >
                        Bắt đầu bài thi mới
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleStartExam}
                      className="w-full group bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
                    >
                      Bắt đầu làm bài <Play className="w-5 h-5 fill-current" />
                    </button>
                  )}

                  <p className="text-center text-xs text-gray-400 mt-4">
                    <Info size={12} className="inline mr-1" />
                    Nhấn F11 để vào chế độ toàn màn hình
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showStartModal}
        onClose={() => setShowStartModal(false)}
        title="Bắt đầu làm bài?"
        message={`Bạn đang chuẩn bị bắt đầu bài thi với chế độ "${mode === "testing" ? "Kiểm tra" : "Luyện tập"}". Hãy đảm bảo kết nối mạng ổn định.`}
        actions={[
          {
            label: "Bắt đầu ngay",
            primary: true,
            onClick: confirmStartExam,
          },
          {
            label: "Hủy bỏ",
            secondary: true,
            onClick: () => setShowStartModal(false),
          },
        ]}
      />
    </div>
  );
};

export default ExamDetailPage;
