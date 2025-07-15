import { useState } from 'react';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import Signup from './pages/client/Signup';

function App() {
  return (
    <>
      <Routes>
        <Route path='/auth/signup' element={<Signup />} />
      </Routes>
    </>
  );
}

export default App;
