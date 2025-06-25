import { useEffect, useState, useRef } from 'react';
import userService from '../../services/UserService';
import { User } from '../../types/User';
import './About.css';
import { 
    TbBrandGithub,
    TbBrandInstagram,
    TbBrandFacebook,
    TbBrandLinkedin,
    TbBrandTiktok,
    TbBrandX,
    TbBrandBluesky,
    TbBrandMastodon,
    TbUser,
    TbAt,
    TbMail,
    TbCalendar,
    TbGenderMale,
} from 'react-icons/tb';
import SentientIOB from '../SentientIOB';
import SentientButton from '../SentientButton';
import LoadingSpinner from '../LoadingSpinner';
import Error from '../Error';
import { useError } from '../../hooks/useError';
import { ERROR_CODES } from '../../utils/errorCodes';

// Utility: create tooltip handlers that broadcast tooltip text to Navbar
const createTooltipHandlers = (text: string) => ({
    onMouseEnter: () => window.dispatchEvent(new CustomEvent('tooltipHover', { detail: { text } })),
    onMouseLeave: () => window.dispatchEvent(new CustomEvent('tooltipHover', { detail: { text: null } })),
    onTouchStart: () => window.dispatchEvent(new CustomEvent('tooltipHover', { detail: { text } })),
    onTouchEnd: () => window.dispatchEvent(new CustomEvent('tooltipHover', { detail: { text: null } })),
});

