// Profile Dialog — View and edit user profile

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { X, Camera, Loader2, Check, Edit2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { uploadAvatar } from "@/lib/storage";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

export default function ProfileDialog() {
  const { user, profile, updateUserProfile } = useAuth();
  const { setShowProfileDialog } = useChat();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile({ displayName, bio });
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName });
      }
      setEditing(false);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const url = await uploadAvatar(user.uid, file);
      await updateUserProfile({ photoURL: url });
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: url });
      }
      toast.success("Avatar updated");
    } catch {
      toast.error("Failed to update avatar");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowProfileDialog(false)}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="relative w-full max-w-sm bg-[#12151e] border border-white/10 rounded-2xl p-6 shadow-2xl z-10"
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-lg font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Profile
          </h2>
          <div className="flex items-center gap-2">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowProfileDialog(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-white/10">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                  {profile?.displayName?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleAvatarChange(file);
              e.target.value = "";
            }}
          />
        </div>

        {/* Profile info */}
        <div className="space-y-4">
          <div>
            <label className="text-slate-400 text-xs mb-1 block" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Username
            </label>
            <div className="px-4 py-2.5 bg-white/5 rounded-xl border border-white/10">
              <span className="text-white font-mono text-sm">@{profile?.username}</span>
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1 block" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Display Name
            </label>
            {editing ? (
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              />
            ) : (
              <div className="px-4 py-2.5 bg-white/5 rounded-xl border border-white/10">
                <span className="text-white text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {profile?.displayName}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1 block" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Email
            </label>
            <div className="px-4 py-2.5 bg-white/5 rounded-xl border border-white/10">
              <span className="text-slate-300 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {user?.email}
              </span>
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1 block" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Bio
            </label>
            {editing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about yourself..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              />
            ) : (
              <div className="px-4 py-2.5 bg-white/5 rounded-xl border border-white/10 min-h-[60px]">
                <span className="text-slate-300 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {profile?.bio || <span className="text-slate-500 italic">No bio yet</span>}
                </span>
              </div>
            )}
          </div>

          {editing && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditing(false);
                  setDisplayName(profile?.displayName || "");
                  setBio(profile?.bio || "");
                }}
                className="flex-1 py-2.5 bg-white/5 text-slate-300 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
