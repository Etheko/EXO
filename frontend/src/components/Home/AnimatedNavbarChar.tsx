import { useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import './Navbar.css';

interface AnimatedNavbarCharProps {
  char: string;
}

const AnimatedNavbarChar = ({ char }: AnimatedNavbarCharProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const baseMarginLeft = char === 'e' ? 1.2 : 0;
  const baseMarginRight = char === 'e' ? 0.5 : 0;
  const hoverMarginIncrease = 1;

  const { transform, fontFamily, marginLeft, marginRight } = useSpring({
    transform: `scale(${isHovered ? 1.2 : 1})`,
    fontFamily: isHovered ? 'Jua, sans-serif' : 'Space Grotesk, sans-serif',
    marginLeft: isHovered ? baseMarginLeft + hoverMarginIncrease : baseMarginLeft,
    marginRight: isHovered ? baseMarginRight + hoverMarginIncrease : baseMarginRight,
    config: { mass: 0.5, tension: 400, friction: 15 },
    delay: isHovered ? 0 : 2000,
  });

  return (
    <animated.div
      className="char-container"
      style={{
        marginLeft,
        marginRight,
      }}
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
    </animated.div>
  );
};

export default AnimatedNavbarChar; 