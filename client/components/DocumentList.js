import React, { useState, useEffect } from 'react';

const DocumentList = ({ onSelectDocument, onCreateDocument }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/documents');
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    const title = prompt('Enter document title:');
    if (!title) return;

    try {
      const response = await fetch('http://localhost:5000/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });
      
      const newDocument = await response.json();
      onCreateDocument(newDocument);
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Documents</h1>
        <button
          onClick={handleCreateDocument}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
        >
          + New Document
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => (
          <div
            key={doc._id}
            onClick={() => onSelectDocument(doc._id)}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg cursor-pointer border border-gray-200 transition-shadow"
          >
            <h3 className="font-semibold text-gray-800 mb-2">{doc.title}</h3>
            <p className="text-sm text-gray-500">
              Last modified: {new Date(doc.lastModified).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {documents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No documents yet</p>
          <button
            onClick={handleCreateDocument}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            Create your first document
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentList;