import { useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import './Navbar.css';

interface AnimatedNavbarCharProps {
  char: string;
}

const AnimatedNavbarChar = ({ char }: AnimatedNavbarCharProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const { transform, fontFamily } = useSpring({
    transform: `scale(${isHovered ? 1.4 : 1})`,
    fontFamily: isHovered ? 'Jua, sans-serif' : 'Space Grotesk, sans-serif',
    config: { mass: 0.5, tension: 400, friction: 15 },
  });

  return (
    <animated.span
      style={{
        display: 'inline-block',
        transform,
        fontFamily,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {char}
    </animated.span>
  );
};

export default AnimatedNavbarChar; 