import React from 'react';
import { Trophy, RotateCcw, Printer, Clock, Heart } from 'lucide-react';
import type {ReceiptPrintPayload} from '../types/game';
import { sound } from '../utils/sound';

interface SummaryScreenProps {
    receipt: ReceiptPrintPayload;
    onRestart: () => void;
}

export const SummaryScreen: React.FC<SummaryScreenProps> = ({ receipt, onRestart }) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-5xl w-full mx-auto">
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-slate-800/80 border border-slate-700 rounded-3xl p-8 shadow-2xl animate-pop-in">
                {/* Links: Bewertung */}
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
                        <Trophy className="w-4 h-4" />
                        Prozess erfolgreich abgeschlossen!
                    </div>

                    <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
                        Saubere Arbeit, {receipt.employeeName}!
                    </h2>
                    <p className="text-slate-300 mb-6">
                        Du hast den kompletten Geschäftsprozess der <strong className="text-white">HTL Kaindorf GmbH</strong> vom Verkaufsgespräch über das Lager bis zur Buchhaltung gemeistert.
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-4">
                            <div className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                                <Clock className="w-3.5 h-3.5 text-cyan-400" /> Durchlaufzeit
                            </div>
                            <div className="text-2xl font-black text-white">{receipt.durationSeconds} Sek.</div>
                        </div>
                        <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-4">
                            <div className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                                <Heart className="w-3.5 h-3.5 text-rose-400" /> Kundenzufriedenheit
                            </div>
                            <div className="text-2xl font-black text-emerald-400">{receipt.satisfactionScore}%</div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-2xl p-4 mb-6">
                        <div className="text-xs uppercase font-bold text-cyan-300">Verliehener Titel:</div>
                        <div className="text-xl font-black text-white">{receipt.rankTitle}</div>
                    </div>

                    <button
                        onClick={() => {
                            sound.playPop();
                            onRestart();
                        }}
                        className="w-full py-4 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-black text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                        <RotateCcw className="w-5 h-5" />
                        NÄCHSTER BESUCHER / NEU STARTEN
                    </button>
                </div>

                {/* Rechts: Kassenbon / Rechnungs-Vorschau */}
                <div className="bg-slate-100 text-slate-900 rounded-2xl p-6 font-mono text-xs shadow-2xl border-t-8 border-cyan-500 max-w-sm mx-auto w-full">
                    <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="flex items-center gap-1 font-sans font-bold text-emerald-700">
              <Printer className="w-4 h-4" /> Druckdaten gesendet
            </span>
                        <span>{receipt.invoiceNumber}</span>
                    </div>

                    <div className="text-center border-b-2 border-dashed border-slate-400 pb-3 mb-3">
                        <div className="font-black text-base">{receipt.company}</div>
                        <div>{receipt.department}</div>
                        <div className="text-[11px] text-slate-600 mt-1">OFFIZIELLER PROZESSBELEG</div>
                    </div>

                    <div className="space-y-1 mb-3">
                        <div>Sachbearbeiter: <strong>{receipt.employeeName}</strong></div>
                        <div>Kunde: {receipt.customerName}</div>
                        <div>Auftrag: {receipt.orderNumber}</div>
                    </div>

                    <div className="border-y border-dashed border-slate-400 py-2 my-2 space-y-1">
                        {receipt.items.map((item, i) => (
                            <div key={i} className="flex justify-between">
                                <span>{item.quantity}x {item.name}</span>
                                <span>{item.totalPrice.toFixed(2)} €</span>
                            </div>
                        ))}
                        {receipt.discountPercent > 0 && (
                            <div className="flex justify-between text-slate-600">
                                <span>Rabatt ({receipt.discountPercent}%)</span>
                                <span>-{receipt.discountAmount.toFixed(2)} €</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1 mb-4">
                        <div className="flex justify-between text-slate-600">
                            <span>inkl. 20% USt:</span>
                            <span>{receipt.taxAmount.toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between font-black text-sm pt-1">
                            <span>GESAMTBEZAHLT:</span>
                            <span>{receipt.grandTotal.toFixed(2)} €</span>
                        </div>
                    </div>

                    <div className="text-center bg-slate-900 text-white py-2 px-3 rounded-lg font-sans">
                        <div className="text-[10px] uppercase tracking-wider text-cyan-300">Rang</div>
                        <div className="font-bold text-xs">{receipt.rankTitle}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};