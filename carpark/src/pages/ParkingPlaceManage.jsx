// src/pages/ParkingPlaceManage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/ParkingPlaceManage.css";
import backIcon from "../Assets/arrow.png";
import { useMyParkings } from "../store/MyParkings";
import { useParkingForm } from "../store/ParkingForm";
import { getMyParkings } from "../apis/parking";
import { client } from "../apis/client";

export default function ParkingPlaceManage() {
  const navigate = useNavigate();

  // ✅ 내가 소유한 주차장만 가져오기
  const allItems = useMyParkings((s) => s.items);
  const getMyItems = useMyParkings((s) => s.getMyItems);
  const getCurrentUser = useMyParkings((s) => s.getCurrentUser);
  const toggleEnabled = useMyParkings((s) => s.toggleEnabled);
  const remove = useMyParkings((s) => s.remove);
  const replaceAll = useMyParkings((s) => s.replaceAll);
  const upsert = useMyParkings((s) => s.upsert);
  const loadFromPlace = useParkingForm((s) => s.loadFromPlace);
  
  // ✅ 서버 기반 데이터로 전환
  const [serverPlaces, setServerPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ 토큰 기반 현재 사용자 확인
  const currentUser = getCurrentUser();
  const allItemsDebug = allItems || [];
  
  // ✅ 서버 데이터와 로컬 데이터 모두에서 내 주차장만 필터링
  const myServerPlaces = serverPlaces.filter(place => {
    // 서버 데이터의 경우 등록자 정보로 필터링 (임시로 모든 데이터 표시 안함)
    return false; // 백엔드에서 소유자 정보를 제공하지 않으므로 서버 데이터는 제외
  });
  
  const myLocalPlaces = getMyItems(); // 이미 토큰 기반 필터링됨
  const places = [...myServerPlaces, ...myLocalPlaces]; // 로컬 데이터 우선
  
  // ✅ 로컬 스토리지 원본 데이터 확인
  const rawStorageData = localStorage.getItem('my-parkings');
  const parsedStorage = rawStorageData ? JSON.parse(rawStorageData) : null;
  
  console.log("[MANAGE] 🔍 스토리지 원본 데이터:", parsedStorage);
  console.log("[MANAGE] 🔍 상세 디버깅:", {
    현재사용자: currentUser,
    전체아이템수: allItemsDebug.length,
    전체아이템상세: allItemsDebug.map(item => ({
      id: item.id,
      name: item.name,
      owner: item.owner,
      ownerType: typeof item.owner,
      currentUserType: typeof currentUser,
      소유자일치: item.owner === currentUser,
      소유자완전일치: String(item.owner) === String(currentUser)
    })),
    필터링후개수: places.length,
    필터링후상세: places.map(p => ({
      id: p.id,
      name: p.name,
      owner: p.owner
    }))
  });
  
  // 🔍 추가 디버깅: localStorage 직접 확인
  const rawStorage = localStorage.getItem('my-parkings');
  console.log("[MANAGE] 🗄️ localStorage 원본:", rawStorage ? JSON.parse(rawStorage) : null);

  // 서버와 연동된 토글 기능 (내 주차장만)
  const handleToggle = async (parking) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    // ✅ 내 주차장인지 확인
    if (!parking.isMyParking && parking.origin !== "server") {
      alert("본인이 등록한 주차장만 토글할 수 있습니다.");
      return;
    }

    try {
      console.log(`[TOGGLE] ${parking.name} 토글 시작:`, parking.enabled ? 'OFF' : 'ON');
      
      // 서버에 토글 상태 전송
      const { data } = await client.patch(`/api/parking/${parking.id}/operate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("[TOGGLE] 서버 응답:", data);

      // 응답에서 새로운 상태 확인
      const newOperate = data?.data?.operate ?? !parking.enabled;
      
      // 로컬 상태 업데이트
      upsert({
        ...parking,
        enabled: newOperate
      });

      console.log(`[TOGGLE] ${parking.name} 토글 완료: ${newOperate ? 'ON' : 'OFF'}`);
    } catch (error) {
      console.error("[TOGGLE] 토글 실패:", error);
      
      if (error?.response?.status === 403) {
        alert("본인이 등록한 주차장만 토글할 수 있습니다.");
      } else if (error?.response?.status === 401) {
        alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
        navigate("/login");
      } else {
        alert("토글 변경에 실패했습니다.");
      }
    }
  };

    // 서버에서 내가 등록한 주차장 목록만 가져오기
  const syncWithServer = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      setLoading(true);
      
      // ✅ 내가 등록한 주차장만 조회하는 API 호출
      const response = await getMyParkings();
      const data = response.data;
      
      console.log("[SYNC] 서버 응답 (내 주차장만):", data);
      
      // ✅ 현재 로그인한 사용자 정보 확인
      const currentUser = getCurrentUser(); // ✅ JWT 기반으로 통일
      console.log("[SYNC] 현재 사용자:", currentUser);
      
      // 서버 데이터를 로컬 store에 반영 (기존 enabled 상태 보존)
      const currentItems = places || [];
      const serverParkings = (data?.data || []).map(parking => {
        const parkingId = parking.parking_id || parking.parkingId || parking.id;
        
        // 기존 아이템에서 정보 찾기 (좌표, enabled 상태 등)
        const existingItem = currentItems.find(item => String(item.id) === String(parkingId));
        
        return {
          id: String(parkingId),
          name: parking.name || parking.parkingName || `주차장 ${parkingId}`,
          // 서버에서 좌표 제공됨!
          lat: parking.lat != null ? Number(parking.lat) : existingItem?.lat ?? null,
          lng: parking.lng != null ? Number(parking.lng) : existingItem?.lng ?? null,
          // 나머지는 기존 데이터 유지 (서버에서 제공되지 않음)
          address: existingItem?.address ?? "",
          content: existingItem?.content ?? "",
          operateTimes: existingItem?.operateTimes ?? [],
          charge: existingItem?.charge ?? 0, // 기존 값 완전 보존
          imageUrl: existingItem?.imageUrl ?? null,
          enabled: parking.operate ?? existingItem?.enabled ?? true,
          origin: "server",
          isMyParking: true, // ✅ 내가 등록한 주차장 표시
          owner: currentUser // ✅ 소유자 정보 추가
        };
      });
      
      console.log("[SYNC] 가공된 데이터 (내 주차장만):", serverParkings);
      console.log("[SYNC] 총 개수:", serverParkings.length);
      
      // ✅ 서버 데이터와 로컬 데이터 병합 (덮어쓰기 방지)
      const existingItems = allItems || [];
      
      // 서버에서 온 데이터로 업데이트하되, 기존 로컬 데이터는 유지
      serverParkings.forEach(serverParking => {
        upsert(serverParking);
      });
      
      console.log("[SYNC] 동기화 완료:", {
        서버데이터: serverParkings.length,
        현재사용자: currentUser,
        전체아이템: existingItems.length,
        내아이템: getMyItems().length
      });
    } catch (error) {
      console.error("[SYNC] 동기화 실패:", error);
      
      // 401 오류 시 로그인 페이지로 이동
      if (error?.response?.status === 401) {
        localStorage.removeItem("accessToken");
        alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
        navigate("/login");
        return;
      }
      
      alert("서버와 동기화에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 🔧 개발자 도구: 로컬 스토리지 초기화 (테스트용)
  const resetLocalStorage = () => {
    console.log("[MANAGE] 🚨 로컬 스토리지 초기화 실행");
    replaceAll([]); // 모든 주차장 데이터 삭제
    localStorage.removeItem('my-parkings'); // 로컬 스토리지도 삭제
    console.log("[MANAGE] ✅ 초기화 완료 - 새로 주차장을 등록해주세요");
  };
  
  // 🔧 현재 사용자의 데이터만 삭제 (다른 사용자 데이터는 보존)
  const clearMyDataOnly = () => {
    const currentUser = getCurrentUser();
    const allItems = useMyParkings.getState().items || [];
    const otherUsersData = allItems.filter(item => item.owner !== currentUser);
    
    console.log("[MANAGE] 🧹 내 데이터만 삭제:", {
      전체: allItems.length,
      내꺼: allItems.length - otherUsersData.length,
      남은거: otherUsersData.length
    });
    
    replaceAll(otherUsersData);
  };
  
  // 개발자 도구에서 사용 가능하도록 전역 함수 등록
  if (typeof window !== 'undefined') {
    window.resetParkingData = resetLocalStorage;
    window.clearMyDataOnly = clearMyDataOnly;
  }

  // ✅ 서버에서 내 주차장만 가져오기
  const fetchMyParkingsFromServer = async () => {
    setLoading(true);
    try {
      console.log("[MANAGE] 🔄 서버에서 내 주차장 조회...");
      const response = await getMyParkings(); // 내 주차장만 조회하는 API
      const data = response?.data?.data || response?.data || [];
      
      console.log("[MANAGE] 📡 서버 응답:", {
        개수: data.length,
        목록: data.map(p => ({ 
          id: p.parking_id || p.id, 
          name: p.name,
          owner: p.owner_email || '서버'
        }))
      });
      
      // 서버 데이터 변환
      const serverData = data.map(parking => ({
        id: String(parking.parking_id || parking.id),
        name: parking.name || '이름 없음',
        address: parking.address || '',
        charge: parking.charge || 0,
        lat: parking.lat,
        lng: parking.lng,
        operateTimes: parking.operate_times || [],
        enabled: parking.operate !== false,
        origin: 'server'
      }));
      
      setServerPlaces(serverData);
      console.log("[MANAGE] ✅ 서버 데이터 로드 완료:", serverData.length);
      
    } catch (error) {
      console.error("[MANAGE] ❌ 서버 조회 실패:", error);
      console.log("[MANAGE] 🔄 로컬 스토리지로 폴백");
      // 서버 실패 시 로컬 데이터 사용
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 서버에서 데이터 로드
  useEffect(() => {
    fetchMyParkingsFromServer();
  }, []); // ✅ 마운트 시에만 실행

  const edit = (p) => {
    loadFromPlace(p); // ✅ 기존 데이터 주입
    navigate("/confirm"); // ✅ confirm부터 시작하도록 수정
  };

  const removeWatched = (id) => {
    try {
      const raw = localStorage.getItem("watchedPlaceIds");
      const ids = raw ? JSON.parse(raw) : [];
      const next = ids.filter((x) => String(x) !== String(id));
      localStorage.setItem("watchedPlaceIds", JSON.stringify(next));
    } catch {}
  };

  const onDelete = (p) => {
    if (!window.confirm(`'${p.name || "(이름 없음)"}'을(를) 삭제할까요?`))
      return;
    remove(p.id);
    removeWatched(p.id);
    // 선택된 상세 정리
    try {
      const raw = sessionStorage.getItem("selectedPlace");
      const sp = raw ? JSON.parse(raw) : null;
      if (sp && String(sp.id) === String(p.id)) {
        sessionStorage.removeItem("selectedPlace");
      }
    } catch {}
  };

  return (
    <div className="ppm-wrap">
      <header className="ppm-top">
        <button
          className="ppm-back"
          onClick={() => navigate("/home")}
          aria-label="뒤로가기"
        >
          <img src={backIcon} alt="" />
        </button>
        <h1 className="ppm-title">
          주차 장소 관리 {loading && "(동기화 중...)"}
        </h1>
      </header>

      <ul className="ppm-list">
        {(places || []).map((p) => {
          return (
            <li key={p.id} className="ppm-item">
              <div className="ppm-left">
                <div className={`ppm-name ${!p.enabled ? "disabled" : ""}`}>
                  {p.name?.trim() || `(이름 없음 #${p.id})`}
                </div>

                <div className="ppm-actions">
                  <button
                    className={`ppm-edit ${!p.enabled ? "disabled" : ""}`}
                    onClick={() => edit(p)}
                    type="button"
                  >
                    수정하기 <span className="ppm-chevron">›</span>
                  </button>

                  <button
                    className="ppm-delete"
                    onClick={() => onDelete(p)}
                    type="button"
                    aria-label={`${p.name} 삭제`}
                  >
                    삭제
                  </button>
                </div>
              </div>

              <label className={`ppm-switch ${p.enabled ? "on" : "off"}`}>
                <input
                  type="checkbox"
                  checked={!!p.enabled}
                  onChange={() => handleToggle(p)}
                  aria-label={`${p.name} 사용 여부`}
                />
                <span className="ppm-knob" />
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
