import {
  TbBrandGithub,
  TbBrandInstagram,
  TbBrandLinkedin,
  TbBrandX,
} from 'react-icons/tb';
import './Navbar.css';
import AnimatedNavbarChar from './AnimatedNavbarChar';

interface NavbarProps {
  isVisible: boolean;
  onBrandClick?: () => void;
}

const Navbar = ({ isVisible, onBrandClick }: NavbarProps) => {
  const brandName = "Etheko.";

  const handleBrandClick = () => {
    if (onBrandClick) {
      onBrandClick();
    }
  };

  return (
    <div className={`navbar-container ${isVisible ? 'visible' : ''}`}>
      <div className="navbar-brand" onClick={handleBrandClick}>
        {brandName.split('').map((char, index) => (
          <AnimatedNavbarChar key={index} char={char} />
        ))}
      </div>
      <div className="navbar-socials">
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
          <TbBrandInstagram size={24} />
        </a>
        <a href="https://x.com" target="_blank" rel="noopener noreferrer">
          <TbBrandX size={24} />
        </a>
        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
          <TbBrandLinkedin size={24} />
        </a>
        <a href="https://github.com/Etheko" target="_blank" rel="noopener noreferrer">
          <TbBrandGithub size={24} />
        </a>
      </div>
    </div>
  );
};

export default Navbar;
