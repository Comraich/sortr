import { useState, useEffect } from 'react';
import { apiClient, getCurrentUser } from './api/client';

function CommentsSection({ itemId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUser = getCurrentUser();

  useEffect(() => {
    fetchComments();
  }, [itemId]);

  const fetchComments = async () => {
    try {
      const data = await apiClient.get(`/api/comments/item/${itemId}`);
      setComments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await apiClient.post('/api/comments', {
        itemId: parseInt(itemId),
        content: newComment.trim()
      });
      setNewComment('');
      fetchComments();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdate = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      await apiClient.put(`/api/comments/${commentId}`, {
        content: editContent.trim()
      });
      setEditingId(null);
      setEditContent('');
      fetchComments();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      await apiClient.delete(`/api/comments/${commentId}`);
      fetchComments();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEditing = (comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>💬 Comments</h3>

      {error && <div className="error-message">{error}</div>}

      {/* Add comment form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows="3"
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            resize: 'vertical'
          }}
        />
        <button
          type="submit"
          className="btn-primary"
          style={{ marginTop: '8px', width: 'auto', padding: '8px 16px' }}
          disabled={!newComment.trim()}
        >
          Post Comment
        </button>
      </form>

      {/* Comments list */}
      {loading ? (
        <p>Loading comments...</p>
      ) : comments.length === 0 ? (
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>No comments yet. Be the first to comment!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>
                    {comment.user?.displayName || comment.user?.username}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    {formatDate(comment.createdAt)}
                  </div>
                </div>

                {currentUser && comment.userId === currentUser.id && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {editingId === comment.id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(comment.id)}
                          className="btn-small"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditContent('');
                          }}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(comment)}
                          className="btn-small"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="btn-danger"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {editingId === comment.id ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    fontSize: 'inherit'
                  }}
                  autoFocus
                />
              ) : (
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                  {comment.content}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentsSection;
