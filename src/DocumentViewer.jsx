import { IconX } from '@tabler/icons-react';
import './DocumentViewer.css'; // Sẽ tạo file này ở bước sau

function DocumentViewer({ fileUrl, onClose }) {
  if (!fileUrl) {
    return null;
  }

  // Chuyển đổi link Google Drive thông thường thành link có thể nhúng (embed)
  // Ví dụ: .../view?usp=sharing -> .../preview
  const embedUrl = fileUrl.replace("/view?usp=sharing", "/preview")
                         .replace("/view?usp=drive_link", "/preview")
                         .replace("/edit?usp=drive_link&ouid=", "/preview?ouid=");


  return (
    <div className="document-viewer">
      <div className="document-header">
        <h3>Tài liệu tham khảo</h3>
        <button onClick={onClose} className="close-viewer-btn" title="Đóng">
          <IconX size={20} />
        </button>
      </div>
      <div className="document-content">
        <iframe
          src={embedUrl}
          title="Tài liệu tham khảo"
          width="100%"
          height="100%"
          frameBorder="0"
          allow="autoplay"
        >
          Trình duyệt của bạn không hỗ trợ iframe, hoặc link Google Drive không cho phép nhúng.
        </iframe>
      </div>
    </div>
  );
}

export default DocumentViewer;
