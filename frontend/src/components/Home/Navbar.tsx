import { FaGithub, FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa';
import './Navbar.css';
import AnimatedNavbarChar from './AnimatedNavbarChar';

interface NavbarProps {
  isVisible: boolean;
}

const Navbar = ({ isVisible }: NavbarProps) => {
  const brandName = "Etheko.";

  return (
    <div className={`navbar-container ${isVisible ? 'visible' : ''}`}>
      <div className="navbar-brand">
        {brandName.split('').map((char, index) => (
          <AnimatedNavbarChar key={index} char={char} />
        ))}
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
        <a href="https://github.com/Etheko" target="_blank" rel="noopener noreferrer">
          <FaGithub size={24} />
        </a>
      </div>
    </div>
  );
};

export default Navbar;
