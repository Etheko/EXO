import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import './App.css';
import Home from './components/Home';
import Projects from './components/Projects';
import { CursorProvider } from './contexts/CursorContext';
import Cursor from './components/Cursor';
import LoginService from './services/LoginService';

function App() {
  // Initialize authentication header when app starts
  useEffect(() => {
    LoginService.initializeAuthHeader();
  }, []);

  return (
    <CursorProvider>
      <Cursor />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects onProjectSelected={() => {}} onBackToIndex={() => {}} />} />
        </Routes>
      </Router>
    </CursorProvider>
  );
}

export default App;
