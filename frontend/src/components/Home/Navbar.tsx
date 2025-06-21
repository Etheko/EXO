import { FaGithub, FaLinkedin, FaInstagram, FaTwitter } from 'react-icons/fa';
import './Navbar.css';

interface NavbarProps {
  isVisible: boolean;
}

const Navbar = ({ isVisible }: NavbarProps) => {
  return (
    <div className={`navbar-container ${isVisible ? 'visible' : ''}`}>
      <div className="navbar-brand">
        Etheko.
      </div>
      <div className="navbar-socials">
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
          <FaInstagram size={24} />
        </a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
          <FaTwitter size={24} />
        </a>
        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
          <FaLinkedin size={24} />
        </a>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer">
          <FaGithub size={24} />
        </a>
      </div>
    </div>
  );
};

export default Navbar;
