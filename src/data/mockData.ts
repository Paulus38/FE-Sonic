import { Recording, UserSettings, DictionaryItem } from '../types';

export const initialUserSettings: UserSettings = {
  name: 'Nguyễn Văn A',
  email: 'vana.nguyen@example.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  primaryLang: 'Tiếng Việt',
  secondaryLang: 'Tiếng Anh (US)',
  sampleRate: 48,
  aiNoiseCancellation: true,
  theme: 'light',
};

export const initialDictionaryItems: DictionaryItem[] = [
  {
    id: 'd1',
    word: 'Deliverable',
    phonetic: '/dɪˈlɪv.ər.ə.bəl/',
    definition: 'Sản phẩm bàn giao (báo cáo, bản thiết kế, code...) cho khách hàng.',
    example: 'We need to make sure all design deliverables are uploaded to Figma before the client meeting.',
    category: 'Họp Khách hàng'
  },
  {
    id: 'd2',
    word: 'To align',
    phonetic: '/tə əˈlaɪn/',
    definition: 'Thống nhất, đồng bộ ý kiến hoặc kế hoạch giữa các bên.',
    example: 'Let\'s schedule a quick sync to align on the project scope and timeline.',
    category: 'Họp Khách hàng'
  },
  {
    id: 'd3',
    word: 'Pain point',
    phonetic: '/peɪn pɔɪnt/',
    definition: 'Điểm đau, vấn đề khó khăn hoặc rắc rối lớn nhất mà người dùng đang gặp phải.',
    example: 'The main pain point for our users is the complicated onboarding process.',
    category: 'Phỏng vấn'
  },
  {
    id: 'd4',
    word: 'Synergy',
    phonetic: '/ˈsɪn.ə.dʒi/',
    definition: 'Sự hiệp lực, sự kết hợp hiệu quả mang lại kết quả lớn hơn tổng các phần đơn lẻ.',
    example: 'We want to create synergy between the marketing team and product designers.',
    category: 'Học Tiếng Anh'
  },
  {
    id: 'd5',
    word: 'Touch base',
    phonetic: '/tʌtʃ beɪs/',
    definition: 'Liên hệ nhanh, cập nhật thông tin ngắn gọn với ai đó.',
    example: 'I will touch base with the client tomorrow to get their initial feedback.',
    category: 'Học Tiếng Anh'
  },
  {
    id: 'd6',
    word: 'Keep in the loop',
    phonetic: '/kiːp ɪn ðə luːp/',
    definition: 'Luôn thông báo cho ai đó về những diễn biến mới nhất của công việc.',
    example: 'Please keep me in the loop regarding any changes to the design system.',
    category: 'Cuộc họp'
  }
];

