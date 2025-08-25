import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "../../Styles/Place/PlaceDetail.css";

import reportIcon from "../../Assets/report.svg";
import pinIcon from "../../Assets/emptypin.svg";
import moneyIcon from "../../Assets/money.svg";
import copyIcon from "../../Assets/copy.svg";
import alarmIcon from "../../Assets/alarm.svg";
import alarmFilledIcon from "../../Assets/alarm1.svg";
import close from "../../Assets/close.svg";
import upload_img from "../../Assets/upload_img.svg";
import gyuImg from "../../Assets/gyu.png";

import {
  getPublicDetail,
  getParkingStatus,
  subscribeAlert,
  unsubscribeAlert,
} from "../../apis/parking";
import { mapStatusToUI } from "../../utils/parkingStatus";
import { shrinkImageFile } from "../../utils/imageShrink";

const toNum = (v) => (v == null || v === "" ? null : Number(v));
const normalizeId = (id) => String(id ?? "").replace(/^kakao:/i, "");

// 양재 AT센터 좌표
const YANGJAE_AT_CENTER = { lat: 37.4707, lng: 127.0389 };

// 두 지점 간의 거리 계산 (km 단위, 소수점 2자리까지)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null;
  
  const R = 6371; // 지구의 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // 소수점 2자리까지
};

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
  const [isLeavingSoon, setIsLeavingSoon] = useState(false);

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
    // leavingSoon 상태일 때는 대기 알림 설정
    if (isLeavingSoon) {
      alert("곧 나가는 차량이 있습니다. 대기 알림을 설정했습니다.");
      // 여기에 대기 알림 로직을 추가할 수 있습니다
      return;
    }
    
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
    
    // 교장 앞 주차장의 경우 NFC 페이지로 이동
    if (kakaoId === "pub-dummy-gn-4") {
      console.log('[PlaceDetail] 교장 앞 주차장 - NFC 페이지로 이동');
      
      // NFC 페이지로 전달할 주차장 정보 준비
      const parkingInfo = {
        id: parkingId ?? kakaoId,
        name: detail?.name || "교장 앞 주차장(구간 182)",
        address: detail?.address || "",
        availableTimes: detail?.availableTimes || "",
        isPrivate: true,
        lat: targetLat,
        lng: targetLng,
        charge: detail?.pricePer10m || 1800,
        note: detail?.note || "",
      };

      console.log('PlaceDetail에서 NFC로 전달하는 정보:', parkingInfo);
      
      // 세션 스토리지에 저장
      try {
        sessionStorage.setItem('nfcParkingInfo', JSON.stringify(parkingInfo));
        console.log('[PlaceDetail] sessionStorage 저장 완료');
      } catch (error) {
        console.error('[PlaceDetail] 스토리지 저장 실패:', error);
      }
      
      // NFC 페이지로 이동
      navigate("/nfc", {
        state: {
          prefetched: true,
          placeId: parkingId ?? kakaoId,
          placeName: detail?.name,
          address: detail?.address,
          openRangesText: detail?.availableTimes,
          isPrivate: true,
          lat: targetLat,
          lng: targetLng,
          pricePer10Min: detail?.pricePer10m || 1800,
        },
      });
    } else {
      // 일반 공용 주차장 플로우
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
    }
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
      
      // 더미 데이터 ID인지 확인
      const isDummyData = kakaoId.startsWith('pub-dummy-') || kakaoId.startsWith('pv-dummy-') || kakaoId.startsWith('prv-dummy-');
      
      if (isDummyData) {
        console.log('[PlaceDetail] 더미 데이터 감지, API 호출 건너뛰기:', kakaoId);
        
        try {
          // 더미 데이터에서 해당 주차장 정보 찾기
          const { getYangjaeDummies, getSeochoGangnamDummies } = await import('../../utils/dummyData');
          const allDummies = [...getYangjaeDummies(), ...getSeochoGangnamDummies()];
          const dummyPlace = allDummies.find(p => p.id === kakaoId);
          
          if (dummyPlace) {
            const d = dummyPlace;
            const pid = d.id ?? d.parkingId ?? null;
            setParkingId(pid);

            const lat = toNum(d?.lat) ?? sessionLat ?? null;
            const lng = toNum(d?.lng) ?? sessionLng ?? null;
            
            // 양재 AT센터에서의 거리 계산
            const calculatedDistance = lat && lng 
              ? calculateDistance(YANGJAE_AT_CENTER.lat, YANGJAE_AT_CENTER.lng, lat, lng)
              : null;
            
            // leavingSoon 상태 확인
            const leavingSoon = !!d.leavingSoon;
            setIsLeavingSoon(leavingSoon);
            console.log('[PlaceDetail] 더미 데이터 leavingSoon 상태:', leavingSoon, d.name);

            const normalized = {
              id: pid ?? kakaoId,
              name: d.name ?? placeFromSession?.name ?? "주차 장소",
              distanceKm: calculatedDistance ?? d.distanceKm ?? placeFromSession?.distanceKm ?? null,
              pricePer10m: d.charge != null ? Number(d.charge) : (placeFromSession?.price ?? 0),
              address: d.address ?? placeFromSession?.address ?? "",
              availableTimes: Array.isArray(d.operateTimes)
                ? d.operateTimes.map((t) => `${t.start} ~ ${t.end}`).join("  |  ")
                : (placeFromSession?.available ?? "00:00 ~ 00:00"),
              note: d.note ?? placeFromSession?.note ?? "",
              lat,
              lng,
            };
            setDetail(normalized);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('[PlaceDetail] 더미 데이터 처리 중 오류:', error);
        }
      }
      
      // 실제 API 호출 (더미 데이터가 아닌 경우)
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

        // 양재 AT센터에서의 거리 계산
        const calculatedDistance = lat && lng 
          ? calculateDistance(YANGJAE_AT_CENTER.lat, YANGJAE_AT_CENTER.lng, lat, lng)
          : null;

        const normalized = {
          id: pid ?? kakaoId,
          name: d.placeName ?? d.name ?? placeFromSession?.name ?? "주차 장소 이름",
          distanceKm: calculatedDistance ?? (d.distanceMeters != null
            ? d.distanceMeters / 1000
            : d.distanceKm ?? placeFromSession?.distanceKm ?? null),
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

  /** 🔔 알림 버튼 (등록/해지 가능) */
  const onClickAlarm = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    try {
      if (isSubscribed) {
        // 알림 해지 - alertId 필요
        const alertIdsKey = `alertIds__${userKey}`;
        const alertIds = JSON.parse(localStorage.getItem(alertIdsKey) || "{}");
        const alertId = alertIds[externalId];
        
        if (alertId) {
          await unsubscribeAlert({ alertId });
          
          // 로컬에서 제거
          const watchedIds = readWatched(userKey).filter(id => id !== externalId);
          saveWatched(watchedIds, userKey);
          
          const nameKey = "watchedPlaceNames__" + userKey;
          const names = JSON.parse(localStorage.getItem(nameKey) || "{}");
          delete names[externalId];
          localStorage.setItem(nameKey, JSON.stringify(names));
          
          // alertId도 제거
          delete alertIds[externalId];
          localStorage.setItem(alertIdsKey, JSON.stringify(alertIds));
          
          setIsSubscribed(false);
          alert("알림이 해지되었습니다.");
        } else {
          alert("알림 ID를 찾을 수 없어 해지할 수 없습니다.");
        }
      } else {
        // 알림 등록
        console.log('알림 등록 파라미터:', { provider: "kakao", externalId, parkingId: parkingId ?? externalId });
        const alertResponse = await subscribeAlert({ 
          provider: "kakao", 
          externalId,
          parkingId: parkingId ?? externalId 
        });
        const alertId = alertResponse?.data?.data?.id;
        
        console.log('POST /api/alerts response:', alertResponse);
        console.log('extracted alertId:', alertId);
        
        addWatched(externalId, userKey);

        const nameKey = "watchedPlaceNames__" + userKey;
        const names = JSON.parse(localStorage.getItem(nameKey) || "{}");
        names[externalId] = detail?.name || "주차장";
        localStorage.setItem(nameKey, JSON.stringify(names));

        // alertId 저장
        if (alertId) {
          const alertIdsKey = `alertIds__${userKey}`;
          const alertIds = JSON.parse(localStorage.getItem(alertIdsKey) || "{}");
          alertIds[externalId] = alertId;
          localStorage.setItem(alertIdsKey, JSON.stringify(alertIds));
        }

        setIsSubscribed(true);
        alert("알림이 설정되었습니다.");
      }
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
            <img src={close} />
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
            <img src={close} />
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
            <img src={close} />
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
          <img src={close}/>
        </button>

        <button
          className={`pub-alarm ${isSubscribed ? "is-on" : ""}`}
          onClick={onClickAlarm}
          aria-label="알림"
          title={isSubscribed ? "알림 해지" : "알림 설정"}
        >
          <img
            src={isSubscribed ? alarmFilledIcon : alarmIcon}
            alt={isSubscribed ? "알림 설정됨" : "알림"}
            className="pub-alarm-img"
          />
        </button>

        <button
          className="pub-bell"
          onClick={() => navigate("/report", {
            state: {
              placeId: kakaoId,
              placeName: detail?.name || "주차장",
              address: detail?.address || "",
              isPrivate: false
            }
          })}
          aria-label="신고하기"
        >
          <img src={reportIcon} alt="신고" className="pub-report-img"/>
        </button>
      </div>

      <h1 className="pub-title">{name || "주차 장소"}</h1>

      <div className="pub-chips">
        <div className="pub-chip">
          <div className="pub-chip-text">
            <div className="pub-chip-value">
              <img src={pinIcon} alt="위치" className="pub-chip-locationicon"/>
              <strong className="pub-chip-locationtext">{distanceKm ?? "-"}km</strong>
            </div>
            <div className="pub-chip-sub">주차 장소까지</div>
          </div>
        </div>

        <div className="pub-chip">
          <div className="pub-chip-text">
            <div className="pub-chip-value">
              <img src={moneyIcon} alt="요금" className="pub-chip-moneyicon"/>
              <strong className="pub-chip-moneytext">{Number(pricePer10m || 0).toLocaleString()}원</strong>
            </div>
            <div className="pub-chip-sub">10분당 주차 비용</div>
          </div>
        </div>
      </div>

      <section className="pub-section">
        <h2 className="pub-section-title">주차 장소와 가장 근접한 위치</h2>
        <div className="pub-address-row">
          <span className="pub-address">{address || "-"}</span>
          <img
            src={copyIcon} 
            className="pub-copy-btn"
            onClick={copyAddress}
            aria-label="주소 복사"
            title="주소 복사"
            alt="복사"
             />
        </div>
      </section>

      <section className="pub-section">
        <h2 className="pub-section-title">주차 가능 시간</h2>
        <div className="pub-times">{availableTimes}</div>
      </section>

      <section className="pub-section">
        <h2 className="pub-section-title">주차 장소 설명</h2>
        <div className="pub-photo-box" role="img" aria-label="주차 장소 사진" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="pub-photo-placeholder">
          <img 
            src={name?.includes("규장") ? gyuImg : upload_img} 
            alt="주차장 이미지"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain'
            }}
          />
        </div>
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

        <button 
          className="pub-btn pub-btn-primary"
          onClick={startUse}
          style={isLeavingSoon ? {
            background: '#434343',
            color: '#FFFFFF'
          } : {}}
        >
          {isLeavingSoon ? "대기하기" : primary.label}
        </button>
      </div>
    </div>
  );
}
