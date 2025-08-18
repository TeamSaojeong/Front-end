import PreviousBtn from "../components/Register/PreviousBtn";
import AISearch from "../components/AISearch";
import "../Styles/AIPredict.css";
import NextBtn from "../components/Register/NextBtn";
import { useNavigate } from "react-router-dom";
const AIPredict = () =>{

    const navigate = useNavigate();

    const handleNext = () => {
    // if (!isActive) return;
    navigate("/airesult");
  };

    return (
        <div className="ai-wrap">
            <PreviousBtn />
            
            
            <h1 className="ai-title">AI 주차 예보</h1>
            <p className="ai-desc">
                장소와 시간을 입력하면,
                <br/>그 주변 구역의 주차 혼잡도를 미리 알려드립니다!
            </p>
        
            <div>
                <p className="ai-name">주차 장소 이름</p>
                <AISearch />
            </div>
            
            <div>
                <div></div>
                {/*timepicker */}
            </div>

            <NextBtn 
                // disabled={!isActive}
                onClick={handleNext}/>
        </div>
    );
}

export default AIPredict;