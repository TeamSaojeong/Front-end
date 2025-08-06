import QRCodeMaker from "../components/QRCode/QRCodeMaker";
const QRCodePage =()=>{
    return(
        <>
            <h1>QR CODE</h1>
            <QRCodeMaker address="https://www.naver.com" />
        </>
    )
}

export default QRCodePage;