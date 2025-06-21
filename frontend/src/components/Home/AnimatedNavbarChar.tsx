import { useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import './Navbar.css';

interface AnimatedNavbarCharProps {
  char: string;
}

const AnimatedNavbarChar = ({ char }: AnimatedNavbarCharProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const { transform, fontFamily } = useSpring({
    transform: `scale(${isHovered ? 1.2 : 1})`,
    fontFamily: isHovered ? 'Jua, sans-serif' : 'Space Grotesk, sans-serif',
    config: { mass: 0.5, tension: 400, friction: 15 },
  });

  const containerStyle = {
    marginLeft: char === 'e' ? '1.2px' : '0',
    marginRight: char === 'e' ? '0.5px' : '0',
  };

  return (
    <div
      className="char-container"
      style={containerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <animated.span
        style={{
          display: 'inline-block',
          transform,
          fontFamily,
        }}
      >
        {char}
      </animated.span>
    </div>
  );
};

export default AnimatedNavbarChar; 