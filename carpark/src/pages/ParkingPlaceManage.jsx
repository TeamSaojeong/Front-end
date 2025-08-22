// src/pages/ParkingPlaceManage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/ParkingPlaceManage.css";
import backIcon from "../Assets/arrow.png";
import { useMyParkings } from "../store/MyParkings";
import { useParkingForm } from "../store/ParkingForm";
import { client } from "../apis/client";

export default function ParkingPlaceManage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const places = useMyParkings((s) => s.items);
  const toggleEnabled = useMyParkings((s) => s.toggleEnabled);
  const remove = useMyParkings((s) => s.remove);
  const replaceAll = useMyParkings((s) => s.replaceAll);
  const upsert = useMyParkings((s) => s.upsert);
  const loadFromPlace = useParkingForm((s) => s.loadFromPlace);

  // 서버와 연동된 토글 기능
  const handleToggle = async (parking) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
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

      console.log(`[TOGGLE] ${parking.name} 토글: ${newOperate ? 'ON' : 'OFF'}`);
    } catch (error) {
      console.error("[TOGGLE] 토글 실패:", error);
      alert("토글 변경에 실패했습니다.");
    }
  };

  // 서버에서 최신 주차장 목록 가져오기
  const syncWithServer = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      setLoading(true);
      const { data } = await client.get("/api/parking", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("[SYNC] 서버 응답:", data);
      
      // 서버 데이터를 로컬 store에 반영 (기존 enabled 상태 보존)
      const currentItems = places || [];
      const serverParkings = (data?.data || []).map(parking => {
        const parkingId = parking.parkingId || parking.id;
        
        // 기존 아이템에서 정보 찾기 (좌표, enabled 상태 등)
        const existingItem = currentItems.find(item => String(item.id) === String(parkingId));
        
        return {
          id: parkingId,
          name: parking.parkingName || parking.name || `주차장 ${parkingId}`,
          // 서버에 좌표가 없으므로 기존 데이터 유지 (npm start 후에도 보존)
          lat: existingItem?.lat ?? null,
          lng: existingItem?.lng ?? null,
          address: existingItem?.address ?? "",
          content: existingItem?.content ?? "",
          operateTimes: existingItem?.operateTimes ?? [],
          charge: existingItem?.charge ?? 0,
          imageUrl: existingItem?.imageUrl ?? null,
          enabled: parking.operate ?? existingItem?.enabled ?? true,
          origin: "server"
        };
      });
      
      console.log("[SYNC] 가공된 데이터:", serverParkings);
      
      replaceAll(serverParkings);
      console.log("[SYNC] 동기화 완료:", serverParkings);
    } catch (error) {
      console.error("[SYNC] 동기화 실패:", error);
      alert("서버와 동기화에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 자동 동기화
  useEffect(() => {
    syncWithServer();
  }, []);

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
