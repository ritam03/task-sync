import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AuthContext from '../context/AuthContext';
import { 
  Plus, Briefcase, UserPlus, LogOut, 
  Trash2, Activity, X, 
  MoveRight, MessageSquare, Calendar, Edit3, FilePlus, Layers
} from 'lucide-react';
import io from 'socket.io-client';

// Initialize Socket
const socket = io.connect("http://localhost:5000");

// --- HELPER COMPONENT: Activity Item ---
const ActivityItem = ({ log }) => {
  const getIcon = () => {
    switch (log.action) {
      case 'CREATED': return <FilePlus size={14} className="text-green-600" />;
      case 'MOVED': return <MoveRight size={14} className="text-blue-600" />;
      case 'COMMENTED': return <MessageSquare size={14} className="text-purple-600" />;
      case 'SCHEDULED': return <Calendar size={14} className="text-orange-600" />;
      case 'RENAMED': return <Edit3 size={14} className="text-yellow-600" />;
      default: return <Activity size={14} className="text-gray-600" />;
    }
  };

  const renderMessage = () => {
    const title = log.entityTitle || "";
    const type = log.entityType.toLowerCase();
    
    const Highlight = ({ txt }) => <span className="font-semibold text-gray-900">{txt.replace(/"/g, '')}</span>;

    if (log.action === 'MOVED' && title.includes(' to ')) {
      const [card, list] = title.split(' to ');
      return (
        <span>
          moved {type} <Highlight txt={card} /> to <Highlight txt={list} />
        </span>
      );
    }
    
    if (log.action === 'RENAMED' && title.includes(' to ')) {
        const [oldName, newName] = title.replace('From ', '').split(' to ');
        return (
          <span>
            renamed {type} from <Highlight txt={oldName} /> to <Highlight txt={newName} />
          </span>
        );
    }

    if (log.action === 'COMMENTED' && title.includes('on ')) {
        const target = title.replace('on ', '');
        return (
            <span>
              commented on {type} <Highlight txt={target} />
            </span>
        );
    }

    if (log.action === 'SCHEDULED') {
        return <span>scheduled {type} <Highlight txt={title} /></span>;
    }

    return (
      <span>
        {log.action.toLowerCase()} {type} <Highlight txt={title} />
      </span>
    );
  };

  return (
    <div className="flex gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group">
      <div className="mt-1">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700 border border-gray-200">
            {log.user.name.charAt(0)}
        </div>
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-gray-900">{log.user.name}</span>
            <span className="text-[10px] text-gray-400 font-medium">
                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>

        <div className="text-sm text-gray-600 leading-snug flex items-start gap-2">
            <div className="mt-0.5 bg-gray-50 p-1 rounded-md border border-gray-200">
                {getIcon()}
            </div>
            <p>{renderMessage()}</p>
        </div>

        {log.board && (
            <div className="flex items-center gap-1 mt-1">
                <Layers size={10} className="text-indigo-400" />
                <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                    {log.board.title}
                </span>
            </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [boards, setBoards] = useState([]);
  
  // States
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0); 
  
  // Modals
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newBoardTitle, setNewBoardTitle] = useState('');

  const navigateTo = useNavigate();

  // RBAC Checks & Owner Logic
  const currentMember = selectedWorkspace?.members?.find(m => m.userId === user?.id);
  const isWorkspaceAdmin = currentMember?.role === 'ADMIN';
  
  // FIND THE OWNER
  const workspaceOwner = selectedWorkspace?.members?.find(m => m.userId === selectedWorkspace.ownerId)?.user;

  // --- API FUNCTIONS ---
  const fetchWorkspaces = async () => { 
    try {
        const { data } = await api.get('/workspaces');
        setWorkspaces(data);
        if (data.length > 0 && !selectedWorkspace) setSelectedWorkspace(data[0]);
    } catch (e) { console.error(e); }
  };

  const fetchBoards = async (workspaceId) => {
    try {
        const { data } = await api.get(`/boards?workspaceId=${workspaceId}`);
        setBoards(data);
    } catch (e) { console.error(e); }
  };

  const fetchLogs = async () => {
    try {
      const { data } = await api.get(`/workspaces/${selectedWorkspace.id}/logs`);
      setLogs(data);
    } catch (error) { console.error("Failed to load logs"); }
  };

  useEffect(() => { fetchWorkspaces(); }, []);
  
  // --- REAL-TIME ACTIVITY LOGIC ---
  useEffect(() => {
    if (selectedWorkspace) {
        fetchBoards(selectedWorkspace.id);
        
        socket.emit("join_workspace", selectedWorkspace.id);

        const handleNewActivity = (newLog) => {
            if (showLogs) {
                setLogs(prev => [newLog, ...prev]);
            } else {
                setUnreadCount(prev => prev + 1);
            }
        };

        socket.on("new_activity", handleNewActivity);

        return () => {
            socket.off("new_activity", handleNewActivity);
        };
    }
  }, [selectedWorkspace, showLogs]);

  useEffect(() => {
    if (showLogs && selectedWorkspace) {
        fetchLogs();
        setUnreadCount(0);
    }
  }, [showLogs]);

  // --- HANDLERS ---
  const createBoard = async (e) => {
    e.preventDefault();
    try {
        const { data } = await api.post('/boards', { title: newBoardTitle, workspaceId: selectedWorkspace.id });
        setBoards([data, ...boards]); setNewBoardTitle('');
    } catch (e) { alert('Failed'); }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName) return;
    try {
      const { data } = await api.post('/workspaces', { name: newWorkspaceName });
      setWorkspaces([...workspaces, data]);
      setSelectedWorkspace(data);
      setShowCreateWorkspace(false);
      setNewWorkspaceName('');
    } catch (error) { alert("Failed to create workspace"); }
  };

  const handleDeleteWorkspace = async (workspaceId, workspaceName, e) => {
    e.stopPropagation(); 
    if (!window.confirm(`Delete "${workspaceName}" permanently? This cannot be undone.`)) return;
    try {
      await api.delete(`/workspaces/${workspaceId}`);
      const remaining = workspaces.filter(w => w.id !== workspaceId);
      setWorkspaces(remaining);
      if (selectedWorkspace.id === workspaceId) {
          setSelectedWorkspace(remaining.length > 0 ? remaining[0] : null);
          setBoards([]);
      }
    } catch (error) { alert("Delete failed. Only the Owner can delete workspaces."); }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try { await api.post(`/workspaces/${selectedWorkspace.id}/invite`, { email: inviteEmail }); setShowInvite(false); setInviteEmail(''); } catch (e) { alert('Failed'); }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col z-10">
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 mb-6 text-indigo-600">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">T</div>
            <span className="text-xl font-bold">TaskSync</span>
          </div>

          <div className="flex justify-between items-center mb-3">
             <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Workspaces</h2>
             <button onClick={() => setShowCreateWorkspace(true)} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded transition-colors">
               <Plus size={16} />
             </button>
          </div>
          
          <div className="space-y-1">
            {workspaces.map((ws) => (
              <div 
                key={ws.id}
                onClick={() => setSelectedWorkspace(ws)}
                className={`group flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  selectedWorkspace?.id === ws.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                   <Briefcase size={16} /> <span className="truncate">{ws.name}</span>
                </div>
                {ws.ownerId === user?.id && (
                  <button 
                    onClick={(e) => handleDeleteWorkspace(ws.id, ws.name, e)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all p-1"
                    title="Delete Workspace"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* USER PROFILE SECTION */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 border border-indigo-200">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-sm overflow-hidden">
                    <p className="font-medium truncate text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate" title={user?.email}>{user?.email}</p>
                </div>
            </div>
            <button onClick={logout} className="w-full flex items-center justify-center gap-2 text-sm text-red-600 hover:bg-red-50 p-2 rounded-md transition-colors border border-transparent hover:border-red-100">
                <LogOut size={16} /> Log out
            </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative">
        {selectedWorkspace ? (
          <>
            <header className="flex justify-between items-start p-8 bg-white border-b border-gray-200">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedWorkspace.name}</h1>
                {/* --- UPDATE HERE: SHOW OWNER NAME --- */}
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  Workspace Owner: <span className="font-medium text-gray-900">{workspaceOwner?.name || 'Unknown'}</span>
                </p>
              </div>
              
              <div className="flex gap-3">
                {isWorkspaceAdmin && (
                  <>
                     <button 
                        onClick={() => setShowLogs(true)} 
                        className="relative flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm transition-all border border-gray-200"
                     >
                        <Activity size={16} /> Activity Log
                        {unreadCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-bounce">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                     </button>

                     <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 shadow-sm">
                        <UserPlus size={16} /> Invite
                     </button>
                  </>
                )}
              </div>
            </header>

            <div className="p-8 overflow-y-auto flex-1">
                <div className="mb-8">
                    <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-200 max-w-md">
                        <form onSubmit={createBoard} className="flex gap-2">
                            <input type="text" placeholder="e.g., Q4 Roadmap" className="flex-1 border-none outline-none px-4 py-2 text-sm" value={newBoardTitle} onChange={(e) => setNewBoardTitle(e.target.value)} />
                            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium"><Plus size={16} /> Create</button>
                        </form>
                    </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Boards</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {boards.map((board) => (
                        <div key={board.id} onClick={() => navigateTo(`/board/${board.id}`)} className="group cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-200 overflow-hidden transition-all duration-200">
                            <div className={`h-24 ${board.bgImage || 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}></div>
                            <div className="p-4"><h3 className="font-bold text-gray-900 group-hover:text-indigo-600">{board.title}</h3></div>
                        </div>
                    ))}
                </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">Select a workspace</div>
        )}

        {/* --- ACTIVITY LOG SIDEBAR --- */}
        {showLogs && (
          <div className="absolute right-0 top-0 bottom-0 w-[400px] bg-white border-l border-gray-200 shadow-2xl z-20 flex flex-col animate-slide-in">
             <div className="p-4 border-b flex justify-between items-center bg-white z-10 sticky top-0">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm"><Activity size={18}/> Activity Feed</h3>
                <button onClick={() => setShowLogs(false)} className="hover:bg-gray-100 p-1 rounded"><X size={18} className="text-gray-500"/></button>
             </div>
             <div className="flex-1 overflow-y-auto bg-white">
                {logs.length === 0 && <div className="p-10 text-center text-gray-400 text-xs">No recent activity</div>}
                {logs.map(log => (
                  <ActivityItem key={log.id} log={log} />
                ))}
             </div>
          </div>
        )}

        {/* --- MODALS --- */}
        {showCreateWorkspace && (
           <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
             <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                <h3 className="text-lg font-bold mb-4">Create Workspace</h3>
                <form onSubmit={handleCreateWorkspace}>
                   <input autoFocus type="text" placeholder="Workspace Name" className="w-full border p-2 rounded mb-4" value={newWorkspaceName} onChange={e => setNewWorkspaceName(e.target.value)} />
                   <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setShowCreateWorkspace(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Create</button>
                   </div>
                </form>
             </div>
           </div>
        )}
        {showInvite && (
           <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
             <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                <h3 className="text-lg font-bold mb-4">Invite Member</h3>
                <form onSubmit={handleInvite}>
                   <input type="email" placeholder="Email" className="w-full border p-2 rounded mb-4" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                   <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setShowInvite(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Invite</button>
                   </div>
                </form>
             </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;