import { Project, StyleOption, QuizQuestion } from "./types";

export const INTERIOR_STYLES: StyleOption[] = [
  {
    id: "modern-led",
    name: "Trần Thạch Cao Hiện Đại kết hợp Đèn LED Hắt Sáng",
    description: "Xu hướng thiết kế trần giật cấp đột phá, kết hợp hoàn hảo giữa các khối thạch cao phẳng mịn và khe hắt đèn LED ấm áp. Tạo chiều sâu tối đa cho phòng khách, phòng ngủ hiện đại.",
    traits: [
      "Trần giật cấp tinh tế tạo hiệu ứng nổi nhẹ nhàng",
      "Hệ khe hắt sáng bố trí dải LED COB cao cấp màu trung tính",
      "Kết hợp đèn rọi spotlight âm trần góc chiếu hẹp nghệ thuật",
      "Khung xương thạch cao Vĩnh Tường chất lượng vàng bảo hành 10 năm"
    ],
    colors: ["#FFFFFF (Trắng tuyết)", "#F5F5F0 (Trắng kem)", "#FFEAD2 (Vàng ấm 3000K)", "#CCCCCC (Màu xám ánh kim)"],
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "wood-composite",
    name: "Ốp Trần Vách Nhựa Giả Gỗ Lam Sóng & Nano",
    description: "Giải pháp ốp vách tivi, đầu giường hay toàn bộ trần bằng tấm nhựa giả gỗ Composite cao cấp. Chống nước tuyệt đối, chống mối mọt cong vênh, giữ nguyên vẻ ấm cúng mộc mạc của thớ gỗ tự nhiên.",
    traits: [
      "Sử dụng tấm nhựa lam sóng kết cấu đặc, cách âm tốt",
      "Tấm ốp Nano phẳng chống xước, dễ dàng lau chùi vệ sinh",
      "Vân gỗ sồi, gỗ óc chó tự nhiên tinh xảo sắc nét",
      "Phù hợp với cả ban công ngoài trời chịu mưa gió nắng gắt"
    ],
    colors: ["#8C5E3C (Nâu sồi ấm)", "#53331C (Nâu óc chó trầm)", "#CFA47C (Vàng sồi sáng)", "#2C2C2C (Xám than thanh lịch)"],
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "luxury-pvc",
    name: "Vách PVC Vân Đá kết hợp Nẹp Titan Luxury",
    description: "Sự kết hợp hoàn hảo giữa tấm nhựa PVC giả đá Marble vân mây lớn bóng loáng và hệ lam sóng gỗ nhựa 2 bên, điểm xuyết phào chỉ kim loại mạ vàng. Mang lại vẻ đẹp đẳng cấp hoàng gia quyền quý.",
    traits: [
      "Tấm nhựa giả đá phủ UV bóng gương phản chiếu ánh sáng",
      "Nẹp chỉ Titan mạ vàng gương chống bay màu cực kỳ sang trọng",
      "Khung xương chịu lực sắt hộp mạ kẽm vô cùng chắc chắn",
      "Thích hợp làm vách nhấn tivi phòng khách, vách sảnh đón khách"
    ],
    colors: ["#E8F1F5 (Trắng đá Marble)", "#D4AF37 (Vàng kim titan)", "#4A3F35 (Vân đá đen xám)", "#A18262 (Gỗ đỏ quý phái)"],
    image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "classic-plaster",
    name: "Trần Thạch Cao Tân Cổ Điển Chỉ Phào Quý Phái",
    description: "Vẻ đẹp trường tồn vượt thời gian với các đường phào chỉ thạch cao trang nhã, mâm trần uốn lượn mềm mại và các họa tiết hoa văn cổ điển sang trọng. Điểm nhấn hoàn hảo cho căn biệt thự thượng lưu.",
    traits: [
      "Hệ phào chỉ trần thạch cao đối xứng cân đối tuyệt đối",
      "Dát vàng hoặc nhũ bạc thủ công sắc nét trên hoa văn",
      "Bố trí mâm trần trung tâm treo đèn chùm pha lê cỡ lớn",
      "Sơn nước trần siêu trắng cao cấp bền màu chống ẩm mốc"
    ],
    colors: ["#FFFFFF (Trắng tinh khôi)", "#FDFBF7 (Kem ngọc trai)", "#D4AF37 (Vàng nhũ hoàng gia)", "#E2D8C9 (Màu sâm banh)"],
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80"
  }
];

