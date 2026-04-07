import { Link } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Users,
  FileQuestion,
  Clock,
  ArrowRight,
} from "lucide-react";

const ExamCard = ({ item }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden h-full border border-gray-100 flex flex-col relative">
      <div className="absolute top-3 left-3 z-20">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-md border border-white/20 shadow-sm text-white
                ${
                  item?.access === "PUBLIC"
                    ? "bg-green-500/90"
                    : "bg-red-600/90"
                }
              `}
        >
          {item?.access === "PUBLIC" ? "Miễn phí" : "Pro"}
        </span>
      </div>

      {/* Content Container */}
      <div className="p-4 flex flex-col flex-1">
        {/* Status & Type Row */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <span
            className={`flex items-center gap-1 font-medium ${item?.active ? "text-green-600" : "text-gray-500"}`}
          >
            {item?.active ? <CheckCircle size={12} /> : <XCircle size={12} />}
            {item?.active ? "Đang mở" : "Đóng"}
          </span>
          <span className="font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
            {item?.type}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-900 text-sm mb-4 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
          {item?.title?.text}
        </h3>

        {/* Stats Grid - Cleaner Look */}
        <div className="grid grid-cols-2 gap-3 mb-4 mt-auto">
          <div className="flex items-center gap-2 text-gray-500">
            <Users size={14} />
            <span className="text-xs">{item?.numberOfTest || 0} lượt</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Clock size={14} />
            <span className="text-xs">{item?.time === 0 ? "∞" : `${item?.time || 0}p`}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <FileQuestion size={14} />
            <span className="text-xs">{(item?.questions || []).reduce((t, q) => q.type === "DL" && Array.isArray(q.subQuestions) ? t + q.subQuestions.length : t + 1, 0) || item?.numberOfQuestions || 0} câu</span>
          </div>
        </div>

        {/* Action Button */}
        <Link to={`/exam/${item?._id || ""}`}>
          <button className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg">
            <>
              Xem đề thi <ArrowRight size={16} />
            </>
          </button>
        </Link>
      </div>
    </div>
  );
};

export default ExamCard;
