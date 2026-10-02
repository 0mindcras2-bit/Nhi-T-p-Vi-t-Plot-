import { Character, AppConfig, TarotCard, FeedbackItem, PlotRequestItem } from '../types';

export const INITIAL_CHARACTERS: Character[] = [
  {
    id: 'char-1',
    name: 'Rafayel • Họa Sĩ Biển Sâu',
    avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    hashtags: ['#BienSau', '#KỳẢo', '#NgạoKiều', '#LãngMạn', '#HọaSĩ'],
    plot: 'Anh là hậu duệ cuối cùng của vương quốc Lemuria chìm dưới đáy đại dương, ẩn mình trong vỏ bọc một họa sĩ tài hoa nhưng tính khí thất thường. Mỗi bức tranh anh vẽ đều chứa linh hồn của sóng biển và ký ức ngàn năm về bạn. Bạn vô tình bước vào xưởng tranh hoa hồng san hô của anh lúc nửa đêm...',
    aiStudioLink: 'https://aistudio.google.com/prompts/new_chat',
    isLocked: false,
    unlockCost: 0,
    likes: 0,
    createdAt: '2026-03-01T10:00:00Z',
    authorNote: 'Bot đầu tay lấy cảm hứng từ biển cả và hoa hồng tím.'
  },
  {
    id: 'char-2',
    name: 'Ciel • Kỵ Sĩ Hoa Hồng Gai',
    avatar: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    hashtags: ['#HoàngGia', '#KỵSĩ', '#TrungThành', '#NgượcNhẹ', '#HoaHồngGai'],
    plot: 'Mang trong mình lời nguyền hoa hồng gai quấn quanh tim, mỗi lần rung động vì bạn, những cánh hoa đỏ thẫm sẽ nở bung từ lồng ngực. Ciel thề sẽ bảo vệ bạn khỏi ngai vàng nhuốm máu, dù cái giá phải trả là chính sinh mệnh của mình.',
    aiStudioLink: 'https://aistudio.google.com/prompts/new_chat',
    isLocked: true,
    unlockCost: 35,
    likes: 0,
    createdAt: '2026-03-10T12:30:00Z',
    authorNote: 'Plot ngập tràn gai nhọn và tình cảm sâu kín, unlock để lấy prompt chuẩn nhé!'
  },
  {
    id: 'char-3',
    name: 'Aurelius • Hoàng Tử Ngân Hà',
    avatar: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80',
    hashtags: ['#VuTru', '#MilkyWay', '#Diudang', '#ChữaLành', '#CaVoiXanh'],
    plot: 'Lạc lối giữa những đám mây tinh vân tím biếc, Aurelius cưỡi cá voi ánh sao chu du khắp các hành tinh để tìm lại mảnh linh hồn thất lạc của người anh yêu. Khi chiếc tàu không gian của bạn rơi vào quỹ đạo của anh...',
    aiStudioLink: 'https://aistudio.google.com/prompts/new_chat',
    isLocked: true,
    unlockCost: 40,
    likes: 0,
    createdAt: '2026-03-15T09:15:00Z',
    authorNote: 'Tông màu xanh tím galaxy mộng mơ.'
  },
  {
    id: 'char-4',
    name: 'Mochi • Thần Thú Cá Nóc Đỏ',
    avatar: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    hashtags: ['#HaiHuoc', '#NgọtNgào', '#BienHinh', '#ĐángYêu', '#CaNocDo'],
    plot: 'Vốn là một linh thú biển sâu uy phong lẫm liệt, nhưng do ăn nhầm kẹo ma thuật nên bị biến thành một chú cá nóc đỏ tròn xoe hay dỗi hờn, chỉ bạn mới có thể xoa dịu và giúp anh dần lấy lại hình hài vương giả thật sự.',
    aiStudioLink: 'https://aistudio.google.com/prompts/new_chat',
    isLocked: false,
    unlockCost: 0,
    likes: 0,
    createdAt: '2026-03-20T14:00:00Z',
    authorNote: 'Được tạo ra để đem lại tiếng cười vui vẻ!'
  }
];

