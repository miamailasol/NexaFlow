'use client';

import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Calendar, 
  Flame, 
  ChevronUp, 
  ChevronDown, 
  UserCheck, 
  Trophy, 
  ArrowRight,
  TrendingUp,
  FolderSync,
  Edit2,
  X,
  Compass,
  MapPin,
  Star,
  Check
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { useNexaFlow } from '@/context/NexaFlowContext';

// Default mock suggestions
const initialSuggestions = [
  {
    id: 'suggest-1',
    title: 'Multi-currency streaming support (EURC, USDC, yield stablecoins)',
    description: 'Allow employers to stream not just USDC but also EURC or yield-bearing stablecoins directly to remote contractors. This makes international salary payouts much more flexible.',
    category: 'Payroll',
    status: 'In Progress',
    impact: 'High',
    upvotes: 48,
    downvotes: 2,
    submitterAddress: '0x71C9592AC392A7210100282121B66f343cde10ac',
    submitterName: 'NexaAdmin',
    date: '3 days ago',
    comments: [
      {
        id: 'c-1',
        authorName: 'Tan Wei Liang',
        authorAddress: '0x9e71a3371987d6f26d8251e18a8fdcb59296556e',
        content: 'This is super critical for our European remote engineers!',
        timestamp: '2 days ago'
      },
      {
        id: 'c-2',
        authorName: 'Alice Smith',
        authorAddress: '0x32a78f26d8251e18a8fdcb59296556e41ef4a25c',
        content: 'Awesome, yield-bearing streams will be a game changer for long term escrows.',
        timestamp: '1 day ago'
      }
    ],
    votedUsers: {
      '0x71C9592AC392A7210100282121B66f343cde10ac': 'up',
      '0x9e71a3371987d6f26d8251e18a8fdcb59296556e': 'up'
    }
  },
  {
    id: 'suggest-2',
    title: 'Apple Pay / Google Pay integrations for Biometric Wallets',
    description: 'Enable top-up or withdrawal of stablecoins directly to bank cards using Apple Pay/Google Pay via Circle on-ramp precompiles. Great for mobile-first employees.',
    category: 'Smart Wallet',
    status: 'Planned',
    impact: 'Medium',
    upvotes: 35,
    downvotes: 1,
    submitterAddress: '0x98b8c01ac5c02574B56B0b4F9F1b76960a9Ea5E6',
    submitterName: 'UserX',
    date: '5 days ago',
    comments: [],
    votedUsers: {}
  },
  {
    id: 'suggest-3',
    title: 'Automated Tax Filing & Local compliance helper exports',
    description: 'Automatically calculate, withhold, and generate tax forms (e.g. W-8BEN, W-9) based on country code rules. Makes cross-border hiring compliance effortless.',
    category: 'Security',
    status: 'Planned',
    impact: 'High',
    upvotes: 29,
    downvotes: 0,
    submitterAddress: '0x51c5b4F9F1b76960a9Ea5E610000000000000000',
    submitterName: 'BizDev',
    date: '1 week ago',
    comments: [
      {
        id: 'c-3',
        authorName: 'Developer SG',
        authorAddress: '0x42fef12345678901234567890123456789012345',
        content: 'We need this to comply with Singapore IRAS guidelines.',
        timestamp: '5 days ago'
      }
    ],
    votedUsers: {}
  },
  {
    id: 'suggest-4',
    title: 'Agent Command Center: Automate pay rules via custom LLM prompts',
    description: 'Let users write natural language rules like "If my employee works > 40 hours or submits a verified git commit, stream an extra 50 USDC buffer automatically."',
    category: 'Agents',
    status: 'Completed',
    impact: 'High',
    upvotes: 62,
    downvotes: 3,
    submitterAddress: '0x88fca21c392A7210100282121B66f343cde10ac1',
    submitterName: 'DevGuru',
    date: '2 weeks ago',
    comments: [
      {
        id: 'c-4',
        authorName: 'Founder Beta',
        authorAddress: '0x1129994F9F1b76960a9Ea5E61000000000000000',
        content: 'Works like a charm! Love the integration with compliance scanner.',
        timestamp: '1 week ago'
      }
    ],
    votedUsers: {}
  },
  {
    id: 'suggest-5',
    title: 'Decentralized Co-op Staking: Yield Auto-compounder',
    description: 'Automatically stake accrued co-op shares and compound rewards into the treasury pool to maximize liquidity rewards for long-term treasury stakers.',
    category: 'Staking',
    status: 'Completed',
    impact: 'Medium',
    upvotes: 50,
    downvotes: 1,
    submitterAddress: '0x2a1bc88C392A7210100282121B66f343cde10ac1',
    submitterName: 'YieldMax',
    date: '2 weeks ago',
    comments: [],
    votedUsers: {}
  },
  {
    id: 'suggest-6',
    title: 'Gasless transaction sponsorship for custom employee payouts',
    description: 'Sponsor all transfer and withdrawal gas fees for employees using Circle Gas Station precompiles. Zero network fee friction for remote staff.',
    category: 'Payroll',
    status: 'Completed',
    impact: 'High',
    upvotes: 57,
    downvotes: 0,
    submitterAddress: '0x1ace211C392A7210100282121B66f343cde10ac1',
    submitterName: 'FounderAlpha',
    date: '3 weeks ago',
    comments: [],
    votedUsers: {}
  },
  {
    id: 'suggest-7',
    title: 'Dogecoin Payout Stream integration',
    description: 'Allow payroll payouts to be streamed in Dogecoin instead of USDC/EURC stablecoins.',
    category: 'Others',
    status: 'Rejected',
    impact: 'Low',
    upvotes: 3,
    downvotes: 42,
    submitterAddress: '0xdoge456C392A7210100282121B66f343cde10ac1',
    submitterName: 'MemeLord',
    date: '1 month ago',
    comments: [
      {
        id: 'c-5',
        authorName: 'Alice Smith',
        authorAddress: '0x32a78f26d8251e18a8fdcb59296556e41ef4a25c',
        content: 'We want stable payments, not high volatility memecoins for salaries.',
        timestamp: '3 weeks ago'
      }
    ],
    votedUsers: {}
  }
];

