import "../../Styles/Register/NextBtn.css";
const NextBtn = ({ onClick, isActive, label = "다음", className }) => {
  const handleClick = (e) => {
    if (!isActive) {
      // 클릭 차단
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };
  return (
    <button
      type="button"
      className={`${className} next-button ${isActive ? "enabled" : "disable"}`}
      onClick={handleClick}
      disabled={!isActive}
    >
      <span className="text-wrapper">{label}</span>
    </button>
  );
};

export default NextBtn;
