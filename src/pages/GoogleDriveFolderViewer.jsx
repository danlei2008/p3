import React from 'react';

const GoogleDriveFolderViewer = ({ folderId }) => {
  //const iframeUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`;



  const iframeUrl = 'https://drive.google.com/drive/folders/1vTBKHHqvIwYT3RbLKqSl2DhYi8ZEEjx7?usp=drive_link';

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <iframe
        src={iframeUrl}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Google Drive Folder Viewer"
      />
    </div>
  );
};

export default GoogleDriveFolderViewer;

