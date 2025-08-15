import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import PreviousBtn from "../../components/Register/PreviousBtn";
import NextBtn from "../../components/Register/NextBtn";
import Address from "../../components/Register/Address";
import InputBox from "../../components/InputBox";
import AddImg from "../../components/Register/AddImg";
import "../../Styles/Register/DescriptionPage.css";
const DescriptionPage = () => {
    const [description, setDescription] = useState("");
    const [address, setAddress] = useState("");
    const [image, setImage] = useState(null);
    const [isActive, setIsActive] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const descOk = String(description ?? "").trim().length > 0;
        const addrOk = String(address ?? "").trim().length > 0;
        const imgOk= !!image;
        // const savedDescription = localStorage.getItem("register:description");

    setIsActive(descOk && addrOk && imgOk);
  }, [description, address, image]);

    const handleChange = (e)=>{
        const value = e.target.value;
        setDescription(value);
        localStorage.setItem("register:name", value);
    }
    
    const handleNext = () => {
        if (!isActive) return;
        navigate("/time");
    };

    return (
    
        <div className="Wrapper">
            <PreviousBtn/>

        <div>
            <h1 className="title"> 주차 장소 설명</h1>
            <p className="description">주차 위치를 이용자가 찾기 쉽도록 주차 장소에 대한
            <br/>설명을 작성해주세요!</p>
        </div>

        <div>
            <p className="address-title">주차 장소과 가장 근접한 위치</p>
            <Address/>
        </div>

        <div>
            <p className="img-title">주차 장소 사진&설명</p>
            <AddImg/>
        </div>

        <div className="input-wrapper">
            <InputBox 
                className = "input" 
                value={description}
                onChange={handleChange}
                placeholder="주차 장소 상세 설명" 
                maxLength={80}/>
        </div>
        
            <NextBtn
                disabled={!isActive} 
                onClick={handleNext} />
        </div>
    )
}

export default DescriptionPage;