export const INITIAL_CONFIG: AppConfig = {
  qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://nhitapvietplot.studio/donate',
  qrThankYou: 'Cảm ơn bạn rất nhiều vì đã ghé thăm góc nhỏ "Nhi tập viết plot"! Sự ủng hộ và yêu thương của bạn là nguồn động lực to lớn giúp Nhi tiếp tục sáng tạo thêm nhiều nhân vật & cốt truyện tuyệt vời. Chúc bạn luôn tìm thấy niềm vui trong từng con chữ! 🌹✨',
  playlist: [
    {
      id: 'track-1',
      title: 'Vườn Hoa Hồng Hoàng Gia (Lo-fi Chime)',
      artist: 'Nhi Music Sanctuary',
      url: 'synth://fairy-garden'
    },
    {
      id: 'track-2',
      title: 'Bản Giao Hưởng Biển & Cá Nóc Đỏ',
      artist: 'Ocean Whispers',
      url: 'synth://ocean-calm'
    },
    {
      id: 'track-3',
      title: 'Điệu Van-xơ Dải Ngân Hà',
      artist: 'Stardust Lofi',
      url: 'synth://stardust'
    }
  ]
};

export const INITIAL_FEEDBACKS: FeedbackItem[] = [];

export const INITIAL_REQUESTS: PlotRequestItem[] = [];