export const initialRecordings: Recording[] = [
  {
    id: 'eng_1',
    title: 'Luyện giao tiếp tiếng Anh: Góp ý thiết kế UI/UX',
    category: 'Học Tiếng Anh',
    date: '19 Tháng 7, 2026',
    duration: '08:45',
    durationSec: 525,
    summary: 'Bài nghe tiếng Anh về cách đưa ra feedback (góp ý) thiết kế một cách lịch sự, chuyên nghiệp. Hỗ trợ dịch song ngữ Anh - Việt từng dòng để người học dễ dàng đối chiếu từ vựng.',
    transcript: [
      {
        time: '00:00',
        speaker: 'Teacher Sarah',
        text: 'Hello everyone! Today we will practice professional phrases to give constructive feedback on design mockups in English.',
        translation: 'Chào mọi người! Hôm nay chúng ta sẽ luyện tập các cụm từ chuyên nghiệp để đưa ra phản hồi mang tính xây dựng về các bản phác thảo thiết kế bằng tiếng Anh.'
      },
      {
        time: '00:30',
        speaker: 'Student Minh',
        text: 'That is wonderful! Sometimes I struggle to tell my client that I do not like their color choices without sounding rude.',
        translation: 'Thật tuyệt vời! Đôi khi tôi gặp khó khăn khi nói với khách hàng rằng tôi không thích lựa chọn màu sắc của họ mà không làm cho nó có vẻ thô lỗ.'
      },
      {
        time: '01:10',
        speaker: 'Teacher Sarah',
        text: 'Instead of saying "I don\'t like this color", you can say: "I feel that a different color palette might align better with our brand identity". It sounds much more professional!',
        translation: 'Thay vì nói "Tôi không thích màu này", bạn có thể nói: "Tôi cảm thấy rằng một bảng màu khác có thể phù hợp (đồng bộ) tốt hơn với nhận diện thương hiệu của chúng ta". Nghe chuyên nghiệp hơn nhiều!'
      },
      {
        time: '02:05',
        speaker: 'Student Minh',
        text: 'Ah, I see! "Align with the brand identity". That is a very useful business phrase. What about the font size?',
        translation: 'À, tôi hiểu rồi! "Đồng bộ với nhận diện thương hiệu". Đó là một cụm từ kinh doanh rất hữu ích. Còn về kích thước phông chữ thì sao?'
      },
      {
        time: '02:45',
        speaker: 'Teacher Sarah',
        text: 'For typography, you can say: "To enhance readability on mobile devices, we might want to increase the body text contrast slightly". Let\'s repeat that phrase!',
        translation: 'Đối với kiểu chữ, bạn có thể nói: "Để nâng cao khả năng đọc trên thiết bị di động, chúng ta có thể muốn tăng độ tương phản của văn bản chính lên một chút". Hãy cùng lặp lại cụm từ đó nào!'
      }
    ],
    aiSummary: `Bài học giao tiếp tiếng Anh chuyên ngành Thiết kế & Công nghệ:
- Học cách sử dụng cụm từ lịch sự và chuyên nghiệp "align with the brand identity" thay vì chê trực tiếp.
- Học cấu trúc nâng cao khi đề xuất cải tiến UX trên điện thoại: "To enhance readability on mobile...".
- Ôn tập phát âm và tăng phản xạ giao tiếp với khách hàng nước ngoài.`,
    participants: [
      {
        name: 'Teacher Sarah',
        role: 'Native Speaker',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120',
      },
      {
        name: 'Minh',
        role: 'UI Designer Student',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120',
      },
    ],
    tags: ['Học Tiếng Anh', 'UI/UX Feedback', 'English Pronunciation', 'Bilingual'],
    isTranslated: true,
  },
  {
    id: '1',
    title: 'Họp với Khách hàng US - Thống nhất UI Dashboard',
    category: 'Cuộc họp',
    date: '18 Tháng 7, 2026',
    duration: '15:22',
    durationSec: 922,
    summary: 'Cuộc họp quan trọng trực tiếp với khách hàng từ Mỹ (John Smith) về việc tinh chỉnh các biểu đồ hiển thị và tối ưu hóa tốc độ tải trang.',
    transcript: [
      {
        time: '00:00',
        speaker: 'John Smith (Client)',
        text: 'The dashboard looks super sleek, but I\'m worried about how the charts render on smaller screens, specifically iPhones.',
        translation: 'Trang tổng quan trông cực kỳ bóng bẩy, nhưng tôi lo lắng về cách các biểu đồ hiển thị trên màn hình nhỏ hơn, cụ thể là iPhone.'
      },
      {
        time: '00:45',
        speaker: 'Nguyễn Văn A (Dev)',
        text: 'No worries John! We designed the charts using responsive containers. They will automatically adapt and stack vertically on mobile screens.',
        translation: 'Không cần lo lắng đâu John! Chúng tôi đã thiết kế các biểu đồ bằng các responsive container. Chúng sẽ tự động thích ứng và xếp chồng theo chiều dọc trên màn hình di động.'
      },
      {
        time: '01:30',
        speaker: 'John Smith (Client)',
        text: 'That sounds perfect. Also, we need to touch base on the database migration next week. Is everything on track?',
        translation: 'Nghe có vẻ hoàn hảo. Ngoài ra, chúng ta cần trao đổi nhanh về việc di chuyển cơ sở dữ liệu vào tuần tới. Mọi thứ có đi đúng hướng không?'
      },
      {
        time: '02:15',
        speaker: 'Nguyễn Văn A (Dev)',
        text: 'Yes, we have already prepared the backup and will deploy during off-peak hours to avoid any downtime.',
        translation: 'Vâng, chúng tôi đã chuẩn bị sẵn bản sao lưu và sẽ triển khai trong giờ thấp điểm để tránh bất kỳ thời gian gián đoạn nào.'
      }
    ],
    aiSummary: `Tóm tắt nội dung cuộc họp với khách hàng John Smith:
- Tối ưu biểu đồ: John hài lòng với UI nhưng lo ngại về hiển thị di động. Dev giải thích phương án responsive container tự xếp chồng dọc.
- Lịch trình di chuyển cơ sở dữ liệu: Xác nhận diễn ra vào tuần sau trong giờ thấp điểm, cam kết không gây gián đoạn hệ thống.`,
    participants: [
      {
        name: 'John Smith',
        role: 'Product Owner (US Client)',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120',
      },
      {
        name: 'Nguyễn Văn A',
        role: 'Tech Lead',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      },
    ],
    tags: ['Client Meeting', 'US Client', 'Responsive', 'Database Migration'],
    isTranslated: true,
  },
  {
    id: '3',
    title: 'Phỏng vấn thử Tiếng Anh - Vị trí Product Designer',
    category: 'Phỏng vấn',
    date: '15 Tháng 7, 2026',
    duration: '28:15',
    durationSec: 1695,
    summary: 'Buổi phỏng vấn mẫu tiếng Anh hỏi về quy trình thiết kế, các khó khăn và cách thức xây dựng hệ thống thiết kế (Design System) cho sản phẩm Fintech.',
    transcript: [
      {
        time: '00:00',
        speaker: 'Interviewer (HR)',
        text: 'Thank you for coming today. Can you tell us about a design system you created and the primary challenges you faced?',
        translation: 'Cảm ơn bạn đã đến ngày hôm nay. Bạn có thể chia sẻ về một hệ thống thiết kế (design system) mà bạn từng tạo và những thách thức chính mà bạn đã đối mặt?'
      },
      {
        time: '01:15',
        speaker: 'Lê Anh (Candidate)',
        text: 'In my last Fintech project, the main challenge was ensuring consistency across multiple legacy platforms while maintaining high security.',
        translation: 'Trong dự án Fintech trước đây của tôi, thách thức chính là đảm bảo tính nhất quán trên nhiều nền tảng cũ trong khi vẫn duy trì tính bảo mật cao.'
      },
      {
        time: '02:30',
        speaker: 'Interviewer (HR)',
        text: 'And how did you align all stakeholders to adopt this new system?',
        translation: 'Và làm thế nào bạn có thể thuyết phục tất cả các bên liên quan áp dụng hệ thống mới này?'
      },
      {
        time: '03:10',
        speaker: 'Lê Anh (Candidate)',
        text: 'I organized bi-weekly workshops to demonstrate the time-saving benefits and got early buy-in from engineering leads.',
        translation: 'Tôi đã tổ chức các buổi hội thảo định kỳ hai tuần một lần để chứng minh lợi ích tiết kiệm thời gian và sớm nhận được sự đồng thuận từ các kỹ sư trưởng.'
      }
    ],
    aiSummary: `Đánh giá và tóm tắt buổi phỏng vấn thử:
- Chủ đề: Thiết kế Hệ thống (Design System) cho Fintech.
- Giải pháp ứng viên đưa ra: Tổ chức workshop 2 tuần một lần giúp lập trình viên và các phòng ban liên quan hiểu rõ lợi ích, từ đó tạo sự đồng lòng trong toàn bộ doanh nghiệp.
- Nhận xét: Trả lời rành mạch, từ vựng tiếng Anh chuyên ngành chuẩn xác.`,
    participants: [
      { name: 'David Lee', role: 'Interviewer (HR)', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120' },
      { name: 'Lê Anh', role: 'Candidate', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120' },
    ],
    tags: ['Interview Prep', 'Design System', 'Fintech', 'HR Questions'],
    isTranslated: true,
  }
];
