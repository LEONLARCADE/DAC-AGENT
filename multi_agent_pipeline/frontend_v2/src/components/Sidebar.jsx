import React from 'react';
import { Home, LayoutTemplate, Compass, Clock, Wallet, Command, Search } from 'lucide-react';

const Sidebar = ({ isOpen }) => {
    return (
        <div className={`${isOpen ? 'w-64 border-r' : 'w-0 border-r-0'} transition-all duration-300 h-screen border-borderContent bg-[#0B0D13] flex flex-col pt-6 pb-4 overflow-hidden shrink-0`}>

            {/* Brand */}
            <div className="px-6 flex items-center space-x-2 text-white mb-6">
                <div className="w-6 h-6 bg-gradient-to-tr from-accent to-pink-500 rounded flex items-center justify-center text-xs font-bold font-serif">
                    E
                </div>
                <span className="font-semibold text-lg">ELITE AI</span>
            </div>

            {/* Search */}
            <div className="px-6 mb-6">
                <div className="flex items-center space-x-2 bg-surface hover:bg-surfaceHover border border-borderContent rounded-xl px-3 py-2 transition-colors cursor-text">
                    <Search size={16} className="text-textMuted" />
                    <input
                        type="text"
                        placeholder="Search chats"
                        className="bg-transparent border-none text-sm text-textMain outline-none w-full placeholder:text-textMuted"
                        disabled
                    />
                    <div className="bg-borderContent p-1 rounded text-xs text-textMuted flex items-center justify-center">
                        <Command size={12} />
                    </div>
                </div>
            </div>

            {/* Nav Links */}
            <div className="px-4 space-y-1 mb-8">
                <NavItem icon={<Home size={18} />} label="Home" active />
                <NavItem icon={<Clock size={18} />} label="History" />
            </div>

            {/* History Sections */}
            <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
                <HistorySection title="Recent Chats" items={[
                    "Research on quantum computing",
                    "Analyze topic: Elite AI features",
                    "Compare modern UI frameworks"
                ]} />
            </div>

        </div>
    );
};

const NavItem = ({ icon, label, active }) => (
    <button className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ${active ? 'bg-surface hover:bg-surfaceHover text-white' : 'text-textMuted hover:text-white hover:bg-surface/50'
        }`}>
        {icon}
        <span className="text-sm font-medium">{label}</span>
    </button>
);

const HistorySection = ({ title, items }) => (
    <div className="mb-6">
        <h4 className="text-xs font-semibold text-textMain mb-3 px-2">{title}</h4>
        <div className="space-y-1">
            {items.map((item, i) => (
                <button key={i} className="w-full text-left truncate text-xs text-textMuted hover:text-white px-2 py-1.5 rounded-lg hover:bg-surface/50 transition-colors">
                    {item}
                </button>
            ))}
        </div>
    </div>
);

export default Sidebar;
