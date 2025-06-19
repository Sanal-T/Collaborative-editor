import React, { useState } from 'react';
import DocumentEditor from './components/DocumentEditor';
import DocumentList from './components/DocumentList';
import './App.css';

function App() {
  const [currentDocument, setCurrentDocument] = useState(null);
  const [userName, setUserName] = useState('');

  // Get user name on first load
  React.useEffect(() => {
    const name = localStorage.getItem('userName');
    if (!name) {
      const newName = prompt('Enter your name:') || 'Anonymous';
      localStorage.setItem('userName', newName);
      setUserName(newName);
    } else {
      setUserName(name);
    }
  }, []);

  const handleSelectDocument = (documentId) => {
    setCurrentDocument(documentId);
  };

  const handleCreateDocument = (document) => {
    setCurrentDocument(document._id);
  };

  const handleBackToList = () => {
    setCurrentDocument(null);
  };

  return (
    <div className="App min-h-screen bg-gray-50">
      {currentDocument ? (
        <div>
          <button
            onClick={handleBackToList}
            className="absolute top-4 left-4 z-10 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm font-medium"
          >
            ← Back to Documents
          </button>
          <DocumentEditor 
            documentId={currentDocument} 
            userName={userName}
          />
        </div>
      ) : (
        <DocumentList
          onSelectDocument={handleSelectDocument}
          onCreateDocument={handleCreateDocument}
        />
      )}
    </div>
  );
}

export default App;