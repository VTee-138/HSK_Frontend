/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Search, Filter } from "lucide-react";
import Loading from "../Loading";
import ExamCard from "./ExamCard";
import { getExam } from "../../services/ExamService";
import { Stack } from "@mui/material";
import PaginationCustom from "../PaginationCustom";

const TYPES = ["ALL", "HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6"];
const STATUSES = [
  { value: "ALL", label: "Tất cả" },
  { value: "DONE", label: "Đã làm" },
  { value: "NOT_DONE", label: "Chưa làm" },
];

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);

  // Filter States
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const handleFetch = async () => {
    try {
      setLoading(true);
      const typeParam = selectedType === "ALL" ? "" : selectedType;
      const statusParam = selectedStatus === "ALL" ? "" : selectedStatus;

      const response = await getExam(page, 6, "", typeParam, statusParam);
      if (response) {
        setExams(response.data || []);
        setTotalPages(response?.totalPages || 0);
      }
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetch();
  }, [page, selectedType, selectedStatus]);

  const handleChangePage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleNextPage = () => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setPage((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="w-full space-y-8 pt-10">
      {loading && <Loading />}
      {/* Header Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              Danh sách đề thi
            </h1>
            <p className="text-gray-500 mt-2 text-sm md:text-base">
              Khám phá và thực hành với các đề thi chất lượng cao
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Type Filter */}
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Filter size={16} /> Phân loại
            </div>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedType(type);
                    setPage(1);
                  }}
                  className={`
                                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                ${
                                  selectedType === type
                                    ? "bg-red-600 text-white shadow-md shadow-red-200 ring-2 ring-red-100"
                                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                }
                            `}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-3">
              Trạng thái
            </div>
            <div className="flex flex-wrap gap-2 bg-gray-100 p-1.5 rounded-xl">
              {STATUSES.map((status) => (
                <button
                  key={status.value}
                  onClick={() => {
                    setSelectedStatus(status.value);
                    setPage(1);
                  }}
                  className={`
                                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                ${
                                  selectedStatus === status.value
                                    ? "bg-white text-red-600 shadow-sm font-bold"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                                }
                            `}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Exam Cards Grid */}
      <div className="space-y-8">
        {exams?.length === 0 && !loading ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-gray-300" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Không tìm thấy kết quả
            </h3>
            <p className="text-gray-500">Vui lòng thử lại với từ khóa khác</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 grid-rows-2 gap-6">
            {exams?.length > 0 &&
              exams?.map((item, index) => (
                <ExamCard key={item._id || index} item={item} />
              ))}
          </div>
        )}
      </div>

      <Stack
        sx={{
          width: "100%",
          margin: "0 auto",
        }}
        alignItems={"center"}
        justifyContent={"center"}
        className="mt-[30px]"
      >
        <PaginationCustom
          totalPage={totalPages}
          currentPage={page}
          handleChangePage={handleChangePage}
          handleNextPage={handleNextPage}
          handlePrevPage={handlePrevPage}
        ></PaginationCustom>
      </Stack>
    </div>
  );
};

export default Exams;
