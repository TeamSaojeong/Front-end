'use client'; // 브라우저에서 동작한 컴포넌트 명시 

import React from 'react';
import {Box, styled, useTheme} from '@mui/material'; // 구글 material design
import { QRCodeSVG } from 'qrcode.react';

const Container = styled(Box)({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
});

function QrCodeMaker({address, size=108, bgColor = null}){
    const theme = useTheme();

    return(
        <Container>
            <QRCodeSVG
            value={address} // qr 코드로 인코딩할 값(url, 텍스트 등)
            size={size} // qr 코드의 크기(기본값은 128px)
            bgColor={bgColor ? bgColor : theme.palette.background.paper} // qr코드 배경색 (기본 : 흰색)
            fgColor={theme.palette.mode === 'dark' ? '#fff' : '#000'} // qr 코드 전경색 (기본 : 검정)
            />
        </Container>
    );
}

export default QrCodeMaker;
