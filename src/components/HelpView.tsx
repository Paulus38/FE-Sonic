import React from 'react';
import { HelpCircle, Mic, Languages, Sparkles, BookOpen, Cloud, Shield } from 'lucide-react';

const FAQ: { icon: React.ElementType; q: string; a: string }[] = [
  {
    icon: Mic,
    q: 'Vì sao app xin quyền micro?',
    a: 'Ghi âm và chuyển giọng nói thành văn bản (STT) cần quyền truy cập micro. Trên điện thoại, hệ thống sẽ hỏi lại mỗi lần cài mới — bấm "Cho phép" khi được hỏi. Nếu lỡ từ chối, vào Cài đặt hệ thống của điện thoại → Ứng dụng → Sonic Scribe → Quyền → bật lại Micro.',
  },
  {
    icon: Languages,
    q: 'Dịch song ngữ hoạt động thế nào?',
    a: 'Khi ghi âm tiếng Anh, hệ thống tự dịch sang tiếng Việt theo thời gian thực và hiển thị song song bên dưới mỗi câu. Bản ghi có dịch sẽ được đánh dấu "Song ngữ" trong thư viện.',
  },
  {
    icon: Sparkles,
    q: 'Gợi ý trả lời AI dùng để làm gì?',
    a: 'Trong lúc ghi âm, bấm nút gợi ý để AI đề xuất một câu trả lời tiếng Anh phù hợp với nội dung hội thoại và hồ sơ cá nhân (nghề nghiệp, sở thích...) bạn khai trong Cài đặt. Gợi ý tự đóng sau vài giây để không che màn hình.',
  },
  {
    icon: BookOpen,
    q: 'Từ điển cá nhân thêm từ mới thế nào?',
    a: 'Vào tab Từ điển → bấm "+" để thêm từ/cụm từ, hoặc bấm vào một từ trong bản ghi đã lưu để thêm nhanh vào từ điển cá nhân.',
  },
  {
    icon: Cloud,
    q: 'Dung lượng lưu trữ và token AI tính thế nào?',
    a: 'Mỗi tài khoản có hạn mức dung lượng audio (cloud storage) và số token AI dùng cho dịch/tóm tắt/gợi ý riêng. Xem chi tiết mức đã dùng ở mục "AI Tokens" (trên máy tính) hoặc thanh dung lượng trong Cài đặt.',
  },
  {
    icon: Shield,
    q: 'Tài khoản quản trị (admin) khác gì?',
    a: 'Tài khoản admin có thêm quyền xem "Quản trị" (quản lý người dùng) và "Nhật ký" (audit log toàn hệ thống) — chỉ hiển thị với admin, người dùng thường không thấy và không truy cập được các mục này.',
  },
];

export default function HelpView() {
  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 pb-28 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex flex-col items-center text-center gap-2 py-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center">
            <HelpCircle className="w-7 h-7 text-blue-600" />
          </div>
          <h2 className="font-extrabold text-lg text-slate-950 dark:text-white">
            Hỗ trợ &amp; Câu hỏi thường gặp
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            Nhấn Ghi âm mới, nói tiếng Anh — hệ thống chuyển lời và dịch Việt
            realtime, rồi lưu để ôn tập.
          </p>
        </div>

        <div className="space-y-2.5">
          {FAQ.map(({ icon: Icon, q, a }) => (
            <details
              key={q}
              className="group bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl overflow-hidden"
            >
              <summary className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none list-none">
                <Icon className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                <span className="flex-1 text-sm font-bold text-slate-800 dark:text-slate-100">
                  {q}
                </span>
                <span className="text-slate-400 text-xs font-bold group-open:rotate-180 transition-transform">
                  ▾
                </span>
              </summary>
              <p className="px-4 pb-4 text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {a}
              </p>
            </details>
          ))}
        </div>

        <p className="text-center text-[11px] text-slate-400 dark:text-slate-600 font-semibold pt-2">
          Sonic Scribe · v1.0.0
        </p>
      </div>
    </div>
  );
}
