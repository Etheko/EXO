import {
  TbBrandGithub,
  TbBrandInstagram,
  TbBrandLinkedin,
  TbBrandX,
  TbChevronLeft,
} from 'react-icons/tb';
import './Navbar.css';
import AnimatedNavbarChar from './AnimatedNavbarChar';
import SentientIOB from '../SentientIOB';

interface NavbarProps {
  isVisible: boolean;
  onBrandClick?: () => void;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

const Navbar = ({ isVisible, onBrandClick, showBackButton = false, onBackClick }: NavbarProps) => {
  const brandName = "Etheko.";

  const handleBrandClick = () => {
    if (onBrandClick) {
      onBrandClick();
    }
  };

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    }
  };

  return (
    <div className={`navbar-container ${isVisible ? 'visible' : ''}`}>
      <div className="navbar-left-section">
        <div className={`navbar-brand ${showBackButton ? 'shifted' : ''}`} onClick={handleBrandClick}>
          {brandName.split('').map((char, index) => (
            <AnimatedNavbarChar key={index} char={char} />
          ))}
        </div>
        <div className={`navbar-back-button ${showBackButton ? 'visible' : ''}`}>
          <SentientIOB onClick={handleBackClick} as="button">
            <TbChevronLeft size={26} />
          </SentientIOB>
        </div>
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
