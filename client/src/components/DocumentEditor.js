import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';

const DocumentEditor = ({ documentId, userName }) => {
  const [content, setContent] = useState('');
  const [users, setUsers] = useState([]);
  const socket = useSocket();
  const textareaRef = useRef(null);
  const isUpdating = useRef(false);

  // Initialize document
  useEffect(() => {
    if (!socket || !documentId) return;

    socket.emit('join-document', documentId, { name: userName });

    socket.on('load-document', (documentData) => {
      if (documentData && documentData.content) {
        setContent(documentData.content);
      }
    });

    socket.on('receive-changes', (newContent, userId) => {
      if (!isUpdating.current) {
        setContent(newContent);
      }
    });

    socket.on('user-joined', (user) => {
      setUsers(prev => [...prev, user]);
    });

    socket.on('user-left', (userId) => {
      setUsers(prev => prev.filter(user => user.id !== userId));
    });

    socket.on('users-list', (usersList) => {
      setUsers(usersList);
    });

    return () => {
      socket.off('load-document');
      socket.off('receive-changes');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('users-list');
    };
  }, [socket, documentId, userName]);

  // Handle text changes
  const handleTextChange = useCallback((e) => {
    const newContent = e.target.value;
    setContent(newContent);

    if (!socket) return;

    isUpdating.current = true;
    socket.emit('send-changes', documentId, newContent);
    
    setTimeout(() => {
      isUpdating.current = false;
    }, 100);

    // Auto-save every 2 seconds
    clearTimeout(window.saveTimeout);
    window.saveTimeout = setTimeout(() => {
      socket.emit('save-document', documentId, { content: newContent });
    }, 2000);
  }, [socket, documentId]);

  // Formatting functions
  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    textareaRef.current.focus();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">Document Editor</h1>
        
        {/* Active users */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Active users:</span>
          <div className="flex -space-x-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                style={{ backgroundColor: user.color }}
                title={user.name}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b p-2 flex flex-wrap gap-2">
        <button
          onClick={() => formatText('bold')}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
        >
          B
        </button>
        <button
          onClick={() => formatText('italic')}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm italic"
        >
          I
        </button>
        <button
          onClick={() => formatText('underline')}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm underline"
        >
          U
        </button>
        <div className="w-px bg-gray-300 mx-1"></div>
        <button
          onClick={() => formatText('fontSize', '3')}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
        >
          H1
        </button>
        <button
          onClick={() => formatText('fontSize', '2')}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
        >
          H2
        </button>
        <div className="w-px bg-gray-300 mx-1"></div>
        <button
          onClick={() => formatText('insertUnorderedList')}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
        >
          • List
        </button>
        <button
          onClick={() => formatText('insertOrderedList')}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
        >
          1. List
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            className="w-full h-full p-6 text-base leading-relaxed resize-none border-none outline-none"
            style={{ minHeight: 'calc(100vh - 250px)' }}
            placeholder="Start typing your document..."
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;