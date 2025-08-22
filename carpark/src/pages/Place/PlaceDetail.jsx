import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "../../Styles/Place/PlaceDetail.css";

import reportIcon from "../../Assets/report.svg";
import pinIcon from "../../Assets/emptypin.svg";
import moneyIcon from "../../Assets/money.svg";
import copyIcon from "../../Assets/copy.svg";
import alarmIcon from "../../Assets/alarm.svg";
import alarmFilledIcon from "../../Assets/alarm1.svg";

import {
  getPublicDetail,
  getParkingStatus,
  subscribeAlert,
} from "../../apis/parking";
import { mapStatusToUI } from "../../utils/parkingStatus";

const toNum = (v) => (v == null || v === "" ? null : Number(v));
const normalizeId = (id) => String(id ?? "").replace(/^kakao:/i, "");

/** 사용자별 로컬 키 (동일 브라우저 내 다른 계정 분리용) */
const getUserKey = () => localStorage.getItem("userKey") || "guest";
const lsk = (key) => `watchedPlaceIds__${key}`;
const readWatched = (userKey = getUserKey()) => {
  try {
    const raw = localStorage.getItem(lsk(userKey));
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.map((x) => normalizeId(x)) : [];
  } catch {
    return [];
  }
};
const saveWatched = (ids, userKey = getUserKey()) => {
  try {
    localStorage.setItem(lsk(userKey), JSON.stringify(ids));
  } catch {}
};
const addWatched = (id, userKey = getUserKey()) => {
  const set = new Set(readWatched(userKey));
  set.add(normalizeId(id));
  saveWatched([...set], userKey);
};

