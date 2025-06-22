import './ScrollIndicator.css';

interface ScrollIndicatorProps {
  isVisible: boolean;
}

const ScrollIndicator = ({ isVisible }: ScrollIndicatorProps) => {
  return (
    <div className={`scroll-indicator-container ${isVisible ? 'visible' : ''}`}>
      <div className="mouse">
        <div className="wheel"></div>
      </div>
    </div>
  );
};

export default ScrollIndicator; 