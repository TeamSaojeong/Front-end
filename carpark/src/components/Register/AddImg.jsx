import { useRef, useState, useEffect } from "react";
import Upload_Img from "../../Assets/upload_img.svg";
import "../../Styles/Register/AddImg.css";
import { shrinkImageFile } from "../../utils/imageShrink";

const AddImg = ({ onChange, value }) => {
  const [imageSrc, setImageSrc] = useState(null);

  // value prop이 변경될 때 이미지 미리보기 업데이트
  useEffect(() => {
    console.log("[AddImg] value prop 변경:", {
      hasValue: !!value,
      valueType: value ? typeof value : 'null',
      isFile: value instanceof File,
      valueName: value?.name
    });
    
    if (value && value instanceof File) {
      const reader = new FileReader();
      reader.readAsDataURL(value);
      reader.onload = () => {
        setImageSrc(reader.result || null);
      };
    } else {
      setImageSrc(null);
    }
  }, [value]);

  const onUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert("이미지 파일 크기는 5MB 이하여야 합니다.");
      return;
    }
    
    try {
      // 이미지 크기 조절 (박스에 딱 맞게)
      const resizedFile = await shrinkImageFile(file, {
        maxW: 342,  // pub-photo-box 너비에 맞게 조절
        maxH: 192,  // pub-photo-box 높이에 맞게 조절
        quality: 0.85,
        targetBytes: 300 * 1024, // 300KB 목표
      });
      
      const reader = new FileReader();
      reader.readAsDataURL(resizedFile);
      reader.onload = () => {
        setImageSrc(reader.result || null);
      };
      onChange?.(resizedFile);
      console.log("[AddImg] 이미지 크기 조절 완료:", {
        originalSize: file.size,
        resizedSize: resizedFile.size,
        originalName: file.name
      });
    } catch (error) {
      console.warn("[AddImg] 이미지 크기 조절 실패, 원본 사용:", error);
      // 크기 조절 실패 시 원본 사용
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setImageSrc(reader.result || null);
      };
      onChange?.(file);
    }
  };

  return (
    <div className="add_img_wrap">
      <label
        htmlFor="file-upload"
        className="add_img_file-label"
        style={{ display: "block", cursor: "pointer" }}
      >
        <div
          className="add_img_upload"
          role="button"
          aria-label="이미지 업로드"
        >
          {imageSrc ? (
            <img src={imageSrc} alt="업로드 이미지" className="preview-img" />
          ) : (
            <img
              src={Upload_Img} // 아이콘 경로
              alt="이미지 아이콘"
              className="add_img_icon"
            />
          )}
        </div>
      </label>

      <input
        id="file-upload"
        type="file"
        accept="image/*"
        onChange={onUpload}
        className="add_img_input"
      />
    </div>
  );
};

export default AddImg;
