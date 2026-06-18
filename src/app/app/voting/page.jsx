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
  const AGENT_SERVER_URL = process.env.NEXT_PUBLIC_AGENT_SERVER_URL || 'http://localhost:3012';
  
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

  // Load suggestions and profile from API
  const fetchSuggestions = async () => {
    try {
      const res = await fetch(`${AGENT_SERVER_URL}/api/voting/suggestions`);
      const data = await res.json();
      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions);
        // Also sync expanded suggestion if open
        if (expandedSuggestion) {
          const updated = data.suggestions.find(s => s.id === expandedSuggestion.id);
          if (updated) setExpandedSuggestion(updated);
        }
      }
    } catch (err) {
      console.error("Failed to fetch suggestions from backend:", err);
      // Fallback
      setSuggestions(initialSuggestions);
    }
  };

  const fetchProfile = async (userAddress) => {
    try {
      const res = await fetch(`${AGENT_SERVER_URL}/api/voting/profile/${userAddress}`);
      const data = await res.json();
      if (data.success && data.profile) {
        setUserProfile({
          name: data.profile.name || 'Anonymous Contributor',
          bio: data.profile.bio || 'NexaFlow Beta Tester & Crypto Enthusiast',
          reputation: data.profile.reputation ?? 15,
          votedList: data.profile.votedList || {}
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile from backend:", err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSuggestions();
    if (address) {
      fetchProfile(address);
    }
  }, [address]);

  // Upvote/Downvote actions
  const handleVote = async (id, type) => {
    if (!isConnected || !address) {
      triggerToast('Wallet Disconnected', 'Please connect your Web3 wallet to vote.');
      return;
    }

    try {
      const res = await fetch(`${AGENT_SERVER_URL}/api/voting/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, voterAddress: address, voteType: type })
      });
      const data = await res.json();
      if (data.success) {
        if (data.message.includes("removed")) {
          triggerToast('Vote Removed', 'Your vote has been cancelled.');
        } else if (type === 'up') {
          triggerToast('Feature Upvoted', 'Thank you for your feedback!', 'success');
        } else {
          triggerToast('Feature Downvoted', 'Feedback recorded.');
        }
        await fetchSuggestions();
        await fetchProfile(address);
      }
    } catch (err) {
      console.error("Failed to submit vote:", err);
      triggerToast('Error', 'Failed to communicate with voting server.');
    }
  };

  // Submit suggestion
  const handleSubmitSuggestion = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      triggerToast('Validation Error', 'Please fill in all required fields.');
      return;
    }

    if (!isConnected || !address) {
      triggerToast('Wallet Disconnected', 'Connect your wallet to submit ideas.');
      return;
    }

    try {
      const res = await fetch(`${AGENT_SERVER_URL}/api/voting/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          category: newCategory,
          impact: newImpact,
          submitterAddress: address,
          submitterName: userProfile.name || 'Anonymous'
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsSuggestModalOpen(false);
        setNewTitle('');
        setNewDescription('');
        setNewCategory('Payroll');
        setNewImpact('Medium');
        
        await fetchSuggestions();
        await fetchProfile(address);
        triggerToast('Suggestion Submitted', 'Your suggestion is now live for community voting!', 'success');
      }
    } catch (err) {
      console.error("Failed to submit suggestion:", err);
      triggerToast('Error', 'Failed to submit proposal to server.');
    }
  };

  // Submit comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!isConnected || !address) {
      triggerToast('Wallet Disconnected', 'Connect your wallet to leave a comment.');
      return;
    }

    try {
      const res = await fetch(`${AGENT_SERVER_URL}/api/voting/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: expandedSuggestion.id,
          authorName: userProfile.name || 'Anonymous',
          authorAddress: address,
          content: commentText.trim()
        })
      });
      const data = await res.json();
      if (data.success && data.proposal) {
        setExpandedSuggestion(data.proposal);
        setCommentText('');
        await fetchSuggestions();
        await fetchProfile(address);
        triggerToast('Comment Added', 'Your comment was posted successfully.', 'success');
      }
    } catch (err) {
      console.error("Failed to submit comment:", err);
      triggerToast('Error', 'Failed to add comment on server.');
    }
  };

  // Edit Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;

    if (!isConnected || !address) {
      triggerToast('Wallet Disconnected', 'Connect your wallet to update profile.');
      return;
    }

    try {
      const res = await fetch(`${AGENT_SERVER_URL}/api/voting/profile/${address}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          bio: editBio.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setUserProfile({
          name: data.profile.name || 'Anonymous Contributor',
          bio: data.profile.bio || 'NexaFlow Beta Tester & Crypto Enthusiast',
          reputation: data.profile.reputation ?? 15,
          votedList: data.profile.votedList || {}
        });
        setIsEditProfileOpen(false);
        triggerToast('Profile Updated', 'Your contributor profile is saved.', 'success');
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
      triggerToast('Error', 'Failed to save profile update to server.');
    }
  };

  const openEditProfile = () => {
    setEditName(userProfile.name || '');
    setEditBio(userProfile.bio || '');
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
        return <span className="badge" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--text-main)', border: 'var(--thin-border)', boxShadow: '1.5px 1.5px 0px #1A1A1A' }}>🔮 Planned</span>;
      case 'In Progress':
        return <span className="badge" style={{ backgroundColor: 'var(--color-warning)', color: 'var(--text-main)', border: 'var(--thin-border)', boxShadow: '1.5px 1.5px 0px #1A1A1A' }}>⚙️ In Progress</span>;
      case 'Completed':
        return <span className="badge" style={{ backgroundColor: 'var(--color-success)', color: 'var(--text-main)', border: 'var(--thin-border)', boxShadow: '1.5px 1.5px 0px #1A1A1A' }}>✅ Completed</span>;
      case 'Rejected':
        return <span className="badge" style={{ backgroundColor: 'var(--color-error)', color: 'var(--text-main)', border: 'var(--thin-border)', boxShadow: '1.5px 1.5px 0px #1A1A1A' }}>❌ Rejected</span>;
      default:
        return null;
    }
  };

  const getCategoryBadgeColor = (cat) => {
    switch (cat) {
      case 'Payroll': return 'var(--color-success)';
      case 'Smart Wallet': return 'var(--color-primary)';
      case 'Staking': return 'var(--color-secondary)';
      case 'Security': return 'var(--color-warning)';
      case 'Agents': return '#B5F9FF';
      default: return '#E2DBFC';
    }
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Header Panel */}
      <div className="dashboard-header-panel" style={{
        background: 'var(--bg-sidebar)',
        border: 'var(--thick-border)',
        boxShadow: 'var(--shadow-flat)',
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
          <p style={{ color: '#A1A1AA', fontSize: '13px', margin: '4px 0 0' }}>
            Vote on upcoming features, request enhancements, and track our engineering progress live on the Arc Chain.
          </p>
        </div>

        {/* User Stats Card */}
        <div style={{
          backgroundColor: '#FFFDF0',
          border: 'var(--medium-border)',
          borderRadius: '12px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: 'var(--shadow-flat-sm)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary)',
            border: 'var(--thin-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-main)',
            fontWeight: '900',
            fontSize: '14px',
            position: 'relative',
            boxShadow: '2.5px 2.5px 0px #1A1A1A'
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
              border: '1.5px solid #1A1A1A'
            }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: '800', fontSize: '13px', color: 'var(--text-main)', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>{userProfile.name}</span>
              <button 
                onClick={openEditProfile}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary-dark)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                title="Edit Contributor Profile"
              >
                <Edit2 size={12} strokeWidth={2.5} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Trophy size={11} color="#fbbf24" fill="#fbbf24" />
                Rep: {userProfile.reputation}
              </span>
              <span>•</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Guest Mode'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: 'var(--thin-border)', paddingBottom: '16px' }}>
        <button 
          onClick={() => setActiveTab('board')}
          className={`tab-btn ${activeTab === 'board' ? 'active' : ''}`}
          style={{
            background: activeTab === 'board' ? 'var(--color-primary)' : '#FFFFFF',
            border: 'var(--thin-border)',
            color: 'var(--text-main)',
            padding: '10px 18px',
            borderRadius: '6px',
            fontWeight: '800',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.1s ease',
            boxShadow: '3px 3px 0px #1A1A1A',
            transform: activeTab === 'board' ? 'translateY(-1px)' : 'none'
          }}
        >
          <TrendingUp size={16} />
          Community Suggestions ({suggestions.length})
        </button>
        <button 
          onClick={() => setActiveTab('roadmap')}
          className={`tab-btn ${activeTab === 'roadmap' ? 'active' : ''}`}
          style={{
            background: activeTab === 'roadmap' ? 'var(--color-primary)' : '#FFFFFF',
            border: 'var(--thin-border)',
            color: 'var(--text-main)',
            padding: '10px 18px',
            borderRadius: '6px',
            fontWeight: '800',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.1s ease',
            boxShadow: '3px 3px 0px #1A1A1A',
            transform: activeTab === 'roadmap' ? 'translateY(-1px)' : 'none'
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
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                <input 
                  type="text"
                  placeholder="Search suggestions..."
                  value={searchQuery || ''}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: 'var(--thin-border)',
                    borderRadius: '6px',
                    padding: '8px 12px 8px 32px',
                    fontSize: '12px',
                    color: 'var(--text-main)',
                    outline: 'none',
                    minWidth: '220px',
                    boxShadow: '2px 2px 0px #1A1A1A',
                    fontWeight: '600'
                  }}
                />
              </div>

              {/* Category selector capsules */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 0' }}>
                {categories.map(cat => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '800',
                        border: 'var(--thin-border)',
                        backgroundColor: isActive ? 'var(--color-primary)' : '#FFFFFF',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        transition: 'all 0.1s ease',
                        boxShadow: '2px 2px 0px #1A1A1A',
                        transform: isActive ? 'translateY(-1px)' : 'none'
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sorting & Submit suggestion CTA */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SlidersHorizontal size={12} color="var(--text-muted)" />
                <select
                  value={selectedSort || ''}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: 'var(--thin-border)',
                    borderRadius: '6px',
                    color: 'var(--text-main)',
                    fontSize: '12px',
                    padding: '6px 10px',
                    outline: 'none',
                    boxShadow: '2px 2px 0px #1A1A1A',
                    fontWeight: '800',
                    cursor: 'pointer'
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
                      backgroundColor: '#FFFFFF',
                      border: 'var(--medium-border)',
                      borderRadius: '12px',
                      padding: '16px 20px 16px 28px',
                      display: 'flex',
                      gap: '16px',
                      transition: 'all 0.2s',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-flat-sm)',
                    }}
                    className="suggestion-item"
                  >
                    {/* Floating Side border based on status */}
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '8px',
                      borderRight: 'var(--thin-border)',
                      backgroundColor: 
                        item.status === 'Completed' ? 'var(--color-success)' :
                        item.status === 'In Progress' ? 'var(--color-warning)' :
                        item.status === 'Rejected' ? 'var(--color-error)' : 'var(--color-primary)'
                    }} />

                    {/* Voting Column widget */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '50px',
                      backgroundColor: 'transparent',
                      borderRight: 'var(--thin-border)',
                      paddingRight: '16px'
                    }}>
                      <button 
                        onClick={() => handleVote(item.id, 'up')}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: userVote === 'up' ? '#10B981' : 'var(--text-muted)',
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
                        fontSize: '16px', 
                        fontWeight: '900', 
                        color: userVote === 'up' ? '#10B981' : userVote === 'down' ? '#EF4444' : 'var(--text-main)', 
                        margin: '2px 0',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {(item.upvotes || 0) - (item.downvotes || 0)}
                      </span>
                      <button 
                        onClick={() => handleVote(item.id, 'down')}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: userVote === 'down' ? '#EF4444' : 'var(--text-muted)',
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
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <span className="badge" style={{ backgroundColor: getCategoryBadgeColor(item.category), color: 'var(--text-main)', border: 'var(--thin-border)', boxShadow: '1.5px 1.5px 0px #1A1A1A' }}>
                          {item.category}
                        </span>
                        {getStatusBadge(item.status)}
                        <span className="badge" style={{ 
                          backgroundColor: item.impact === 'High' ? 'var(--color-error)' : item.impact === 'Medium' ? 'var(--color-warning)' : '#E2E8F0', 
                          color: 'var(--text-main)',
                          border: 'var(--thin-border)',
                          boxShadow: '1.5px 1.5px 0px #1A1A1A',
                          fontSize: '10px'
                        }}>
                          Impact: {item.impact}
                        </span>
                      </div>

                      <h3 
                        onClick={() => setExpandedSuggestion(item)}
                        style={{ 
                          fontSize: '18px', 
                          fontWeight: '800', 
                          color: 'var(--text-main)', 
                          margin: '0 0 6px', 
                          cursor: 'pointer',
                          transition: 'color 0.2s',
                          fontFamily: 'var(--font-display)',
                          textTransform: 'uppercase'
                        }}
                        className="hover-underline"
                      >
                        {item.title}
                      </h3>
                      
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 12px', lineHeight: '1.5', fontWeight: '500' }}>
                        {item.description}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                            <User size={10} />
                            Suggested by {item.submitterName}
                          </span>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                            <Clock size={10} />
                            {item.date}
                          </span>
                        </div>

                        {/* Comment trigger */}
                        <button 
                          onClick={() => setExpandedSuggestion(item)}
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: 'var(--thin-border)',
                            color: 'var(--text-main)',
                            fontSize: '12px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            boxShadow: '2px 2px 0px #1A1A1A',
                            transition: 'all 0.1s ease'
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
            backgroundColor: '#FFFFFF',
            border: 'var(--medium-border)',
            borderRadius: '12px',
            padding: '18px 16px',
            boxShadow: 'var(--shadow-flat-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
                <span style={{ color: '#C084FC' }}>🔮</span> Planned
              </h3>
              <span className="badge" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--text-main)', border: 'var(--thin-border)', boxShadow: '1.5px 1.5px 0px #1A1A1A', fontWeight: '900' }}>
                {plannedItems.length}
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {plannedItems.map(item => (
                <div 
                  key={item.id} 
                  style={{
                    backgroundColor: '#FFFDF0',
                    border: 'var(--thin-border)',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '2px 2px 0px #1A1A1A'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{item.category}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-main)', fontWeight: 'bold' }}>👍 {item.upvotes}</span>
                  </div>
                  <h4 
                    onClick={() => setExpandedSuggestion(item)}
                    style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 6px', cursor: 'pointer', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}
                  >
                    {item.title}
                  </h4>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3', fontWeight: '500' }}>
                    {item.description}
                  </p>
                </div>
              ))}
              {plannedItems.length === 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', fontWeight: '600' }}>No features planned.</div>
              )}
            </div>
          </div>

          {/* COLUMN: IN PROGRESS */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: 'var(--medium-border)',
            borderRadius: '12px',
            padding: '18px 16px',
            boxShadow: 'var(--shadow-flat-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
                <span style={{ color: '#FBBF24' }}>⚙️</span> In Progress
              </h3>
              <span className="badge" style={{ backgroundColor: 'var(--color-warning)', color: 'var(--text-main)', border: 'var(--thin-border)', boxShadow: '1.5px 1.5px 0px #1A1A1A', fontWeight: '900' }}>
                {inProgressItems.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {inProgressItems.map(item => (
                <div 
                  key={item.id} 
                  style={{
                    backgroundColor: '#FFFDF0',
                    border: 'var(--thin-border)',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '2px 2px 0px #1A1A1A'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{item.category}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-main)', fontWeight: 'bold' }}>👍 {item.upvotes}</span>
                  </div>
                  <h4 
                    onClick={() => setExpandedSuggestion(item)}
                    style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 6px', cursor: 'pointer', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}
                  >
                    {item.title}
                  </h4>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3', fontWeight: '500' }}>
                    {item.description}
                  </p>
                </div>
              ))}
              {inProgressItems.length === 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', fontWeight: '600' }}>No features in progress.</div>
              )}
            </div>
          </div>

          {/* COLUMN: COMPLETED */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: 'var(--medium-border)',
            borderRadius: '12px',
            padding: '18px 16px',
            boxShadow: 'var(--shadow-flat-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
                <span style={{ color: 'var(--color-success)' }}>✅</span> Completed
              </h3>
              <span className="badge" style={{ backgroundColor: 'var(--color-success)', color: 'var(--text-main)', border: 'var(--thin-border)', boxShadow: '1.5px 1.5px 0px #1A1A1A', fontWeight: '900' }}>
                {completedItems.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {completedItems.map(item => (
                <div 
                  key={item.id} 
                  style={{
                    backgroundColor: '#FFFDF0',
                    border: 'var(--thin-border)',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '2px 2px 0px #1A1A1A'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{item.category}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-main)', fontWeight: 'bold' }}>👍 {item.upvotes}</span>
                  </div>
                  <h4 
                    onClick={() => setExpandedSuggestion(item)}
                    style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 6px', cursor: 'pointer', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}
                  >
                    {item.title}
                  </h4>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3', fontWeight: '500' }}>
                    {item.description}
                  </p>
                </div>
              ))}
              {completedItems.length === 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', fontWeight: '600' }}>No features completed yet.</div>
              )}
            </div>
          </div>

          {/* COLUMN: REJECTED */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: 'var(--medium-border)',
            borderRadius: '12px',
            padding: '18px 16px',
            boxShadow: 'var(--shadow-flat-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
                <span style={{ color: '#F87171' }}>❌</span> Rejected
              </h3>
              <span className="badge" style={{ backgroundColor: 'var(--color-error)', color: 'var(--text-main)', border: 'var(--thin-border)', boxShadow: '1.5px 1.5px 0px #1A1A1A', fontWeight: '900' }}>
                {rejectedItems.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {rejectedItems.map(item => (
                <div 
                  key={item.id} 
                  style={{
                    backgroundColor: '#FFFDF0',
                    border: 'var(--thin-border)',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '2px 2px 0px #1A1A1A'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{item.category}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-main)', fontWeight: 'bold' }}>👍 {item.upvotes}</span>
                  </div>
                  <h4 
                    onClick={() => setExpandedSuggestion(item)}
                    style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 6px', cursor: 'pointer', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}
                  >
                    {item.title}
                  </h4>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3', fontWeight: '500' }}>
                    {item.description}
                  </p>
                </div>
              ))}
              {rejectedItems.length === 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', fontWeight: '600' }}>No rejected features.</div>
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
          backgroundColor: 'rgba(26, 26, 36, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 999
        }}>
          <div style={{
            width: '100%',
            maxWidth: '550px',
            backgroundColor: '#FFFFFF',
            height: '100%',
            borderLeft: 'var(--thick-border)',
            padding: '30px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflowY: 'auto',
            boxShadow: '-10px 0px 0px rgba(0,0,0,0.15)'
          }}>
            <button 
              onClick={() => setExpandedSuggestion(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#FFFFFF',
                border: 'var(--thin-border)',
                borderRadius: '6px',
                color: 'var(--text-main)',
                cursor: 'pointer',
                padding: '6px',
                boxShadow: '2px 2px 0px #1A1A1A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>

            {/* Header info */}
            <div style={{ marginTop: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                <span className="badge" style={{ backgroundColor: getCategoryBadgeColor(expandedSuggestion.category), color: 'var(--text-main)', border: 'var(--thin-border)', boxShadow: '1.5px 1.5px 0px #1A1A1A' }}>
                  {expandedSuggestion.category}
                </span>
                {getStatusBadge(expandedSuggestion.status)}
                <span className="badge" style={{ 
                  backgroundColor: expandedSuggestion.impact === 'High' ? 'var(--color-error)' : expandedSuggestion.impact === 'Medium' ? 'var(--color-warning)' : '#E2E8F0', 
                  color: 'var(--text-main)', 
                  border: 'var(--thin-border)',
                  boxShadow: '1.5px 1.5px 0px #1A1A1A',
                  fontSize: '10px' 
                }}>
                  Impact: {expandedSuggestion.impact}
                </span>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 10px', lineHeight: '1.4', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
                {expandedSuggestion.title}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.5', margin: 0, fontWeight: '500' }}>
                {expandedSuggestion.description}
              </p>
            </div>

            {/* Voting Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FFFDF0',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '24px',
              border: 'var(--thin-border)',
              boxShadow: '2px 2px 0px #1A1A1A'
            }}>
              <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '800', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>Community Feedback</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                  onClick={() => handleVote(expandedSuggestion.id, 'up')}
                  style={{
                    backgroundColor: 'var(--color-success)',
                    border: 'var(--thin-border)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    color: 'var(--text-main)',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '2px 2px 0px #1A1A1A'
                  }}
                >
                  <ThumbsUp size={12} />
                  Upvote ({expandedSuggestion.upvotes})
                </button>
                <button 
                  onClick={() => handleVote(expandedSuggestion.id, 'down')}
                  style={{
                    backgroundColor: 'var(--color-error)',
                    border: 'var(--thin-border)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    color: 'var(--text-main)',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '2px 2px 0px #1A1A1A'
                  }}
                >
                  <ThumbsDown size={12} />
                  Downvote ({expandedSuggestion.downvotes})
                </button>
              </div>
            </div>

            {/* Comments List Section */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
                <MessageSquare size={14} color="var(--color-primary)" />
                Comments ({expandedSuggestion.comments?.length || 0})
              </h3>
              
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', padding: '4px' }}>
                {expandedSuggestion.comments?.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0', fontWeight: '600' }}>
                    No comments yet. Join the discussion below!
                  </div>
                ) : (
                  expandedSuggestion.comments.map(c => (
                    <div 
                      key={c.id} 
                      style={{
                        backgroundColor: '#FFFDF0',
                        border: 'var(--thin-border)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        boxShadow: '2px 2px 0px #1A1A1A'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '600' }}>
                        <span style={{ fontWeight: '800', color: 'var(--text-main)' }}>{c.authorName}</span>
                        <span>{c.timestamp}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-main)', lineHeight: '1.4', fontWeight: '500' }}>{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '10px', padding: '4px' }}>
                <input 
                  type="text"
                  placeholder={isConnected ? "Add a comment..." : "Connect wallet to comment..."}
                  value={commentText || ''}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={!isConnected}
                  style={{
                    flex: 1,
                    backgroundColor: '#FFFFFF',
                    border: 'var(--thin-border)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: 'var(--text-main)',
                    outline: 'none',
                    boxShadow: '2px 2px 0px #1A1A1A',
                    fontWeight: '600'
                  }}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!isConnected || !commentText.trim()}
                  style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '800', boxShadow: '2px 2px 0px #1A1A1A' }}
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
          backgroundColor: 'rgba(26, 26, 36, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="modal-card" style={{
            backgroundColor: '#FFFFFF',
            border: 'var(--thick-border)',
            boxShadow: 'var(--shadow-flat)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            padding: '28px',
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
                color: 'var(--text-main)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
              <Plus size={20} color="var(--color-primary)" />
              Suggest a New Feature
            </h3>

            <form onSubmit={handleSubmitSuggestion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Feature Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Multi-chain deployment to Base"
                  value={newTitle || ''}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Category</label>
                  <select
                    value={newCategory || ''}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="form-input"
                    style={{ backgroundColor: '#FFFFFF', color: 'var(--text-main)' }}
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
                    value={newImpact || ''}
                    onChange={(e) => setNewImpact(e.target.value)}
                    className="form-input"
                    style={{ backgroundColor: '#FFFFFF', color: 'var(--text-main)' }}
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
                  value={newDescription || ''}
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
                  padding: '12px',
                  fontWeight: '800',
                  marginTop: '8px',
                  boxShadow: 'var(--shadow-flat-sm)'
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
          backgroundColor: 'rgba(26, 26, 36, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="modal-card" style={{
            backgroundColor: '#FFFFFF',
            border: 'var(--thick-border)',
            boxShadow: 'var(--shadow-flat)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '450px',
            padding: '28px',
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
                color: 'var(--text-main)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
              <UserCheck size={20} color="var(--color-primary)" />
              Contributor Profile Settings
            </h3>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Contributor Name</label>
                <input 
                  type="text"
                  placeholder="e.g. John Doe"
                  value={editName || ''}
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
                  value={editBio || ''}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="form-input"
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{
                  padding: '12px',
                  fontWeight: '800',
                  marginTop: '8px',
                  boxShadow: 'var(--shadow-flat-sm)'
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
