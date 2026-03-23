import { useEffect, useState } from "react";

import { useLocation, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getCourseById } from "../../services/CourseService";
import Loading from "../Loading";
import { generateRandomNumber } from "../../common/Utils";
import Footer from "../Footer/Footer";
import { getUserInfo } from "../../services/AuthService";

export default function CheckoutPage() {
  const location = useLocation();
  const isDiscounted = location.state;
  const [loading, setLoading] = useState(false);
  const [courseData, setCourseData] = useState(null);
  const { courseId } = useParams();
  const randomUUID = generateRandomNumber();
  const [bankInfo, setBankInfo] = useState({
    bankCode: "VCB", // Mã ngân hàng, ví dụ: VCB, TCB, BIDV, ...
    bankName: "Ngân hàng TMCP Ngoại thương Việt Nam",
    accountNumber: "1018027178",
    accountName: "PHẠM VĂN TUẤN",
    amount: 2000,
    content: "DKHSA_0775796391 Pham Minh Tuan",
  });

  const [buyer] = useState({
    name: getUserInfo()?.username,
    email: getUserInfo()?.email,
  });

  useEffect(() => {  // eslint-disable-line react-hooks/exhaustive-deps
    const handleFetch = async () => {
      try {
        setLoading(true);
        const response = await getCourseById(courseId);
        if (response && response?.data) {
          const course = response?.data;
          const finalPrice = isDiscounted
            ? Math.round(
                course?.price * (1 - Math.abs(course?.discountPercent) / 100)
              )
            : course?.price;
          setBankInfo({
            ...bankInfo,
            amount: finalPrice,
            content: `${buyer.name} ${buyer.email} ${randomUUID}`,
          });
          setCourseData(course);
        }
      } catch (error) {
        const message = error?.response?.data?.message;
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    handleFetch();
  }, [courseId]);

  // Nội dung QR theo chuẩn VietQR (có thể tuỳ chỉnh theo ngân hàng)
  const qrUrl = `https://api.vietqr.io/image/${bankInfo.bankCode}-${
    bankInfo.accountNumber
  }-compact.png?amount=${bankInfo.amount}&addInfo=${encodeURIComponent(
    bankInfo.content
  )}`;
  if (loading) return <Loading />;
  return (
    <div>
      <div className="bg-[#f8fafc] min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Bước tiến trình */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-bold">GIỎ HÀNG</span>
              <span className="w-8 h-1 bg-green-600 rounded"></span>
              <span className="text-green-600 font-bold">THANH TOÁN</span>
              <span className="w-8 h-1 bg-gray-300 rounded"></span>
              <span className="text-gray-400 font-bold">HOÀN TẤT</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Thông tin chuyển khoản */}
            <div className="md:col-span-2 bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-bold text-[#cd1628] mb-4">
                Lựa chọn hình thức thanh toán
              </h2>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="radio"
                    checked
                    readOnly
                    className="accent-[#cd1628]"
                  />
                  <span className="font-semibold text-[#cd1628]">
                    Chuyển khoản Ngân hàng
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-[#cd1628]">
                  <div className="mb-2 text-gray-700">
                    Hãy sử dụng <b>"Nội dung chuyển khoản"</b> khi chuyển khoản
                    cho chúng tôi theo hướng dẫn phía dưới.
                    <br />
                    <span className="text-sm text-gray-500">
                      <b>Lưu ý:</b> Đơn hàng chỉ được xác nhận, bạn chỉ cần
                      chuyển khoản đúng số tiền và nội dung bên dưới.
                    </span>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 items-center mt-4">
                    <div>
                      <div className="mb-1 text-gray-700">
                        <b>Ngân hàng:</b> {bankInfo.bankName}
                      </div>
                      <div className="mb-1 text-gray-700">
                        <b>Số tài khoản:</b>{" "}
                        <span className="font-mono">
                          {bankInfo.accountNumber}
                        </span>
                      </div>
                      <div className="mb-1 text-gray-700">
                        <b>Chủ tài khoản:</b> {bankInfo.accountName}
                      </div>
                      <div className="mb-1 text-gray-700">
                        <b>Số tiền:</b>{" "}
                        <span className="text-[#cd1628] font-bold font-mono">
                          {bankInfo.amount.toLocaleString()} đ
                        </span>
                      </div>
                      <div className="mb-1 text-gray-700 flex flex-col">
                        <span>
                          <strong>Nội dung chuyển khoản</strong>:{" "}
                          <span className="font-mono text-[#cd1628] font-bold">
                            {bankInfo.content}
                          </span>
                        </span>{" "}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <img
                        src={qrUrl}
                        alt="QR chuyển khoản VietQR"
                        className="w-80 h-80 object-contain border-2 border-[#cd1628] rounded bg-white shadow"
                      />
                      <div className="text-xs text-center text-gray-500 mt-1">
                        Quét mã QR để chuyển khoản
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Thông tin người mua */}
              {/* <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Thông tin người mua
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Họ và tên"
                    value={buyer.name}
                    onChange={(e) =>
                      setBuyer((b) => ({ ...b, name: e.target.value }))
                    }
                  />
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Số điện thoại"
                    value={buyer.phone}
                    onChange={(e) =>
                      setBuyer((b) => ({ ...b, phone: e.target.value }))
                    }
                  />
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Email"
                    value={buyer.email}
                    onChange={(e) =>
                      setBuyer((b) => ({ ...b, email: e.target.value }))
                    }
                  />
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Địa chỉ"
                    value={buyer.address}
                    onChange={(e) =>
                      setBuyer((b) => ({ ...b, address: e.target.value }))
                    }
                  />
                  <input
                    className="border rounded px-3 py-2 md:col-span-2"
                    placeholder="Tên trường"
                    value={buyer.school}
                    onChange={(e) =>
                      setBuyer((b) => ({ ...b, school: e.target.value }))
                    }
                  />
                </div>
              </div> */}
            </div>
            {/* Thông tin đơn hàng */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-3">1 sản phẩm</h3>
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={courseData?.imgUrl}
                  alt="Sản phẩm"
                  className="w-16 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">
                    {courseData?.title?.text}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">Giá:</span>
                    <span className="text-[#cd1628] font-bold text-base whitespace-nowrap">
                      {bankInfo.amount.toLocaleString()} đ
                    </span>
                  </div>
                </div>
              </div>
              <div className="border-t my-2"></div>
              <div className="flex flex-col items-center font-bold text-lg text-[#cd1628] mt-4">
                <span>Tổng thanh toán sau khuyến mãi:</span>
                <span className="text-2xl whitespace-nowrap">
                  {bankInfo.amount.toLocaleString()} đ
                </span>
              </div>
              {/* <div className="mt-6">
                <button className="w-full bg-[#cd1628] text-white font-bold py-2 rounded hover:bg-[#a80f1a] transition">
                  GỬI ĐĂNG KÝ
                </button>
              </div> */}
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <Footer />
    </div>
  );
}
