import React, { useState } from 'react';
import './CollectionViewerModal.css';
import { 
    IconLayoutGrid, 
    IconList, 
    IconX,
    IconBooks,
    IconFileText,
    IconChevronLeft,
    IconChevronRight
} from '@tabler/icons-react';

function CollectionViewerModal({ isOpen, onClose, collectionName, data, isLoading, onPrevPage, onNextPage }) {
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

    if (!isOpen) {
        return null;
    }

    const { documents, pagination } = data || {};

    const truncateText = (text, maxLength = 150) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const formatMetadata = (metadata) => {
        if (!metadata || Object.keys(metadata).length === 0) {
            return <span className="no-metadata">Không có metadata</span>;
        }
        return Object.entries(metadata).map(([key, value]) => (
            <div key={key} className="metadata-item">
                <span className="metadata-key">{key}:</span>
                <span className="metadata-value"><strong>{String(value)}</strong></span>
            </div>
        ));
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="header-info">
                        <h2>
                            <IconBooks size={32} className="icon" />
                            {collectionName}
                        </h2>
                        {pagination && (
                            <p className="collection-stats">
                                {pagination.total} tài liệu • Trang {Math.floor(pagination.offset / pagination.limit) + 1}
                            </p>
                        )}
                    </div>
                    <div className="header-controls">
                        <div className="view-toggle">
                            <button 
                                className={viewMode === 'grid' ? 'active' : ''}
                                onClick={() => setViewMode('grid')}
                                title="Chế độ lưới"
                            >
                                <IconLayoutGrid size={20} />
                            </button>
                            <button 
                                className={viewMode === 'table' ? 'active' : ''}
                                onClick={() => setViewMode('table')}
                                title="Chế độ bảng"
                            >
                                <IconList size={20} />
                            </button>
                        </div>
                        <button onClick={onClose} className="close-btn"><IconX size={24} /></button>
                    </div>
                </div>

                {/* Body */}
                <div className="modal-body">
                    <div className="documents-container">
                        {isLoading ? (
                            <div className="loading-state"><div className="loading-spinner"></div></div>
                        ) : !documents || documents.length === 0 ? (
                            <div className="empty-state"><h3>Collection này trống</h3></div>
                        ) : (
                            viewMode === 'grid' ? (
                                <div className="documents-grid">
                                    {documents.map((doc, index) => (
                                        <div 
                                            key={doc.id || index} 
                                            className="document-card"
                                            onClick={() => setSelectedDoc(doc)}
                                        >
                                            <div className="card-header">
                                                <IconFileText size={24} className="icon" />
                                                <span className="doc-id">#{doc.id.slice(0, 8)}...</span>
                                            </div>
                                            <div className="card-content">
                                                <p>{truncateText(doc.content)}</p>
                                            </div>
                                            <div className="card-footer">
                                                {doc.metadata && Object.keys(doc.metadata).length > 0 && (
                                                    <span className="metadata-badge">
                                                        {Object.keys(doc.metadata).length} metadata
                                                    </span>
                                                )}
                                                <span>{doc.content.length} ký tự</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <table className="documents-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '35%' }}>Nội dung</th>
                                            <th style={{ width: '45%' }}>Metadata</th>
                                            <th style={{ width: '20%' }}>ID</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {documents.map((doc, index) => (
                                            <tr key={doc.id || index} onClick={() => setSelectedDoc(doc)}>
                                                <td>{truncateText(doc.content, 200)}</td>
                                                <td>{formatMetadata(doc.metadata)}</td>
                                                <td className="doc-id">#{doc.id.slice(0, 8)}...</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    {pagination && (
                        <>
                            <div className="pagination-info">
                                <span>
                                    Hiển thị <strong>{pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)}</strong> 
                                    {' '}trên tổng số <strong>{pagination.total}</strong>
                                </span>
                            </div>
                            <div className="pagination-controls">
                                <button onClick={onPrevPage} disabled={pagination.offset === 0 || isLoading} className="pagination-btn">
                                    <IconChevronLeft size={16} /> Trước
                                </button>
                                <button onClick={onNextPage} disabled={!pagination.has_next || isLoading} className="pagination-btn">
                                    Sau <IconChevronRight size={16} />
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Document Detail Modal */}
                {selectedDoc && (
                    <div className="detail-backdrop" onClick={() => setSelectedDoc(null)}>
                        <div className="detail-modal" onClick={e => e.stopPropagation()}>
                            <div className="detail-header">
                                <h3>Thông Tin Tài Liệu #{selectedDoc.id}</h3>
                                <button onClick={() => setSelectedDoc(null)} className="close-btn"><IconX size={20}/></button>
                            </div>
                            <div className="detail-body">
                                <div className="detail-section">
                                    <h4>Nội dung đầy đủ</h4>
                                    <div className="full-content">{selectedDoc.content}</div>
                                </div>
                                <div className="detail-section">
                                    <h4>Metadata</h4>
                                    <div>{formatMetadata(selectedDoc.metadata)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CollectionViewerModal;