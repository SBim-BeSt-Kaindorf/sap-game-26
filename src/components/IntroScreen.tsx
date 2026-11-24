import React, { useState } from 'react';
import { Play, Building2, Sparkles, Monitor, Package, Receipt } from 'lucide-react';
import { sound } from '../utils/sound';

interface IntroScreenProps {
    onStart: (playerName: string) => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onStart }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sound.playSuccess();
        onStart(name.trim() || 'Gast-Manager');
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white">
            <div className="max-w-2xl w-full bg-slate-800/80 backdrop-blur border border-slate-700 rounded-3xl p-8 shadow-2xl animate-pop-in">
                <div className="flex items-center justify-between mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        Informatik • Vertiefung SAP
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-sm font-semibold">
                        <Building2 className="w-4 h-4 text-cyan-400" />
                        HTL Kaindorf GmbH
                    </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                    Order-to-Chaos!
                </h1>
                <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                    Schlüpfe in <span className="text-white font-semibold">3 Minuten</span> in alle Rollen unseres Unternehmens: Verhandle den Deal, schnapp dir die Ware im Lager und kassiere in der Buchhaltung ab – inkl. echtem Rechnungsausdruck!
                </p>

                {/* 3 Rollen Preview */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3.5 text-center">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-2">
                            <Monitor className="w-5 h-5" />
                        </div>
                        <div className="font-bold text-sm">1. Vertrieb</div>
                        <div className="text-xs text-slate-400 mt-0.5">Deal verhandeln</div>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3.5 text-center">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
                            <Package className="w-5 h-5" />
                        </div>
                        <div className="font-bold text-sm">2. Lager</div>
                        <div className="text-xs text-slate-400 mt-0.5">Paket packen</div>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3.5 text-center">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                            <Receipt className="w-5 h-5" />
                        </div>
                        <div className="font-bold text-sm">3. Buchhaltung</div>
                        <div className="text-xs text-slate-400 mt-0.5">Rechnung drucken</div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Dein Name (erscheint als Sachbearbeiter auf der Rechnung)
                        </label>
                        <input
                            type="text"
                            maxLength={24}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="z.B. Max Mustermann"
                            className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-lg font-medium"
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-lg shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                    >
                        <Play className="w-5 h-5 fill-current" />
                        SCHICHT STARTEN
                    </button>
                </form>
            </div>
        </div>
    );
};