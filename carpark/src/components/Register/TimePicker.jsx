import { Swiper, SwiperSlide } from "swiper/react";
import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import "swiper/css";
import "swiper/css/mousewheel";
import { Mousewheel } from "swiper/modules";

export default function TimePicker() {
  const [hours, setHours] = useState(0);
  const TIME_HOURS = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div
      className="timepicker"
      style={{ height: 270, overflow: "hidden", border: "1px dashed #999" }} // 컨테이너 확정 높이
    >
      {/* ✅ 슬라이드 높이를 강제로 1/3로 고정 */}
      <style>
        {`
          .timepicker .swiper { height: 100%; }
          .timepicker .swiper-slide {
            height: calc(100% / 3) !important;
            display: flex;
            align-items: center;
          }
        `}
      </style>

      <Swiper
        direction="vertical"
        slidesPerView={3}
        centeredSlides
        modules={[Mousewheel]}
        mousewheel={{ forceToAxis: true, releaseOnEdges: true }}
        slideToClickedSlide
        onSlideChange={(s) => setHours(s.realIndex)}
      >
        {TIME_HOURS.map((hour) => (
          <SwiperSlide key={hour}>
            <div
              className={clsx(
                "cursor-pointer",
                hours === hour ? "H2 text-primary-700" : "text-[2rem] font-medium text-primary-500"
              )}
              style={{ paddingLeft: 12, color: "#111" }} // 내부는 고정 height 주지 않음!
            >
              {String(hour).padStart(2, "0")}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}