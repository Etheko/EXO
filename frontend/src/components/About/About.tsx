import { useEffect, useState, useRef, useCallback } from 'react';
import userService from '../../services/UserService';
import LoginService from '../../services/LoginService';
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
    TbEdit,
    TbX,
    TbCheck,
} from 'react-icons/tb';
import SentientIOB from '../SentientIOB';
import SentientButton from '../SentientButton';
import LoadingSpinner from '../LoadingSpinner';
import Error from '../Error';
import { useError } from '../../hooks/useError';
import { ERROR_CODES } from '../../utils/errorCodes';
import SocialEditWindow from './SocialEditWindow';

// Utility: create tooltip handlers that broadcast tooltip text to Navbar
const createTooltipHandlers = (text: string) => ({
    onMouseEnter: () => window.dispatchEvent(new CustomEvent('tooltipHover', { detail: { text } })),
    onMouseLeave: () => window.dispatchEvent(new CustomEvent('tooltipHover', { detail: { text: null } })),
    onTouchStart: () => window.dispatchEvent(new CustomEvent('tooltipHover', { detail: { text } })),
    onTouchEnd: () => window.dispatchEvent(new CustomEvent('tooltipHover', { detail: { text: null } })),
});

const About = () => {
    const [isAdmin, setIsAdmin] = useState<boolean>(LoginService.isCurrentUserAdmin());
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const timeoutRef = useRef<number | null>(null);
    const { showError } = useError();

    /* ==========================
     *  ADMIN / EDIT STATE LOGIC
     * ==========================
     */
    type SectionKey = 'profile' | 'description' | 'preferences';
    const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
    const [hoverSection, setHoverSection] = useState<SectionKey | null>(null);

    // Local editable copy of user during editing
    const [draftUser, setDraftUser] = useState<User | null>(null);

    // Social edit modal state
    const [socialModal, setSocialModal] = useState<{ key: string; visible: boolean }>({ key: '', visible: false });

    // Listen to login status changes so About reflects admin status dynamically
    useEffect(() => {
        const handleLoginStatusChange = (event: CustomEvent) => {
            setIsAdmin(LoginService.isCurrentUserAdmin());
        };
        window.addEventListener('loginStatusChanged', handleLoginStatusChange as EventListener);
        return () => window.removeEventListener('loginStatusChanged', handleLoginStatusChange as EventListener);
    }, []);

    const handleSave = useCallback(async (section: SectionKey) => {
        if (section === 'profile' && draftUser) {
            try {
                const updated = await userService.updateBasicInfo(draftUser.username, {
                    realName: draftUser.realName,
                    firstSurname: draftUser.firstSurname,
                    secondSurname: draftUser.secondSurname,
                    nick: draftUser.nick,
                    email: draftUser.email,
                    genderIdentity: draftUser.genderIdentity,
                    distinctivePhrase: draftUser.distinctivePhrase,
                    description: draftUser.description,
                });

                await userService.updateSocialLinks(draftUser.username, {
                    github: draftUser.github ?? null,
                    instagram: draftUser.instagram ?? null,
                    facebook: draftUser.facebook ?? null,
                    xUsername: draftUser.xUsername ?? null,
                    mastodon: draftUser.mastodon ?? null,
                    bluesky: draftUser.bluesky ?? null,
                    tiktok: draftUser.tiktok ?? null,
                    linkedIn: draftUser.linkedIn ?? null,
                });

                // Refresh user data from backend to ensure we have the latest state
                const refreshedUser = await userService.getUserByUsername(draftUser.username);
                setUser(refreshedUser);
            } catch (e) {
                console.error('Failed to save user', e);
            }
        }
        setEditingSection(null);
        setDraftUser(null);
    }, [draftUser]);

    const renderEditControls = (section: SectionKey) => {
        if (!isAdmin) return null;

        const commonProps = { as: 'button', hoverScale: 1 } as const;
        const isEditing = editingSection === section;

        return (
            <div className="edit-controls">
                {isEditing ? (
                    <>
                        <SentientIOB {...commonProps} onClick={() => setEditingSection(null)} {...createTooltipHandlers('cancel')}>
                            <TbX size={18} />
                        </SentientIOB>
                        <SentientIOB {...commonProps} onClick={() => handleSave(section)} {...createTooltipHandlers('save')}>
                            <TbCheck size={18} />
                        </SentientIOB>
                    </>
                ) : (
                    hoverSection === section && (
                        <SentientIOB {...commonProps} onClick={() => {
                            if (section === 'profile' && user) {
                                setDraftUser({ ...user });
                            }
                            setEditingSection(section);
                        }} {...createTooltipHandlers('edit')}>
                            <TbEdit size={18} />
                        </SentientIOB>
                    )
                )}
            </div>
        );
    };

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

    // Function to generate a random past date for citation
    const getRandomPastDate = () => {
        const today = new Date();
        const pastYears = Math.floor(Math.random() * 5) + 1; // 1-5 years ago
        const pastMonths = Math.floor(Math.random() * 12);
        const pastDays = Math.floor(Math.random() * 28) + 1;
        
        const randomDate = new Date(today.getFullYear() - pastYears, today.getMonth() - pastMonths, today.getDate() - pastDays);
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[randomDate.getMonth()];
        const day = randomDate.getDate();
        const year = randomDate.getFullYear();
        
        return `${month} ${day}, ${year}`;
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

    const mapKeyToProp = (k: string): keyof User => {
        switch (k) {
            case 'x':
            case 'twitter':
                return 'xUsername' as keyof User;
            case 'linkedin':
                return 'linkedIn' as keyof User;
            default:
                return k as keyof User;
        }
    };

    // Helper function to conditionally apply editable-section class only for admin users
    const getEditableSectionClass = (baseClass: string, section: SectionKey) => {
        const editingClass = editingSection === section ? 'editing' : '';
        const editableClass = isAdmin ? 'editable-section' : '';
        return `${baseClass} ${editableClass} ${editingClass}`.trim();
    };

    return (
        <div className="about-component">
            <header className="about-header">
                <div className="about-header-content">
                    <h1 className="about-title">Who am I?</h1>
                </div>
            </header>
            <main className="about-content">
                <div className="about-profile-section">
                    <div
                        className={getEditableSectionClass('profile-info-wrapper', 'profile')}
                        onMouseEnter={() => isAdmin && setHoverSection('profile')}
                        onMouseLeave={() => isAdmin && setHoverSection(null)}
                    >
                        {renderEditControls('profile')}
                        <div className="profile-info">
                            <div className="profile-info-item">
                                <div className="profile-info-label">
                                    <TbUser className="profile-info-icon" size={20} />
                                    <span>Name:</span>
                                </div>
                                {editingSection === 'profile' ? (
                                    <input
                                      className="login-input"
                                      style={{ width: '100%' }}
                                      value={draftUser?.realName ?? ''}
                                      placeholder="Full name"
                                      onChange={e => setDraftUser(prev => ({ ...prev!, realName: e.target.value }))}
                                    />
                                  ) : (
                                    <div className="profile-info-value">{getFullName()}</div>
                                  )}
                            </div>

                            {/* Nick */}
                            {user.nick && (
                                <div className="profile-info-item">
                                    <div className="profile-info-label">
                                        <TbAt className="profile-info-icon" size={20} />
                                        <span>Nick:</span>
                                    </div>
                                    {editingSection === 'profile' ? (
                                      <input
                                        className="login-input"
                                        style={{ width: '100%' }}
                                        value={draftUser?.nick ?? ''}
                                        placeholder="Nick"
                                        onChange={e => setDraftUser(prev => ({ ...prev!, nick: e.target.value }))}
                                      />
                                    ) : (
                                      <div className="profile-info-value">{user.nick}</div>
                                    )}
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
                                    {editingSection === 'profile' ? (
                                      <input
                                        className="login-input"
                                        style={{ width: '100%' }}
                                        value={draftUser?.genderIdentity ?? ''}
                                        placeholder="Pronouns"
                                        onChange={e => setDraftUser(prev => ({ ...prev!, genderIdentity: e.target.value }))}
                                      />
                                    ) : (
                                      <div className="profile-info-value">{user.genderIdentity}</div>
                                    )}
                                </div>
                            )}

                            {/* Email */}
                            {user.email && (
                                <div className="profile-info-item">
                                    <div className="profile-info-label">
                                        <TbMail className="profile-info-icon" size={20} />
                                        <span>Email:</span>
                                    </div>
                                    {editingSection === 'profile' ? (
                                      <input
                                        className="login-input"
                                        style={{ width: '100%' }}
                                        value={draftUser?.email ?? ''}
                                        placeholder="Email"
                                        onChange={e => setDraftUser(prev => ({ ...prev!, email: e.target.value }))}
                                      />
                                    ) : (
                                      <div className="profile-info-value">{user.email}</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bottom social icons section */}
                        <div className="profile-social-icons">
                            {profileSocials.map(({ key, url, icon: IconCmp, label }) => {
                                const userProp = mapKeyToProp(key);
                                const isActive = editingSection === 'profile'
                                    ? Boolean(draftUser?.[userProp])
                                    : Boolean(user[userProp as keyof User]);
                                if (editingSection === 'profile') {
                                    return (
                                        <SentientIOB
                                            key={key}
                                            as="button"
                                            className={isActive ? 'social-icon-active' : ''}
                                            onClick={() => setSocialModal({ key, visible: true })}
                                            {...createTooltipHandlers(label.toLowerCase())}
                                        >
                                            <IconCmp size={20} />
                                        </SentientIOB>
                                    );
                                }
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

                {user.description && (
                    <div className="description-wrapper">
                        {/* Section title */}
                        <div className="section-subtitle-container">
                            <h3 className="section-subtitle">Description</h3>
                        </div>
                        {/* Single description card */}
                        <div
                            className={getEditableSectionClass('description-card', 'description')}
                            onMouseEnter={() => isAdmin && setHoverSection('description')}
                            onMouseLeave={() => isAdmin && setHoverSection(null)}
                        >
                            {renderEditControls('description')}
                            {user.description.split('\n').map((line, index) => (
                                <p key={index} className="description-text">
                                    {line}
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                {(user.likes?.length || user.dislikes?.length) && (
                    <div className="preferences-wrapper">
                        {/* Section title */}
                        <div className="section-subtitle-container">
                            <h3 className="section-subtitle">Preferences</h3>
                        </div>
                        {/* Grid with two vertical cards */}
                        <div
                            className={getEditableSectionClass('preferences-grid', 'preferences')}
                            onMouseEnter={() => isAdmin && setHoverSection('preferences')}
                            onMouseLeave={() => isAdmin && setHoverSection(null)}
                        >
                            {renderEditControls('preferences')}
                            {user.likes?.length && (
                                <div className="preference-card">
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
                                <div className="preference-card">
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
                {/* Distinctive Phrase */}
                {user.distinctivePhrase && (
                    <div className="distinctive-phrase-wrapper">
                        <p className="distinctive-phrase">{user.distinctivePhrase}</p>
                        <p className="distinctive-phrase-citation">—{user.nick || user.username}. {getRandomPastDate()}</p>
                    </div>
                )}
            </main>
            <SocialEditWindow
                isVisible={socialModal.visible}
                socialKey={socialModal.key}
                currentValue={(draftUser ?? user)?.[mapKeyToProp(socialModal.key)] as string | undefined}
                onSave={(value) => {
                    if (editingSection === 'profile' && draftUser) {
                        const prop = mapKeyToProp(socialModal.key);
                        setDraftUser(prev => ({ ...prev!, [prop]: value } as any));
                    }
                }}
                onClose={() => setSocialModal({ key: '', visible: false })}
            />
        </div>
    );
};

export default About; 