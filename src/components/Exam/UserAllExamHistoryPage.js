/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  History,
  Clock,
  ChevronRight,
  BarChart2,
  FileText,
  ChevronLeft,
} from "lucide-react";
import moment from "moment";
import { get } from "../../common/apiClient";
import Loading from "../Loading";
import UserSidebar from "../UserSidebar";

const UserAllExamHistoryPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const fetchHistory = async (page = 1) => {
    try {
      setLoading(true);
      const res = await get(`/exam-result/history/all?page=${page}&limit=5`);
      // debug: inspect API payload in browser console
      // eslint-disable-next-line no-console
      console.log("[fetchHistory] API response:", res);
      setHistory(res?.data || []);
      setPagination(res?.pagination);
    } catch (error) {
      console.error("Error fetching history:", error);
      const message =
        error?.response?.data?.message || "Không thể tải lịch sử làm bài";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchHistory(newPage);
    }
  };

  if (loading && history.length === 0) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <UserSidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="max-w-7xl mx-auto pl-[220px]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <History className="w-8 h-8 text-red-600" />
              Lịch sử thi của tôi
            </h1>
            <p className="text-gray-600">
              Theo dõi toàn bộ quá trình luyện tập của bạn
            </p>
          </div>
          <div className="bg-white px-5 py-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">
                Tổng lượt thi
              </p>
              <p className="text-xl font-bold text-gray-900">
                {pagination.total} lần
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px] flex flex-col">
          {history.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-12">
              <History className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg">Bạn chưa làm bài thi nào.</p>
              <button
                onClick={() => navigate(`/exam`)}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Khám phá đề thi
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm uppercase tracking-wider">
                      <th className="p-4 font-semibold text-center w-16">#</th>
                      <th className="p-4 font-semibold">Đề thi</th>
                      <th className="p-4 font-semibold">Thời gian nộp</th>
                      <th className="p-4 font-semibold text-center">Điểm số</th>
                      <th className="p-4 font-semibold text-center hidden md:table-cell">
                        Kết quả
                      </th>
                      <th className="p-4 font-semibold text-center hidden md:table-cell">
                        Thời gian làm
                      </th>
                      <th className="p-4 font-semibold text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((item, index) => {
                      const exam = item.examId || {};
                      return (
                        <tr
                          key={item._id}
                          className="hover:bg-gray-50 transition-colors group"
                        >
                          <td className="p-4 text-center font-medium text-gray-400">
                            {(pagination.page - 1) * 10 + index + 1}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-red-50 text-red-600 group-hover:bg-white group-hover:shadow-sm transition">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 line-clamp-1 max-w-[200px] md:max-w-xs">
                                  {typeof exam.title === 'object' 
                                    ? exam.title?.text || exam.title?.code || "Đề thi không xác định"
                                    : exam.title || "Đề thi không xác định"}
                                </p>
                                <p className="text-xs text-gray-500 bg-gray-100 inline-block px-1.5 py-0.5 rounded mt-1">
                                  {exam.type || "N/A"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              <p className="font-medium text-gray-900">
                                {moment(item.createdAt).format("DD/MM/YYYY")}
                              </p>
                              <p className="text-xs text-gray-500">
                                {moment(item.createdAt).format("HH:mm")}
                              </p>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span
                              className={`
                                                        inline-block px-3 py-1 rounded-lg font-bold text-sm
                                                        ${
                                                          (Number((item.total_score ?? item.totalScore ?? item.score) || 0)) >= 8
                                                            ? "bg-green-100 text-green-700"
                                                            : (Number((item.total_score ?? item.totalScore ?? item.score) || 0)) >=
                                                                5
                                                              ? "bg-yellow-100 text-yellow-700"
                                                              : "bg-red-50 text-red-600"
                                                        }
                                                    `}
                            >
                              {(() => {
                                const score = item.total_score ?? item.totalScore ?? item.score;
                                return (score !== undefined && score !== null) ? score : "N/A";
                              })()}
                            </span>
                          </td>
                          <td className="p-4 text-center hidden md:table-cell">
                            <div className="text-sm text-gray-600 font-medium">
                              {(item.numberOfCorrectAnswers ?? item.correctCount ?? 0)}/
                              {exam.numberOfQuestions ?? "?"}  câu
                            </div>
                          </td>
                          <td className="p-4 text-center hidden md:table-cell">
                            <div className="flex items-center justify-center gap-1 text-gray-500 text-sm">
                              <Clock className="w-4 h-4" />
                              {(() => {
                                // examCompledTime is already stored in *seconds* on the
                                // server, so we don't divide by 1000 again here. The
                                // previous code treated it as milliseconds which meant
                                // the value was nearly always 0 when displaying the list.
                                const durationInSeconds = item.examCompledTime || 0;
                                const minutes = Math.floor(durationInSeconds / 60);
                                const seconds = durationInSeconds % 60;
                                return `${minutes}p ${seconds}s`;
                              })()}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() =>
                                navigate(
                                  `/exam/result/${item.examId?._id || item.examId}?resultId=${item._id}`,
                                )
                              }
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors text-sm"
                            >
                              Xem lại <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="border-t border-gray-100 p-4 flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium text-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4" /> Trước
                  </button>

                  <span className="px-4 py-2 text-sm font-medium text-gray-700">
                    Trang {pagination.page} / {pagination.totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium text-gray-700"
                  >
                    Tiếp <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAllExamHistoryPage;
