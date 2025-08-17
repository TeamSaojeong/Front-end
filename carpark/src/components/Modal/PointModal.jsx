import React from "react";
import "../../Styles/Modal/PointModal.css";
import coinIcon from "../../Assets/Coin.svg";

const PointModal = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="outsoon-modal__backdrop" onClick={onClose}>
      <div
        className="outsoon-modal__card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="outsoon-modal-title"
      >
        <button
          className="outsoon-modal__close"
          aria-label="닫기"
          onClick={onClose}
        >
          ×
        </button>

        <div className="outsoon-modal__icon-wrap">
          <img
            src={coinIcon}
            alt="포인트 아이콘"
            className="outsoon-modal__icon-img"
          />
        </div>

        <h3 id="outsoon-modal-title" className="outsoon-modal__title">
          곧 나감 코인 적립 완료!
        </h3>

        <p className="outsoon-modal__desc">
          곧 나감을 눌러주셔서 감사합니다! <br />
          주차 이용시간도 얼마남지 않았으니, 출차 준비도 <br />
          잊지 말아주세요!
        </p>

        <button className="outsoon-modal__primary" onClick={onClose}>
          확인
        </button>
      </div>
    </div>
  );
};

export default PointModal;
