import React from 'react'
import {Routes,Route,Navigate} from 'react-router-dom'
// import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'



const App = () => {
  return (
    <div className='px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]'>
      <Routes>
        {/* <Route path='/' element={<Home /> } /> */}
        <Route path='/login' element={<LoginPage />} />
        <Route path='/signup' element={<SignupPage />} />


      </Routes>
      
    </div>
  )
}

export default App
