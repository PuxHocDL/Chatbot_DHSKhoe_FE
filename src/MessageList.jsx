import React from 'react';
import ReactMarkdown from 'react-markdown';
import { IconFileText } from '@tabler/icons-react';
import remarkGfm from 'https://esm.sh/remark-gfm@4';
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax';

// Component này chỉ nhận vào danh sách tin nhắn và hiển thị chúng
function MessageList({ messages, isLoading, handleViewSource }) {
  console.log("Rendering MessageList..."); // Bạn sẽ thấy log này chỉ xuất hiện khi có tin nhắn mới

  return (
    <>
      {messages.map((msg, index) => (
        <div key={index} className={`message ${msg.sender}`}>
          <div className="message-bubble">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeMathjax]}>
              {msg.text}
            </ReactMarkdown>
            {msg.sender === 'ai' && typeof msg.responseTime === 'number' && (
              <div className="response-time-info">
                Đã suy nghĩ trong {Number(msg.responseTime).toFixed(2)} giây
              </div>
            )}
            {msg.sources && msg.sources.length > 0 && (
              <div className="message-sources">
                <b>Nguồn tham khảo:</b>
                <ul>
                  {msg.sources.map((source, idx) => (
                    <li key={idx}>
                      <button onClick={() => handleViewSource(source.url)} className="source-link">
                        <IconFileText size={16} />
                        {source.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="message ai">
          <div className="message-bubble loading-bubble">
            <div className="typing-indicator">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default React.memo(MessageList);