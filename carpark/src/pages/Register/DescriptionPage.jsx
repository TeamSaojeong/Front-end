// import {useState} from "react";
// import {useNavigate} from "react-router-dom";
// import PreviousBtn from "../../components/Register/PreviousBtn";
// import NextBtn from "../../components/Register/NextBtn";
// import Address from "../../components/Register/Address";

// const Description = () => {
//     const[description, setDescription] = useState();
//     const isActive = a;
//     const navigate = useNavigate();

// const handleNext = () => {
//         if(!isActive) return;
//         navigate("/description");
//     }
//     return (
//     <>
//         <div className="Wrapper">
//                     <PreviousBtn/>
//         </div>

//         <div>
//             <h1 className="title"> 주차 장소 설명</h1>
//             <p className="description">주차 위치를 이용자가 찾기 쉽도록 주차 장소에 대한 설명을 작성해주세요!
//             <br/>설명을 작성해주세요!</p>
//         </div>

//         <div>
//             <p className="address-title">주차 장소과 가장 근접한 위치</p>
//             <Address/>
//         </div>

//         <div>
//             <p className="img-title">주차 장소 사진&설명</p>

//         </div>

//         <div className="input-wrapper">
//             <InputBox 
//                 className = "input" 
//                 value={description}
//                 placeholder="주차 장소 상세 설명" 
//                 maxLength={80}/>
//         </div>
        
//         <div>
//             <NextBtn
//                 disabled={!isActive} 
//                 onClick={handleNext} />
//         </div>
//         </>
//     )
// }

// export default Description;