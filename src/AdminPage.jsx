import React, { useState, useEffect } from 'react';
// Đảm bảo bạn đã import tất cả các hàm API cần thiết
import { apiUploadDocument, apiGetCollections, apiDeleteCollection, apiGetDbStats, apiGetCollectionDocuments, apiGetResponseStats, apiGetTokenUsageStats} from './api';
// Import component Modal
import CollectionViewerModal from './CollectionViewerModal';
import './AdminPage.css';

function AdminPage() {
    // State cho form upload
    const [file, setFile] = useState(null);
    const [collectionName, setCollectionName] = useState('');
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');

    // State cho bảng điều khiển và danh sách collection
    const [collections, setCollections] = useState([]);
    const [dbStats, setDbStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [tokenStats, setTokenStats] = useState(null);
    const [responseStats, setResponseStats] = useState(null);

    // <-- THÊM MỚI: State để quản lý Modal xem chi tiết -->
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCollection, setCurrentCollection] = useState(null);
    const [collectionDocs, setCollectionDocs] = useState(null);
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);
    const [sourceUrl, setSourceUrl] = useState('');
    
    // Hàm để tải tất cả dữ liệu cần thiết cho trang admin
    const fetchAdminData = async () => {
        setIsLoading(true);
        setMessage('');
        setStatus('idle');
        try {
            const [statsData, collectionsData, responseData, tokenData] = await Promise.all([
                apiGetDbStats(),
                apiGetCollections(),
                apiGetResponseStats(),
                apiGetTokenUsageStats()
            ]);
            setDbStats(statsData);
            setCollections(collectionsData);
            setResponseStats(responseData);
            setTokenStats(tokenData);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu trang admin:", error);
            setMessage(error.message || "Không thể tải dữ liệu từ server.");
            setStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    // Tải dữ liệu chính khi component được tải lần đầu
    useEffect(() => {
        fetchAdminData();
    }, []);

    // <-- THÊM MỚI: useEffect để tải dữ liệu cho Modal -->
    // Sẽ chạy mỗi khi modal được mở hoặc khi người dùng chuyển trang
    useEffect(() => {
        if (!isModalOpen || !currentCollection) return;

        const fetchDocs = async () => {
            setIsLoadingDocs(true);
            const offset = collectionDocs?.pagination?.offset ?? 0;
            try {
                const data = await apiGetCollectionDocuments(currentCollection, 10, offset);
                setCollectionDocs(data);
            } catch (error) {
                console.error("Lỗi khi tải tài liệu:", error);
                // Bạn có thể thêm state để hiển thị lỗi trên modal nếu muốn
            } finally {
                setIsLoadingDocs(false);
            }
        };
        fetchDocs();
    }, [isModalOpen, currentCollection, collectionDocs?.pagination?.offset]);

    
    // <-- THÊM MỚI: Các hàm xử lý cho Modal -->
    const handleViewCollection = (collectionName) => {
        setCurrentCollection(collectionName);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentCollection(null);
        setCollectionDocs(null);
    };

    const handlePageChange = (newOffset) => {
        if (!currentCollection || newOffset < 0 || !collectionDocs) return;
        // Đảm bảo không vượt quá tổng số trang
        if (newOffset >= collectionDocs.pagination.total) return;
        setCollectionDocs(prev => ({ ...prev, pagination: { ...prev.pagination, offset: newOffset } }));
    };


    // Các hàm xử lý sự kiện cũ
    const handleFileChange = (e) => { setFile(e.target.files[0]); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !collectionName.trim()) {
            setMessage('Vui lòng chọn file và nhập tên danh mục.');
            setStatus('error');
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('collection_name', collectionName.trim().toLowerCase().replace(/\s+/g, '_'));
        if (sourceUrl.trim()) {
            formData.append('source_url', sourceUrl.trim());
        }
        setStatus('uploading');
        setMessage('Đang tải file...');
        try {
            await apiUploadDocument(formData);
            setStatus('success');
            setMessage('Tải file thành công!');
            setFile(null);
            setCollectionName('');
            document.getElementById('file-input').value = '';
            await fetchAdminData(); 
        } catch (error) {
            setStatus('error');
            setMessage(error.message || 'Lỗi khi tải file.');
        }
    };
    
    const handleDeleteCollection = async (name) => {
        if (window.confirm(`Bạn có chắc muốn xóa vĩnh viễn kho kiến thức "${name}" không?`)) {
            try {
                await apiDeleteCollection(name);
                setMessage(`Đã xóa thành công collection "${name}".`);
                setStatus('success');
                await fetchAdminData(); // Tải lại dữ liệu
            } catch (error) {
                setMessage(error.message || `Lỗi khi xóa collection "${name}".`);
                setStatus('error');
            }
        }
    };

    return (
    <div className="admin-container">
        <header className="admin-header"><h1>Trang Quản trị</h1></header>
        
        <main className="admin-content">
            {/* 1. Bảng điều khiển được sắp xếp lại */}
            <section className="admin-section">
                <h2>Bảng điều khiển</h2>
                {isLoading ? <p>Đang tải thống kê...</p> : (
                    <>
                        {dbStats && (
                            <>
                                <h3>Kho kiến thức</h3>
                                <div className="dashboard-summary">
                                    <div className="stat-card"><h3>Tổng số Kho</h3><p>{dbStats.total_collections}</p></div>
                                    <div className="stat-card"><h3>Tổng số Tài liệu</h3><p>{dbStats.total_documents}</p></div>
                                </div>
                            </>
                        )}

                        {responseStats && (
                            <>
                                <h3 style={{ marginTop: '30px' }}>Tốc độ Phản hồi (giây)</h3>
                                <div className="dashboard-summary">
                                    <div className="stat-card" title="Tốc độ trung bình">
                                        <h3>Trung bình</h3>
                                        <p>{responseStats.average_response_time} s</p>
                                    </div>
                                    <div className="stat-card" title="Phản hồi nhanh nhất">
                                        <h3>Nhanh nhất</h3>
                                        <p>{responseStats.fastest_response_time} s</p>
                                    </div>
                                    <div className="stat-card" title="Phản hồi chậm nhất">
                                        <h3>Chậm nhất</h3>
                                        <p>{responseStats.slowest_response_time} s</p>
                                    </div>
                                    <div className="stat-card" title="Tổng số phản hồi đã ghi nhận">
                                        <h3>Tổng số</h3>
                                        <p>{responseStats.total_ai_messages}</p>
                                    </div>
                                </div>
                            </>
                        )}

                        {tokenStats && (
                            <>
                                <h3 style={{ marginTop: '30px' }}>Sử dụng Token</h3>
                                <div className="dashboard-summary">
                                    <div className="stat-card" title="Tổng token đầu vào">
                                        <h3>Input</h3>
                                        <p>{tokenStats.total_prompt_tokens.toLocaleString('en-US')}</p>
                                    </div>
                                    <div className="stat-card" title="Tổng token đầu ra">
                                        <h3>Output</h3>
                                        <p>{tokenStats.total_completion_tokens.toLocaleString('en-US')}</p>
                                    </div>
                                    <div className="stat-card" title="Tổng cộng">
                                        <h3>Tổng cộng</h3>
                                        <p>{tokenStats.grand_total_tokens.toLocaleString('en-US')}</p>
                                    </div>
                                    <div className="stat-card" title="Tổng số lần gọi API">
                                        <h3>Lượt gọi</h3>
                                        <p>{tokenStats.total_llm_calls.toLocaleString('en-US')}</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </section>

            {/* 2. Form Tải lên tài liệu */}
            <section className="admin-section">
                <h2>Tải lên tài liệu mới</h2>
                <form onSubmit={handleSubmit} className="upload-form">
                     <div className="form-group">
                         <label htmlFor="collectionName">📚 Tên Kho kiến thức</label>
                         <input type="text" id="collectionName" value={collectionName} onChange={(e) => setCollectionName(e.target.value)} required disabled={status === 'uploading'} placeholder="ví dụ: quy_che_tuyen_sinh_2025"/>
                     </div>
                    <div className="form-group">
                         <label htmlFor="source-url">🔗 Nguồn tham khảo - URL (Tùy chọn)</label>
                         <input
                             type="url" id="source-url" value={sourceUrl}
                             onChange={(e) => setSourceUrl(e.target.value)}
                             placeholder="https://... (link Google Drive, web, etc.)"
                             disabled={status === 'uploading'} />
                     </div>
                    
                     <div className="form-group">
                         <label htmlFor="file-input">📂 Chọn Tệp từ máy tính (Bắt buộc)</label>
                         <input type="file" id="file-input" onChange={handleFileChange} required disabled={status === 'uploading'} />
                     </div>
                    
                     <button type="submit" className="submit-btn" disabled={status === 'uploading'}>
                         {status === 'uploading' ? 'Đang xử lý...' : 'Tải lên và Xử lý'}
                     </button>
                </form>
                {message && <div className={`status-message ${status}`}><p>{message}</p></div>}
            </section>

            {/* 3. Bảng Quản lý Collection */}
            <section className="admin-section">
                <h2>Quản lý Kho kiến thức</h2>
                {isLoading ? <p>Đang tải danh sách...</p> : (
                    <table className="stats-table">
                        <thead>
                            <tr>
                                <th>Tên Kho kiến thức</th>
                                <th>Số lượng tài liệu</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {collections.length > 0 ? collections.map(col => (
                                <tr key={col.id}>
                                    <td>{col.name}</td>
                                    <td>{dbStats?.details.find(d => d.name === col.name)?.document_count ?? 'N/A'}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button onClick={() => handleViewCollection(col.name)} className="view-btn">Xem</button>
                                            <button onClick={() => handleDeleteCollection(col.name)} className="delete-btn">Xóa</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="3" style={{textAlign: 'center'}}>Chưa có kho kiến thức nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </section>
        </main>

        {/* Modal không đổi */}
        <CollectionViewerModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            collectionName={currentCollection}
            data={collectionDocs}
            isLoading={isLoadingDocs}
            onPrevPage={() => handlePageChange(collectionDocs.pagination.offset - 10)}
            onNextPage={() => handlePageChange(collectionDocs.pagination.offset + 10)}
        />
    </div>
);
}

export default AdminPage;