export default function FeatureVotingPage() {
  const { address, isConnected, triggerToast } = useNexaFlow();
  
  // States
  const [activeTab, setActiveTab] = useState('board'); // 'board', 'roadmap'
  const [suggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSort, setSelectedSort] = useState('votes'); // 'votes', 'newest'
  
  // Suggestion Modal
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Payroll');
  const [newImpact, setNewImpact] = useState('Medium');
  const [newDescription, setNewDescription] = useState('');

  // Comment Drawer / Details
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);
  const [commentText, setCommentText] = useState('');

  // User Profile
  const [userProfile, setUserProfile] = useState({
    name: 'Anonymous Contributor',
    bio: 'NexaFlow Beta Tester & Crypto Enthusiast',
    reputation: 15,
    votedList: {}
  });
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');

  // Initial load from local storage or defaults
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSuggestions = localStorage.getItem('nexaflow_feature_suggestions');
      if (savedSuggestions) {
        try {
          setSuggestions(JSON.parse(savedSuggestions));
        } catch (e) {
          setSuggestions(initialSuggestions);
        }
      } else {
        setSuggestions(initialSuggestions);
        localStorage.setItem('nexaflow_feature_suggestions', JSON.stringify(initialSuggestions));
      }

      const savedProfile = localStorage.getItem(`nexaflow_user_profile_${address?.toLowerCase() || 'guest'}`);
      if (savedProfile) {
        try {
          setUserProfile(JSON.parse(savedProfile));
        } catch (e) {}
      } else if (address) {
        const defaultProf = {
          name: `Contributor ${address.slice(0, 6)}...${address.slice(-4)}`,
          bio: 'NexaFlow Web3 Contributor',
          reputation: 10,
          votedList: {}
        };
        setUserProfile(defaultProf);
        localStorage.setItem(`nexaflow_user_profile_${address.toLowerCase()}`, JSON.stringify(defaultProf));
      }
    }
  }, [address]);

  // Sync profile when address changes
  useEffect(() => {
    if (address) {
      const saved = localStorage.getItem(`nexaflow_user_profile_${address.toLowerCase()}`);
      if (saved) {
        setUserProfile(JSON.parse(saved));
      } else {
        const defaultProf = {
          name: `Contributor ${address.slice(0, 6)}...${address.slice(-4)}`,
          bio: 'NexaFlow Web3 Contributor',
          reputation: 10,
          votedList: {}
        };
        setUserProfile(defaultProf);
        localStorage.setItem(`nexaflow_user_profile_${address.toLowerCase()}`, JSON.stringify(defaultProf));
      }
    }
  }, [address]);

  // Save suggestions to local storage helper
  const saveSuggestions = (updated) => {
    setSuggestions(updated);
    localStorage.setItem('nexaflow_feature_suggestions', JSON.stringify(updated));
  };

  // Upvote/Downvote actions
  const handleVote = (id, type) => {
    if (!isConnected) {
      triggerToast('Wallet Disconnected', 'Please connect your Web3 wallet to vote.');
      return;
    }

    const userId = address.toLowerCase();
    const updated = suggestions.map(s => {
      if (s.id !== id) return s;

      const currentVote = s.votedUsers?.[userId] || null;
      let newVotedUsers = { ...(s.votedUsers || {}) };
      let upvotes = s.upvotes || 0;
      let downvotes = s.downvotes || 0;

      if (currentVote === type) {
        // Remove vote
        if (type === 'up') upvotes = Math.max(0, upvotes - 1);
        else downvotes = Math.max(0, downvotes - 1);
        delete newVotedUsers[userId];
        triggerToast('Vote Removed', 'Your vote has been cancelled.');
      } else {
        // Change or add vote
        if (currentVote === 'up') upvotes = Math.max(0, upvotes - 1);
        if (currentVote === 'down') downvotes = Math.max(0, downvotes - 1);

        if (type === 'up') {
          upvotes += 1;
          triggerToast('Feature Upvoted', 'Thank you for your feedback!', 'success');
        } else {
          downvotes += 1;
          triggerToast('Feature Downvoted', 'Feedback recorded.');
        }

        newVotedUsers[userId] = type;
      }

      // Recalculate reputation
      updateReputation(5);

      return {
        ...s,
        upvotes,
        downvotes,
        votedUsers: newVotedUsers
      };
    });

    saveSuggestions(updated);
  };

  const updateReputation = (val) => {
    if (!address) return;
    const updatedProf = {
      ...userProfile,
      reputation: (userProfile.reputation || 0) + val
    };
    setUserProfile(updatedProf);
    localStorage.setItem(`nexaflow_user_profile_${address.toLowerCase()}`, JSON.stringify(updatedProf));
  };

  // Submit suggestion
  const handleSubmitSuggestion = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      triggerToast('Validation Error', 'Please fill in all required fields.');
      return;
    }

    const newSuggest = {
      id: `suggest-${Date.now()}`,
      title: newTitle.trim(),
      description: newDescription.trim(),
      category: newCategory,
      status: 'Planned',
      impact: newImpact,
      upvotes: 1,
      downvotes: 0,
      submitterAddress: address || '0xAnonymous',
      submitterName: userProfile.name || 'Anonymous',
      date: 'Just now',
      comments: [],
      votedUsers: address ? { [address.toLowerCase()]: 'up' } : {}
    };

    const updated = [newSuggest, ...suggestions];
    saveSuggestions(updated);
    setIsSuggestModalOpen(false);
    
    // Reset Form
    setNewTitle('');
    setNewDescription('');
    setNewCategory('Payroll');
    setNewImpact('Medium');

    updateReputation(15); // Bonus rep for submitting a suggestion
    triggerToast('Suggestion Submitted', 'Your suggestion is now live for community voting!', 'success');
  };

  // Submit comment
  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!isConnected) {
      triggerToast('Wallet Disconnected', 'Connect your wallet to leave a comment.');
      return;
    }

    const newComment = {
      id: `c-${Date.now()}`,
      authorName: userProfile.name,
      authorAddress: address,
      content: commentText.trim(),
      timestamp: 'Just now'
    };

    const updated = suggestions.map(s => {
      if (s.id !== expandedSuggestion.id) return s;
      return {
        ...s,
        comments: [...(s.comments || []), newComment]
      };
    });

    saveSuggestions(updated);
    
    // Update active expanded view state
    const currentExpanded = updated.find(s => s.id === expandedSuggestion.id);
    setExpandedSuggestion(currentExpanded);
    
    setCommentText('');
    updateReputation(2); // reputation bump
    triggerToast('Comment Added', 'Your comment was posted successfully.', 'success');
  };

  // Edit Profile
  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!editName.trim()) return;

    const updatedProf = {
      ...userProfile,
      name: editName.trim(),
      bio: editBio.trim()
    };
    setUserProfile(updatedProf);
    if (address) {
      localStorage.setItem(`nexaflow_user_profile_${address.toLowerCase()}`, JSON.stringify(updatedProf));
    }
    setIsEditProfileOpen(false);
    triggerToast('Profile Updated', 'Your contributor profile is saved.', 'success');
  };

  const openEditProfile = () => {
    setEditName(userProfile.name);
    setEditBio(userProfile.bio);
    setIsEditProfileOpen(true);
  };

  // Categories list
  const categories = ['All', 'Payroll', 'Smart Wallet', 'Staking', 'Security', 'Agents', 'Others'];

  // Filtering & Sorting logic
  const filteredSuggestions = suggestions
    .filter(s => {
      const matchSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === 'All' || s.category === selectedCategory;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (selectedSort === 'votes') {
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      }
      return 1; // Default order is sorted by date / index
    });

  // Count items per roadmap status
  const plannedItems = suggestions.filter(s => s.status === 'Planned');
  const inProgressItems = suggestions.filter(s => s.status === 'In Progress');
  const completedItems = suggestions.filter(s => s.status === 'Completed');
  const rejectedItems = suggestions.filter(s => s.status === 'Rejected');

  // Status Style Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Planned':
        return <span className="badge" style={{ backgroundColor: 'rgba(147, 51, 234, 0.15)', color: '#C084FC', border: '1px solid rgba(147, 51, 234, 0.3)' }}>🔮 Planned</span>;
      case 'In Progress':
        return <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>⚙️ In Progress</span>;
      case 'Completed':
        return <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>✅ Completed</span>;
      case 'Rejected':
        return <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>❌ Rejected</span>;
      default:
        return null;
    }
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Header Panel */}
      <div className="dashboard-header-panel" style={{
        background: 'linear-gradient(135deg, rgba(17, 12, 34, 0.95) 0%, rgba(9, 6, 21, 0.95) 100%)',
        border: 'var(--thin-border)',
        boxShadow: 'var(--neo-shadow-primary)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Compass size={20} color="var(--color-primary)" />
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Community-Led Development</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: 0 }}>Product Board & Feedback Portal</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0' }}>
            Vote on upcoming features, request enhancements, and track our engineering progress live on the Arc Chain.
          </p>
        </div>

        {/* User Stats Card */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-dark)',
            border: '2px solid var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '14px',
            position: 'relative'
          }}>
            {userProfile.name.slice(0, 2).toUpperCase()}
            <div style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              backgroundColor: 'var(--color-success)',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              border: '2px solid #000'
            }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#fff' }}>{userProfile.name}</span>
              <button 
                onClick={openEditProfile}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: 0 }}
                title="Edit Contributor Profile"
              >
                <Edit2 size={12} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Trophy size={11} color="#fbbf24" />
                Rep: {userProfile.reputation}
              </span>
              <span>•</span>
              <span style={{ fontFamily: 'monospace' }}>
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Guest Mode'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
        <button 
          onClick={() => setActiveTab('board')}
          className={`tab-btn ${activeTab === 'board' ? 'active' : ''}`}
          style={{
            background: activeTab === 'board' ? 'rgba(167, 139, 250, 0.1)' : 'transparent',
            border: activeTab === 'board' ? '1px solid var(--color-primary)' : '1px solid transparent',
            color: activeTab === 'board' ? '#fff' : 'var(--text-muted)',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <TrendingUp size={16} />
          Community Suggestions ({suggestions.length})
        </button>
        <button 
          onClick={() => setActiveTab('roadmap')}
          className={`tab-btn ${activeTab === 'roadmap' ? 'active' : ''}`}
          style={{
            background: activeTab === 'roadmap' ? 'rgba(167, 139, 250, 0.1)' : 'transparent',
            border: activeTab === 'roadmap' ? '1px solid var(--color-primary)' : '1px solid transparent',
            color: activeTab === 'roadmap' ? '#fff' : 'var(--text-muted)',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <FolderSync size={16} />
          Public Product Roadmap
        </button>
      </div>

      {/* SUGGESTIONS BOARD TAB */}
      {activeTab === 'board' && (
        <div>
          {/* Filtering and Search Controls Bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input 
                  type="text"
                  placeholder="Search suggestions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px',
                    padding: '6px 12px 6px 30px',
                    fontSize: '12px',
                    color: '#fff',
                    outline: 'none',
                    minWidth: '200px'
                  }}
                />
              </div>

              {/* Category selector capsules */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '2px 0' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      border: selectedCategory === cat ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.06)',
                      backgroundColor: selectedCategory === cat ? 'rgba(167, 139, 250, 0.15)' : 'rgba(255,255,255,0.02)',
                      color: selectedCategory === cat ? '#fff' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sorting & Submit suggestion CTA */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SlidersHorizontal size={12} color="var(--text-muted)" />
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  style={{
                    backgroundColor: '#0c071d',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12px',
                    padding: '4px 8px',
                    outline: 'none'
                  }}
                >
                  <option value="votes">Sort by votes</option>
                  <option value="newest">Sort by date</option>
                </select>
              </div>

              <button
                onClick={() => setIsSuggestModalOpen(true)}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                <Plus size={14} />
                Suggest Feature
              </button>
            </div>
          </div>

          {/* List of suggestions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredSuggestions.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px 20px',
                border: '2px dashed rgba(255,255,255,0.06)',
                borderRadius: '8px',
                color: 'var(--text-muted)'
              }}>
                <MessageSquare size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>No suggestions match your criteria.</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Be the first to submit a suggestion and shape the future of NexaFlow!</p>
              </div>
            ) : (
              filteredSuggestions.map((item) => {
                const userId = address?.toLowerCase();
                const userVote = item.votedUsers?.[userId] || null;

                return (
                  <div 
                    key={item.id}
                    style={{
                      backgroundColor: 'rgba(17, 12, 34, 0.4)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '16px 20px',
                      display: 'flex',
                      gap: '16px',
                      transition: 'all 0.2s',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    className="suggestion-item"
                  >
                    {/* Floating Side border based on status */}
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      backgroundColor: 
                        item.status === 'Completed' ? 'var(--color-success)' :
                        item.status === 'In Progress' ? '#fbbf24' :
                        item.status === 'Rejected' ? '#f87171' : 'var(--color-primary)'
                    }} />

                    {/* Voting Column widget */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '50px',
                      backgroundColor: 'rgba(255, 255, 255, 0.01)',
                      borderRight: '1px solid rgba(255,255,255,0.04)',
                      paddingRight: '16px'
                    }}>
                      <button 
                        onClick={() => handleVote(item.id, 'up')}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: userVote === 'up' ? 'var(--color-success)' : 'var(--text-muted)',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s'
                        }}
                        title="Upvote suggestion"
                      >
                        <ChevronUp size={20} strokeWidth={userVote === 'up' ? 3 : 2} />
                      </button>
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: '800', 
                        color: userVote === 'up' ? 'var(--color-success)' : userVote === 'down' ? '#f87171' : '#fff', 
                        margin: '2px 0' 
                      }}>
                        {(item.upvotes || 0) - (item.downvotes || 0)}
                      </span>
                      <button 
                        onClick={() => handleVote(item.id, 'down')}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: userVote === 'down' ? '#f87171' : 'var(--text-muted)',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s'
                        }}
                        title="Downvote suggestion"
                      >
                        <ChevronDown size={20} strokeWidth={userVote === 'down' ? 3 : 2} />
                      </button>
                    </div>

                    {/* Main Request details */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span className="badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          {item.category}
                        </span>
                        {getStatusBadge(item.status)}
                        <span className="badge" style={{ 
                          backgroundColor: item.impact === 'High' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.02)', 
                          color: item.impact === 'High' ? '#f87171' : 'var(--text-muted)',
                          fontSize: '10px'
                        }}>
                          Impact: {item.impact}
                        </span>
                      </div>

                      <h3 
                        onClick={() => setExpandedSuggestion(item)}
                        style={{ 
                          fontSize: '15px', 
                          fontWeight: 'bold', 
                          color: '#fff', 
                          margin: '0 0 6px', 
                          cursor: 'pointer',
                          transition: 'color 0.2s'
                        }}
                        className="hover-underline"
                      >
                        {item.title}
                      </h3>
                      
                      <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '0 0 12px', lineHeight: '1.4' }}>
                        {item.description}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={10} />
                            Suggested by {item.submitterName}
                          </span>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={10} />
                            {item.date}
                          </span>
                        </div>

                        {/* Comment trigger */}
                        <button 
                          onClick={() => setExpandedSuggestion(item)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-primary)',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(167, 139, 250, 0.05)'
                          }}
                        >
                          <MessageSquare size={12} />
                          {item.comments?.length || 0} Comments
                          <ArrowRight size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ROADMAP KANBAN TAB */}
      {activeTab === 'roadmap' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '20px',
          marginTop: '8px'
        }}>
          {/* COLUMN: PLANNED */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.01)',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#C084FC' }}>🔮</span> Planned
              </h3>
              <span className="badge" style={{ backgroundColor: 'rgba(147, 51, 234, 0.1)', color: '#C084FC' }}>
                {plannedItems.length}
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {plannedItems.map(item => (
                <div 
                  key={item.id} 
                  style={{
                    backgroundColor: '#110c22',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '6px',
                    padding: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--color-primary)' }}>{item.category}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>👍 {item.upvotes}</span>
                  </div>
                  <h4 
                    onClick={() => setExpandedSuggestion(item)}
                    style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', margin: '0 0 6px', cursor: 'pointer' }}
                  >
                    {item.title}
                  </h4>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3' }}>
                    {item.description}
                  </p>
                </div>
              ))}
              {plannedItems.length === 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No features planned.</div>
              )}
            </div>
          </div>

          {/* COLUMN: IN PROGRESS */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.01)',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#FBBF24' }}>⚙️</span> In Progress
              </h3>
              <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#FBBF24' }}>
                {inProgressItems.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {inProgressItems.map(item => (
                <div 
                  key={item.id} 
                  style={{
                    backgroundColor: '#110c22',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '6px',
                    padding: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--color-primary)' }}>{item.category}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>👍 {item.upvotes}</span>
                  </div>
                  <h4 
                    onClick={() => setExpandedSuggestion(item)}
                    style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', margin: '0 0 6px', cursor: 'pointer' }}
                  >
                    {item.title}
                  </h4>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3' }}>
                    {item.description}
                  </p>
                </div>
              ))}
              {inProgressItems.length === 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No features in progress.</div>
              )}
            </div>
          </div>

          {/* COLUMN: COMPLETED */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.01)',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--color-success)' }}>✅</span> Completed
              </h3>
              <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
                {completedItems.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {completedItems.map(item => (
                <div 
                  key={item.id} 
                  style={{
                    backgroundColor: '#110c22',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '6px',
                    padding: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--color-primary)' }}>{item.category}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>👍 {item.upvotes}</span>
                  </div>
                  <h4 
                    onClick={() => setExpandedSuggestion(item)}
                    style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', margin: '0 0 6px', cursor: 'pointer' }}
                  >
                    {item.title}
                  </h4>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3' }}>
                    {item.description}
                  </p>
                </div>
              ))}
              {completedItems.length === 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No features completed yet.</div>
              )}
            </div>
          </div>

          {/* COLUMN: REJECTED */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.01)',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#F87171' }}>❌</span> Rejected
              </h3>
              <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#F87171' }}>
                {rejectedItems.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {rejectedItems.map(item => (
                <div 
                  key={item.id} 
                  style={{
                    backgroundColor: '#110c22',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '6px',
                    padding: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--color-primary)' }}>{item.category}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>👍 {item.upvotes}</span>
                  </div>
                  <h4 
                    onClick={() => setExpandedSuggestion(item)}
                    style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', margin: '0 0 6px', cursor: 'pointer' }}
                  >
                    {item.title}
                  </h4>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3' }}>
                    {item.description}
                  </p>
                </div>
              ))}
              {rejectedItems.length === 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No rejected features.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETAILED VIEW DRAWER / DIALOG MODAL */}
      {expandedSuggestion && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 999
        }}>
          <div style={{
            width: '100%',
            maxWidth: '550px',
            backgroundColor: '#110c22',
            height: '100%',
            borderLeft: '2px solid var(--color-primary)',
            padding: '30px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflowY: 'auto'
          }}>
            <button 
              onClick={() => setExpandedSuggestion(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={16} />
            </button>

            {/* Header info */}
            <div style={{ marginTop: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                <span className="badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#fff' }}>
                  {expandedSuggestion.category}
                </span>
                {getStatusBadge(expandedSuggestion.status)}
                <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', fontSize: '10px' }}>
                  Impact: {expandedSuggestion.impact}
                </span>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', margin: '0 0 10px', lineHeight: '1.4' }}>
                {expandedSuggestion.title}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                {expandedSuggestion.description}
              </p>
            </div>

            {/* Voting Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(255,255,255,0.02)',
              borderRadius: '6px',
              padding: '12px 16px',
              marginBottom: '24px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Community Feedback</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                  onClick={() => handleVote(expandedSuggestion.id, 'up')}
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    color: '#34D399',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <ThumbsUp size={12} />
                  Upvote ({expandedSuggestion.upvotes})
                </button>
                <button 
                  onClick={() => handleVote(expandedSuggestion.id, 'down')}
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    color: '#F87171',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <ThumbsDown size={12} />
                  Downvote ({expandedSuggestion.downvotes})
                </button>
              </div>
            </div>

            {/* Comments List Section */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={14} color="var(--color-primary)" />
                Comments ({expandedSuggestion.comments?.length || 0})
              </h3>
              
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {expandedSuggestion.comments?.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0' }}>
                    No comments yet. Join the discussion below!
                  </div>
                ) : (
                  expandedSuggestion.comments.map(c => (
                    <div 
                      key={c.id} 
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '6px',
                        padding: '10px 14px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 'bold', color: '#fff' }}>{c.authorName}</span>
                        <span>{c.timestamp}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#D1D5DB', lineHeight: '1.4' }}>{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text"
                  placeholder={isConnected ? "Add a comment..." : "Connect wallet to comment..."}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={!isConnected}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!isConnected || !commentText.trim()}
                  style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 'bold' }}
                >
                  Post
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SUGGESTION CREATION MODAL */}
      {isSuggestModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="modal-card" style={{
            backgroundColor: '#110c22',
            border: '2px solid var(--color-primary)',
            boxShadow: '4px 4px 0px 0px var(--color-primary)',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '500px',
            padding: '24px',
            position: 'relative'
          }}>
            <button 
              onClick={() => setIsSuggestModalOpen(false)} 
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={20} color="var(--color-primary)" />
              Suggest a New Feature
            </h3>

            <form onSubmit={handleSubmitSuggestion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Feature Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Multi-chain deployment to Base"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="form-input"
                    style={{ backgroundColor: '#090515', color: '#fff' }}
                  >
                    <option value="Payroll">Payroll</option>
                    <option value="Smart Wallet">Smart Wallet</option>
                    <option value="Staking">Staking</option>
                    <option value="Security">Security</option>
                    <option value="Agents">Agents</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Estimated Impact</label>
                  <select
                    value={newImpact}
                    onChange={(e) => setNewImpact(e.target.value)}
                    className="form-input"
                    style={{ backgroundColor: '#090515', color: '#fff' }}
                  >
                    <option value="Low">Low Impact</option>
                    <option value="Medium">Medium Impact</option>
                    <option value="High">High Impact</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Description & Use Case</label>
                <textarea 
                  rows={4}
                  placeholder="Describe the feature, why the community needs it, and how it improves NexaFlow payroll streaming."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="form-input"
                  style={{ resize: 'none' }}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{
                  padding: '10px',
                  fontWeight: 'bold',
                  marginTop: '8px'
                }}
              >
                Submit Feature Proposal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="modal-card" style={{
            backgroundColor: '#110c22',
            border: '2px solid var(--color-primary)',
            boxShadow: '4px 4px 0px 0px var(--color-primary)',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '450px',
            padding: '24px',
            position: 'relative'
          }}>
            <button 
              onClick={() => setIsEditProfileOpen(false)} 
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={20} color="var(--color-primary)" />
              Contributor Profile Settings
            </h3>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Contributor Name</label>
                <input 
                  type="text"
                  placeholder="e.g. John Doe"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Bio / Tagline</label>
                <input 
                  type="text"
                  placeholder="e.g. Core Developer, Product Designer"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="form-input"
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{
                  padding: '10px',
                  fontWeight: 'bold',
                  marginTop: '8px'
                }}
              >
                Save Settings
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
