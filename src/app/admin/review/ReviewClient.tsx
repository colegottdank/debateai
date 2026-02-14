'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface ReviewItem {
  id: string;
  type: string;
  title: string;
  content: string | any;
  status: 'pending' | 'approved' | 'rejected' | 'fast_tracked';
  author: string;
  metadata: any;
  created_at: string;
}

export default function ReviewClient() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('pending');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/review?status=${filter}`);
      if (!res.ok) throw new Error('Failed to fetch reviews');
      const data = await res.json();
      
      // Parse JSON content/metadata if needed (D1 returns strings for JSON types in some drivers, objects in others)
      // Assuming API returns objects
      setItems(data.map((item: any) => ({
        ...item,
        content: typeof item.content === 'string' ? tryParse(item.content) : item.content,
        metadata: typeof item.metadata === 'string' ? tryParse(item.metadata) : item.metadata,
      })));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading reviews');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAction = async (id: string, action: 'approved' | 'rejected' | 'fast_tracked') => {
    try {
      const res = await fetch(`/api/content/review/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      });
      
      if (!res.ok) throw new Error('Action failed');
      
      // Remove from list or update status
      setItems(prev => prev.filter(item => item.id !== id));
    } catch {
      alert('Failed to update status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Content Review Queue</h1>
            <p className="text-gray-400">Manage pending content from Atlas and agents.</p>
          </div>
          <div className="space-x-4">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="fast_tracked">Fast-Tracked</option>
            </select>
            <Link href="/admin" className="text-blue-400 hover:underline">
              Back to Dashboard
            </Link>
          </div>
        </header>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded mb-8">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading queue...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <p className="text-xl text-gray-300">No items found in {filter} queue.</p>
            {filter === 'pending' && <p className="text-gray-500 mt-2">Good job! Atlas is happy.</p>}
          </div>
        ) : (
          <div className="grid gap-6">
            {items.map((item) => (
              <div key={item.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs uppercase tracking-wide font-bold mb-2 ${
                      item.type === 'blog' ? 'bg-purple-900 text-purple-200' :
                      item.type === 'debate' ? 'bg-blue-900 text-blue-200' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {item.type}
                    </span>
                    <h3 className="text-xl font-bold">{item.title || 'Untitled'}</h3>
                    <p className="text-sm text-gray-400">By {item.author || 'Unknown'} · {new Date(item.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    {filter === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleAction(item.id, 'approved')}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-medium text-sm transition-colors"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleAction(item.id, 'rejected')}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-medium text-sm transition-colors"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handleAction(item.id, 'fast_tracked')}
                          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded font-medium text-sm transition-colors"
                        >
                          Fast-Track
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-gray-900 rounded p-4 text-sm font-mono text-gray-300 max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {typeof item.content === 'object' ? JSON.stringify(item.content, null, 2) : item.content}
                </div>
                
                {item.metadata && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Metadata</h4>
                    <pre className="text-xs text-gray-400 overflow-x-auto">
                      {JSON.stringify(item.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function tryParse(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}
