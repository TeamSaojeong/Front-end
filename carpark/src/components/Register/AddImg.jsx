import { useRef, useState } from "react";
import Upload_Img from "../../Assets/upload_img.svg";
import "../../Styles/Register/AddImg.css";

const AddImg = ({onChange}) => {
  const [imageSrc, setImageSrc] = useState(null);

  const onUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {setImageSrc(reader.result || null);};
    onChange?.(file);
  };

  return (
    <div className="add_img_wrap">
      <label htmlFor="file-upload" className="file-label" style={{ display: "block", cursor: "pointer" }}>
        <div className="add_img" role="button" aria-label="이미지 업로드">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="업로드 이미지"/>
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