import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useSocket } from '../hooks/useSocket';

const DocumentEditor = ({ documentId, userName }) => {
  const [quill, setQuill] = useState(null);
  const [users, setUsers] = useState([]);
  const socket = useSocket();
  const isUpdating = useRef(false);

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
  };

  // Initialize document
  useEffect(() => {
    if (!socket || !documentId) return;

    socket.emit('join-document', documentId, { name: userName });

    socket.on('load-document', (documentData) => {
      if (quill) {
        quill.setContents(documentData);
      }
    });

    socket.on('receive-changes', (delta, userId) => {
      if (quill && !isUpdating.current) {
        quill.updateContents(delta);
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
  }, [socket, documentId, userName, quill]);

  // Handle text changes
  const handleTextChange = useCallback((content, delta, source, editor) => {
    if (source !== 'user' || !socket) return;

    isUpdating.current = true;
    socket.emit('send-changes', documentId, delta);
    
    setTimeout(() => {
      isUpdating.current = false;
    }, 100);

    // Auto-save every 2 seconds
    clearTimeout(window.saveTimeout);
    window.saveTimeout = setTimeout(() => {
      socket.emit('save-document', documentId, editor.getContents());
    }, 2000);
  }, [socket, documentId]);

  // Quill ref callback
  const quillRef = useCallback((node) => {
    if (node !== null) {
      const quillInstance = node.getEditor();
      setQuill(quillInstance);
    }
  }, []);

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

      {/* Editor */}
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          <ReactQuill
            ref={quillRef}
            theme="snow"
            onChange={handleTextChange}
            modules={modules}
            style={{ height: 'calc(100vh - 200px)' }}
            placeholder="Start typing your document..."
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;