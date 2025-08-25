import PreviousBtn from "../../components/Register/PreviousBtn";
import NextBtn from "../../components/Register/NextBtn";
import "../../Styles/Register/ConfirmFilePage.css";
import cf_plus from "../../Assets/cf-plus.svg";
import folder from "../../Assets/folder.svg";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParkingForm } from "../../store/ParkingForm";

const ConfirmFilePage = ({ onNext }) => {
  const [files, setFiles] = useState([]);
  const editingId = useParkingForm((s) => s.editingId);
  const isEditing = !!editingId;

  const handleUpload = (e) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const navigate = useNavigate();

  const isActive = true;


  const handleNext = async () => {
        navigate("/name");
    };    

  return (
    <div className="cf-wrap">
      <PreviousBtn />

      <div>
        <h1 className="cf-title">
          {isEditing ? (
            <>
              내 주차 장소 수정을 위한 <br />
              필수 확인
            </>
          ) : (
            <>
              내 주차 장소 등록을 위한 <br />
              필수 확인
            </>
          )}
        </h1>
        <p className="cf-desc">
          개인 소유 주차 장소인지 확인할 수 있도록
          <br />
          <span className="cf-desc-point">토지, 건물 관계 입증 서류</span>를
          준비해주세요.
          <br />
          EX) 토지매매서, 임대계약서
        </p>
      </div>

      <div className="cf-file-upload-wrap">
        <label className="cf-upload-btn">
          <img src={cf_plus} className="cf-plus" alt="" />
          파일 업로드하기
          <input
            type="file"
            multiple
            style={{ display: "none" }}
            onChange={handleUpload}
          />
        </label>

        <div className="cf-file-list">
          {files.map((file, idx) => (
            <div className="cd-file-item" key={idx}>
              <img src={folder} className="cf-folder" alt="" />
              <span className="cf-folder-name">{file.name}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="cf-description">시연을 위해 파일 업로드 없이 바로 다음으로 넘어갈 수 있습니다.</p>

<div className="cf-next-wrap">
        <NextBtn
          className="rg-nextBtn"
          isActive={isActive}
          onClick={handleNext}
        />
      </div>
    </div>
  );
};

export default ConfirmFilePage;
