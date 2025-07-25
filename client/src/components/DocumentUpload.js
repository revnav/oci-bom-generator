import React from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon, 
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';

const DocumentUpload = ({ onUpload, isLoading, uploadedDocument }) => {
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    rejectedFiles
  } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/bmp': ['.bmp'],
      'image/tiff': ['.tiff', '.tif']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onUpload(acceptedFiles[0]);
      }
    }
  });

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'tif'].includes(ext)) {
      return <PhotoIcon className="w-5 h-5" />;
    }
    return <DocumentTextIcon className="w-5 h-5" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${isDragActive && !isDragReject ? 'border-blue-400 bg-blue-50' : ''}
          ${isDragReject ? 'border-red-400 bg-red-50' : ''}
          ${!isDragActive ? 'border-gray-300 hover:border-gray-400' : ''}
          ${isLoading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isLoading ? (
          <div className="space-y-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-600">Processing document...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto" />
            
            {isDragActive ? (
              <div>
                <p className="text-blue-600 font-medium">
                  {isDragReject ? 'File type not supported' : 'Drop your file here'}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-700 font-medium">
                  Drag & drop a document here
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  or click to select a file
                </p>
              </div>
            )}
            
            <div className="text-xs text-gray-500">
              <p>Supported formats: PDF, Excel, Word, Images</p>
              <p>Maximum file size: 10MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Document Status */}
      {uploadedDocument && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-green-900">
                Document processed successfully
              </h4>
              <div className="mt-2 flex items-center space-x-2 text-sm text-green-700">
                {getFileIcon(uploadedDocument.filename)}
                <span>{uploadedDocument.filename}</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Content has been extracted and added to your requirements.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {rejectedFiles && rejectedFiles.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-900">
                Upload failed
              </h4>
              {rejectedFiles.map((file, index) => (
                <div key={index} className="mt-2 text-sm text-red-700">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(file.name)}
                    <span>{file.name}</span>
                    <span className="text-xs">({formatFileSize(file.size)})</span>
                  </div>
                  <ul className="mt-1 text-xs text-red-600">
                    {file.errors.map((error, errorIndex) => (
                      <li key={errorIndex}>
                        • {error.code === 'file-too-large' 
                            ? 'File is too large (max 10MB)' 
                            : error.code === 'file-invalid-type'
                            ? 'File type not supported'
                            : error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Supported Formats Info */}
      <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
        <div>
          <h4 className="font-medium text-gray-700 mb-1">Documents</h4>
          <ul className="space-y-0.5">
            <li>• PDF files (.pdf)</li>
            <li>• Excel sheets (.xlsx, .xls)</li>
            <li>• Word docs (.docx, .doc)</li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium text-gray-700 mb-1">Images (OCR)</h4>
          <ul className="space-y-0.5">
            <li>• JPEG (.jpg, .jpeg)</li>
            <li>• PNG (.png)</li>
            <li>• BMP, TIFF formats</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;