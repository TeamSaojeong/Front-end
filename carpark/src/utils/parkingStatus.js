// 상태 응답을 UI용으로 안전하게 변환
// 응답이 없거나 모르면 "사용 가능"을 기본값으로 처리
export function mapStatusToUI(raw) {
  if (!raw) {
    return {
      isAvailable: true,
      inUse: false,
      queueOpen: false,
      leavingEtaMin: null,
      primaryLabel: "주차장 이용하기",
      primaryDisabled: false,
    };
  }

  const inUse = !!(raw.inUse ?? raw.occupied ?? raw.isUsing);
  const queueOpen = !!raw.queueOpen;
  const leavingEtaMin =
    typeof raw.leavingEtaMin === "number" ? raw.leavingEtaMin : null;

  const isAvailable = !inUse; // inUse가 아니면 사용 가능

  let primaryLabel;
  let primaryDisabled;

  if (isAvailable) {
    // 공영: 기본은 바로 이용 가능
    primaryLabel = "주차장 이용하기";
    primaryDisabled = false;
  } else {
    // 사용 중이면 버튼 비활성 + 라벨 고정
    primaryLabel = "이용 중...";
    primaryDisabled = true;
  }

  return {
    isAvailable,
    inUse,
    queueOpen,
    leavingEtaMin,
    primaryLabel,
    primaryDisabled,
  };
}
