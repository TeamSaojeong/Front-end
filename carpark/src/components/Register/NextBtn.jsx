import "../../Styles/Register/NextBtn.css";
const NextBtn = ({ disabled = false, onClick }) => {
  const className = `next-button ${!disabled ? "enabled" : "disable"}`;
  const handleClick = (e) => {
    if (disabled) {
      // 클릭 차단
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };
  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      onClick={handleClick}
    >
      <span className="text-wrapper">다음</span>
    </button>
  );
};

export default NextBtn;
