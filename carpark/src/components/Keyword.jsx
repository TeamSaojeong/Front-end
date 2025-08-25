import React, { useEffect, useRef, useState, useCallback } from "react";
import "../Styles/Keyword.css";
import aisearch from "../Assets/aisearch.svg";
// 간단 디바운스 유틸

const useDebounced = (value, delay = 300) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

const Keyword = ({
value,
onSelect,
placeholder = "장소 검색"
}) =>{
  // 입력/검색 상태
  const [searchInput, setSearchInput] = useState(value ?? "");
  const [keyword, setKeyword] = useState(""); // 실제 검색에 사용
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

   // 자동완성(관련 검색어)
  const [suggestions, setSuggestions] = useState([]);
  const [openSuggest, setOpenSuggest] = useState(false);
  const [keywordSelected, setKeywordSelected] = useState(false); // 키워드 선택 여부
  const debouncedInput = useDebounced(searchInput, 300);


  // 페이지네이션
  const paginationRef = useRef(null);

  //외부에서 value가 바뀌면 인풋 동기화
   useEffect(()=>{
    if(typeof value === "string" && value !== searchInput){
      setSearchInput(value);
    }
  }, [value]);

  //검색 바깥 클릭하면 닫기
    useEffect(()=>{
      const onDocClick = (e) =>{
        //검색 래퍼 바깥을 클릭하면 닫기
        const wrap = document.querySelector(".kkm-search-wrap");
        if (wrap && !wrap.contains(e.target)) setOpenSuggest(false);
      };
      document.addEventListener("click", onDocClick);
      return () => document.removeEventListener("click", onDocClick);
    }, []);

    const onSubmit = (e) => {
    e.preventDefault();
    const q = (searchInput || "").trim();
    if (!q) return;
    // 제안 패널 닫고 실제 검색
    setOpenSuggest(false);
    setKeyword(q);
  };

    //본 검색
    const doSearch = useCallback(
    (page) => {
      if (!window.kakao?.maps?.services) {
        // setStatusMsg("Kakao services를 불러오지 못했습니다.");
        return;
      }
      const q = (keyword || "").trim();
      if (!q) {
        setPlaces([]);
        setStatusMsg("");
        paginationRef.current = null;
        return;
      }

      setIsLoading(true);
      setStatusMsg("");

      const ps = new window.kakao.maps.services.Places();

      const callback = (data, status, pagination) => {
        setIsLoading(false);
        if (status === window.kakao.maps.services.Status.OK) {
          setPlaces(data || []);
          if (paginationRef) {
            paginationRef.current = pagination;
          }
          setStatusMsg("");
        } 
        else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          setPlaces([]);
          if (paginationRef?.current) {
            paginationRef.current = null;
          }
          setStatusMsg("검색 결과가 없습니다.");
        } else {
          setPlaces([]);
          if (paginationRef?.current) {
            paginationRef.current = null;
          }
          setStatusMsg("검색 중 오류가 발생했습니다.");
        }
      };

      if (page && paginationRef?.current?.setPage) {
        paginationRef.current.setPage(page);
      } else {
        ps.keywordSearch(q, callback);
      }
    },
    [keyword]
  );


  // keyword 변경 시 본 검색 수행
  useEffect(() => {
    doSearch();
  }, [doSearch]);
    
  // 입력 내용이 바뀔 때마다 자동완성(관련 검색어) 호출
  useEffect(() => {
    console.log('[Keyword] 자동완성 호출:', { debouncedInput, kakaoLoaded: !!window.kakao?.maps?.services });
    
    if (!window.kakao?.maps?.services) {
      console.log('[Keyword] Kakao Maps API가 로드되지 않음');
      return;
    }
    
    const q = (debouncedInput || "").trim();
    if (!q) {
      setSuggestions([]);
      return;
    }

    console.log('[Keyword] 검색어:', q);

    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(q, (data, status) => {
      console.log('[Keyword] 검색 결과:', { status, dataLength: data?.length });
      
      if (status !== window.kakao.maps.services.Status.OK) {
        console.log('[Keyword] 검색 실패:', status);
        setSuggestions([]);
        return;
      }
      
      // 상위 4개만 관련 검색어로 사용 (place_name)
      const items = (data || []).slice(0, 4).map((d) => d.place_name);
      console.log('[Keyword] 제안 항목:', items);
      setSuggestions(items);
    });
  }, [debouncedInput]);


  const handleSelect = (p) =>{
    const name = p?.place_name || "";
    const addr = p?.road_address_name || p?.address_name || "";
    setSearchInput(name || addr);
    setKeyword(name||addr); // 선택 즉시 그 값으로 재검색
    
    setOpenSuggest(false); // 선택 후 리스트 닫기

    setPlaces([]);
    setStatusMsg("");
    if (paginationRef?.current) {
      paginationRef.current = null;
    }

    setKeyword(name || addr);

    //부모에게 전달 (위, 경도는 카카오 기준 : x=lon, y=lat)
    onSelect?.({
      place: p,
      name,
      address : addr,
      lat: p?.y ? Number(p.y) : undefined,
      lon: p?.x ? Number(p.x) : undefined,
    });
  };

  // 페이지네이션 렌더
  const renderPagination = () => {
    const p = paginationRef?.current;
    if (!p) return null;

    const goPage = (n) => {
      if (!p?.setPage) return;
      const next = Math.max(1, Math.min(p.last, n));
      p.setPage(next);
    };

    const items = [];
    for (let i = 1; i <= p.last; i += 1) {
      const isCurrent = i === p.current;
      items.push(
        <button
          key={i}
          type="button"
          disabled={isCurrent}
          onClick={() => goPage(i)}
          className={`kkm-page ${isCurrent ? "is-current" : ""}`}
        >
          {i}
        </button>
      );
    }
  
    return (
      <div className="kkm-pages">
        <button
          type="button"
          onClick={() => goPage(p.current - 1)}
          disabled={p.current === 1}
          className="kkm-page-nav"
        >
          이전
        </button>
        {items}
        <button
          type="button"
          onClick={() => goPage(p.current + 1)}
          disabled={p.current === p.last}
          className="kkm-page-nav"
        >
          다음
        </button>
      </div>
    );
  };

  return (
    <div className="kkm-search-wrap">
      {/* 검색 필드 */}
      <form className="kkm-search" onSubmit={onSubmit}>
        <span className="kkm-ico" aria-hidden>
        <img src={aisearch} />
        </span>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setKeywordSelected(false); // 새로운 입력 시 키워드 선택 상태 리셋
          }}
          onFocus={() => setOpenSuggest(true)}
          placeholder={placeholder}
          className="kkm-input"
          aria-autocomplete="list"
          aria-expanded={openSuggest}
          onKeyDown={(e) => {
            // 엔터키로 첫 번째 제안 선택
            if (e.key === 'Enter' && suggestions.length > 0 && openSuggest) {
              e.preventDefault();
              const firstSuggestion = suggestions[0];
              setSearchInput(firstSuggestion);
              setOpenSuggest(false);
              setKeywordSelected(true); // 키워드 선택됨
              setKeyword(firstSuggestion);
              
              // 엔터키 선택 시에도 위도/경도 정보 가져오기
              const ps = new window.kakao.maps.services.Places();
              ps.keywordSearch(firstSuggestion, (data, status) => {
                if (status === window.kakao.maps.services.Status.OK && data && data.length > 0) {
                  const place = data[0]; // 첫 번째 결과 사용
                  const name = place?.place_name || firstSuggestion;
                  const addr = place?.road_address_name || place?.address_name || "";
                  
                  console.log('[Keyword] 엔터키 선택 결과:', { name, addr, lat: place?.y, lon: place?.x });
                  
                  // 부모에게 전달
                  onSelect?.({
                    place,
                    name,
                    address: addr,
                    lat: place?.y ? Number(place.y) : undefined,
                    lon: place?.x ? Number(place.x) : undefined,
                  });
                }
              });
            }
          }}
          onBlur = {() => { // 포커스 아웃
            //클릭으로 항목을 고르는 순간 blur먼저 발생
            // 아주 짧게 지연해서 클릭 핸들러가 먼저 실행되도록
            setTimeout(()=> setOpenSuggest(false), 0);
          }}
        />
        {/* submit 버튼은 숨김(모바일 키보드용 enter 제출) */}
        <button type="submit" className="kkm-hidden-submit" aria-hidden />
      </form>

      {/* 관련 검색어 패널 */}
      {openSuggest && suggestions.length > 0 && (
        <div
          className="kkm-suggest"
          onMouseDown={(e) => e.preventDefault()} // 클릭 시 input 블러 방지
        >
          {suggestions.map((s, i) => (
            <button
              key={`${s}-${i}`}
              type="button"
              className="kkm-suggest-item"
              onClick={() => {
                console.log('[Keyword] 제안 선택:', s);
                setSearchInput(s);
                setOpenSuggest(false);
                setKeywordSelected(true); // 키워드 선택됨
                setKeyword(s); // 제안 선택 즉시 본 검색
                
                // 키워드 선택 시에도 위도/경도 정보 가져오기
                const ps = new window.kakao.maps.services.Places();
                ps.keywordSearch(s, (data, status) => {
                  if (status === window.kakao.maps.services.Status.OK && data && data.length > 0) {
                    const place = data[0]; // 첫 번째 결과 사용
                    const name = place?.place_name || s;
                    const addr = place?.road_address_name || place?.address_name || "";
                    
                    console.log('[Keyword] 키워드 선택 결과:', { name, addr, lat: place?.y, lon: place?.x });
                    
                    // 부모에게 전달
                    onSelect?.({
                      place,
                      name,
                      address: addr,
                      lat: place?.y ? Number(place.y) : undefined,
                      lon: place?.x ? Number(place.x) : undefined,
                    });
                  }
                });
                
                // 입력 필드에 포커스 유지 (선택적)
                // setTimeout(() => {
                //   document.querySelector('.kkm-input')?.focus();
                // }, 100);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      


      {/* 검색 결과 목록 - 키워드 선택 후에는 숨김 */}
      {places.length > 0 && !openSuggest && !keywordSelected && (
        <>
          <ul className="kkm-ul">
            {places.map((p, idx) => (
              <li key={`${p.id}-${idx}`} className="kkm-li">
                <button
                  type="button"
                  className="kkm-li-body"     // 기존 div 대신 버튼으로
                  onClick={() => handleSelect(p)}
                >
                  <div className="kkm-li-no">{idx + 1}</div>
                  <div>
                    <div className="kkm-li-name">{p.place_name}</div>
                    <div className="kkm-li-addr">
                      {p.road_address_name || p.address_name}
                    </div>
                    {p.phone && <div className="kkm-li-sub">{p.phone}</div>}
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {/* 페이지네이션 */}
          {renderPagination()}
        </>
      )}
    </div>
  );
}

export default Keyword;