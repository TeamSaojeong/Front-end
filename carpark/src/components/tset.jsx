import { useState } from "react"

const test = () => {
    const [data,setData] = useState([])
    const [isModal, setIsModal ] = useState(false);
    const [myIsModal, setMYIsModal ] = useState(false);
    useEffect(() => {
        const interval = async ()=> {
            setInterval({
                const getData = async () => { 
                    const res = await axios.get("https://api.example.com/api/feed");
                    if(res.data.isSuccess && res.data.data.message === "곧나감" && res.data.data.soon_id !== data.id){
                        setUserIsMOdal(true);

                        setData(res.data.data)
                    } else if(res.data.id === data.id) {
                        setMyIsMOdal(true);
                    }
                 }
                 getData()
            },10000);
        }
    },[])

    return (
        <div>
            {isModal && <div>test</div>}
            {isMyModal && <div>testtestsetsetestet</div>}
            <h1>test</h1>
        </div>
    )
}

export default test;