const About = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const timeoutRef = useRef<number | null>(null);
    const { showError } = useError();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                setLoading(true);
                const userData = await userService.getUserByUsername('etheko');
                setUser(userData);
            } catch (err) {
                console.error('Error fetching user:', err);
                showError(ERROR_CODES.INTERNAL.DATA_FETCH_FAILED, 'Failed to load user profile');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [showError]);

    // Start image timeout when user data is loaded
    useEffect(() => {
        if (user && imageLoading) {
            // Clear any existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            
            // Set new timeout for 10 seconds
            timeoutRef.current = window.setTimeout(() => {
                setImageLoading(false);
                setImageError(true);
                timeoutRef.current = null;
            }, 10000); // 10 seconds
        }
    }, [user, imageLoading]);

    const handleImageLoad = () => {
        setImageLoading(false);
        setImageError(false);
        // Clear timeout if image loads successfully
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    const handleImageError = () => {
        setImageLoading(false);
        setImageError(true);
        // Clear timeout if image errors
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    // Cleanup timeout on component unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    if (loading) {
        return <LoadingSpinner fullViewport={false} />;
    }

    if (!user) {
        return null;
    }

    const getFullName = () => {
        const parts = [user.realName, user.firstSurname, user.secondSurname].filter(Boolean);
        return parts.join(' ');
    };

    const getAge = () => {
        if (!user.dateOfBirth) return null;
        const birthDate = new Date(user.dateOfBirth);
        if (isNaN(birthDate.getTime())) return null;
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Function to format social media URLs properly
    const formatSocialUrl = (platform: string, username: string | null | undefined): string | null => {
        if (!username) return null;
        
        // Remove any existing protocol or domain
        const cleanUsername = username.replace(/^https?:\/\//, '').replace(/^www\./, '');
        
        switch (platform) {
            case 'instagram':
                return `https://instagram.com/${cleanUsername}`;
            case 'x':
            case 'twitter':
                return `https://x.com/${cleanUsername}`;
            case 'linkedin':
                // LinkedIn URLs can be complex, check if it's already a full URL
                if (cleanUsername.includes('linkedin.com')) {
                    return `https://${cleanUsername}`;
                }
                return `https://linkedin.com/in/${cleanUsername}`;
            case 'github':
                return `https://github.com/${cleanUsername}`;
            case 'bluesky':
                return `https://bsky.app/profile/${cleanUsername}`;
            case 'facebook':
                return `https://facebook.com/${cleanUsername}`;
            case 'mastodon':
                // Mastodon URLs need the instance domain
                if (cleanUsername.includes('@')) {
                    const [user, domain] = cleanUsername.split('@');
                    return `https://${domain}/@${user}`;
                }
                return `https://mastodon.social/@${cleanUsername}`;
            case 'tiktok':
                return `https://tiktok.com/@${cleanUsername}`;
            default:
                return null;
        }
    };

    const profileSocials = [
        { key: 'instagram', url: formatSocialUrl('instagram', user.instagram), icon: TbBrandInstagram, label: 'Instagram' },
        { key: 'x', url: formatSocialUrl('x', user.xUsername), icon: TbBrandX, label: 'X / Twitter' },
        { key: 'linkedin', url: formatSocialUrl('linkedin', user.linkedIn), icon: TbBrandLinkedin, label: 'LinkedIn' },
        { key: 'github', url: formatSocialUrl('github', user.github), icon: TbBrandGithub, label: 'GitHub' },
        { key: 'bluesky', url: formatSocialUrl('bluesky', user.bluesky), icon: TbBrandBluesky, label: 'Bluesky' },
        { key: 'facebook', url: formatSocialUrl('facebook', user.facebook), icon: TbBrandFacebook, label: 'Facebook' },
        { key: 'mastodon', url: formatSocialUrl('mastodon', user.mastodon), icon: TbBrandMastodon, label: 'Mastodon' },
        { key: 'tiktok', url: formatSocialUrl('tiktok', user.tiktok), icon: TbBrandTiktok, label: 'TikTok' },
    ];

    return (
        <div className="about-component">
            <header className="about-header">
                <div className="about-header-content">
                    <h1 className="about-title">About Me</h1>
                </div>
            </header>
            <main className="about-content">
                <div className="about-profile-section">
                    <div className="profile-info-wrapper">
                        {/* Top text section */}
                        <div className="profile-info">
                            <div className="profile-info-item">
                                <div className="profile-info-label">
                                    <TbUser className="profile-info-icon" size={20} />
                                    <span>Name:</span>
                                </div>
                                <div className="profile-info-value">{getFullName()}</div>
                            </div>

                            {/* Nick */}
                            {user.nick && (
                                <div className="profile-info-item">
                                    <div className="profile-info-label">
                                        <TbAt className="profile-info-icon" size={20} />
                                        <span>Nick:</span>
                                    </div>
                                    <div className="profile-info-value">{user.nick}</div>
                                </div>
                            )}

                            {/* Age */}
                            {getAge() !== null && (
                                <div className="profile-info-item">
                                    <div className="profile-info-label">
                                        <TbCalendar className="profile-info-icon" size={20} />
                                        <span>Age:</span>
                                    </div>
                                    <div className="profile-info-value">{getAge()}</div>
                                </div>
                            )}

                            {/* Gender Identity */}
                            {user.genderIdentity && (
                                <div className="profile-info-item">
                                    <div className="profile-info-label">
                                        <TbGenderMale className="profile-info-icon" size={20} />
                                        <span>Pronouns:</span>
                                    </div>
                                    <div className="profile-info-value">{user.genderIdentity}</div>
                                </div>
                            )}

                            {/* Email */}
                            {user.email && (
                                <div className="profile-info-item">
                                    <div className="profile-info-label">
                                        <TbMail className="profile-info-icon" size={20} />
                                        <span>Email:</span>
                                    </div>
                                    <div className="profile-info-value">{user.email}</div>
                                </div>
                            )}
                        </div>

                        {/* Bottom social icons section */}
                        <div className="profile-social-icons">
                            {profileSocials.map(({ key, url, icon: IconCmp, label }) => {
                                if (url) {
                                    return (
                                        <SentientIOB 
                                            key={key}
                                            href={url}
                                            as="a"
                                            {...createTooltipHandlers(label.toLowerCase())}
                                        >
                                            <IconCmp size={20} />
                                        </SentientIOB>
                                    );
                                }
                                return (
                                    <span key={key} className="disabled-social-icon" title={label}>
                                        <IconCmp size={20} />
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {/* Profile picture */}
                    <SentientButton
                        as="div"
                        className="profile-image-container"
                        intensity={0.05}
                        scaleIntensity={1.02}
                    >
                        {imageLoading && <LoadingSpinner fullViewport={false} />}
                        {imageError && <Error fullViewport={false} errorCode={ERROR_CODES.INTERNAL.IMAGE_LOAD_TIMEOUT} />}
                        {!imageLoading && !imageError && (
                            <img
                                src={user.pfpString || '/assets/defaultProfilePicture.png'}
                                alt="Profile"
                                className="profile-image"
                                onLoad={handleImageLoad}
                                onError={handleImageError}
                            />
                        )}
                    </SentientButton>
                </div>

                {(user.likes?.length || user.dislikes?.length) && (
                    <div className="preferences-section">
                        <h3 className="section-subtitle">Preferences</h3>
                        <div className="preferences-grid">
                            {user.likes?.length && (
                                <div className="preference-group">
                                    <h4 className="preference-title">Likes</h4>
                                    <div className="preference-tags">
                                        {user.likes.map((like, index) => (
                                            <span key={index} className="preference-tag like">
                                                {like}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {user.dislikes?.length && (
                                <div className="preference-group">
                                    <h4 className="preference-title">Dislikes</h4>
                                    <div className="preference-tags">
                                        {user.dislikes.map((dislike, index) => (
                                            <span key={index} className="preference-tag dislike">
                                                {dislike}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {user.email && (
                    <div className="contact-section">
                        <h3 className="section-subtitle">Contact</h3>
                        <p className="contact-email">
                            <a href={`mailto:${user.email}`} className="email-link">
                                {user.email}
                            </a>
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default About; 