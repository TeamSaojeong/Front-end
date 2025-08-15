// import {useState} from "react";
// import {useNavigate} from "react-router-dom";
// import InputBox from "../../components/InputBox";
// import NextBtn from "../../components/Register/NextBtn";
// import PreviousBtn from "../../components/Register/PreviousBtn";
import TimePicker from "../../components/Register/TimePicker";
// import "../../Styles/Register/NamePage.css";
const TimePage = () => {
//     const [time, setTime] = useState("");
//     const navigate = useNavigate();


//     const handleNext = () => {
//         if() return;
//         navigate("/description");
//     }
    return (
//     <>
//         <div className="Wrapper">
//                     <PreviousBtn/>
//         </div>
//             <h1 className="title">주차 가능 시간 설정</h1>
//             <div className>

//             </div>
//             </>
        <div style={{padding: 24}}>
            <TimePicker/>
        </div>
    )
}

export default TimePage;