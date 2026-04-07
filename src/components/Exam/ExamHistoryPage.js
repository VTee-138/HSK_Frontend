/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { History, Calendar, Clock, ChevronRight, BarChart2, ArrowLeft } from "lucide-react"; // Icons
import moment from "moment";
import { getExamHistory } from "../../services/TestService";
import { getExamDetail } from "../../services/ExamService";
import Loading from "../Loading";

const ExamHistoryPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [examData, setExamData] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [resHistory, resExam] = await Promise.all([
                getExamHistory(id),
                getExamDetail(id)
            ]);
            // debug: inspect API responses in browser console
            // eslint-disable-next-line no-console
            console.log('[fetchData] resHistory:', resHistory, 'resExam:', resExam);
            setHistory(resHistory?.data || []);
            
            let examData = resExam?.data;
            // Normalize audio URL if it's relative (from DB)
            if (examData && examData.audioUrl && !examData.audioUrl.startsWith("http")) {
              const baseUrl = process.env.REACT_APP_API_BASE_URL?.replace("/api/v2", "") || "http://localhost:4000";
              examData.audioUrl = `${baseUrl}${examData.audioUrl}`;
            }
            setExamData(examData);

        } catch (error) {
            console.error("Error fetching history:", error);
            const message = error?.response?.data?.message || "Không thể tải lịch sử làm bài";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    if(loading) return <Loading />;
    if(!examData) return <div className="p-10 text-center">Không tìm thấy thông tin đề thi</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
             <div className="max-w-5xl mx-auto">
                <button 
                    onClick={() => navigate(`/exam/${id}`)}
                    className="flex items-center gap-2 text-gray-500 hover:text-red-600 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" /> 
                    Quay lại đề thi
                </button>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                     <div>
                         <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                            Lịch sử làm bài
                         </h1>
                         <p className="text-gray-600 text-lg">{examData.title?.text || examData.title}</p>
                     </div>
                     <div className="bg-white px-5 py-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                         <div className="p-2 bg-red-50 rounded-lg text-red-600">
                             <BarChart2 className="w-6 h-6" />
                         </div>
                         <div>
                             <p className="text-xs text-gray-500 uppercase font-semibold">Tổng số lần thi</p>
                             <p className="text-xl font-bold text-gray-900">{history.length} lần</p>
                         </div>
                     </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {history.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg">Bạn chưa làm bài thi này lần nào.</p>
                            <button 
                                onClick={() => navigate(`/exam/test/${id}`)}
                                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            >
                                Bắt đầu thi ngay
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm uppercase tracking-wider">
                                        <th className="p-4 font-semibold text-center w-20">#</th>
                                        <th className="p-4 font-semibold">Đề thi</th>
                                        <th className="p-4 font-semibold">Thời gian nộp</th>
                                        <th className="p-4 font-semibold text-center">Điểm số</th>
                                        <th className="p-4 font-semibold text-center hidden md:table-cell">Kết quả</th>
                                        <th className="p-4 font-semibold text-center hidden md:table-cell">Thời gian làm</th>
                                        <th className="p-4 font-semibold text-right">Chi tiết</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {history.map((item, index) => {
                                        return (
                                            <tr key={item._id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="p-4 text-center font-medium text-gray-400">
                                                    {index + 1}
                                                </td>

                                                <td className="p-4 font-medium text-gray-900">
                                                    {examData.title?.text || examData.title}
                                                </td>
                                                
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-gray-100 text-gray-500 group-hover:bg-white group-hover:shadow-sm transition">
                                                            <Calendar className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {moment(item.createdAt).format("DD/MM/YYYY")}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {moment(item.createdAt).format("HH:mm")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                
                                                <td className="p-4 text-center">
                                                    <span className={`
                                                        inline-block px-3 py-1 rounded-lg font-bold text-sm
                                                        ${Number((item.total_score ?? item.totalScore ?? item.score) || 0) >= 8 ? 'bg-green-100 text-green-700' : 
                                                          Number((item.total_score ?? item.totalScore ?? item.score) || 0) >= 5 ? 'bg-yellow-100 text-yellow-700' : 
                                                          'bg-red-50 text-red-600'}
                                                    `}>
                                                        {(() => {
                                                            const score = item.total_score ?? item.totalScore ?? item.score;
                                                            return (score !== undefined && score !== null) ? score : 'N/A';
                                                        })()}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center hidden md:table-cell">
                                                    <div className="text-sm text-gray-600 font-medium">
                                                        {(item.numberOfCorrectAnswers ?? item.correctCount ?? 0)}/{(examData.questions || []).reduce((t, q) => q.type === "DL" && Array.isArray(q.subQuestions) ? t + q.subQuestions.length : t + 1, 0) || examData.numberOfQuestions} câu đúng
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center hidden md:table-cell">
                                                    <div className="flex items-center justify-center gap-1 text-gray-500 text-sm">
                                                        <Clock className="w-4 h-4" />
                                                        {Math.floor(item.examCompledTime / 60)}p {item.examCompledTime % 60}s
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button 
                                                        onClick={() => navigate(`/exam/result/${id}?resultId=${item._id}`)}
                                                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors text-sm"
                                                    >
                                                        Xem lại <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
             </div>
        </div>
    );
};

export default ExamHistoryPage;