export const PROJECTS: Project[] = [
  {
    id: "p1",
    title: "Trần thạch cao giật cấp LED hắt - Căn hộ Vinhomes Grand Park",
    category: "tran-thach-cao",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
    area: 75,
    style: "Hiện đại LED",
    budget: "35 Triệu",
    location: "Quận 9, TP. Hồ Chí Minh",
    description: "Thi công trọn gói hệ thống trần thạch cao phòng khách liền bếp sử dụng tấm thạch cao chống ẩm Vĩnh Tường, khung xương chìm mạ kim loại chịu lực cực tốt. Tích hợp khe hắt sáng LED COB 3 chế độ màu sắc rực rỡ và đèn spotlight âm trần."
  },
  {
    id: "p2",
    title: "Vách ốp tivi PVC vân đá phối lam sóng gỗ nhựa - Biệt thự Khang Điền",
    category: "vach-pvc-vanda",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    area: 28,
    style: "Composite Luxury",
    budget: "48 Triệu",
    location: "Quận 2, TP. Hồ Chí Minh",
    description: "Cải tạo mảng tường tivi phòng khách rộng lớn. Sử dụng tấm PVC giả đá cẩm thạch Calacatta dày 3.2mm chống ẩm, hai bên cánh ốp vách lam sóng Composite màu nâu óc chó đậm, bo viền inox mạ vàng gương sang trọng."
  },
  {
    id: "p3",
    title: "Trần gỗ nhựa ngoài trời chịu nước - Ban công Penhouse Vista",
    category: "vach-nhua-composite",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    area: 18,
    style: "Gỗ nhựa ngoài trời",
    budget: "22 Triệu",
    location: "An Phú, Quận 2",
    description: "Hệ thống trần ban công ngoài trời sử dụng gỗ nhựa composite cao cấp. Vật liệu siêu chịu nước, chịu nhiệt độ cao không cong vênh, kết hợp hệ thống đèn LED âm trần chịu nước, tạo không gian nghỉ dưỡng thư thái ban đêm."
  },
  {
    id: "p4",
    title: "Trần thạch cao giật cấp Tân cổ điển - Biệt thự Chateau Phú Mỹ Hưng",
    category: "tran-thach-cao",
    image: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80",
    area: 120,
    style: "Tân cổ điển dát vàng",
    budget: "95 Triệu",
    location: "Quận 7, TP. Hồ Chí Minh",
    description: "Công trình nghệ thuật trần thạch cao với hoa văn phào chỉ xi măng nhẹ và thạch cao đúc khuôn tinh xảo. Sử dụng mâm trần lớn nâng đèn chùm pha lê, mạ vàng nhũ sắc nét từng đường nét uốn lượn hoàng gia."
  },
  {
    id: "p5",
    title: "Vách ốp đầu giường nhựa giả gỗ lam sóng phòng ngủ Master",
    category: "vach-nhua-composite",
    image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80",
    area: 12,
    style: "Mộc mạc Japandi",
    budget: "15 Triệu",
    location: "Bình Thạnh, TP. Hồ Chí Minh",
    description: "Trang trí đầu giường ngủ Master tạo cảm giác ấm cúng dễ ngủ. Sử dụng tấm lam sóng nhựa giả gỗ mộc mạc màu sồi sáng, kết hợp tấm Nano phẳng cùng tông màu và dải LED âm tỏa sáng dịu mắt."
  },
  {
    id: "p6",
    title: "Thi công trọn gói trần thạch cao & vách ốp trần gỗ nhựa - Văn phòng Techcom",
    category: "tron-goi",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
    area: 250,
    style: "Hiện đại Công sở",
    budget: "185 Triệu",
    location: "Quận 1, TP. Hồ Chí Minh",
    description: "Công trình tích hợp toàn diện: Trần thạch cao giật cấp lớn hắt sáng tạo điểm nhấn cho khu vực quầy lễ tân, kết hợp hệ trần gỗ nhựa lam sọc trang trí tạo không khí văn phòng xanh, sang trọng và hiện đại."
  }
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Bạn đang có nhu cầu thi công hạng mục trần vách nào chủ đạo cho ngôi nhà?",
    options: [
      {
        text: "Trần thạch cao giật cấp, phẳng, tích hợp hệ thống chiếu sáng LED hiện đại.",
        value: "modern-led",
        image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80"
      },
      {
        text: "Ốp vách trang trí tivi, vách đầu giường hoặc trần gỗ nhựa mộc mạc ấm áp.",
        value: "wood-composite",
        image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=400&q=80"
      },
      {
        text: "Vách tivi sang chảnh phối đá Marble sáng loáng kết hợp lam sóng vân gỗ.",
        value: "luxury-pvc",
        image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=400&q=80"
      },
      {
        text: "Hệ trần thạch cao phào chỉ đối xứng quý phái, lộng lẫy phong cách Châu Âu.",
        value: "classic-plaster",
        image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80"
      }
    ]
  },
  {
    id: 2,
    question: "Đặc tính vật lý nào bạn quan tâm hàng đầu khi lựa chọn tấm trần và vách ngăn?",
    options: [
      {
        text: "Thẩm mỹ phẳng mịn hoàn hảo, cách âm phòng ngủ, phòng khách cực tốt.",
        value: "modern-led",
        image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80"
      },
      {
        text: "Chống nước tuyệt đối, không sợ mối mọt, ẩm mốc, dễ dàng lau chùi dầu mỡ bụi bẩn.",
        value: "wood-composite",
        image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80"
      },
      {
        text: "Bề mặt bóng bẩy phản chiếu ánh sáng cực tốt, chống xước và tăng độ sang trọng.",
        value: "luxury-pvc",
        image: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=400&q=80"
      },
      {
        text: "Độ bền thế hệ mới, phào chỉ thạch cao đúc kết cấu siêu cứng cáp không nứt nẻ.",
        value: "classic-plaster",
        image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=400&q=80"
      }
    ]
  },
  {
    id: 3,
    question: "Về mặt thẩm mỹ và màu sắc, bạn muốn hướng không gian trần vách tới tông màu nào?",
    options: [
      {
        text: "Tông trắng tuyết sáng sủa, điểm xuyết ánh sáng vàng ấm áp dễ chịu.",
        value: "modern-led",
        image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=400&q=80"
      },
      {
        text: "Tông gỗ tự nhiên ấm cúng mộc mạc như gỗ sồi sần hoặc gỗ óc chó óng ả.",
        value: "wood-composite",
        image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80"
      },
      {
        text: "Vân đá trắng mây xám tinh khiết kết hợp những sọc màu đồng mạ kim óng vàng.",
        value: "luxury-pvc",
        image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80"
      },
      {
        text: "Sơn trắng tinh tế kết hợp phào thạch cao dát vàng hoàng gia lấp lánh nghệ thuật.",
        value: "classic-plaster",
        image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80"
      }
    ]
  }
];

