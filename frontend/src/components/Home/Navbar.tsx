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
        <SentientIOB href="https://instagram.com" as="a" hoverScale={1}>
          <TbBrandInstagram size={18} />
        </SentientIOB>
        <SentientIOB href="https://x.com" as="a" hoverScale={1}>
          <TbBrandX size={18} />
        </SentientIOB>
        <SentientIOB href="https://linkedin.com" as="a" hoverScale={1}>
          <TbBrandLinkedin size={18} />
        </SentientIOB>
        <SentientIOB href="https://github.com/Etheko" as="a" hoverScale={1}>
          <TbBrandGithub size={18} />
        </SentientIOB>
      </div>
    </div>
  );
};

export default Navbar;
