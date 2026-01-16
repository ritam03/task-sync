import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AuthContext from '../context/AuthContext';
import { Plus, Layout, Briefcase, UserPlus, Users, LogOut, Shield, ShieldAlert } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext); // This is YOU (the logged-in user)
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [boards, setBoards] = useState([]);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Invite Modal State
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  
  const navigate = useNavigate();

  // --- 1. COMPUTED PROPERTIES (RBAC Logic) ---
  // Find "MY" role in the selected workspace
  const currentMember = selectedWorkspace?.members?.find(m => m.userId === user?.id);
  const isWorkspaceAdmin = currentMember?.role === 'ADMIN';

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      fetchBoards(selectedWorkspace.id);
    }
  }, [selectedWorkspace]);

  const fetchWorkspaces = async () => {
    try {
      const { data } = await api.get('/workspaces');
      setWorkspaces(data);
      if (data.length > 0) setSelectedWorkspace(data[0]);
    } catch (error) {
      console.error('Failed to fetch workspaces', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBoards = async (workspaceId) => {
    try {
      const { data } = await api.get(`/boards?workspaceId=${workspaceId}`);
      setBoards(data);
    } catch (error) {
      console.error('Failed to fetch boards', error);
    }
  };

  const createBoard = async (e) => {
    e.preventDefault();
    if (!newBoardTitle) return;
    try {
      const { data } = await api.post('/boards', {
        title: newBoardTitle,
        workspaceId: selectedWorkspace.id
      });
      setBoards([data, ...boards]);
      setNewBoardTitle('');
    } catch (error) {
      alert('Failed to create board');
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/workspaces/${selectedWorkspace.id}/invite`, { email: inviteEmail });
      alert('User added successfully!');
      setInviteEmail('');
      setShowInvite(false);
      fetchWorkspaces(); 
    } catch (error) {
      alert(error.response?.data?.message || 'Invite failed');
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 flex-1">
          <div className="flex items-center gap-2 mb-6 text-indigo-600">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">T</div>
            <span className="text-xl font-bold">TaskSync</span>
          </div>

          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Your Workspaces
          </h2>
          <div className="space-y-1">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => setSelectedWorkspace(ws)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  selectedWorkspace?.id === ws.id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Briefcase size={16} />
                <span className="truncate">{ws.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* --- USER PROFILE (Must show LOGGED IN USER, not Owner) --- */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 border border-indigo-200">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-sm overflow-hidden">
                    <p className="font-medium text-gray-700 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate" title={user?.email}>{user?.email}</p>
                </div>
            </div>
            <button 
                onClick={logout} 
                className="w-full flex items-center justify-center gap-2 text-sm text-red-600 hover:bg-red-50 p-2 rounded-md transition-colors border border-transparent hover:border-red-100"
            >
                <LogOut size={16} /> Log out
            </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-start mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <div className='flex items-center gap-3'>
              <h1 className="text-2xl font-bold text-gray-900">{selectedWorkspace?.name}</h1>
              {/* Role Badge */}
              {isWorkspaceAdmin ? (
                 <span className="flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium">
                   <Shield size={12} /> Admin
                 </span>
              ) : (
                 <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                   <Users size={12} /> Member
                 </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-1">
                Owner: <span className="font-medium text-gray-700">{selectedWorkspace?.members?.find(m => m.role === 'ADMIN')?.user?.name}</span>
            </p>
          </div>
          
          <div className="flex gap-3">
            {/* RBAC: Only show Invite button if Admin */}
            {isWorkspaceAdmin && (
              <button 
                  onClick={() => setShowInvite(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 shadow-sm transition-all"
              >
                  <UserPlus size={16} /> Invite Member
              </button>
            )}
          </div>
        </header>

        {/* Create Board Section - Available to everyone, or restrict if you prefer */}
        <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Create New Board</h3>
            <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-200 max-w-md">
                <form onSubmit={createBoard} className="flex gap-2">
                    <input
                    type="text"
                    placeholder="e.g., Q4 Roadmap"
                    className="flex-1 border-none outline-none px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-0 rounded-md"
                    value={newBoardTitle}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                    />
                    <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                    <Plus size={16} /> Create
                    </button>
                </form>
            </div>
        </div>

        {/* Boards Grid */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Boards</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <div
              key={board.id}
              onClick={() => navigate(`/board/${board.id}`)}
              className="group cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-200 overflow-hidden transition-all duration-200"
            >
              <div className={`h-24 ${board.bgImage || 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}></div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {board.title}
                </h3>
                <div className='flex justify-between items-center mt-2'>
                   <p className="text-xs text-gray-500">Updated recently</p>
                </div>
              </div>
            </div>
          ))}
          
          {boards.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
              <Layout className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm">No boards in this workspace.</p>
            </div>
          )}
        </div>
      </main>

      {/* Invite Modal (Only renders if allowed) */}
      {showInvite && isWorkspaceAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Invite to {selectedWorkspace.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">Add team members by their email address.</p>
                </div>
                
                <form onSubmit={handleInvite} className="p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Users size={16} className="text-gray-400" />
                        </div>
                        <input 
                            type="email" 
                            placeholder="colleague@example.com"
                            className="w-full pl-10 border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            required
                        />
                    </div>
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                       <ShieldAlert size={12}/> User must be registered first.
                    </p>
                    
                    <div className="flex justify-end gap-3 mt-6">
                        <button 
                            type="button" 
                            onClick={() => setShowInvite(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
                        >
                            Send Invite
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;