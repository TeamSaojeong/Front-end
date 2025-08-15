import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import InputBox from "../../components/InputBox";
import NextBtn from "../../components/Register/NextBtn";
import PreviousBtn from "../../components/Register/PreviousBtn";
import "../../Styles/Register/NamePage.css";
const NamePage = () => {
    const [name, setName] = useState("");
    const isActive = name.trim() !== ""; // 비활성 처리
    const navigate = useNavigate();

    useEffect(()=> {
        const savedName = localStorage.getItem("register:name");
        if(savedName) setName(savedName);
    }, []);

    const handleChange = (e)=>{
        const value = e.target.value;
        setName(value);
        localStorage.setItem("register:name", value);
    }

    const handleNext = () => {
        if(!isActive) return;
        navigate("/description");
    }
    return (
        <div className="Wrapper">
            <PreviousBtn/>
        <div>
            <h1 className="title">주차 장소 이름</h1>
            <div>
            <p className="description">가까운 주변 건물 이름을 활용하면 더욱 알기 쉬워요!
            <br/>
            EX) 'ㅇㅇㅇ대학교 앞 주차장'</p>
            </div>
        </div>
        
        <div>
            <p className="name">주차 장소 이름</p>
            
            <div className="input-wrapper">
            <InputBox 
                className = "input" 
                value={name}
                onChange={handleChange}
                placeholder="주차 장소 이름을 입력해 주세요(최대 25자)" 
                maxLength={25}/>
            </div>
        </div>
            <NextBtn
                disabled={!isActive} 
                onClick={handleNext} />
        </div>
    )
}

export default NamePage;

