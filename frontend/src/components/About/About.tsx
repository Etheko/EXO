import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import userService from '../../services/UserService';
import LoginService from '../../services/LoginService';
import SectionService from '../../services/SectionService';
import { User } from '../../types/User';
import { Section } from '../../types/Section';
import './About.css';
import '../LoginWindow/LoginWindow.css';
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
    TbPlus,
    TbUpload,
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
    const [section, setSection] = useState<Section | null>(null);
    const [sectionLoading, setSectionLoading] = useState(true);
    const timeoutRef = useRef<number | null>(null);
    const { showError } = useError();
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* ==========================
     *  ADMIN / EDIT STATE LOGIC
     * ==========================
     */
    type SectionKey = 'profile' | 'description' | 'preferences' | 'distinctivePhrase';
    const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
    const [hoverSection, setHoverSection] = useState<SectionKey | null>(null);
    const [newProfilePic, setNewProfilePic] = useState<{ file: File; previewUrl: string } | null>(null);
    const [isHoveringPfp, setIsHoveringPfp] = useState(false);

    /**
     * Dynamic opacity handling for edit controls
     * -------------------------------------------------
     * We keep a per-section opacity value and update it
     * according to the distance between the cursor and
     * the centre of the corresponding edit-controls div.
     */
    const [editControlsOpacity, setEditControlsOpacity] = useState<Record<SectionKey, number>>({
        profile: 0,
        description: 0,
        preferences: 0,
        distinctivePhrase: 0,
    });

    const editControlsRefs = useRef<Partial<Record<SectionKey, HTMLDivElement | null>>>({});

    const MAX_DISTANCE = 200; // px at which opacity reaches 0

    const updateOpacityForSection = (section: SectionKey, mouseX: number, mouseY: number) => {
        const ref = editControlsRefs.current[section];
        if (!ref) return;
        const rect = ref.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = mouseX - cx;
        const dy = mouseY - cy;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Compute opacity: 1 at distance 0, 0 at >= MAX_DISTANCE
        const opacity = Math.max(0, Math.min(1, 1 - distance / MAX_DISTANCE));

        setEditControlsOpacity(prev => (prev[section] === opacity ? prev : { ...prev, [section]: opacity }));
    };

    const handleMouseMove = (event: React.MouseEvent, section: SectionKey) => {
        if (!isAdmin) return;
        updateOpacityForSection(section, event.clientX, event.clientY);
    };

    const handleMouseLeaveSection = (section: SectionKey) => {
        if (!isAdmin) return;
        setEditControlsOpacity(prev => ({ ...prev, [section]: 0 }));
    };

    // Ensure controls are visible upon entering edit mode
    useEffect(() => {
        if (editingSection) {
            setEditControlsOpacity(prev => ({ ...prev, [editingSection]: 1 }));
        }
    }, [editingSection]);

    // Local editable copy of user during editing
    const [draftUser, setDraftUser] = useState<User | null>(null);

    // Separate state for the full name input field
    const [fullNameInput, setFullNameInput] = useState<string>('');

    // Separate state for the description input field
    const [descriptionInput, setDescriptionInput] = useState<string>('');

    // Separate state for the distinctive phrase input field
    const [distinctivePhraseInput, setDistinctivePhraseInput] = useState<string>('');

    // Preferences edit state
    const [draftLikes, setDraftLikes] = useState<string[]>([]);
    const [draftDislikes, setDraftDislikes] = useState<string[]>([]);
    const [newLikeInput, setNewLikeInput] = useState<string>('');
    const [newDislikeInput, setNewDislikeInput] = useState<string>('');

    // Social edit modal state
    const [socialModal, setSocialModal] = useState<{ key: string; visible: boolean }>({ key: '', visible: false });

    // Memoize the random date to prevent it from changing on every render
    const memoizedRandomDate = useMemo(() => {
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
    }, []); // Empty dependency array means this will only be calculated once

    // Auto-resize textarea when entering description edit mode or content changes
    useEffect(() => {
        if (editingSection === 'description' && textareaRef.current) {
            autoResizeTextarea(textareaRef.current);
        }
    }, [editingSection, descriptionInput]);

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
                // Split the full name input into the three components
                const { realName, firstSurname, secondSurname } = splitFullName(fullNameInput);
                
                const updated = await userService.updateBasicInfo(draftUser.username, {
                    realName: realName,
                    firstSurname: firstSurname,
                    secondSurname: secondSurname,
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
        } else if (section === 'description' && user) {
            try {
                // Update the description with proper newline management
                const updated = await userService.updateBasicInfo(user.username, {
                    realName: user.realName,
                    firstSurname: user.firstSurname,
                    secondSurname: user.secondSurname,
                    nick: user.nick,
                    email: user.email,
                    genderIdentity: user.genderIdentity,
                    distinctivePhrase: user.distinctivePhrase,
                    description: descriptionInput, // Use the description input with newlines preserved
                });

                // Refresh user data from backend to ensure we have the latest state
                const refreshedUser = await userService.getUserByUsername(user.username);
                setUser(refreshedUser);
            } catch (e) {
                console.error('Failed to save description', e);
            }
        } else if (section === 'distinctivePhrase' && user) {
            try {
                // Update the distinctive phrase
                const updated = await userService.updateBasicInfo(user.username, {
                    realName: user.realName,
                    firstSurname: user.firstSurname,
                    secondSurname: user.secondSurname,
                    nick: user.nick,
                    email: user.email,
                    genderIdentity: user.genderIdentity,
                    distinctivePhrase: distinctivePhraseInput, // Use the distinctive phrase input
                    description: user.description,
                });

                // Refresh user data from backend to ensure we have the latest state
                const refreshedUser = await userService.getUserByUsername(user.username);
                setUser(refreshedUser);
            } catch (e) {
                console.error('Failed to save distinctive phrase', e);
            }
        } else if (section === 'preferences' && user) {
            try {
                // Handle likes changes
                const originalLikes = user.likes || [];
                const likesToAdd = draftLikes.filter(like => !originalLikes.includes(like));
                const likesToRemove = originalLikes.filter(like => !draftLikes.includes(like));

                // Handle dislikes changes
                const originalDislikes = user.dislikes || [];
                const dislikesToAdd = draftDislikes.filter(dislike => !originalDislikes.includes(dislike));
                const dislikesToRemove = originalDislikes.filter(dislike => !draftDislikes.includes(dislike));

                // Make API calls for likes
                for (const like of likesToAdd) {
                    await userService.addLike(user.username, like);
                }
                for (const like of likesToRemove) {
                    await userService.removeLike(user.username, like);
                }

                // Make API calls for dislikes
                for (const dislike of dislikesToAdd) {
                    await userService.addDislike(user.username, dislike);
                }
                for (const dislike of dislikesToRemove) {
                    await userService.removeDislike(user.username, dislike);
                }

                // Refresh user data from backend to ensure we have the latest state
                const refreshedUser = await userService.getUserByUsername(user.username);
                setUser(refreshedUser);
            } catch (e) {
                console.error('Failed to save preferences', e);
            }
        }
        setEditingSection(null);
        setDraftUser(null);
        setFullNameInput(''); // Reset the full name input
        setDescriptionInput(''); // Reset the description input
        setDistinctivePhraseInput(''); // Reset the distinctive phrase input
        setDraftLikes([]); // Reset draft preferences
        setDraftDislikes([]);
        setNewLikeInput(''); // Reset input fields
        setNewDislikeInput('');
    }, [draftUser, fullNameInput, descriptionInput, distinctivePhraseInput, user, draftLikes, draftDislikes]);

    const handleSaveProfilePic = async () => {
        if (!newProfilePic || !user) return;
        try {
            const updatedUser = await userService.updateProfilePicture(user.username, newProfilePic.file);
            setUser(updatedUser);
            if (newProfilePic) {
                URL.revokeObjectURL(newProfilePic.previewUrl);
            }
            setNewProfilePic(null); 
        } catch (error) {
            console.error("Failed to upload profile picture", error);
            showError(ERROR_CODES.INTERNAL.DATA_UPDATE_FAILED, 'Failed to upload profile picture.');
        }
    };

    const handleCancelProfilePic = () => {
        if (newProfilePic) {
            URL.revokeObjectURL(newProfilePic.previewUrl);
        }
        setNewProfilePic(null);
    };

    const renderEditControls = (section: SectionKey) => {
        if (!isAdmin) return null;

        const commonProps = { as: 'button', hoverScale: 1 } as const;
        const isEditing = editingSection === section;

        const opacity = editControlsOpacity[section] ?? 0;
        const scale = 0.8 + (0.2 * opacity);

        return (
            <div
                className="edit-controls"
                ref={el => {
                    if (el) {
                        editControlsRefs.current[section] = el;
                    }
                }}
                style={{ opacity, transform: `scale(${scale})` }}
            >
                {isEditing ? (
                    <>
                        <SentientIOB {...commonProps} onClick={() => {
                            setEditingSection(null);
                            setFullNameInput(''); // Reset the full name input
                            setDescriptionInput(''); // Reset the description input
                            setDistinctivePhraseInput(''); // Reset the distinctive phrase input
                            setDraftLikes([]); // Reset draft preferences
                            setDraftDislikes([]);
                            setNewLikeInput(''); // Reset input fields
                            setNewDislikeInput('');
                        }} {...createTooltipHandlers('cancel')}>
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
                                // Initialize the full name input with the current full name
                                const currentFullName = [user.realName, user.firstSurname, user.secondSurname].filter(Boolean).join(' ');
                                setFullNameInput(currentFullName);
                            } else if (section === 'description' && user) {
                                // Initialize the description input with the current description
                                setDescriptionInput(user.description || '');
                            } else if (section === 'distinctivePhrase' && user) {
                                // Initialize the distinctive phrase input with the current distinctive phrase
                                setDistinctivePhraseInput(user.distinctivePhrase || '');
                            } else if (section === 'preferences' && user) {
                                // Initialize the preferences with current likes and dislikes
                                setDraftLikes([...(user.likes || [])]);
                                setDraftDislikes([...(user.dislikes || [])]);
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

    // Fetch section data for the about section
    useEffect(() => {
        const fetchSection = async () => {
            try {
                setSectionLoading(true);
                const sectionData = await SectionService.getSectionBySlug('init-etheko');
                setSection(sectionData);
            } catch (err) {
                console.error('Error fetching section:', err);
                showError(ERROR_CODES.INTERNAL.DATA_FETCH_FAILED, 'Failed to load section data');
            } finally {
                setSectionLoading(false);
            }
        };

        fetchSection();
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

    // Cleanup for profile pic object URL
    useEffect(() => {
        return () => {
            if (newProfilePic) {
                URL.revokeObjectURL(newProfilePic.previewUrl);
            }
        };
    }, [newProfilePic]);

    if (loading || sectionLoading) {
        return <LoadingSpinner fullViewport={false} />;
    }

    if (!user) {
        return null;
    }

    const handleProfilePicClick = () => {
        if (isAdmin) {
            fileInputRef.current?.click();
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (newProfilePic) {
                URL.revokeObjectURL(newProfilePic.previewUrl);
            }
            setNewProfilePic({
                file,
                previewUrl: URL.createObjectURL(file),
            });
            // Reset input so selecting the same file again triggers change event
            event.target.value = '';
        }
    };

    const getFullName = () => {
        const parts = [user.realName, user.firstSurname, user.secondSurname].filter(Boolean);
        return parts.join(' ');
    };

    // Function to split a full name into realName, firstSurname, and secondSurname
    const splitFullName = (fullName: string): { realName: string; firstSurname: string; secondSurname: string } => {
        const words = fullName.trim().split(/\s+/).filter(word => word.length > 0);
        
        return {
            realName: words[0] || '',
            firstSurname: words[1] || '',
            secondSurname: words[2] || ''
        };
    };

    // Function to get the combined full name for editing
    const getFullNameForEditing = () => {
        return fullNameInput;
    };

    // Function to auto-resize textarea based on content
    const autoResizeTextarea = (element: HTMLTextAreaElement) => {
        element.style.height = 'auto';
        element.style.height = element.scrollHeight + 'px';
    };

    // Helper functions for preferences management
    const addLike = () => {
        if (newLikeInput.trim()) {
            setDraftLikes(prev => [...prev, newLikeInput.trim()]);
            setNewLikeInput('');
        }
    };

    const removeLike = (likeToRemove: string) => {
        setDraftLikes(prev => prev.filter(like => like !== likeToRemove));
    };

    const addDislike = () => {
        if (newDislikeInput.trim()) {
            setDraftDislikes(prev => [...prev, newDislikeInput.trim()]);
            setNewDislikeInput('');
        }
    };

    const removeDislike = (dislikeToRemove: string) => {
        setDraftDislikes(prev => prev.filter(dislike => dislike !== dislikeToRemove));
    };

    const handleKeyPress = (e: React.KeyboardEvent, type: 'like' | 'dislike') => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (type === 'like') {
                addLike();
            } else {
                addDislike();
            }
        }
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

    const showUploadOverlay = isAdmin && isHoveringPfp && !newProfilePic;

    const backendBase = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8080';

    return (
        <div className="about-component">
            <header className="about-header">
                <div className="about-header-content">
                    <h1 className="about-title">{section?.title || 'Who am I?'}</h1>
                </div>
            </header>
            <main className="about-content">
                <div className="about-profile-section">
                    <div
                        className={getEditableSectionClass('profile-info-wrapper', 'profile')}
                        onMouseEnter={() => isAdmin && setHoverSection('profile')}
                        onMouseLeave={() => {
                            isAdmin && setHoverSection(null);
                            handleMouseLeaveSection('profile');
                        }}
                        onMouseMove={(e) => handleMouseMove(e, 'profile')}
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
                                      value={getFullNameForEditing()}
                                      placeholder="Full name"
                                      onChange={e => setFullNameInput(e.target.value)}
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
                        onClick={handleProfilePicClick}
                        onMouseEnter={() => isAdmin && setIsHoveringPfp(true)}
                        onMouseLeave={() => isAdmin && setIsHoveringPfp(false)}
                    >
                        {newProfilePic ? (
                            <>
                                <img
                                    src={newProfilePic.previewUrl}
                                    alt="New Profile Preview"
                                    className="profile-image"
                                />
                                <div className="edit-controls pfp-edit-controls">
                                    <SentientIOB as="button" hoverScale={1} onClick={(e) => { e.stopPropagation(); handleCancelProfilePic(); }} {...createTooltipHandlers('cancel')}>
                                        <TbX size={18} />
                                    </SentientIOB>
                                    <SentientIOB as="button" hoverScale={1} onClick={(e) => { e.stopPropagation(); handleSaveProfilePic(); }} {...createTooltipHandlers('save')}>
                                        <TbCheck size={18} />
                                    </SentientIOB>
                                </div>
                            </>
                        ) : (
                            <>
                                {imageLoading && <LoadingSpinner fullViewport={false} />}
                                {imageError && <Error fullViewport={false} errorCode={ERROR_CODES.INTERNAL.IMAGE_LOAD_TIMEOUT} />}
                                <img
                                    src={user.pfpString ? (user.pfpString.startsWith('/api') ? `${backendBase}${user.pfpString}` : user.pfpString) : '/assets/defaultProfilePicture.png'}
                                    alt="Profile"
                                    className="profile-image"
                                    style={{ display: imageError ? 'none' : 'block' }}
                                    onLoad={handleImageLoad}
                                    onError={handleImageError}
                                />
                                {showUploadOverlay && (
                                    <div className="pfp-upload-overlay">
                                        <TbUpload size={48} />
                                        <span>Upload a pic</span>
                                    </div>
                                )}
                            </>
                        )}
                    </SentientButton>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        accept="image/*"
                        aria-label="Profile picture upload"
                    />
                </div>

                {(user.description || editingSection === 'description') && (
                    <div className="description-wrapper">
                        {/* Section title */}
                        <div className="section-subtitle-container">
                            <h3 className="section-subtitle">Description</h3>
                        </div>
                        {/* Single description card */}
                        <div
                            className={getEditableSectionClass('description-card', 'description')}
                            onMouseEnter={() => isAdmin && setHoverSection('description')}
                            onMouseLeave={() => {
                                isAdmin && setHoverSection(null);
                                handleMouseLeaveSection('description');
                            }}
                            onMouseMove={(e) => handleMouseMove(e, 'description')}
                        >
                            {renderEditControls('description')}
                            {editingSection === 'description' ? (
                                <textarea
                                    ref={textareaRef}
                                    className="login-input"
                                    value={descriptionInput}
                                    placeholder="Enter your description..."
                                    onChange={e => setDescriptionInput(e.target.value)}
                                    onInput={e => autoResizeTextarea(e.target as HTMLTextAreaElement)}
                                />
                            ) : (
                                user.description ? (
                                    user.description.split('\n').map((line, index) => (
                                        <p key={index} className="description-text">
                                            {line}
                                        </p>
                                    ))
                                ) : (
                                    <p className="description-text" style={{ color: 'rgba(255, 255, 255, 0.4)', fontStyle: 'italic' }}>
                                        No description available.
                                    </p>
                                )
                            )}
                        </div>
                    </div>
                )}

                {(user.likes?.length || user.dislikes?.length || editingSection === 'preferences') && (
                    <div className="preferences-wrapper">
                        {/* Section title */}
                        <div className="section-subtitle-container">
                            <h3 className="section-subtitle">Preferences</h3>
                        </div>
                        {/* Grid with two vertical cards */}
                        <div
                            className={getEditableSectionClass('preferences-grid', 'preferences')}
                            onMouseEnter={() => isAdmin && setHoverSection('preferences')}
                            onMouseLeave={() => {
                                isAdmin && setHoverSection(null);
                                handleMouseLeaveSection('preferences');
                            }}
                            onMouseMove={(e) => handleMouseMove(e, 'preferences')}
                        >
                            {renderEditControls('preferences')}
                            {(editingSection === 'preferences' ? draftLikes.length > 0 : user.likes?.length) && (
                                <div className="preference-card">
                                    <h4 className="preference-title">Likes</h4>
                                    <div className="preference-tags">
                                        {(editingSection === 'preferences' ? draftLikes : user.likes || []).map((like, index) => (
                                            <span key={index} className="preference-tag like">
                                                {like}
                                                {editingSection === 'preferences' && (
                                                    <button
                                                        className="preference-tag-remove"
                                                        onClick={() => removeLike(like)}
                                                        {...createTooltipHandlers('remove')}
                                                    >
                                                        <TbX size={12} />
                                                    </button>
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                    {editingSection === 'preferences' && (
                                        <div className="preference-input-container">
                                            <input
                                                className="login-input"
                                                value={newLikeInput}
                                                onChange={(e) => setNewLikeInput(e.target.value)}
                                                onKeyPress={(e) => handleKeyPress(e, 'like')}
                                                placeholder="Add a new like..."
                                            />
                                            <SentientIOB
                                                as="button"
                                                onClick={addLike}
                                                disabled={!newLikeInput.trim()}
                                                {...createTooltipHandlers('add')}
                                            >
                                                <TbPlus size={16} />
                                            </SentientIOB>
                                        </div>
                                    )}
                                </div>
                            )}
                            {(editingSection === 'preferences' ? draftDislikes.length > 0 : user.dislikes?.length) && (
                                <div className="preference-card">
                                    <h4 className="preference-title">Dislikes</h4>
                                    <div className="preference-tags">
                                        {(editingSection === 'preferences' ? draftDislikes : user.dislikes || []).map((dislike, index) => (
                                            <span key={index} className="preference-tag dislike">
                                                {dislike}
                                                {editingSection === 'preferences' && (
                                                    <button
                                                        className="preference-tag-remove"
                                                        onClick={() => removeDislike(dislike)}
                                                        {...createTooltipHandlers('remove')}
                                                    >
                                                        <TbX size={12} />
                                                    </button>
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                    {editingSection === 'preferences' && (
                                        <div className="preference-input-container">
                                            <input
                                                className="login-input"
                                                value={newDislikeInput}
                                                onChange={(e) => setNewDislikeInput(e.target.value)}
                                                onKeyPress={(e) => handleKeyPress(e, 'dislike')}
                                                placeholder="Add a new dislike..."
                                            />
                                            <SentientIOB
                                                as="button"
                                                onClick={addDislike}
                                                disabled={!newDislikeInput.trim()}
                                                {...createTooltipHandlers('add')}
                                            >
                                                <TbPlus size={16} />
                                            </SentientIOB>
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Show empty cards when in edit mode and no preferences exist */}
                            {editingSection === 'preferences' && draftLikes.length === 0 && (
                                <div className="preference-card">
                                    <h4 className="preference-title">Likes</h4>
                                    <div className="preference-tags">
                                        <span className="preference-tag-empty">No likes yet</span>
                                    </div>
                                    <div className="preference-input-container">
                                        <input
                                            className="login-input"
                                            value={newLikeInput}
                                            onChange={(e) => setNewLikeInput(e.target.value)}
                                            onKeyPress={(e) => handleKeyPress(e, 'like')}
                                            placeholder="Add a new like..."
                                        />
                                        <SentientIOB
                                            as="button"
                                            onClick={addLike}
                                            disabled={!newLikeInput.trim()}
                                            {...createTooltipHandlers('add')}
                                        >
                                            <TbPlus size={16} />
                                        </SentientIOB>
                                    </div>
                                </div>
                            )}
                            {editingSection === 'preferences' && draftDislikes.length === 0 && (
                                <div className="preference-card">
                                    <h4 className="preference-title">Dislikes</h4>
                                    <div className="preference-tags">
                                        <span className="preference-tag-empty">No dislikes yet</span>
                                    </div>
                                    <div className="preference-input-container">
                                        <input
                                            className="login-input"
                                            value={newDislikeInput}
                                            onChange={(e) => setNewDislikeInput(e.target.value)}
                                            onKeyPress={(e) => handleKeyPress(e, 'dislike')}
                                            placeholder="Add a new dislike..."
                                        />
                                        <SentientIOB
                                            as="button"
                                            onClick={addDislike}
                                            disabled={!newDislikeInput.trim()}
                                            {...createTooltipHandlers('add')}
                                        >
                                            <TbPlus size={16} />
                                        </SentientIOB>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* Distinctive Phrase */}
                {(user.distinctivePhrase || editingSection === 'distinctivePhrase') && (
                    <div
                        className={getEditableSectionClass('distinctive-phrase-wrapper', 'distinctivePhrase')}
                        onMouseEnter={() => isAdmin && setHoverSection('distinctivePhrase')}
                        onMouseLeave={() => {
                            isAdmin && setHoverSection(null);
                            handleMouseLeaveSection('distinctivePhrase');
                        }}
                        onMouseMove={(e) => handleMouseMove(e, 'distinctivePhrase')}
                    >
                        {renderEditControls('distinctivePhrase')}
                        {editingSection === 'distinctivePhrase' ? (
                            <input
                                className="login-input distinctive-phrase"
                                style={{ textAlign: 'center', width: '100%' }}
                                value={distinctivePhraseInput}
                                placeholder="Enter a distinctive phrase..."
                                onChange={e => setDistinctivePhraseInput(e.target.value)}
                                maxLength={120}
                            />
                        ) : (
                            <p className="distinctive-phrase">{user.distinctivePhrase}</p>
                        )}
                        <p className="distinctive-phrase-citation">—{user.nick || user.username}. {memoizedRandomDate}</p>
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