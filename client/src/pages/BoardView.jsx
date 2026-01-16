import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../services/api';
import { Plus, MoreHorizontal, Trash2 } from 'lucide-react';
import io from 'socket.io-client'; 
import CardModal from '../components/CardModal'; // Ensure this component exists from previous steps

// Initialize Socket outside component
const socket = io.connect("http://localhost:5000");

const BoardView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // Track Admin Role
  const [selectedCard, setSelectedCard] = useState(null); // Track Modal State

  useEffect(() => {
    fetchBoard();

    // 1. Join Board Room
    socket.emit("join_board", id);

    // 2. Listen for "card_moved"
    socket.on("card_moved", (data) => {
      setBoard((prevBoard) => {
        if (!prevBoard) return null;
        const newLists = [...prevBoard.lists];

        const sIndex = newLists.findIndex(l => l.id === data.oldList.id);
        const dIndex = newLists.findIndex(l => l.id === data.newList.id);
        
        if (sIndex !== -1) newLists[sIndex] = data.oldList;
        if (dIndex !== -1) newLists[dIndex] = data.newList;

        return { ...prevBoard, lists: newLists };
      });
    });

    // 3. Listen for creation events
    socket.on("list_added", (newList) => {
      setBoard(prev => ({ ...prev, lists: [...prev.lists, newList] }));
    });

    socket.on("card_added", (newCard) => {
      setBoard(prev => {
        const newLists = prev.lists.map(list => {
          if (list.id === newCard.listId) {
            return { ...list, cards: [...list.cards, newCard] };
          }
          return list;
        });
        return { ...prev, lists: newLists };
      });
    });

    return () => {
      socket.off("card_moved");
      socket.off("list_added");
      socket.off("card_added");
    };
  }, [id]);

  const fetchBoard = async () => {
    try {
      const { data } = await api.get(`/boards/${id}`);
      setBoard(data);
      setIsAdmin(data.role === 'ADMIN'); // Check Role from Backend Response
    } catch (error) {
      console.error('Failed to fetch board');
    } finally {
      setLoading(false);
    }
  };

  const deleteBoard = async () => {
    if (!window.confirm("Are you sure? All lists and cards will be lost.")) return;
    try {
      await api.delete(`/boards/${id}`);
      navigate('/dashboard');
    } catch (error) {
      alert("Delete failed. Only Admins can delete boards.");
    }
  };

  const onCardDeleted = (deletedCardId) => {
    // Remove card from local state instantly
    const newLists = board.lists.map(list => ({
      ...list,
      cards: list.cards.filter(c => c.id !== deletedCardId)
    }));
    setBoard({ ...board, lists: newLists });
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    // --- Optimistic Update Logic ---
    const newLists = [...board.lists];
    const sourceListIndex = newLists.findIndex(l => l.id === source.droppableId);
    const destListIndex = newLists.findIndex(l => l.id === destination.droppableId);
    
    const sourceList = newLists[sourceListIndex];
    const destList = newLists[destListIndex];

    const newSourceCards = [...sourceList.cards];
    const newDestCards = sourceList === destList ? newSourceCards : [...destList.cards];

    const [movedCard] = newSourceCards.splice(source.index, 1);
    newDestCards.splice(destination.index, 0, movedCard);

    const newSourceList = { ...sourceList, cards: newSourceCards };
    const newDestList = { ...destList, cards: newDestCards };

    newLists[sourceListIndex] = newSourceList;
    newLists[destListIndex] = newDestList;

    setBoard({ ...board, lists: newLists });

    socket.emit("move_card", {
      boardId: id,
      oldList: newSourceList,
      newList: newDestList
    });

    // --- Backend Order Calculation ---
    const destCards = newDestList.cards;
    let newOrder;
    if (destCards.length === 1) newOrder = 1000;
    else if (destination.index === 0) newOrder = destCards[1].order / 2;
    else if (destination.index === destCards.length - 1) newOrder = destCards[destCards.length - 2].order + 1024;
    else {
      const prev = destCards[destination.index - 1].order;
      const next = destCards[destination.index + 1].order;
      newOrder = (prev + next) / 2;
    }

    try {
      await api.put(`/cards/${draggableId}`, {
        listId: destList.id,
        order: newOrder,
      });
    } catch (error) {
      console.error("Move failed", error);
      fetchBoard();
    }
  };

  const createList = async () => {
    const title = prompt("Enter list title:");
    if (!title) return;
    try {
      const { data } = await api.post('/lists', { boardId: id, title });
      setBoard(prev => ({ ...prev, lists: [...prev.lists, data] }));
      socket.emit("add_list", { boardId: id, list: data });
    } catch (error) {
      console.error(error);
    }
  };

  const createCard = async (listId) => {
    const title = prompt("Enter card title:");
    if (!title) return;
    try {
      const { data } = await api.post('/cards', { listId, title });
      setBoard(prev => {
        const newLists = prev.lists.map(list => {
          if (list.id === listId) {
            return { ...list, cards: [...list.cards, data] };
          }
          return list;
        });
        return { ...prev, lists: newLists };
      });
      socket.emit("add_card", { boardId: id, card: data });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="text-center p-10">Loading Board...</div>;

  return (
    <div className="h-screen flex flex-col bg-blue-600 overflow-hidden">
      {/* HEADER */}
      <header className="bg-black/20 backdrop-blur-md p-4 text-white flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight">{board?.title}</h1>
          {/* RBAC: Only Admin sees Delete Button */}
          {isAdmin && (
            <button 
              onClick={deleteBoard}
              className="text-white/70 hover:text-red-300 hover:bg-red-500/20 p-2 rounded transition-colors"
              title="Delete Board"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
        <div className="flex gap-2 text-xs font-medium items-center bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
           <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
           Live Sync Active
        </div>
      </header>

      {/* KANBAN CANVAS */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="h-full flex px-4 pb-4 items-start gap-4 mt-4">
            
            {/* Render Lists */}
            {board?.lists.map((list) => (
              <div key={list.id} className="w-72 flex-shrink-0 bg-gray-100 rounded-xl shadow-lg max-h-full flex flex-col border border-gray-200/50">
                <div className="p-3 font-semibold text-gray-700 flex justify-between items-center">
                  <span className="truncate">{list.title}</span>
                  <MoreHorizontal size={16} className="cursor-pointer text-gray-400 hover:text-gray-700" />
                </div>
                
                {/* Droppable Area */}
                <Droppable droppableId={list.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`px-2 flex-1 overflow-y-auto min-h-[20px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-gray-200/50' : ''
                      }`}
                    >
                      {list.cards.map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setSelectedCard(card.id)} // CLICK TO OPEN MODAL
                              className={`bg-white p-3 rounded-lg mb-2 shadow-sm text-sm border border-gray-200 group hover:border-blue-400 hover:shadow-md transition-all cursor-pointer relative ${
                                snapshot.isDragging ? 'shadow-2xl rotate-2 ring-2 ring-blue-500 z-50' : ''
                              }`}
                              style={{ ...provided.draggableProps.style }}
                            >
                              <div className="font-medium text-gray-800">{card.title}</div>
                              {/* Show small badge if description/date exists (optional polish) */}
                              {(card.description || card.dueDate) && (
                                <div className="mt-2 flex gap-2">
                                   {card.description && <div className="h-1.5 w-8 bg-gray-200 rounded-full"/>}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                <button 
                  onClick={() => createCard(list.id)}
                  className="p-3 m-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-lg flex items-center gap-2 text-sm transition-colors"
                >
                  <Plus size={16} /> Add a card
                </button>
              </div>
            ))}

            {/* Add List Button */}
            <button 
              onClick={createList}
              className="w-72 flex-shrink-0 bg-white/20 hover:bg-white/30 text-white p-4 rounded-xl font-medium text-left flex items-center gap-2 backdrop-blur-md transition-all border border-white/10 shadow-inner"
            >
              <Plus size={20} /> Add another list
            </button>
          </div>
        </div>
      </DragDropContext>

      {/* MODAL RENDERER */}
      {selectedCard && (
        <CardModal 
          cardId={selectedCard} 
          onClose={() => setSelectedCard(null)}
          isAdmin={isAdmin}
          onDeleteSuccess={onCardDeleted}
        />
      )}
    </div>
  );
};

export default BoardView;