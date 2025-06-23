import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Projects from './components/Projects';
import { CursorProvider } from './contexts/CursorContext';
import Cursor from './components/Cursor';

function App() {
  return (
    <CursorProvider>
      <Cursor />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects onProjectSelected={() => {}} />} />
        </Routes>
      </Router>
    </CursorProvider>
  );
}

export default App;
