import React from "react";
import {
  Clock,
  Calendar,
  HelpCircle,
  FileText,
  User,
  ChevronRight,
  Code,
} from "lucide-react";

const ExamInfo = ({ handleStartExam, handleViewHistory, examData }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md w-full mx-auto font-sans shadow-sm">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
          {examData?.title?.text}
        </h1>

        {/* Exam Code */}
        <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
          <Code className="w-4 h-4 text-gray-500" />
          <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Mã đề:</span>
          <span className="font-mono font-bold text-gray-900 text-sm">
            {examData?._id}
          </span>
        </div>
      </div>

      {/* Exam Details */}
      <div className="space-y-3 mb-6">
        {/* Test Duration */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-md shadow-sm">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-gray-600 text-sm font-medium">Thời gian</span>
          </div>
          <span className="font-bold text-gray-900 text-sm">
            {examData?.time === 0 ? "Không giới hạn" : `${examData?.time ?? 60} phút`}
          </span>
        </div>

        {/* Entry Time */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white rounded-md shadow-sm">
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-gray-600 text-sm font-medium">Hạn vào thi</span>
          </div>
          <span className="font-bold text-green-600 text-sm">
            Tự do
          </span>
        </div>

        {/* Number of Questions */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white rounded-md shadow-sm">
              <HelpCircle className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-gray-600 text-sm font-medium">Số câu hỏi</span>
          </div>
          <span className="font-bold text-gray-900 text-sm">
            {(examData?.questions || []).reduce((t, q) => q.type === "DL" && Array.isArray(q.subQuestions) ? t + q.subQuestions.length : t + 1, 0) || examData?.numberOfQuestions} câu
          </span>
        </div>

        {/* Test Type */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white rounded-md shadow-sm">
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-gray-600 text-sm font-medium">Phân loại</span>
          </div>
          <span className="font-bold text-gray-900 text-sm">
            {examData?.type}
          </span>
        </div>

        {/* Total Attempts */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white rounded-md shadow-sm">
              <User className="w-4 h-4 text-teal-600" />
            </div>
            <span className="text-gray-600 text-sm font-medium">
              Lượt thi
            </span>
          </div>
          <span className="font-bold text-gray-900 text-sm">
            {examData?.numberOfTest || 0}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
          <button
            onClick={handleStartExam}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-lg transform active:scale-[0.98]"
          >
            <span>Bắt đầu làm bài</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleViewHistory}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm"
          >
            <span>Xem lịch sử làm bài</span>
          </button>
      </div>
    </div>
  );
};

export default ExamInfo;
