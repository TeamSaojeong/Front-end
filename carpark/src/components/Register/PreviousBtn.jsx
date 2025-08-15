import previous from "../../Assets/previous.svg";
import { useNavigate } from "react-router-dom";
import "../../Styles/Register/Previous.css";

const PreviousBtn = ({children}) => {
    const navigate = useNavigate();

    return (
        <div className="back">
            <div className="back-inner">
            <img className="previousImg" src={previous} onClick={() => navigate(-1)} />
            {children}
        </div>
        </div>
    );
}

export default PreviousBtn;
