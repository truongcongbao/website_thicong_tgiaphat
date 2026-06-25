import { useState } from "react";
import { QUIZ_QUESTIONS, INTERIOR_STYLES } from "../data";
import { StyleOption } from "../types";
import { Sparkles, RefreshCw, Check, ArrowRight, MessageSquare, Phone } from "lucide-react";

interface StyleQuizProps {
  onOpenChatWithPrompt: (prompt: string) => void;
}

export default function StyleQuiz({ onOpenChatWithPrompt }: StyleQuizProps) {
  const [currentStep, setCurrentStep] = useState<number>(0); // 0 = start, 1, 2, 3 = questions, 4 = result
  const [answers, setAnswers] = useState<string[]>([]);
  const [recommendedStyle, setRecommendedStyle] = useState<StyleOption | null>(null);

  const startQuiz = () => {
    setCurrentStep(1);
    setAnswers([]);
    setRecommendedStyle(null);
  };

  const handleAnswerSelect = (styleValue: string) => {
    const updatedAnswers = [...answers, styleValue];
    setAnswers(updatedAnswers);

    if (currentStep < QUIZ_QUESTIONS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate dominant style
      const frequency: { [key: string]: number } = {};
      let maxFreq = 0;
      let dominant = styleValue; // default to last selected

      updatedAnswers.forEach((ans) => {
        frequency[ans] = (frequency[ans] || 0) + 1;
        if (frequency[ans] > maxFreq) {
          maxFreq = frequency[ans];
          dominant = ans;
        }
      });

      const styleResult = INTERIOR_STYLES.find((style) => style.id === dominant) || INTERIOR_STYLES[0];
      setRecommendedStyle(styleResult);
      setCurrentStep(4); // result screen
    }
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setAnswers([]);
    setRecommendedStyle(null);
  };

  const handleConsultAI = () => {
    if (recommendedStyle) {
      const prompt = `Chào KTS Minh Khôi! Tôi vừa thực hiện bài trắc nghiệm phong cách thiết kế trên website, và kết quả khuyên tôi nên thiết kế theo phong cách: "${recommendedStyle.name}". Bạn có thể giải thích thêm về chi phí thi công trung bình và cách phối màu cho căn hộ của phong cách này không?`;
      onOpenChatWithPrompt(prompt);
    }
  };

  return (
    <section id="styles" className="py-20 bg-stone-900 border-t border-stone-800/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">
            Bản Đồ Thẩm Mỹ
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif text-stone-100">
            Khám Phá Gu Nội Thất Phù Hợp Với Bạn
          </h2>
          <p className="text-stone-400 max-w-xl mx-auto text-sm sm:text-base">
            Hãy trả lời 3 câu hỏi trực quan dưới đây để Trợ lý AI phân tích phong cách thiết kế lý tưởng cho không gian sống của bạn.
          </p>
        </div>

        {/* Quiz Card Container */}
        <div className="relative rounded-2xl bg-stone-950 border border-stone-800 overflow-hidden shadow-2xl p-6 sm:p-10 min-h-[450px] flex flex-col justify-center">
          
          {/* Step 0: Welcome Screen */}
          {currentStep === 0 && (
            <div className="text-center space-y-6 max-w-md mx-auto py-8">
              <div className="mx-auto h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Sparkles className="h-8 w-8 animate-bounce" />
              </div>
              <h3 className="text-xl sm:text-2xl font-serif text-stone-100">
                Gu nội thất của bạn là gì?
              </h3>
              <p className="text-stone-400 text-sm leading-relaxed">
                Japandi mộc mạc, Modern Luxury đẳng cấp thượng lưu, hay Tân Cổ Điển quý phái? Trắc nghiệm nhanh chỉ mất 30 giây để tìm ra câu trả lời lý tưởng!
              </p>
              <button
                onClick={startQuiz}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-all shadow-lg shadow-amber-500/15 cursor-pointer"
              >
                Bắt Đầu Trắc Nghiệm
              </button>
            </div>
          )}

          {/* Steps 1, 2, 3: Questions */}
          {currentStep >= 1 && currentStep <= QUIZ_QUESTIONS.length && (
            <div className="space-y-6">
              {/* Progress bar */}
              <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${(currentStep / QUIZ_QUESTIONS.length) * 100}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs text-stone-500">
                <span>CÂU HỎI {currentStep} TỔNG {QUIZ_QUESTIONS.length}</span>
                <span>{Math.round((currentStep / QUIZ_QUESTIONS.length) * 100)}% hoàn thành</span>
              </div>

              {/* Question text */}
              <h3 className="text-lg sm:text-xl font-medium text-stone-100 font-serif leading-snug">
                {QUIZ_QUESTIONS[currentStep - 1].question}
              </h3>

              {/* Options Grid */}
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                {QUIZ_QUESTIONS[currentStep - 1].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(option.value)}
                    className="flex flex-col text-left rounded-xl bg-stone-900 border border-stone-800 overflow-hidden hover:border-amber-500/50 hover:bg-stone-850 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    <div className="h-28 w-full overflow-hidden">
                      <img
                        src={option.image}
                        alt={option.text}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-4 text-stone-200 text-xs sm:text-sm leading-relaxed grow flex items-center">
                      <span className="mr-2 h-4 w-4 rounded-full border border-stone-700 flex items-center justify-center shrink-0 group-hover:border-amber-500 group-hover:bg-amber-500/10">
                        <span className="h-1.5 w-1.5 rounded-full bg-transparent group-hover:bg-amber-500" />
                      </span>
                      <span>{option.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Result Screen */}
          {currentStep === 4 && recommendedStyle && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center border-b border-stone-800 pb-6">
                {/* Result Title */}
                <div className="space-y-2 grow">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
                    Kết Quả Của Bạn
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif text-stone-100 font-bold">
                    {recommendedStyle.name}
                  </h3>
                  <p className="text-stone-400 text-xs sm:text-sm leading-relaxed">
                    {recommendedStyle.description}
                  </p>
                </div>
                {/* Result Image Frame */}
                <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden border border-stone-800 shrink-0">
                  <img
                    src={recommendedStyle.image}
                    alt={recommendedStyle.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* Traits & Color Palette */}
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Key Traits */}
                <div className="space-y-3">
                  <h4 className="text-xs uppercase tracking-wider text-stone-400 font-semibold">
                    Đặc trưng tiêu biểu:
                  </h4>
                  <ul className="space-y-2">
                    {recommendedStyle.traits.map((trait, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-stone-300 leading-snug">
                        <Check className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{trait}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Color Scheme */}
                <div className="space-y-3">
                  <h4 className="text-xs uppercase tracking-wider text-stone-400 font-semibold">
                    Bảng màu chủ đạo:
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {recommendedStyle.colors.map((color, idx) => {
                      const hex = color.split(" ")[0];
                      return (
                        <div key={idx} className="flex items-center gap-2 p-1.5 rounded bg-stone-900 border border-stone-800">
                          <span
                            className="h-5 w-5 rounded border border-stone-800 shrink-0"
                            style={{ backgroundColor: hex }}
                          />
                          <span className="text-[10px] text-stone-300 truncate">{color.replace(hex, "").trim() || hex}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Call to action */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-stone-800">
                <button
                  onClick={handleConsultAI}
                  className="grow px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Hỏi Ý Kiến KTS Minh Khôi (AI)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={resetQuiz}
                  className="px-5 py-3 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-stone-100 border border-stone-850 text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Làm Lại</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
