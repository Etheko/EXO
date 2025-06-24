import { useState, useRef, useEffect } from 'react';
import './PortfolioIndex.css';
import sectionService from '../../services/SectionService';
import type { Section } from '../../types/Section';
import { useError } from '../../hooks/useError';
import { ERROR_CODES } from '../../utils/errorCodes';
import LoadingSpinner from '../LoadingSpinner';

interface PortfolioIndexProps {
  onSectionSelected: (sectionId: number, componentType?: string) => void;
}

const PortfolioIndexItem = ({ section, onSectionSelected }: { section: Section; onSectionSelected: (sectionId: number, componentType?: string) => void }) => {
  const [commentText, setCommentText] = useState<string>('');
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const typeIntervalRef = useRef<number | null>(null);
  const deleteIntervalRef = useRef<number | null>(null);

  const isPublished = section.published !== false; // Default to true if not specified

  // Handle the typing / deleting animations based on the hover state
  useEffect(() => {
    // Don't run animations for unpublished sections
    if (!isPublished) return;

    // Clear any previous intervals before starting a new one
    if (typeIntervalRef.current) {
      clearInterval(typeIntervalRef.current);
      typeIntervalRef.current = null;
    }
    if (deleteIntervalRef.current) {
      clearInterval(deleteIntervalRef.current);
      deleteIntervalRef.current = null;
    }

    if (isHovered) {
      // Typing animation
      let currentIndex = commentText.length;
      typeIntervalRef.current = window.setInterval(() => {
        if (currentIndex < (section.description?.length || 0)) {
          currentIndex += 1;
          setCommentText(section.description?.slice(0, currentIndex) || '');
        } else if (typeIntervalRef.current) {
          clearInterval(typeIntervalRef.current);
          typeIntervalRef.current = null;
        }
      }, 50);
    } else {
      // Deleting animation
      let currentLength = commentText.length;
      if (currentLength === 0) return; // Nothing to delete

      deleteIntervalRef.current = window.setInterval(() => {
        currentLength -= 1;
        setCommentText((prev) => prev.slice(0, currentLength));

        if (currentLength <= 0 && deleteIntervalRef.current) {
          clearInterval(deleteIntervalRef.current);
          deleteIntervalRef.current = null;
        }
      }, 30);
    }

    // Cleanup when component unmounts
    return () => {
      if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
      if (deleteIntervalRef.current) clearInterval(deleteIntervalRef.current);
    };
    // We intentionally leave commentText out of the dependency array to avoid restarting the interval on every character change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered, section.description, isPublished]);

  const handleMouseEnter = () => {
    if (isPublished) {
      setIsHovered(true);
    }
  };
  
  const handleMouseLeave = () => {
    if (isPublished) {
      setIsHovered(false);
    }
  };

  const handleClick = () => {
    if (isPublished) {
      onSectionSelected(section.id || 0, section.componentType);
    }
  };

  return (
    <div
      className={`portfolio-index-item ${!isPublished ? 'unpublished' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <span className="section-number">
        {(section.displayOrder || 0).toString().padStart(2, '0')}
      </span>
      <span className="section-title">
        {section.title}
      </span>
      {commentText && <span className="section-comment">{commentText}</span>}
    </div>
  );
};

const PortfolioIndex = ({ onSectionSelected }: PortfolioIndexProps) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showError } = useError();

  useEffect(() => {
    const fetchSections = async () => {
      try {
        setLoading(true);
        const fetchedSections = await sectionService.getAllSectionsOrdered();
        setSections(fetchedSections);
      } catch (err) {
        console.error('Error fetching sections:', err);
        // Use the unified error system instead of local error state
        showError(ERROR_CODES.INTERNAL.DATA_FETCH_FAILED, 'Failed to load portfolio sections');
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, [showError]);

  if (loading) {
    return (
      <div className="portfolio-index-component">
        <main className="portfolio-index-content">
          <div className="portfolio-index-list">
            <LoadingSpinner fullViewport={false} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="portfolio-index-component">
      <main className="portfolio-index-content">
        <div className="portfolio-index-list">
          {sections.map((section) => (
            <PortfolioIndexItem 
              key={section.id} 
              section={section} 
              onSectionSelected={onSectionSelected}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default PortfolioIndex;
