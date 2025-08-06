import styled from "styled-components";
import { Outlet } from "react-router-dom";
const LayoutWrapper = styled.div `
    display: flex;
    justify-content: center;
    width: 100%;
    height: 100vh;
    background-color: #FFFFFF;
`;

const AppContainer = styled.div `
    width: 100%;
    max-width: 390px;
    height: 100%;
    background-color: white;
    
    //테스트용
    // border: 2px solid #111111;
    // box-sizing: border-box;
`;

const WebLayout = () => {
    return (
        <LayoutWrapper>
            <AppContainer>
                <Outlet />
            </AppContainer>
        </LayoutWrapper>
    );
};

export default WebLayout;
