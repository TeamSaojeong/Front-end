// src/utils/parkingStatus.js
export function mapStatusToUI(data) {
  const s = String(data?.buttonStaus || "").toUpperCase(); // 명세 철자 주의
  const soon =
    typeof data?.soonOutTime === "number" ? Math.max(0, data.soonOutTime) : 0;

  switch (s) {
    case "AVAILABLE":
      return {
        isAvailable: true,
        queueOpen: false,
        leavingEtaMin: 0,
        primaryLabel: "주차장 이용하기",
        primaryDisabled: false,
      };
    case "RESERVABLE":
      return {
        isAvailable: true,
        queueOpen: true,
        leavingEtaMin: soon, // 10 또는 5
        primaryLabel: "미리 대기하기",
        primaryDisabled: false,
      };
    case "USING":
      return {
        isAvailable: false,
        queueOpen: false,
        leavingEtaMin: 0,
        primaryLabel: "이용 중...",
        primaryDisabled: true,
      };
    case "UNAVAILABLE":
    default:
      return {
        isAvailable: false,
        queueOpen: false,
        leavingEtaMin: 0,
        primaryLabel: "이용 불가",
        primaryDisabled: true,
      };
  }
}
