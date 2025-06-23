import { useState, useRef } from 'react';
import './PortfolioIndex.css';

interface PortfolioSection {
  id: number;
  title: string;
  comment: string;
  onClick: () => void;
}

interface PortfolioIndexProps {
  onSectionSelected: (sectionId: number) => void;
}

const PortfolioIndexItem = ({ section }: { section: PortfolioSection }) => {
  const [commentText, setCommentText] = useState<string>('');
  const typeIntervalRef = useRef<number | null>(null);
  const deleteIntervalRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    // Stop any deletion in progress and reset
    if (deleteIntervalRef.current) clearInterval(deleteIntervalRef.current);
    if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);

    // Continue typing from current position instead of starting over
    let currentIndex = commentText.length;
    typeIntervalRef.current = window.setInterval(() => {
      if (currentIndex < section.comment.length) {
        setCommentText(section.comment.slice(0, currentIndex + 1));
        currentIndex += 1;
      } else {
        if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
      }
    }, 50);
  };

  const handleMouseLeave = () => {
    if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
    if (deleteIntervalRef.current) clearInterval(deleteIntervalRef.current);

    // Start deletion immediately with current comment text length
    let currentLength = commentText.length;
    deleteIntervalRef.current = window.setInterval(() => {
      if (currentLength > 0) {
        currentLength -= 1;
        setCommentText((prev) => prev.slice(0, currentLength));
      } else {
        if (deleteIntervalRef.current) clearInterval(deleteIntervalRef.current);
      }
    }, 30);
  };

  return (
    <div
      className="portfolio-index-item"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={section.onClick}
    >
      <span className="section-number">
        {section.id.toString().padStart(2, '0')}.
      </span>
      <span className="section-title">
        {section.title}
      </span>
      {commentText && <span className="section-comment">{commentText}</span>}
    </div>
  );
};

const PortfolioIndex = ({ onSectionSelected }: PortfolioIndexProps) => {
  const sections: PortfolioSection[] = [
    {
      id: 0,
      title: 'INIT::Etheko()',
      comment: '// Who am I?',
      onClick: () => onSectionSelected(0)
    },
    {
      id: 1,
      title: 'BUILD_STREAM[]',
      comment: '// Current Projects',
      onClick: () => onSectionSelected(1)
    },
    {
      id: 2,
      title: 'RETRO_LOG{}',
      comment: '// Past Projects',
      onClick: () => onSectionSelected(2)
    },
    {
      id: 3,
      title: 'MODULES_LOADED',
      comment: '// Tech Stack',
      onClick: () => onSectionSelected(3)
    },
    {
      id: 4,
      title: 'UX.LAB{👾}',
      comment: '// Design Zone',
      onClick: () => onSectionSelected(4)
    },
    {
      id: 5,
      title: 'SYS_SEC::INSIGHTS',
      comment: '// Cyber Logs',
      onClick: () => onSectionSelected(5)
    },
    {
      id: 6,
      title: 'PIPELINE::WORKFLOW',
      comment: '// DevOps & Agile',
      onClick: () => onSectionSelected(6)
    },
    {
      id: 7,
      title: 'blog.txt',
      comment: '// Thoughts & Posts',
      onClick: () => onSectionSelected(7)
    },
    {
      id: 8,
      title: 'contact.txt',
      comment: '// CV & Links',
      onClick: () => onSectionSelected(8)
    },
    {
      id: 9,
      title: 'CERTS.log',
      comment: '// Certificates & Courses',
      onClick: () => onSectionSelected(9)
    }
  ];

  return (
    <div className="portfolio-index-component">
      <main className="portfolio-index-content">
        <div className="portfolio-index-list">
          {sections.map((section) => (
            <PortfolioIndexItem key={section.id} section={section} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default PortfolioIndex;
