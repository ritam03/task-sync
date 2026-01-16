import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../services/api';
import { Plus, MoreHorizontal } from 'lucide-react';
import io from 'socket.io-client'; // Import Socket Client

// Initialize Socket outside component to prevent re-connections
const socket = io.connect("http://localhost:5000");

const BoardView = () => {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoard();

    // 1. Join the specific board room
    socket.emit("join_board", id);

    // 2. Listen for "card_moved" events from other users
    socket.on("card_moved", (data) => {
      setBoard((prevBoard) => {
        if (!prevBoard) return null;
        const newLists = [...prevBoard.lists];

        // Replace the old lists with the new state sent by the server/peer
        // NOTE: For simplicity, we are replacing the specific lists involved
        // In a production app, you might sync the whole board or apply exact diffs
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

    // Cleanup listeners on unmount
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
    } catch (error) {
      console.error('Failed to fetch board');
    } finally {
      setLoading(false);
    }
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

    // Create copies of cards arrays to avoid direct mutation issues
    const newSourceCards = [...sourceList.cards];
    const newDestCards = sourceList === destList ? newSourceCards : [...destList.cards];

    const [movedCard] = newSourceCards.splice(source.index, 1);
    newDestCards.splice(destination.index, 0, movedCard);

    // Update the objects
    const newSourceList = { ...sourceList, cards: newSourceCards };
    const newDestList = { ...destList, cards: newDestCards };

    newLists[sourceListIndex] = newSourceList;
    newLists[destListIndex] = newDestList;

    setBoard({ ...board, lists: newLists });

    // --- Emit Socket Event ---
    // Tell others "I moved a card, here is the new state of the lists involved"
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
      
      // Update local
      setBoard(prev => ({ ...prev, lists: [...prev.lists, data] }));
      
      // Notify others
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
      
      // Update local
      setBoard(prev => {
        const newLists = prev.lists.map(list => {
          if (list.id === listId) {
            return { ...list, cards: [...list.cards, data] };
          }
          return list;
        });
        return { ...prev, lists: newLists };
      });

      // Notify others
      socket.emit("add_card", { boardId: id, card: data });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="text-center p-10">Loading Board...</div>;

  return (
    <div className="h-screen flex flex-col bg-blue-500 overflow-hidden">
      <header className="bg-white/20 backdrop-blur-sm p-4 text-white flex justify-between items-center">
        <h1 className="text-xl font-bold">{board?.title}</h1>
        <div className="flex gap-2 text-sm items-center">
           <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
           Live Sync Active
        </div>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="h-full flex px-4 pb-4 items-start gap-4 mt-4">
            
            {board?.lists.map((list) => (
              <div key={list.id} className="w-72 flex-shrink-0 bg-gray-100 rounded-lg shadow-md max-h-full flex flex-col">
                <div className="p-3 font-semibold text-gray-700 flex justify-between">
                  {list.title}
                  <MoreHorizontal size={16} className="cursor-pointer text-gray-500" />
                </div>
                
                <Droppable droppableId={list.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`p-2 flex-1 overflow-y-auto min-h-[50px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-gray-200' : ''
                      }`}
                    >
                      {list.cards.map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white p-3 rounded mb-2 shadow-sm text-sm border border-gray-200 hover:border-blue-400 ${
                                snapshot.isDragging ? 'shadow-lg rotate-2 ring-2 ring-blue-500' : ''
                              }`}
                              style={{ ...provided.draggableProps.style }}
                            >
                              {card.title}
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
                  className="p-3 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-b-lg flex items-center gap-2 text-sm"
                >
                  <Plus size={16} /> Add a card
                </button>
              </div>
            ))}

            <button 
              onClick={createList}
              className="w-72 flex-shrink-0 bg-white/30 hover:bg-white/50 text-white p-3 rounded-lg font-medium text-left flex items-center gap-2 backdrop-blur-md transition-colors"
            >
              <Plus size={20} /> Add another list
            </button>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};

export default BoardView;