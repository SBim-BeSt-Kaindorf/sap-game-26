import React, { useState, useEffect } from 'react';
import { Send, ArrowRight, ShoppingBag, BadgePercent, Smile } from 'lucide-react';
import type {CustomerScenario, OrderItem} from '../types/game';
import { sound } from '../utils/sound';

interface SalesStageProps {
    scenario: CustomerScenario;
    playerName: string;
    onComplete: (finalItems: OrderItem[], discountPercent: number, satisfactionDelta: number, scoreBonus: number) => void;
    onSapLog: (module: 'SD', tcode: string, message: string) => void;
}

interface ChatBubble {
    sender: 'customer' | 'player' | 'system';
    text: string;
}

export const SalesStage: React.FC<SalesStageProps> = ({
                                                          scenario,
                                                          playerName,
                                                          onComplete,
                                                          onSapLog,
                                                      }) => {
    const [messages, setMessages] = useState<ChatBubble[]>([]);
    const [step, setStep] = useState<'intro_msg' | 'negotiating' | 'closed'>('intro_msg');
    const [selectedOption, setSelectedOption] = useState<CustomerScenario['options'][0] | null>(null);

    useEffect(() => {
        const t1 = setTimeout(() => {
            sound.playPop();
            setMessages([{ sender: 'customer', text: scenario.openingMessage }]);
        }, 300);

        const t2 = setTimeout(() => {
            sound.playPop();
            setMessages((prev) => [...prev, { sender: 'customer', text: scenario.negotiationPrompt }]);
            setStep('negotiating');
        }, 1100);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [scenario]);

    const handleChooseOption = (option: CustomerScenario['options'][0]) => {
        if (step !== 'negotiating') return;
        sound.playPop();

        setSelectedOption(option);
        setMessages((prev) => [...prev, { sender: 'player', text: option.label }]);
        setStep('closed');

        setTimeout(() => {
            sound.playSuccess();
            setMessages((prev) => [
                ...prev,
                { sender: 'customer', text: option.customerReply },
                { sender: 'system', text: '✅ Kundenauftrag wurde im System gespeichert & ans Lager übertragen!' },
            ]);
            onSapLog(
                'SD',
                'VA01',
                `Kundenauftrag für "${scenario.customerName}" angelegt (${option.discountPercent}% Rabatt).`
            );
        }, 650);
    };

    const handleNextRole = () => {
        if (!selectedOption) return;
        const finalItems = [...scenario.items];
        if (selectedOption.bonusItem) {
            finalItems.push(selectedOption.bonusItem);
        }
        sound.playPop();
        onComplete(
            finalItems,
            selectedOption.discountPercent,
            selectedOption.satisfactionDelta,
            selectedOption.scoreBonus
        );
    };

    const baseTotal = scenario.items.reduce((sum, i) => sum + i.product.unitPrice * i.quantity, 0);

    return (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 max-w-6xl w-full mx-auto overflow-hidden">
            {/* Linke Seite: Chat-Fenster */}
            <div className="flex-1 flex flex-col bg-slate-800/90 border border-slate-700 rounded-3xl overflow-hidden shadow-xl">
                {/* Chat Header */}
                <div className="bg-slate-900/90 px-5 py-4 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-full ${scenario.avatarBg} flex items-center justify-center font-black text-white text-lg shadow`}>
                            {scenario.avatarInitials}
                        </div>
                        <div>
                            <div className="font-bold text-white flex items-center gap-2">
                                {scenario.customerName}
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                            </div>
                            <div className="text-xs text-slate-400">{scenario.customerHandle} • Kaufinteressent</div>
                        </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
            Rolle 1/3: Vertrieb (SD)
          </span>
                </div>

                {/* Chat Verlauf */}
                <div className="flex-1 p-5 space-y-4 overflow-y-auto">
                    {messages.map((msg, idx) => {
                        if (msg.sender === 'system') {
                            return (
                                <div key={idx} className="text-center my-2 animate-pop-in">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                    {msg.text}
                  </span>
                                </div>
                            );
                        }
                        const isPlayer = msg.sender === 'player';
                        return (
                            <div
                                key={idx}
                                className={`flex flex-col max-w-[82%] animate-pop-in ${
                                    isPlayer ? 'ml-auto items-end' : 'mr-auto items-start'
                                }`}
                            >
                <span className="text-[11px] text-slate-400 mb-1 px-1">
                  {isPlayer ? `${playerName} (Vertrieb)` : scenario.customerName}
                </span>
                                <div
                                    className={`px-4 py-3 rounded-2xl text-sm md:text-base leading-relaxed shadow ${
                                        isPlayer
                                            ? 'bg-blue-600 text-white rounded-br-sm'
                                            : 'bg-slate-700 text-slate-100 rounded-bl-sm'
                                    }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Antwortmöglichkeiten */}
                <div className="p-4 bg-slate-900/90 border-t border-slate-700">
                    {step === 'intro_msg' && (
                        <div className="text-center text-slate-400 text-sm py-3 animate-pulse">
                            {scenario.customerName} tippt...
                        </div>
                    )}

                    {step === 'negotiating' && (
                        <div className="space-y-2">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                                <Send className="w-3.5 h-3.5 text-blue-400" />
                                Wähle deine Verhandlungs-Antwort:
                            </div>
                            {scenario.options.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleChooseOption(opt)}
                                    className="w-full text-left p-3.5 rounded-xl bg-slate-800 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-400 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                                >
                  <span className="text-sm md:text-base text-slate-100 group-hover:text-white font-medium">
                    „{opt.label}“
                  </span>
                                    <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-cyan-300 border border-slate-700">
                    {opt.discountPercent > 0
                        ? `-${opt.discountPercent}% Rabatt`
                        : opt.bonusItem
                            ? '+ Gratis-Beigabe'
                            : '0% Rabatt'}
                  </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {step === 'closed' && selectedOption && (
                        <button
                            onClick={handleNextRole}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base md:text-lg shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer animate-pop-in"
                        >
                            HUT WECHSELN: AB INS LAGER!
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Rechte Seite: Live-Angebotsübersicht */}
            <div className="w-full lg:w-80 bg-slate-800/70 border border-slate-700 rounded-3xl p-5 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm uppercase tracking-wider mb-4">
                        <ShoppingBag className="w-4 h-4" />
                        Kundenwunsch (Entwurf)
                    </div>

                    <div className="space-y-3 mb-6">
                        {scenario.items.map((item) => (
                            <div key={item.product.id} className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-sm text-white">
                                        {item.quantity}x {item.product.name}
                                    </div>
                                    <div className="text-xs text-slate-400 font-mono">Mat: {item.product.materialNumber}</div>
                                </div>
                                <div className="font-bold text-slate-200 text-sm">
                                    {(item.product.unitPrice * item.quantity).toFixed(0)} €
                                </div>
                            </div>
                        ))}
                        {selectedOption?.bonusItem && (
                            <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between animate-pop-in">
                                <div>
                                    <div className="font-bold text-sm text-emerald-300">
                                        {selectedOption.bonusItem.quantity}x {selectedOption.bonusItem.product.name}
                                    </div>
                                    <div className="text-xs text-emerald-400/80">Gratis-Zugabe</div>
                                </div>
                                <div className="font-bold text-emerald-300 text-sm">0 €</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t border-slate-700 pt-4 space-y-2 text-sm">
                    <div className="flex justify-between text-slate-400">
                        <span>Listenpreis:</span>
                        <span>{baseTotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-cyan-300">
            <span className="flex items-center gap-1">
              <BadgePercent className="w-4 h-4" /> Rabatt:
            </span>
                        <span>{selectedOption ? `-${selectedOption.discountPercent}%` : 'offen'}</span>
                    </div>
                    <div className="flex justify-between text-lg font-black text-white pt-2 border-t border-slate-700/80">
                        <span>Deal-Wert:</span>
                        <span>
              {(baseTotal * (1 - (selectedOption?.discountPercent || 0) / 100)).toFixed(2)} €
            </span>
                    </div>
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-900/90 text-xs text-slate-400 flex items-start gap-2">
                        <Smile className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>Tipp: Kunden lieben kleine Extras oft mehr als stumpfe Rabatte!</span>
                    </div>
                </div>
            </div>
        </div>
    );
};