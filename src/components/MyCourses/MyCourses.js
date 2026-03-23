import React, { useState, useEffect } from "react";
import {
  BookOpenText,
  Menu
} from "lucide-react";
import UserSidebar from "../UserSidebar";

import {
  getMyCourses,
  getUserInfoById,
} from "../../services/UserService";
import { toast } from "react-toastify";
import Loading from "../Loading";
import Footer from "../Footer/Footer";
import { Link } from "react-router-dom";
import { Stack, Typography } from "@mui/material";
import CourseCard from "../Course/CourseCard";
import PaginationCustom from "../PaginationCustom";

export default function MyCourses() {
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState([]);
  const [coursesData, setCoursesData] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const handleFetch = async () => {
      try {
        const response = await getUserInfoById();
        console.log(" handleFetch ~ response:", response);
        if (response && response.data) {
          const user = response.data;
          setUserInfo(user);
        }
      } catch (error) {
        console.log(error);
        const message = error?.response?.data?.message;
        toast.error(message);
      }
    };
    handleFetch();
  }, []);
  // Fetch courses
  useEffect(() => {
    const handleFetch = async () => {
      try {
        setLoading(true);
        const response = await getMyCourses(page, 6);
        console.log(" handleFetch ~ response:", response);
        if (response && response?.data) {
          const courses = response?.data?.map((item) => ({
            ...item.course,
            isBuy: true,
          }));
          setCoursesData(courses);
          setTotalPages(response?.totalPages);
        }
      } catch (error) {
        const message = error?.response?.data?.message;
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    handleFetch();
  }, [page]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Pagination handlers
  const handleChangePage = (page) => setPage(page);
  const handleNextPage = () => setPage(page + 1);
  const handlePrevPage = () => setPage(page - 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <UserSidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <main className="lg:ml-72 min-h-screen flex flex-col transition-all duration-300">
        <div className="flex-grow max-w-7xl mx-auto w-full py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:underline transition-colors">
              Trang chủ
            </Link>{" "}
            /{" "}
            <span className="text-gray-800 font-medium">Khóa học của tôi</span>
          </div>

          {/* Mobile Header Toggle */}
          <div className="lg:hidden flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Khóa học của tôi</h1>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-600"
            >
              <Menu size={24} />
            </button>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loading />
            </div>
          ) : (
            <>
              {/* Course Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-8">
                {coursesData.map((course) => (
                  <div
                    key={course.id}
                    className="transform hover:scale-105 transition-transform duration-200"
                  >
                    <CourseCard {...course} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {coursesData?.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <Stack
                    sx={{ width: "100%", margin: "0 auto" }}
                    alignItems={"center"}
                    justifyContent={"center"}
                  >
                    <PaginationCustom
                      totalPage={totalPages}
                      currentPage={page}
                      handleChangePage={handleChangePage}
                      handleNextPage={handleNextPage}
                      handlePrevPage={handlePrevPage}
                    />
                  </Stack>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <BookOpenText size={64} className="mx-auto" />
                  </div>
                  <Typography
                    fontSize={"20px"}
                    fontWeight={"500"}
                    color="text.secondary"
                  >
                    Không có khóa học nào được tìm thấy
                  </Typography>
                  <Typography
                    fontSize={"14px"}
                    color="text.secondary"
                    className="mt-2"
                  >
                    Hãy thử tìm kiếm với từ khóa khác hoặc chọn danh mục
                    khác
                  </Typography>
                </div>
              )}
            </>
          )}
        </div>
        <Footer />
      </main>
    </div>
  );
}