export const TAROT_DECK: TarotCard[] = [
  {
    id: '0-fool',
    name: 'The Fool',
    nameVi: 'Kẻ Khờ (0)',
    arcana: 'Major',
    image: '🃏',
    keywords: ['Khởi đầu mới', 'Ngây thơ', 'Tự do', 'Mạo hiểm', 'Lạc quan'],
    meanings: {
      general: {
        upright: 'Bước ngoặt mới đang mở ra trước mắt bạn. Hãy dũng cảm bước tới với lòng nhiệt thành, nhưng đừng quên quan sát mép vực dưới chân.',
        reversed: 'Bạn đang quá vội vàng hoặc thiếu kế hoạch cụ thể. Sự bất cẩn hoặc trốn tránh trách nhiệm có thể dẫn tới vấp ngã đáng tiếc.',
        advice: 'Hãy giữ tâm thế cởi mở như đứa trẻ, nhưng nhớ mang theo chiếc la bàn tỉnh táo trước khi lao vào cuộc phiêu lưu.'
      },
      love: {
        upright: 'Một mối quan hệ mới đầy bất ngờ, tươi vui và không toan tính. Bạn hoặc đối phương đang cảm thấy sự rung động nhẹ nhàng, tự do.',
        reversed: 'Sự thiếu cam kết hoặc tính khí trẻ con làm đối phương bất an. Cần suy nghĩ chín chắn hơn về tương lai hai người.',
        advice: 'Tình yêu cần sự hồn nhiên nhưng cũng cần điểm tựa. Hãy yêu bằng cả trái tim nhưng hãy đi cùng đôi chân vững vàng.'
      },
      study: {
        upright: 'Khởi đầu một môn học, đề tài hoặc kỳ thi mới với tinh thần phấn khởi. Khả năng tiếp thu nhanh nhạy khi bạn có hứng thú thật sự.',
        reversed: 'Học hành đối phó, thiếu tập trung hoặc nhảy từ môn này sang môn khác mà không đi sâu vào căn bản.',
        advice: 'Đừng ngần ngại đặt câu hỏi dù tưởng như ngây ngô. Học từ gốc rễ sẽ giúp bạn bay xa hơn.'
      },
      career: {
        upright: 'Cơ hội chuyển đổi công việc, bắt đầu dự án mới hoặc khởi nghiệp. Trực giác sáng tạo của bạn đang ở mức rất cao.',
        reversed: 'Kế hoạch còn nhiều lỗ hổng, rủi ro tài chính do đánh giá thấp độ khó. Đừng vội vàng nhảy việc khi chưa có sự chuẩn bị.',
        advice: 'Dám nghĩ dám làm là tốt, nhưng hãy lập danh sách dự phòng trước khi ký kết bất kỳ thỏa thuận nào.'
      }
    }
  },
  {
    id: '1-magician',
    name: 'The Magician',
    nameVi: 'Nhà Ảo Thuật (I)',
    arcana: 'Major',
    image: '🪄',
    keywords: ['Tài nguyên đủ đầy', 'Tập trung', 'Ý chí', 'Hành động', 'Khéo léo'],
    meanings: {
      general: {
        upright: 'Bạn đã có đủ mọi công cụ và trí tuệ để biến ước mơ thành hiện thực. Đây là thời điểm vàng để hiện thực hóa các kế hoạch.',
        reversed: 'Tài năng chưa được khai thác đúng chỗ, hoặc có xu hướng thao túng, hứa suông và thiếu kiên định.',
        advice: 'Hành động dứt khoát và có đạo đức. Sức mạnh lớn nhất nằm ở việc bạn sử dụng khả năng của mình để xây dựng thay vì khoe khoang.'
      },
      love: {
        upright: 'Sức hút cá nhân cực kỳ lớn. Bạn có thể chủ động tạo nên những khoảnh khắc lãng mạn đáng nhớ và kết nối sâu sắc.',
        reversed: 'Cảnh giác với những lời đường mật không đi kèm hành động. Có sự che giấu hoặc đóng kịch trong cảm xúc.',
        advice: 'Hãy chân thật. Sự khéo léo quyến rũ ban đầu chỉ có thể bền vững nếu được nuôi dưỡng bằng sự thành tâm.'
      },
      study: {
        upright: 'Tư duy logic và khả năng áp dụng kiến thức vào thực tế xuất sắc. Bạn có thể chinh phục những bài tập khó nhất.',
        reversed: 'Tự tin thái quá, học tủ học vẹt hoặc chủ quan trước các kỳ kiểm tra quan trọng.',
        advice: 'Tận dụng các phương pháp học tập thông minh (mindmap, flashcards, thực hành) thay vì chỉ đọc qua loa.'
      },
      career: {
        upright: 'Thời cơ đàm phán, thể hiện năng lực trước cấp trên và đối tác. Mọi nguồn lực đang sẵn sàng phục vụ cho bạn.',
        reversed: 'Thiếu định hướng rõ ràng, lãng phí thời gian vào nhiều việc không đem lại kết quả thực tế.',
        advice: 'Tập trung vào một mục tiêu mũi nhọn duy nhất tại một thời điểm để tối ưu hóa năng lượng.'
      }
    }
  },
  {
    id: '2-high-priestess',
    name: 'The High Priestess',
    nameVi: 'Nữ Đại Tư Tế (II)',
    arcana: 'Major',
    image: '🌙',
    keywords: ['Trực giác', 'Bí ẩn', 'Trí tuệ tĩnh lặng', 'Nội tâm', 'Kiên nhẫn'],
    meanings: {
      general: {
        upright: 'Hãy lắng nghe tiếng nói nhỏ nhẹ bên trong bạn. Câu trả lời không nằm ở sự ồn ào bên ngoài mà nằm trong sự tĩnh lặng.',
        reversed: 'Bạn đang phớt lờ trực giác, bị cuốn vào những tin đồn thị phi hoặc quá khép kín tới mức cô lập chính mình.',
        advice: 'Dành thời gian suy ngẫm trước khi đưa ra quyết định. Không phải bí mật nào cũng cần vội vàng phơi bày.'
      },
      love: {
        upright: 'Tình cảm sâu sắc, thấu hiểu ngầm không cần nhiều lời hoa mỹ. Có thể có một tình cảm thầm kín đang chờ thời điểm thích hợp.',
        reversed: 'Bức tường ngăn cách vô hình giữa hai người, sự nghi ngờ hoặc lạnh lùng khiến mối quan hệ đóng băng.',
        advice: 'Hãy dịu dàng mở lòng khi cảm thấy an toàn. Đừng để nỗi sợ bị tổn thương khiến bạn dựng lên rào cản quá cao.'
      },
      study: {
        upright: 'Khả năng nghiên cứu chuyên sâu, đọc hiểu tài liệu hàn lâm và khả năng ghi nhớ tuyệt vời trong không gian yên tĩnh.',
        reversed: 'Mất tập trung, tâm trí bay bổng hoặc gặp khó khăn khi phải diễn đạt ý tưởng ra bằng lời nói.',
        advice: 'Tạo cho mình một góc học tập ấm áp, thanh tịnh. Việc ghi chép cẩn thận sẽ giúp bạn nắm vững kiến thức.'
      },
      career: {
        upright: 'Chiến lược giữ kín, quan sát cục diện. Bạn nhìn thấy những điều mà người khác bỏ sót trong dự án.',
        reversed: 'Môi trường làm việc thiếu minh bạch, có những ẩn khuất sau lưng. Tránh tham gia vào các cuộc bàn tán nội bộ.',
        advice: 'Làm tốt việc của mình, giữ vững tính chuyên nghiệp và cẩn trọng với các thông tin mật.'
      }
    }
  },
  {
    id: '3-empress',
    name: 'The Empress',
    nameVi: 'Nữ Hoàng (III)',
    arcana: 'Major',
    image: '👑',
    keywords: ['Dồi dào', 'Yêu thương', 'Sáng tạo', 'Ấm áp', 'Sinh sôi'],
    meanings: {
      general: {
        upright: 'Thời kỳ nở hoa của sự sáng tạo, thịnh vượng và hạnh phúc. Những ý tưởng bạn gieo trồng đang bắt đầu đơm hoa kết trái.',
        reversed: 'Bạn đang bị kiệt sức vì lo nghĩ cho người khác quá nhiều mà bỏ quên bản thân, hoặc cảm thấy bí tắc sáng tạo.',
        advice: 'Hãy chăm sóc cơ thể và tâm hồn mình trước. Bạn không thể rót nước từ một chiếc bình rỗng.'
      },
      love: {
        upright: 'Mối quan hệ ngọt ngào, bao dung và tràn đầy sự chăm sóc dịu dàng. Khả năng tiến tới cam kết gắn bó lâu dài.',
        reversed: 'Sự kiểm soát ngột ngạt hoặc đòi hỏi cảm xúc quá mức. Thiếu không gian riêng cho mỗi người.',
        advice: 'Yêu thương là nâng niu chứ không phải ràng buộc. Hãy để đối phương và chính mình cùng tự do hít thở.'
      },
      study: {
        upright: 'Môi trường học tập thuận lợi, cảm hứng dồi dào với các môn nghệ thuật, văn học và sáng tạo.',
        reversed: 'Lười biếng, sa đà vào hưởng thụ hoặc chiều chuộng bản thân quá đà dẫn đến chậm trễ tiến độ.',
        advice: 'Kết hợp học tập với sự thoải mái, nhưng vẫn giữ kỷ luật nhẹ nhàng để không trượt dài.'
      },
      career: {
        upright: 'Dự án thu về kết quả mỹ mãn, môi trường đồng nghiệp hỗ trợ nhau. Ý tưởng mới được đón nhận nhiệt tình.',
        reversed: 'Bế tắc ý tưởng, chi tiêu hoang phí vào những tiện ích không thực sự cần thiết cho công việc.',
        advice: 'Đầu tư vào sự phát triển bền vững và tạo không khí ấm cúng, truyền cảm hứng tại nơi làm việc.'
      }
    }
  },
  {
    id: '6-lovers',
    name: 'The Lovers',
    nameVi: 'Đôi Tình Nhân (VI)',
    arcana: 'Major',
    image: '💞',
    keywords: ['Lựa chọn', 'Hòa hợp', 'Giá trị cốt lõi', 'Đồng điệu', 'Gắn kết'],
    meanings: {
      general: {
        upright: 'Sự hòa hợp giữa lý trí và con tim. Bạn đang đứng trước một lựa chọn quan trọng đòi hỏi phải trung thực với bản ngã.',
        reversed: 'Mâu thuẫn nội tâm, cảm giác bị giằng xé giữa hai ngả đường hoặc sự bất đồng quan điểm sâu sắc với người xung quanh.',
        advice: 'Hãy đưa ra lựa chọn dựa trên những giá trị đạo đức mà bạn thật sự tin tưởng, không phải vì áp lực bên ngoài.'
      },
      love: {
        upright: 'Sự tương hợp tâm hồn mãnh liệt. Hai bên tìm thấy tiếng nói chung và sẵn sàng san sẻ mọi khía cạnh cuộc sống.',
        reversed: 'Hiểu lầm, lệch pha về mong muốn tương lai hoặc sự can thiệp từ người thứ ba/gia đình.',
        advice: 'Giao tiếp chân thành và thẳng thắn là chiếc chìa khóa duy nhất để tháo gỡ nút thắt lúc này.'
      },
      study: {
        upright: 'Học nhóm hiệu quả, tìm được người bạn đồng hành cùng chí hướng để ôn thi và tiến bộ.',
        reversed: 'Xao nhãng việc học vì các mối quan hệ tình cảm hoặc bất hòa với bạn cùng nhóm.',
        advice: 'Phân định rõ ràng thời gian học và thời gian giao lưu để không bị phân tâm.'
      },
      career: {
        upright: 'Hợp tác làm ăn thuận lợi, tìm được đối tác ăn ý. Lựa chọn công việc phù hợp với đam mê cá nhân.',
        reversed: 'Xung đột lợi ích trong hợp đồng, đối tác không giữ đúng cam kết ban đầu.',
        advice: 'Mọi thỏa thuận hợp tác đều cần văn bản rõ ràng để bảo vệ tình bạn lẫn công việc.'
      }
    }
  },
  {
    id: '10-wheel-of-fortune',
    name: 'Wheel of Fortune',
    nameVi: 'Bánh Xe Số Phận (X)',
    arcana: 'Major',
    image: '🎡',
    keywords: ['Chu kỳ', 'Thay đổi', 'Cơ duyên', 'Thời thế', 'Thích nghi'],
    meanings: {
      general: {
        upright: 'Vòng quay cuộc đời đang hướng lên. Những cơ may bất ngờ và duyên phận tốt đẹp đang đến với bạn.',
        reversed: 'Giai đoạn trũng của chu kỳ, cảm giác mọi việc diễn ra ngoài tầm kiểm soát hoặc gặp vận xui nhất thời.',
        advice: 'Hãy nhớ rằng không có đỉnh cao nào là mãi mãi và cũng không có vực sâu nào là vĩnh viễn. Giữ tâm bất biến giữa dòng đời vạn biến.'
      },
      love: {
        upright: 'Duyên kỳ ngộ! Gặp gỡ người đặc biệt trong hoàn cảnh không ngờ tới. Mối quan hệ bước sang trang mới tươi sáng.',
        reversed: 'Thời điểm chưa thích hợp, hoàn cảnh khách quan chia cắt hoặc thử thách sự kiên nhẫn của hai bạn.',
        advice: 'Đừng cố ép buộc số phận. Hãy thuận theo tự nhiên và trân trọng từng bài học mà đối phương mang lại.'
      },
      study: {
        upright: 'Vận may trong thi cử, trúng tủ hoặc nhận được sự giúp đỡ kịp thời từ thầy cô, bạn bè.',
        reversed: 'Gặp sự cố ngoài ý muốn trong phòng thi hoặc kết quả không như kỳ vọng dù đã cố gắng.',
        advice: 'Chuẩn bị kỹ lưỡng vẫn là cách tốt nhất để biến vận may thành thực lực vững chắc.'
      },
      career: {
        upright: 'Thời thế đảo chiều có lợi cho bạn. Một cơ hội bất ngờ giúp sự nghiệp thăng tiến ngoạn mục.',
        reversed: 'Biến động thị trường, chính sách thay đổi ảnh hưởng tới công việc. Cần thắt lưng buộc bụng.',
        advice: 'Linh hoạt thích nghi thay vì chống cự lại xu hướng tất yếu của thời cuộc.'
      }
    }
  },
  {
    id: '17-star',
    name: 'The Star',
    nameVi: 'Ngôi Sao Hy Vọng (XVII)',
    arcana: 'Major',
    image: '⭐',
    keywords: ['Hy vọng', 'Chữa lành', 'Ánh sáng', 'Niềm tin', 'Bình an'],
    meanings: {
      general: {
        upright: 'Sau cơn mưa trời lại sáng. Một nguồn năng lượng an lành, hy vọng và cảm hứng mới đang tràn ngập tâm trí bạn.',
        reversed: 'Mất niềm tin, cảm giác thất vọng và bi quan. Bạn đang nhìn bầu trời đêm mà quên mất những vì sao lấp lánh.',
        advice: 'Hãy tin tưởng vào ngày mai. Vết thương đang lành lại, đừng để bóng tối của ngày hôm qua che khuất ánh sáng hiện tại.'
      },
      love: {
        upright: 'Mối quan hệ mang tính chữa lành, thanh thuần và tràn đầy sự trân quý. Bạn cảm thấy bình yên khi ở cạnh người ấy.',
        reversed: 'Sự hoài nghi, tổn thương cũ trong quá khứ làm bạn sợ hãi khi đón nhận tình cảm mới.',
        advice: 'Cho bản thân thời gian để phục hồi. Tình yêu chân chính sẽ kiên nhẫn chờ đợi bạn sẵn sàng.'
      },
      study: {
        upright: 'Tìm lại được niềm vui và mục tiêu học tập. Những khúc mắc trước đây dần được giải tỏa sáng tỏ.',
        reversed: 'Thiếu định hướng dài hạn, cảm thấy mơ hồ về ngành học hoặc nghề nghiệp sau này.',
        advice: 'Đặt ra những mục tiêu nhỏ có thể đạt được để từng bước khôi phục sự tự tin.'
      },
      career: {
        upright: 'Tương lai công việc rộng mở. Tác phẩm hoặc dự án của bạn tỏa sáng và nhận được nhiều lời khen ngợi.',
        reversed: 'Mong đợi quá xa vời thực tế, cần hạ bớt kỳ vọng viển vông để bắt tay vào làm việc cụ thể.',
        advice: 'Giữ vững ước mơ lớn, nhưng bước đi bằng những bước chân thực tế và bền bỉ.'
      }
    }
  },
  {
    id: '19-sun',
    name: 'The Sun',
    nameVi: 'Mặt Trời Rực Rỡ (XIX)',
    arcana: 'Major',
    image: '☀️',
    keywords: ['Thành công', 'Rạng rỡ', 'Năng lượng tích cực', 'Rõ ràng', 'Niềm vui'],
    meanings: {
      general: {
        upright: 'Đỉnh cao của niềm vui, thành tựu và ánh sáng rực rỡ. Mọi nghi ngờ đều tan biến dưới ánh mặt trời ấm áp.',
        reversed: 'Niềm vui bị giảm bớt chút ít do sự kiêu ngạo, hoặc bạn đang gặp khó khăn trong việc nhìn nhận mặt tích cực của cuộc sống.',
        advice: 'Hãy chia sẻ ánh sáng ấm áp của bạn với mọi người xung quanh. Khi bạn tỏa sáng khiêm tốn, cả thế giới sẽ mỉm cười cùng bạn.'
      },
      love: {
        upright: 'Tình yêu tràn đầy tiếng cười, chân thành và rạng rỡ. Hai người tự hào khi giới thiệu nhau với gia đình và bạn bè.',
        reversed: 'Cái tôi quá lớn hoặc tính nóng nảy làm tổn thương người thương. Cần hạ bớt sự tự ái.',
        advice: 'Sưởi ấm chứ đừng thiêu đốt. Dành cho nhau sự ấm áp dịu dàng thay vì những lời nói bốc đồng.'
      },
      study: {
        upright: 'Kết quả thi cử xuất sắc, đạt học bổng hoặc thành tích đứng đầu. Trí tuệ minh mẫn, tràn trề năng lượng.',
        reversed: 'Có tiến bộ nhưng chưa đạt mức trọn vẹn do một chút tự mãn phút chót.',
        advice: 'Duy trì phong độ và chia sẻ phương pháp học tập tốt với bạn bè cùng lớp.'
      },
      career: {
        upright: 'Thành công vang dội, được vinh danh và khen thưởng. Cơ hội thăng chức hoặc dự án thắng lớn.',
        reversed: 'Hơi chậm tiến độ so với kỳ vọng ban đầu nhưng kết quả chung cuộc vẫn khả quan.',
        advice: 'Tự tin nắm bắt cơ hội tỏa sáng, đồng thời tri ân những người đã kề vai sát cánh cùng bạn.'
      }
    }
  }
];
