import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Plus, Layout, Briefcase } from 'lucide-react';

const Dashboard = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [boards, setBoards] = useState([]);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 1. Fetch Workspaces on Load
  useEffect(() => {
    fetchWorkspaces();
  }, []);

  // 2. Fetch Boards when Workspace changes
  useEffect(() => {
    if (selectedWorkspace) {
      fetchBoards(selectedWorkspace.id);
    }
  }, [selectedWorkspace]);

  const fetchWorkspaces = async () => {
    try {
      const { data } = await api.get('/workspaces');
      setWorkspaces(data);
      if (data.length > 0) setSelectedWorkspace(data[0]); // Auto-select first
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

  if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - Workspaces */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Briefcase size={20} /> Workspaces
          </h2>
          <div className="mt-4 space-y-2">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => setSelectedWorkspace(ws)}
                className={`w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedWorkspace?.id === ws.id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {ws.name}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content - Boards */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedWorkspace?.name}</h1>
            <p className="text-gray-500">Manage your projects and boards here.</p>
          </div>
        </header>

        {/* Create Board Input */}
        <div className="mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={createBoard} className="flex gap-4">
            <input
              type="text"
              placeholder="Enter new board title..."
              className="flex-1 border-gray-300 rounded-md shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500"
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
            >
              <Plus size={18} /> Create Board
            </button>
          </form>
        </div>

        {/* Boards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <div
              key={board.id}
              onClick={() => navigate(`/board/${board.id}`)}
              className="group cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-200 overflow-hidden transition-all"
            >
              <div className={`h-24 ${board.bgImage || 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}></div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {board.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Updated recently</p>
              </div>
            </div>
          ))}
          
          {boards.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-500">
              <Layout className="mx-auto h-12 w-12 opacity-20 mb-2" />
              <p>No boards found. Create one to get started!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;