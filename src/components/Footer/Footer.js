import React from "react";
import { Facebook, Music } from "lucide-react";
import { Link } from "react-router-dom";
export default function Footer() {
  return (
    <footer className="bg-[#cd1628] text-white py-8 sm:py-12 mt-12 sm:mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="font-bold text-lg mb-4">LIÊN HỆ</h3>
            <div className="space-y-2 text-red-100 text-sm sm:text-base">
              <p className="flex items-start gap-2">
                <span className="mt-0.5">📧</span>
                <span>Email: 86HSK.contact@gmail.com</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="mt-0.5">📞</span>
                <span>Số điện thoại: 19001900</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="mt-0.5">🏢</span>
                <span>Trụ sở: 295 Thanh Nhàn, Hai Bà Trưng, Hà Nội</span>
              </p>
            </div>
            <div className="flex gap-3 mt-4">
              <Link
                to="https://www.facebook.com/86HSKedu"
                target="_blank"
                className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center hover:bg-blue-700 transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </Link>
              <Link
                to="https://www.facebook.com/groups/tsahsathpt.86HSK"
                target="_blank"
                className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </Link>
              <a
                href="/"
                className="w-8 h-8 bg-pink-600 rounded flex items-center justify-center hover:bg-pink-700 transition-colors"
              >
                <Music className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">DANH MỤC</h3>
            <div className="space-y-2 text-sm sm:text-base">
              <a
                href="#"
                className="block text-red-100 hover:text-white transition-colors"
              >
                Hướng dẫn mua hàng
              </a>
              <a
                href="#"
                className="block text-red-100 hover:text-white transition-colors"
              >
                Hướng dẫn thanh toán
              </a>
              <a
                href="#"
                className="block text-red-100 hover:text-white transition-colors"
              >
                Câu hỏi thường gặp
              </a>
            </div>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="font-bold text-lg mb-4">CHÍNH SÁCH ĐIỀU KHOẢN</h3>
            <div className="flex flex-col gap-2">
              <a
                href="#"
                className="text-red-100 hover:text-white transition-colors text-sm sm:text-base"
              >
                Điều khoản dịch vụ
              </a>
              <a
                href="#"
                className="text-red-100 hover:text-white transition-colors text-sm sm:text-base"
              >
                Chính sách bảo mật
              </a>
              <a
                href="#"
                className="text-red-100 hover:text-white transition-colors text-sm sm:text-base"
              >
                Chính sách thanh toán
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
