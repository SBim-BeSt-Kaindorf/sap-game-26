import React from 'react';
import { Database } from 'lucide-react';
import type {SapLogEntry} from '../types/game';

interface SapTickerProps {
    logs: SapLogEntry[];
}

const moduleColors: Record<SapLogEntry['module'], string> = {
    SD: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    MM: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    EWM: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    FI: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    CO: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
};

export const SapTicker: React.FC<SapTickerProps> = ({ logs }) => {
    const latest = logs[logs.length - 1];

    return (
        <div className="bg-slate-950 border-t border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex items-center gap-1.5 text-cyan-400 shrink-0 font-semibold">
                    <Database className="w-4 h-4 animate-pulse" />
                    <span>ERP LIVE-SYSTEM:</span>
                </div>
                {latest ? (
                    <div key={latest.id} className="flex items-center gap-2 animate-pop-in truncate">
            <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${moduleColors[latest.module]}`}>
              SAP {latest.module} ({latest.tcode})
            </span>
                        <span className="text-slate-200 truncate">{latest.message}</span>
                    </div>
                ) : (
                    <span className="text-slate-500">System bereit – warte auf Geschäftsprozess...</span>
                )}
            </div>
            <div className="hidden md:flex items-center gap-2 text-slate-500 shrink-0">
                <span>Mandant: 100</span>
                <span>•</span>
                <span>Buchungskreis: HTLK</span>
            </div>
        </div>
    );
};