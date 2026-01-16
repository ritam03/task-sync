import { useEffect, useState } from 'react';
import { X, Trash2, Clock, AlignLeft, Send } from 'lucide-react';
import api from '../services/api';

const CardModal = ({ cardId, onClose, isAdmin, onDeleteSuccess }) => {
  const [card, setCard] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCardDetails();
  }, [cardId]);

  const fetchCardDetails = async () => {
    try {
      const { data } = await api.get(`/cards/${cardId}`);
      setCard(data);
    } catch (error) {
      console.error("Failed to load card", error);
    } finally {
      setLoading(false);
    }
  };

  const updateCard = async (updates) => {
    try {
      // Optimistic update
      setCard({ ...card, ...updates });
      await api.put(`/cards/${cardId}`, updates);
    } catch (error) {
      console.error("Update failed");
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const { data } = await api.post(`/cards/${cardId}/comments`, { text: commentText });
      setCard({ ...card, comments: [data, ...card.comments] });
      setCommentText('');
    } catch (error) {
      console.error("Comment failed");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this card?")) return;
    try {
      await api.delete(`/cards/${cardId}`);
      onDeleteSuccess(cardId);
      onClose();
    } catch (error) {
      alert("Failed to delete. You might not have permission.");
    }
  };

  if (!cardId) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-start bg-gray-50">
          {loading ? <div className="h-6 w-48 bg-gray-200 animate-pulse rounded"></div> : (
             <input 
               type="text" 
               className="text-xl font-bold bg-transparent border-none focus:ring-2 focus:ring-blue-500 rounded px-1 w-full"
               value={card.title}
               onChange={(e) => updateCard({ title: e.target.value })}
             />
          )}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Due Date & Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1">
                 <Clock size={12} /> Due Date
               </label>
               <input 
                 type="date" 
                 className="border rounded p-1 text-sm w-full"
                 value={card?.dueDate ? card.dueDate.split('T')[0] : ''}
                 onChange={(e) => updateCard({ dueDate: new Date(e.target.value) })}
               />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
              <AlignLeft size={16} /> Description
            </label>
            <textarea
              className="w-full border rounded-md p-3 text-sm h-32 focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-gray-50 focus:bg-white transition-colors"
              placeholder="Add a more detailed description..."
              value={card?.description || ''}
              onChange={(e) => setCard({ ...card, description: e.target.value })}
              onBlur={(e) => updateCard({ description: e.target.value })}
            />
          </div>

          {/* Comments Section */}
          <div>
             <h3 className="text-sm font-bold text-gray-700 mb-3">Activity & Comments</h3>
             
             {/* Add Comment */}
             <form onSubmit={handleComment} className="flex gap-2 mb-4">
                <input 
                  className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700">
                  <Send size={16} />
                </button>
             </form>

             {/* Comments List */}
             <div className="space-y-3">
               {card?.comments?.map((c) => (
                 <div key={c.id} className="flex gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xs">
                      {c.user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{c.user.name} <span className="text-gray-400 font-normal text-xs ml-2">{new Date(c.createdAt).toLocaleDateString()}</span></p>
                      <p className="text-gray-600 bg-gray-50 p-2 rounded-md mt-1">{c.text}</p>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          {isAdmin && (
            <button 
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded transition-colors text-sm font-medium"
            >
              <Trash2 size={16} /> Delete Card
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default CardModal;