export default function PlaceDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { placeId: placeIdFromParam } = useParams();

  const placeFromSession = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("selectedPlace");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  // kakaoId (조회용, nearby의 id)
  const kakaoId = placeFromSession?.id ?? placeIdFromParam ?? null;
  const externalId = useMemo(() => normalizeId(kakaoId), [kakaoId]);
  const sessionLat = toNum(placeFromSession?.lat);
  const sessionLng = toNum(placeFromSession?.lng);

  const userKey = getUserKey();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [parkingId, setParkingId] = useState(null);

  const [primary, setPrimary] = useState({ label: "주차장 이용하기" });

  /** 처음 진입 시: 로컬 기억값을 우선으로 아이콘 상태 결정 */
  const [isSubscribed, setIsSubscribed] = useState(() =>
    readWatched(userKey).includes(externalId)
  );

  const goBack = () => navigate(-1);

  const copyAddress = async () => {
    const text = detail?.address || "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      alert("주소가 복사되었습니다.");
    } catch {
      alert("복사에 실패했습니다.");
    }
  };

  const startUse = () => {
    const targetLat = toNum(detail?.lat) ?? sessionLat ?? null;
    const targetLng = toNum(detail?.lng) ?? sessionLng ?? null;
    if (
      targetLat == null ||
      Number.isNaN(targetLat) ||
      targetLng == null ||
      Number.isNaN(targetLng)
    ) {
      alert("목적지 좌표가 없어 진행할 수 없습니다.");
      return;
    }
    navigate("/pub/time-select", {
      state: {
        prefetched: true,
        placeId: parkingId ?? kakaoId,
        placeName: detail?.name,
        address: detail?.address,
        openRangesText: detail?.availableTimes,
        isPrivate: false,
      },
    });
  };

  // 상세
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!kakaoId) {
        setError("장소 식별자가 없어 상세를 불러올 수 없습니다.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const { data } = await getPublicDetail(
          kakaoId,
          sessionLat ?? 0,
          sessionLng ?? 0
        );
        if (!mounted) return;

        const payload = data?.data ?? data;
        const d = payload?.parking ?? payload;

        const pid = d.id ?? d.parkingId ?? null;
        setParkingId(pid);

        const lat = toNum(d?.y ?? d?.lat ?? d?.latitude) ?? sessionLat ?? null;
        const lng =
          toNum(d?.x ?? d?.lon ?? d?.lng ?? d?.longitude) ?? sessionLng ?? null;

        const normalized = {
          id: pid ?? kakaoId,
          name: d.placeName ?? d.name ?? placeFromSession?.name ?? "주차 장소",
          distanceKm:
            d.distanceMeters != null
              ? d.distanceMeters / 1000
              : d.distanceKm ?? placeFromSession?.distanceKm ?? null,
          pricePer10m:
            d.timerate && d.addrate
              ? Math.round((d.addrate * 10) / d.timerate)
              : placeFromSession?.price ?? 0,
          address:
            d.addressName ?? d.address ?? placeFromSession?.address ?? "",
          availableTimes:
            d.availableTimes ??
            d.openHours ??
            placeFromSession?.available ??
            "00:00 ~ 00:00  |  00:00 ~ 00:00",
          note: d.note ?? placeFromSession?.note ?? "",
          lat,
          lng,
        };
        setDetail(normalized);

        /** 서버가 이미 구독중인 것으로 응답했다면 로컬에도 반영 */
        if (payload?.subscribed) {
          addWatched(externalId, userKey);

          const key =
            "watchedPlaceNames__" +
            (localStorage.getItem("userKey") || "guest");
          const obj = JSON.parse(localStorage.getItem(key) || "{}");
          obj[externalId] = normalized.name || "주차장";
          localStorage.setItem(key, JSON.stringify(obj));

          setIsSubscribed(true);
          alert("알림이 설정되었습니다.");
        }
      } catch (e) {
        if (!mounted) return;
        setError(
          e?.response?.data?.message || "상세 정보를 불러오지 못했습니다."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kakaoId]);

  // 상태 폴링(라벨만 갱신)
  useEffect(() => {
    if (!parkingId) return;
    let mounted = true;
    async function pullStatus() {
      try {
        const { data } = await getParkingStatus(parkingId);
        if (!mounted) return;
        const ui = mapStatusToUI(data?.data);
        setPrimary({
          label: ui.isAvailable ? "주차장 이용하기" : "이용 중…(계속 진행)",
        });
      } catch {
        if (!mounted) return;
        setPrimary({ label: "주차장 이용하기" });
      }
    }
    pullStatus();
    const t = setInterval(pullStatus, 10_000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [parkingId]);

  /** 🔔 알림 버튼 (등록만 가능) */
  const onClickAlarm = async () => {
    if (isSubscribed) {
      alert("이미 알림이 설정되어 있어요. 알림 해지는 현재 지원되지 않습니다.");
      return;
    }
    
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    try {
      // 알림 등록
      await subscribeAlert({ provider: "kakao", externalId });
      addWatched(externalId, userKey);

      const nameKey = "watchedPlaceNames__" + userKey;
      const names = JSON.parse(localStorage.getItem(nameKey) || "{}");
      names[externalId] = detail?.name || "주차장";
      localStorage.setItem(nameKey, JSON.stringify(names));

      setIsSubscribed(true);
      alert("알림이 설정되었습니다.");
    } catch (e) {
      if (e?.response?.status === 401) {
        alert("세션이 만료되었습니다. 다시 로그인해 주세요.");
        try {
          localStorage.removeItem("accessToken");
        } catch {}
        navigate("/login", { state: { from: location.pathname } });
        return;
      }
      alert(e?.response?.data?.message || "처리 중 오류가 발생했어요.");
    }
  };

  if (loading) {
    return (
      <div className="pub-wrap">
        <div className="pub-topbar">
          <button className="pub-close" onClick={goBack} aria-label="닫기">
            ✕
          </button>
        </div>
        <h1 className="pub-title">불러오는 중…</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pub-wrap">
        <div className="pub-topbar">
          <button className="pub-close" onClick={goBack} aria-label="닫기">
            ✕
          </button>
        </div>
        <h1 className="pub-title">오류</h1>
        <p style={{ padding: "0 24px" }}>{error}</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="pub-wrap">
        <div className="pub-topbar">
          <button className="pub-close" onClick={goBack} aria-label="닫기">
            ✕
          </button>
        </div>
        <h1 className="pub-title">데이터가 없습니다.</h1>
      </div>
    );
  }

  const { name, distanceKm, pricePer10m, address, availableTimes, note } =
    detail;

  return (
    <div className="pub-wrap">
      <div className="pub-topbar">
        <button className="pub-close" onClick={goBack} aria-label="닫기">
          ✕
        </button>

        <button
          className={`pub-alarm ${isSubscribed ? "is-on" : ""}`}
          onClick={onClickAlarm}
          aria-label="알림"
          title={isSubscribed ? "알림 설정됨 (해지 불가)" : "알림 설정"}
        >
          <img
            src={isSubscribed ? alarmFilledIcon : alarmIcon}
            alt={isSubscribed ? "알림 설정됨" : "알림"}
          />
        </button>

        <button
          className="pub-bell"
          onClick={() => alert("신고하기 준비 중")}
          aria-label="신고하기"
        >
          <img src={reportIcon} alt="신고" />
        </button>
      </div>

      <h1 className="pub-title">{name || "주차 장소"}</h1>

      <div className="pub-chips">
        <div className="pub-chip">
          <div className="pub-chip-icon">
            <img src={pinIcon} alt="위치" />
          </div>
          <div className="pub-chip-text">
            <div className="pub-chip-value">
              <strong>{distanceKm ?? "-"}km</strong>
            </div>
            <div className="pub-chip-sub">주차 장소까지</div>
          </div>
        </div>

        <div className="pub-chip">
          <div className="pub-chip-icon">
            <img src={moneyIcon} alt="요금" />
          </div>
          <div className="pub-chip-text">
            <div className="pub-chip-value">
              <strong>{Number(pricePer10m || 0).toLocaleString()}원</strong>
            </div>
            <div className="pub-chip-sub">10분당 주차 비용</div>
          </div>
        </div>
      </div>

      <section className="pub-section">
        <h2 className="pub-section-title">주차 장소와 가장 근접한 위치</h2>
        <div className="pub-address-row">
          <div className="pub-address">{address || "-"}</div>
          <button
            className="pub-copy-btn"
            onClick={copyAddress}
            aria-label="주소 복사"
            title="주소 복사"
          >
            <img src={copyIcon} alt="복사" />
          </button>
        </div>
      </section>

      <section className="pub-section">
        <h2 className="pub-section-title">주차 가능 시간</h2>
        <div className="pub-times">{availableTimes}</div>
      </section>

      <section className="pub-section">
        <h2 className="pub-section-title">주차 장소 설명</h2>
        <div className="pub-photo-box" role="img" aria-label="주차 장소 사진">
          <div className="pub-photo-placeholder">🖼️</div>
        </div>
        <pre className="pub-note">{note}</pre>
      </section>

      <div className="pub-actions">
        <button
          className="pub-btn pub-btn-outline"
          onClick={() => {
            const targetLat = toNum(detail?.lat) ?? sessionLat ?? null;
            const targetLng = toNum(detail?.lng) ?? sessionLng ?? null;
            if (
              targetLat == null ||
              Number.isNaN(targetLat) ||
              targetLng == null ||
              Number.isNaN(targetLng)
            ) {
              alert("목적지 좌표가 없어 경로를 열 수 없습니다.");
              return;
            }
            navigate("/MapRoute", {
              state: {
                dest: { lat: targetLat, lng: targetLng },
                name: detail.name,
                address: detail.address,
                placeId: parkingId ?? kakaoId,
                isPrivate: false,
              },
            });
          }}
        >
          경로 안내 보기
        </button>

        <button className="pub-btn pub-btn-primary" onClick={startUse}>
          {primary.label}
        </button>
      </div>
    </div>
  );
}
