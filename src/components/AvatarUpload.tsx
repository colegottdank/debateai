'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/lib/useTestUser';
import { useAvatar } from '@/lib/useAvatar';

const INSULT_NAMES = [
  "Idiot", "Moron", "Dumbass", "Loser", "Noob",
  "Weakling", "Crybaby", "Buttface", "Doofus", "Nimrod",
  "Chump", "Wimp", "Dweeb", "Nerd", "Dork",
  "Bonehead", "Blockhead", "Meathead", "Airhead", "Fatass",
  "Dipshit", "Jackass", "Asshat", "Numbnuts", "Knucklehead",
  "Simpleton", "Imbecile", "Halfwit", "Dimwit", "Nitwit",
  "Dunce", "Fool", "Clown", "Bozo", "Schmuck"
];

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onAvatarUpdate?: (newUrl: string) => void;
}

export default function AvatarUpload({ currentAvatar, onAvatarUpdate }: AvatarUploadProps) {
  const { user } = useUser();
  const { avatarUrl: savedAvatar } = useAvatar();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('Anonymous');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch saved insult name from DB
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.displayName) {
          setDisplayName(data.displayName);
        } else {
          // If no name yet, they haven't uploaded an avatar
          setDisplayName('Anonymous');
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  const generateInsultName = () => {
    return INSULT_NAMES[Math.floor(Math.random() * INSULT_NAMES.length)];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadAvatar(file);
  };

  const uploadAvatar = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      // Create form data with the file
      const formData = new FormData();
      formData.append('file', file);

      // Upload file to our API (which will proxy to R2)
      const response = await fetch('/api/avatar/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload avatar');
      }

      const { publicUrl } = await response.json();

      // Generate and save insult name
      const newInsultName = generateInsultName();
      setDisplayName(newInsultName);
      await saveName(newInsultName);

      // Success! Update the UI
      onAvatarUpdate?.(publicUrl);
      setPreview(null);
      
      // Reload to show new avatar and name everywhere
      window.location.reload();
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const saveName = async (name: string) => {
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name }),
      });
    } catch (err) {
      console.error('Failed to save name:', err);
    }
  };

  const avatarUrl = preview || currentAvatar || savedAvatar;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl border-4 border-black max-w-md mx-auto transform -rotate-1">
      <h2 className="text-xl font-black text-yellow-300 text-center mb-3">🎮 YOUR FIGHTER 🎮</h2>
      
      <div className="flex items-center justify-center gap-4">
        <div className="relative">
          <img 
            src={avatarUrl}
            alt={user?.firstName || 'You'}
            className="w-20 h-20 rounded-full border-4 border-yellow-400 shadow-lg object-cover bg-white"
          />
          
          {/* Upload button overlay */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute inset-0 w-20 h-20 rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
          >
            <span className="text-white text-2xl">📷</span>
          </button>
        </div>
        
        <div className="text-white">
          <div className="flex items-center gap-2 justify-center">
            <div className="font-black text-2xl">{displayName}</div>
          </div>
          <div className="text-sm opacity-90 text-center">
            {isUploading ? 'Uploading...' : displayName === 'Anonymous' ? 'Upload avatar to get your name!' : 'Your assigned name'}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 text-red-200 text-sm text-center font-bold">
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}