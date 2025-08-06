import styled from "styled-components";
const NotFound = () =>{
    return (
        <Container>
            <h1>404 not found</h1>
            <p>해당 페이지를 찾을 수 없습니다.</p>
            <button onClick={()=>(window.location.href="/")}> Back </button>
        </Container>
    )
}

export default NotFound;

const Container = styled.div`
    text-align: center;
    margin-top: 100px;
    font-size: 24px;
`;