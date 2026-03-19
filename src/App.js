import "./App.css";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

import { useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { get } from "./common/apiClient";
import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";
import GuestRoute from "./routes/GuestRoute";
import RouterWrapper from "./RouterWrapper";
import HomePage from "./components/HomePage/Homepage";
// import CoursesPage from "./components/Course/CoursesPage";
// import DocumentsPage from "./components/Documents/DocumentsPage";
// import ExamRoomsPage from "./components/ExamRoom/ExamRoomsPage";
// import CourseDetailPage from "./components/Course/CourseDetailPage";
// import DocumentDetailPage from "./components/Documents/DocumentDetailPage";
import ExamPage from "./components/Exam/ExamPage";
import ExamResultPage from "./components/Exam/ExamResult/ExamResultPage";
import CheckoutPage from "./components/Course/CheckoutPage";
import ExamHistoryPage from "./components/Exam/ExamHistoryPage";
import UserAllExamHistoryPage from "./components/Exam/UserAllExamHistoryPage";
import ExamDetailPage from "./components/Exam/ExamDetailPage";
import ExamTestPage from "./components/Exam/ExamTest/ExamTestPage";
import LoginForm from "./components/Auth/LoginForm";
import SignupForm from "./components/Auth/SignupForm";
import ProfilePage from "./components/Profile/ProfilePage";
import MyCourses from "./components/MyCourses/MyCourses";
import Dashboard from "./components/Dashboard/DashboardNew";
import { BlogsPage, BlogDetailPage } from "./components/Blog";
// import ContactPage from "./components/Contact/ContactPage";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RouterWrapper />}>
      <Route element={<PrivateRoute />}>
        {/* <Route path="/courses/:courseId" element={<CourseDetailPage />} /> */}
        {/* <Route path="/documents/:documentId" element={<DocumentDetailPage />} /> */}
        <Route path="/exam/result/:id" element={<ExamResultPage />} />
        <Route path="/exam/test/:id" element={<ExamTestPage />} />
        <Route path="/thanh-toan/:courseId" element={<CheckoutPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/my-courses" element={<MyCourses />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
      <Route element={<GuestRoute />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<SignupForm />} />
      </Route>
      <Route element={<PublicRoute />}>
        {/* <Route path="/courses" element={<CoursesPage />} /> */}
        {/* <Route path="/documents" element={<DocumentsPage />} /> */}
        <Route path="/exam" element={<ExamPage />} />
        <Route path="/exam/history/:id" element={<ExamHistoryPage />} />
        <Route path="/exam-history" element={<UserAllExamHistoryPage />} />
        <Route path="/exam/:id" element={<ExamDetailPage />} />
        <Route path="/blog" element={<BlogsPage />} />
        <Route path="/blog/:slug" element={<BlogDetailPage />} />
        {/* <Route path="/contact" element={<ContactPage />} /> */}
      </Route>
    </Route>
  )
);
function App() {
  const currentVersionRef = useRef(null);
  const VERSION_CHECK_INTERVAL_MS = 60 * 1000; // 1 minute

  useEffect(() => {
    let isMounted = true;

    const checkAppVersion = async () => {
      try {
        const res = await get("/version");
        const serverVersion = res?.version || "0.0.0";

        if (!isMounted) return;

        if (!currentVersionRef.current) {
          currentVersionRef.current = serverVersion;
          console.info("App version initialized", serverVersion);
          return;
        }

        if (serverVersion !== currentVersionRef.current) {
          console.info("New app version detected", serverVersion, "old", currentVersionRef.current);
          toast.info("Phát hiện phiên bản mới. Tự động nạp lại trang...");
          currentVersionRef.current = serverVersion;
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } catch (error) {
        console.warn("Không thể kiểm tra version", error);
      }
    };

    checkAppVersion();
    const interval = setInterval(checkAppVersion, VERSION_CHECK_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="App">
      <RouterProvider router={router} />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

export default App;
