import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SoundboxModal } from '../common/SoundboxModal';
import { MitraVoiceWidget } from '../voice/MitraVoiceWidget';
import { SoundboxAnnouncement } from '../../types/api';

export interface SoundboxContextType {
  playAnnouncement: (announcement: SoundboxAnnouncement) => void;
  isMuted: boolean;
  toggleMute: () => void;
}

export const SoundboxContext = React.createContext<SoundboxContextType>({
  playAnnouncement: () => {},
  isMuted: false,
  toggleMute: () => {},
});

export const useSoundbox = () => React.useContext(SoundboxContext);

export const MainLayout: React.FC = () => {
  const [activeAnnouncement, setActiveAnnouncement] = useState<SoundboxAnnouncement | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('merchant_mitra_soundbox_muted') === 'true';
  });

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem('merchant_mitra_soundbox_muted', String(next));
      return next;
    });
  };

  const playAnnouncement = (announcement: SoundboxAnnouncement) => {
    setActiveAnnouncement(announcement);
  };

  return (
    <SoundboxContext.Provider value={{ playAnnouncement, isMuted, toggleMute }}>
      <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        {/* Responsive Sidebar (Desktop persistent, Mobile drawer) */}
        <Sidebar
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            isSoundboxMuted={isMuted}
            onToggleSoundboxMute={toggleMute}
            onToggleMobileMenu={() => setMobileSidebarOpen(true)}
          />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <Outlet />
          </main>
        </div>

        {/* Global Soundbox Modal */}
        <SoundboxModal
          announcement={activeAnnouncement}
          onClose={() => setActiveAnnouncement(null)}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />

        {/* Global Mitra Voice Assistant Floating Controller */}
        <MitraVoiceWidget />
      </div>
    </SoundboxContext.Provider>
  );
};