import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Task.css';

const FileUpload = ({ user }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [project, setProject] = useState({
    id: parseInt(projectId),
    name: '区块链投票系统'
  });
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const maxFileSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/zip',
    'application/x-zip-compressed',
    'text/javascript',
    'text/html',
    'text/css',
    'application/json'
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (selectedFiles) => {
    const validFiles = [];
    const errors = [];

    selectedFiles.forEach(file => {
      // 检查文件大小
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: 文件大小超过50MB限制`);
        return;
      }

      // 检查文件类型
      if (!allowedTypes.includes(file.type) && !isCodeFile(file.name)) {
        errors.push(`${file.name}: 不支持的文件类型`);
        return;
      }

      // 检查是否已存在
      if (files.some(f => f.name === file.name && f.size === file.size)) {
        errors.push(`${file.name}: 文件已存在`);
        return;
      }

      validFiles.push({
        file,
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending'
      });
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
    } else {
      setError('');
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const isCodeFile = (filename) => {
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.sol', '.go', '.rs', '.php'];
    return codeExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (filename, type) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('zip')) return '📦';
    if (isCodeFile(filename)) return '💻';
    return '📎';
  };

  const simulateUpload = (fileItem) => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          resolve();
        }
        setUploadProgress(prev => ({
          ...prev,
          [fileItem.id]: Math.min(progress, 100)
        }));
      }, 200);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('请选择要上传的文件');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // 更新所有文件状态为上传中
      setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' })));

      // 模拟并发上传
      const uploadPromises = files.map(async (fileItem) => {
        await simulateUpload(fileItem);
        
        // 模拟API调用
        const formData = new FormData();
        formData.append('file', fileItem.file);
        formData.append('projectId', projectId);
        formData.append('uploader', user.username);
        formData.append('uploadTime', new Date().toISOString());

        // 这里应该是真实的API调用
        // const response = await fetch('/api/files/upload', {
        //   method: 'POST',
        //   headers: {
        //     'Authorization': `Bearer ${user.token}`
        //   },
        //   body: formData
        // });

        return { ...fileItem, status: 'completed' };
      });

      const results = await Promise.all(uploadPromises);
      
      // 更新文件状态
      setFiles(results);
      
      // 延迟跳转，让用户看到上传完成状态
      setTimeout(() => {
        navigate(`/project/${projectId}`);
      }, 1500);

    } catch (err) {
      setError('上传失败，请稍后重试');
      setFiles(prev => prev.map(f => ({ ...f, status: 'error' })));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload">
      <div className="container">
        <div className="page-header">
          <h1>📤 文件上传</h1>
          <p>为项目 "{project.name}" 上传文件</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="upload-container">
          {/* 拖拽上传区域 */}
          <div
            className={`upload-dropzone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="dropzone-content">
              <div className="upload-icon">📁</div>
              <h3>拖拽文件到此处或点击选择</h3>
              <p>支持 PDF, Word, 图片, 代码文件等格式</p>
              <p className="file-limit">单个文件最大 50MB</p>
              <button type="button" className="btn btn-primary">
                📂 选择文件
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.sol,.go,.rs,.php,.html,.css,.json"
            />
          </div>

          {/* 文件列表 */}
          {files.length > 0 && (
            <div className="files-list-container">
              <div className="files-header">
                <h3>📋 待上传文件 ({files.length})</h3>
                <div className="files-actions">
                  <button
                    onClick={() => setFiles([])}
                    className="btn btn-secondary btn-sm"
                    disabled={uploading}
                  >
                    🗑️ 清空列表
                  </button>
                  <button
                    onClick={handleUpload}
                    className="btn btn-primary"
                    disabled={uploading || files.length === 0}
                  >
                    {uploading ? '上传中...' : '📤 开始上传'}
                  </button>
                </div>
              </div>

              <div className="files-list">
                {files.map((fileItem) => (
                  <div key={fileItem.id} className="file-item-upload">
                    <div className="file-info-section">
                      <div className="file-icon-large">
                        {getFileIcon(fileItem.name, fileItem.type)}
                      </div>
                      <div className="file-details">
                        <h4>{fileItem.name}</h4>
                        <p>{formatFileSize(fileItem.size)}</p>
                        <span className={`file-status ${fileItem.status}`}>
                          {fileItem.status === 'pending' && '⏳ 等待上传'}
                          {fileItem.status === 'uploading' && '📤 上传中...'}
                          {fileItem.status === 'completed' && '✅ 上传完成'}
                          {fileItem.status === 'error' && '❌ 上传失败'}
                        </span>
                      </div>
                    </div>

                    {/* 进度条 */}
                    {fileItem.status === 'uploading' && (
                      <div className="upload-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${uploadProgress[fileItem.id] || 0}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">
                          {Math.round(uploadProgress[fileItem.id] || 0)}%
                        </span>
                      </div>
                    )}

                    {/* 操作按钮 */}
                    {fileItem.status === 'pending' && (
                      <button
                        onClick={() => removeFile(fileItem.id)}
                        className="btn btn-danger btn-sm"
                        disabled={uploading}
                      >
                        ❌
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 上传说明 */}
          <div className="upload-info">
            <h3>📋 上传说明</h3>
            <div className="info-grid">
              <div className="info-item">
                <h4>📁 支持的文件类型</h4>
                <ul>
                  <li>文档: PDF, Word, TXT</li>
                  <li>图片: JPG, PNG, GIF</li>
                  <li>代码: JS, TS, Python, Java, Solidity 等</li>
                  <li>压缩包: ZIP</li>
                </ul>
              </div>
              <div className="info-item">
                <h4>📏 文件限制</h4>
                <ul>
                  <li>单个文件最大 50MB</li>
                  <li>支持批量上传</li>
                  <li>自动去重检测</li>
                  <li>支持拖拽上传</li>
                </ul>
              </div>
              <div className="info-item">
                <h4>🔒 安全保障</h4>
                <ul>
                  <li>文件类型安全检查</li>
                  <li>病毒扫描保护</li>
                  <li>访问权限控制</li>
                  <li>版本历史记录</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(`/project/${projectId}`)}
              className="btn btn-secondary"
              disabled={uploading}
            >
              返回项目
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;