export const WORK_PROCESS = [
  {
    step: "01",
    title: "Đo Đạc & Khảo Sát",
    desc: "Đo đạc mặt bằng thực tế bằng thước laser chuyên dụng, kiểm tra độ ẩm của tường trần, tư vấn cốt nền và bố trí mỏ neo xương thạch cao chịu tải tốt nhất."
  },
  {
    step: "02",
    title: "Dựng Phối Cảnh 3D",
    desc: "Dựng hình phối cảnh 3D trần thạch cao giật cấp và vách gỗ nhựa trang trí trực quan nhất, kết hợp mô phỏng luồng ánh sáng đèn LED chân thực."
  },
  {
    step: "03",
    title: "Báo Giá Bóc Tách",
    desc: "Báo giá chính xác theo từng mét vuông thi công, phân chia vật liệu khung xương (Vĩnh Tường) và loại tấm thạch cao hay nhựa giả gỗ minh bạch."
  },
  {
    step: "04",
    title: "Thi Công Trực Tiếp",
    desc: "Thợ thạch cao và thợ mộc tay nghề cao trực tiếp bắn khung xương đạt chuẩn thăng bằng, ghép tấm gỗ nhựa, trét bột bả Matit phẳng mượt và sơn hoàn thiện."
  },
  {
    step: "05",
    title: "Nghiệm Thu Bàn Giao",
    desc: "Kiểm tra kỹ thuật: độ phẳng của trần vách, độ ổn định của hệ thống điện đèn hắt sáng và bàn giao công trình sạch sẽ kèm thẻ bảo hành chống nứt mốc 3 năm."
  }
];
