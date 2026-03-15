/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from "react";
import moment from "moment";
import { toast } from "react-toastify";

const Countdown = ({ exam, onComplete, isTitle = false, currentSection = "LISTENING", onSectionTimeout }) => {
  const [remainingTime, setRemainingTime] = useState(null);
  const [completingTime, setCompletingTime] = useState(null);
  const hasChecked = useRef(false);
  const hasWarned5Min = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!exam) return;

    hasChecked.current = false;
    hasWarned5Min.current = false; // Reset cảnh báo 5 phút
    
    // Get current section time from skillTimes
    const skillTimes = exam.skillTimes || { listening: 0, reading: 0, writing: 0 };
    const sectionKey = currentSection.toLowerCase();
    // Use section time, if 0 or not set, use total exam time divided by 3 as default
    let sectionTime = skillTimes[sectionKey];

    const isUnlimited = exam.time <= 0;

    if (!isUnlimited) {
      if (!sectionTime || sectionTime <= 0) {
        sectionTime = Math.floor((exam.time || 0) / 3);
      }
    }
    
    const sectionStartTime = moment(exam.sectionStartTime || exam.start);
    const sectionEndTime = sectionStartTime.clone().add(sectionTime, "minutes");

    if (isUnlimited) {
      setRemainingTime(null);
      return;
    }

    const updateRemainingTime = () => {
      const now = moment();
      const diff = sectionEndTime.diff(now, "seconds");
      const timeLeft = Math.max(0, diff);

      setRemainingTime(timeLeft);
      sessionStorage.setItem("time-left", JSON.stringify(timeLeft * 1000));

      const elapsed = Math.max(0, now.diff(sectionStartTime, "seconds"));
      const fixedElapsed = Math.min(elapsed, sectionTime * 60);

      setCompletingTime(fixedElapsed);
      sessionStorage.setItem(
        "exam_completing_time",
        JSON.stringify(fixedElapsed * 1000)
      );

      // Cảnh báo khi còn 5 phút (300 giây)
      if (timeLeft <= 300 && timeLeft > 299 && !hasWarned5Min.current) {
        hasWarned5Min.current = true;
        toast.warning("⚠️ Còn 5 phút nữa là hết giờ! Không được bỏ sót câu hỏi nào vì bài thi sẽ tự động nộp khi hết thời gian.", {
          position: "top-center",
          autoClose: 10000, // Hiển thị 10 giây
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }

      if (timeLeft === 0 && !hasChecked.current) {
        hasChecked.current = true;
        
        // Check if there are more sections to go
        const sectionOrder = ['LISTENING', 'READING', 'WRITING'];
        const currentIndex = sectionOrder.indexOf(currentSection.toUpperCase());
        const hasNextSection = currentIndex < sectionOrder.length - 1;
        
        if (hasNextSection && onSectionTimeout) {
          // Move to next section instead of submitting
          onSectionTimeout();
        } else {
          // Last section or no onSectionTimeout provided, submit exam
          onCompleteRef.current?.();
        }
      }
    };

    updateRemainingTime();
    const intervalId = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(intervalId);
  }, [exam?._id, exam?.sectionStartTime, exam?.skillTimes, currentSection]);

  const formatTime = (seconds) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="flex items-center gap-2">
      {isTitle && (
        <span className="text-sm font-medium text-gray-400">
          Thời gian còn lại:
        </span>
      )}
      <span className={`font-mono tracking-widest ${remainingTime !== null && remainingTime <= 300 ? 'text-red-600 font-bold animate-pulse' : 'text-inherit'}`}>
          {remainingTime === null ? 'Không giới hạn' : formatTime(remainingTime)}
      </span>
      {remainingTime !== null && remainingTime <= 300 && (
        <span className="text-xs text-red-600 font-semibold animate-pulse">
          🔥 Hết giờ sắp tới!
        </span>
      )}
    </div>
  );
};

export default Countdown;
