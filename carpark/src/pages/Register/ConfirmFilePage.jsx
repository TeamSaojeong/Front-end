import PreviousBtn from "../../components/Register/PreviousBtn";
import NextBtn from "../../components/Register/NextBtn";
import "../../Styles/Register/ConfirmFilePage.css";
import cf_plus from "../../Assets/cf-plus.svg";
import folder from "../../Assets/folder.svg";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ConfirmFilePage = ({ onNext }) => {
  const [files, setFiles] = useState([]);
  const handleUpload = (e) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const navigate = useNavigate();

  const handleNext = async () => {
    if (files.length > 0) {
      onNext?.(files);
      navigate("/name");
    }
  };

  return (
    <div className="cf-wrap">
      <PreviousBtn />

      <div>
        <h1 className="cf-title">
          내 주차 장소 등록을 위한 <br />
          필수 확인
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

      <div className="cf-next-wrap">
        <NextBtn
          className="rg-nextBtn"
          isActive={files.length > 0}
          onClick={handleNext}
        />
      </div>
    </div>
  );
};

export default ConfirmFilePage;
