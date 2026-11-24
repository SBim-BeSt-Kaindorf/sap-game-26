import React, { useEffect, useRef, useState } from 'react';
import { PackageCheck, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type {OrderItem, Product} from '../types/game';
import { sound } from '../utils/sound';

interface WarehouseStageProps {
    orderItems: OrderItem[];
    distractorProducts: Product[];
    onComplete: (mistakesCount: number) => void;
    onSapLog: (module: 'MM' | 'EWM', tcode: string, message: string) => void;
}

interface Shelf {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    product: Product;
}

interface FloatingText {
    id: number;
    x: number;
    y: number;
    text: string;
    color: string;
    alpha: number;
}

const CANVAS_W = 760;
const CANVAS_H = 480;

export const WarehouseStage: React.FC<WarehouseStageProps> = ({
                                                                  orderItems,
                                                                  distractorProducts,
                                                                  onComplete,
                                                                  onSapLog,
                                                              }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Benötigte Mengen pro Produkt-ID
    const [pickedCounts, setPickedCounts] = useState<Record<string, number>>({});
    const [packedCounts, setPackedCounts] = useState<Record<string, number>>({});
    const [carrying, setCarrying] = useState<Product | null>(null);
    const [mistakes, setMistakes] = useState(0);
    const [isDone, setIsDone] = useState(false);

    // Refs für den 60-FPS Game-Loop
    const stateRef = useRef({
        player: { x: 110, y: 240, radius: 18, vx: 0, vy: 0, walkCycle: 0, facing: 0 },
        keys: {} as Record<string, boolean>,
        carrying: null as Product | null,
        pickedCounts: {} as Record<string, number>,
        packedCounts: {} as Record<string, number>,
        mistakes: 0,
        isDone: false,
        floatingTexts: [] as FloatingText[],
        nextTextId: 1,
    });

    // Regale zusammenbauen (Auftrags-Items + lustige Ablenkungs-Items)
    const shelvesRef = useRef<Shelf[]>([]);
    if (shelvesRef.current.length === 0) {
        const allProducts: Product[] = [
            ...orderItems.map((i) => i.product),
            ...distractorProducts,
        ];
        // 6 feste Regalpositionen im Lager
        const positions = [
            { x: 180, y: 55, w: 145, h: 48 },
            { x: 360, y: 55, w: 145, h: 48 },
            { x: 540, y: 55, w: 145, h: 48 },
            { x: 180, y: 375, w: 145, h: 48 },
            { x: 360, y: 375, w: 145, h: 48 },
            { x: 540, y: 375, w: 145, h: 48 },
        ];
        // eslint-disable-next-line react-hooks/refs
        shelvesRef.current = positions.map((pos, idx) => ({
            id: `shelf-${idx}`,
            ...pos,
            product: allProducts[idx % allProducts.length],
        }));
    }

    const packStation = { x: 645, y: 185, w: 90, h: 110 };

    const addFloatingText = (x: number, y: number, text: string, color: string) => {
        stateRef.current.floatingTexts.push({
            id: stateRef.current.nextTextId++,
            x,
            y,
            text,
            color,
            alpha: 1,
        });
    };

    // Interaktion (Leertaste oder Klick auf Action-Button)
    const handleInteract = () => {
        const st = stateRef.current;
        if (st.isDone) return;

        // 1. Prüfen ob an der Packstation
        const distToPack = Math.hypot(
            st.player.x - (packStation.x + packStation.w / 2),
            st.player.y - (packStation.y + packStation.h / 2)
        );

        if (distToPack < 85 && st.carrying) {
            const prod = st.carrying;
            const newPacked = {
                ...st.packedCounts,
                [prod.id]: (st.packedCounts[prod.id] || 0) + 1,
            };
            st.packedCounts = newPacked;
            st.carrying = null;
            setPackedCounts(newPacked);
            setCarrying(null);
            sound.playSuccess();
            addFloatingText(st.player.x, st.player.y - 25, `+1 ${prod.name} verpackt!`, '#34d399');

            // Prüfen ob alle Auftrags-Items verpackt sind
            const allComplete = orderItems.every(
                (item) => (newPacked[item.product.id] || 0) >= item.quantity
            );
            if (allComplete) {
                st.isDone = true;
                setIsDone(true);
                onSapLog('MM', 'VL02N', 'Kommissionierung abgeschlossen & Warenausgang gebucht!');
            }
            return;
        }

        // 2. Prüfen ob an einem Regal
        for (const shelf of shelvesRef.current) {
            const cx = shelf.x + shelf.w / 2;
            const cy = shelf.y + shelf.h / 2;
            const dx = Math.abs(st.player.x - cx);
            const dy = Math.abs(st.player.y - cy);

            if (dx < shelf.w / 2 + 42 && dy < shelf.h / 2 + 42) {
                if (st.carrying) {
                    sound.playError();
                    addFloatingText(st.player.x, st.player.y - 25, 'Hände voll! Erst zur Packstation →', '#fbbf24');
                    return;
                }

                const requiredItem = orderItems.find((i) => i.product.id === shelf.product.id);
                const alreadyHave =
                    (st.packedCounts[shelf.product.id] || 0) + (st.carrying ? 1 : 0);

                if (!requiredItem || shelf.product.isDistractor) {
                    sound.playError();
                    st.mistakes += 1;
                    setMistakes(st.mistakes);
                    addFloatingText(st.player.x, st.player.y - 25, `Falsch! ${shelf.product.name} steht nicht auf dem Schein!`, '#f87171');
                    return;
                }

                if (alreadyHave >= requiredItem.quantity) {
                    sound.playError();
                    addFloatingText(st.player.x, st.player.y - 25, 'Davon hast du schon genug!', '#fbbf24');
                    return;
                }

                // Item aufnehmen!
                st.carrying = shelf.product;
                const newPicked = {
                    ...st.pickedCounts,
                    [shelf.product.id]: (st.pickedCounts[shelf.product.id] || 0) + 1,
                };
                st.pickedCounts = newPicked;
                setCarrying(shelf.product);
                setPickedCounts(newPicked);
                sound.playPickup();
                addFloatingText(st.player.x, st.player.y - 25, `${shelf.product.name} aufgenommen!`, '#38bdf8');
                return;
            }
        }
    };

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase();
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
                e.preventDefault();
            }
            if (k === ' ' && !stateRef.current.keys[' ']) {
                handleInteract();
            }
            stateRef.current.keys[k] = true;
        };
        const onKeyUp = (e: KeyboardEvent) => {
            stateRef.current.keys[e.key.toLowerCase()] = false;
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        let animId: number;
        const speed = 5.5;

        const drawItemIcon = (ctx: CanvasRenderingContext2D, type: Product['iconType'], x: number, y: number) => {
            ctx.save();
            ctx.translate(x, y);
            if (type === 'pc') {
                // Gaming PC Tower
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(-10, -13, 20, 26);
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 2;
                ctx.strokeRect(-10, -13, 20, 26);
                ctx.fillStyle = '#22d3ee';
                ctx.beginPath();
                ctx.arc(0, -4, 4, 0, Math.PI * 2);
                ctx.arc(0, 6, 4, 0, Math.PI * 2);
                ctx.fill();
            } else if (type === 'mug') {
                // RGB Tasse
                ctx.fillStyle = '#f8fafc';
                ctx.fillRect(-8, -8, 14, 16);
                ctx.strokeStyle = '#a855f7';
                ctx.lineWidth = 2.5;
                ctx.strokeRect(-8, -8, 14, 16);
                ctx.beginPath();
                ctx.arc(6, 0, 5, -Math.PI / 2, Math.PI / 2);
                ctx.stroke();
            } else if (type === 'keyboard') {
                // Mauspad / Keyboard
                ctx.fillStyle = '#10b981';
                ctx.fillRect(-13, -7, 26, 14);
                ctx.strokeStyle = '#ecfdf5';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(-13, -7, 26, 14);
            } else if (type === 'banana') {
                // Bananenschale
                ctx.strokeStyle = '#facc15';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(0, -4, 10, 0.2 * Math.PI, 0.8 * Math.PI);
                ctx.stroke();
            } else if (type === 'broken_printer') {
                // Kaputter Drucker
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(-12, -6, 24, 14);
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(-10, -10);
                ctx.lineTo(10, 10);
                ctx.moveTo(10, -10);
                ctx.lineTo(-10, 10);
                ctx.stroke();
            } else {
                // Quietscheente
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath();
                ctx.arc(0, 2, 9, 0, Math.PI * 2);
                ctx.arc(4, -7, 6, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        };

        const render = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            const st = stateRef.current;

            // Bewegung berechnen
            let dx = 0;
            let dy = 0;
            if (st.keys['w'] || st.keys['arrowup']) dy -= 1;
            if (st.keys['s'] || st.keys['arrowdown']) dy += 1;
            if (st.keys['a'] || st.keys['arrowleft']) dx -= 1;
            if (st.keys['d'] || st.keys['arrowright']) dx += 1;

            if (dx !== 0 || dy !== 0) {
                const len = Math.hypot(dx, dy);
                dx = (dx / len) * speed;
                dy = (dy / len) * speed;
                st.player.walkCycle += 0.22;
                st.player.facing = Math.atan2(dy, dx);
            }

            let nextX = Math.max(28, Math.min(CANVAS_W - 28, st.player.x + dx));
            let nextY = Math.max(28, Math.min(CANVAS_H - 28, st.player.y + dy));

            // Einfache Regal-Kollision
            for (const s of shelvesRef.current) {
                if (
                    nextX + st.player.radius > s.x &&
                    nextX - st.player.radius < s.x + s.w &&
                    nextY + st.player.radius > s.y &&
                    nextY - st.player.radius < s.y + s.h
                ) {
                    nextX = st.player.x;
                    nextY = st.player.y;
                }
            }
            st.player.x = nextX;
            st.player.y = nextY;

            // --- ZEICHNEN ---
            // Lagerhallen-Boden (Beton-Grid)
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            for (let gx = 0; gx < CANVAS_W; gx += 40) {
                ctx.beginPath();
                ctx.moveTo(gx, 0);
                ctx.lineTo(gx, CANVAS_H);
                ctx.stroke();
            }
            for (let gy = 0; gy < CANVAS_H; gy += 40) {
                ctx.beginPath();
                ctx.moveTo(0, gy);
                ctx.lineTo(CANVAS_W, gy);
                ctx.stroke();
            }

            // Gelbe Sicherheitslinien am Boden
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.22)';
            ctx.setLineDash([12, 8]);
            ctx.lineWidth = 3;
            ctx.strokeRect(24, 24, CANVAS_W - 48, CANVAS_H - 48);
            ctx.setLineDash([]);

            // Startzone links
            ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
            ctx.fillRect(35, 195, 90, 90);
            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('START', 80, 280);

            // Packstation rechts
            const nearPack =
                Math.hypot(
                    st.player.x - (packStation.x + packStation.w / 2),
                    st.player.y - (packStation.y + packStation.h / 2)
                ) < 85;

            ctx.fillStyle = nearPack && st.carrying ? 'rgba(16, 185, 129, 0.28)' : 'rgba(16, 185, 129, 0.12)';
            ctx.strokeStyle = nearPack && st.carrying ? '#34d399' : '#059669';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(packStation.x, packStation.y, packStation.w, packStation.h, 14);
            ctx.fill();
            ctx.stroke();

            // Karton-Symbol auf Packstation
            ctx.fillStyle = '#d97706';
            ctx.fillRect(packStation.x + 25, packStation.y + 30, 40, 34);
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2;
            ctx.strokeRect(packStation.x + 25, packStation.y + 30, 40, 34);
            ctx.fillStyle = '#ecfdf5';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText('PACKSTATION', packStation.x + packStation.w / 2, packStation.y + 84);
            if (nearPack && st.carrying) {
                ctx.fillStyle = '#6ee7b7';
                ctx.font = 'bold 10px sans-serif';
                ctx.fillText('[LEERTASTE]', packStation.x + packStation.w / 2, packStation.y + 100);
            }

            // Regale zeichnen
            for (const s of shelvesRef.current) {
                const dist = Math.hypot(st.player.x - (s.x + s.w / 2), st.player.y - (s.y + s.h / 2));
                const isNear = dist < 78;

                ctx.fillStyle = '#1e293b';
                ctx.strokeStyle = isNear ? '#38bdf8' : '#475569';
                ctx.lineWidth = isNear ? 3 : 2;
                ctx.beginPath();
                ctx.roundRect(s.x, s.y, s.w, s.h, 10);
                ctx.fill();
                ctx.stroke();

                // Produkt-Icon & Name
                drawItemIcon(ctx, s.product.iconType, s.x + 24, s.y + s.h / 2);

                ctx.fillStyle = '#f8fafc';
                ctx.font = 'bold 11px sans-serif';
                ctx.textAlign = 'left';
                const shortName = s.product.name.length > 13 ? s.product.name.slice(0, 12) + '…' : s.product.name;
                ctx.fillText(shortName, s.x + 44, s.y + 22);

                ctx.fillStyle = isNear ? '#38bdf8' : '#94a3b8';
                ctx.font = '10px monospace';
                ctx.fillText(isNear ? '[LEERTASTE]' : s.product.materialNumber, s.x + 44, s.y + 37);
            }

            // --- LAGERMITARBEITER ZEICHNEN (Top-Down Sprite mit Lauf-Animation) ---
            ctx.save();
            ctx.translate(st.player.x, st.player.y);

            // Schatten
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.beginPath();
            ctx.ellipse(0, 6, 17, 13, 0, 0, Math.PI * 2);
            ctx.fill();

            // Füße (animiert beim Laufen)
            const footOffset = Math.sin(st.player.walkCycle) * 5;
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(-7, footOffset, 5, 0, Math.PI * 2);
            ctx.arc(7, -footOffset, 5, 0, Math.PI * 2);
            ctx.fill();

            // Warnweste (Neongelb/Orange)
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Kopf & Schutzhelm
            ctx.fillStyle = '#fde68a';
            ctx.beginPath();
            ctx.arc(0, -2, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#0284c7'; // Blauer HTL-Helm
            ctx.beginPath();
            ctx.arc(0, -3, 10.5, Math.PI, 0);
            ctx.fill();

            // Getragenes Paket vor dem Mitarbeiter
            if (st.carrying) {
                ctx.fillStyle = '#d97706';
                ctx.fillRect(-11, -26, 22, 16);
                ctx.strokeStyle = '#fef3c7';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(-11, -26, 22, 16);
            }
            ctx.restore();

            // Floating Feedback-Texte
            st.floatingTexts = st.floatingTexts.filter((ft) => ft.alpha > 0.02);
            for (const ft of st.floatingTexts) {
                ctx.save();
                ctx.globalAlpha = ft.alpha;
                ctx.fillStyle = ft.color;
                ctx.font = 'bold 13px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.restore();
                ft.y -= 0.7;
                ft.alpha -= 0.016;
            }

            animId = requestAnimationFrame(render);
        };

        animId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, []);

    return (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 max-w-6xl w-full mx-auto items-center justify-center">
            {/* Spielfeld */}
            <div className="flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
              Rolle 2/3: Lager & Logistik (MM/EWM)
            </span>
                        <span className="text-xs text-slate-400 hidden sm:inline">
              Steuerung: <strong className="text-white">WASD / Pfeiltasten</strong> • Aufnehmen/Ablegen: <strong className="text-white">LEERTASTE</strong>
            </span>
                    </div>
                    {mistakes > 0 && (
                        <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Fehlgriffe: {mistakes}
            </span>
                    )}
                </div>

                <div className="relative rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-950">
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_W}
                        height={CANVAS_H}
                        className="block max-w-full h-auto"
                    />

                    {/* Overlay wenn alle Pakete gepackt sind */}
                    {isDone && (
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-pop-in">
                            <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-3" />
                            <h3 className="text-3xl font-black text-white mb-2">Kommissionierung komplett!</h3>
                            <p className="text-slate-300 max-w-md mb-6">
                                Alle Artikel wurden sauber verpackt und der Warenausgang ist im System verbucht. Jetzt fehlt nur noch das Geld!
                            </p>
                            <button
                                onClick={() => {
                                    sound.playPop();
                                    onComplete(mistakes);
                                }}
                                className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-lg shadow-lg flex items-center gap-2 cursor-pointer"
                            >
                                KRAWATTE ANZIEHEN: AB IN DIE BUCHHALTUNG!
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Zusatz-Button für Touch/Maus-Klick */}
                {!isDone && (
                    <button
                        onClick={handleInteract}
                        className="mt-3 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sm font-bold text-cyan-300 cursor-pointer"
                    >
                        {carrying ? `📦 „${carrying.name}“ an Packstation ablegen (Leertaste)` : '✋ Artikel aus Regal nehmen (Leertaste)'}
                    </button>
                )}
            </div>

            {/* Rechts: Kommissionierschein */}
            <div className="w-full lg:w-80 bg-amber-50 text-slate-900 rounded-3xl p-5 shadow-xl border-4 border-amber-200/80">
                <div className="border-b-2 border-dashed border-slate-300 pb-3 mb-4 flex items-center justify-between">
                    <div>
                        <div className="text-[11px] font-black uppercase tracking-widest text-amber-700">
                            HTL Kaindorf GmbH
                        </div>
                        <div className="text-lg font-black flex items-center gap-1.5">
                            <PackageCheck className="w-5 h-5 text-amber-600" />
                            Kommissionierschein
                        </div>
                    </div>
                    <span className="font-mono text-xs bg-slate-900 text-white px-2 py-1 rounded">
            #4711
          </span>
                </div>

                <p className="text-xs text-slate-600 mb-4">
                    Laufe zu den Regalen, nimm jeweils <strong>1 Teil</strong> mit <kbd className="px-1.5 py-0.5 bg-slate-200 rounded font-mono">Space</kbd> auf und bring es rechts zur <strong>Packstation</strong>.
                </p>

                <div className="space-y-3 mb-5">
                    {orderItems.map((item) => {
                        const packed = packedCounts[item.product.id] || 0;
                        const done = packed >= item.quantity;
                        return (
                            <div
                                key={item.product.id}
                                className={`p-3 rounded-xl border-2 transition-all ${
                                    done
                                        ? 'bg-emerald-100/80 border-emerald-400 text-emerald-950'
                                        : 'bg-white border-slate-200'
                                }`}
                            >
                                <div className="flex items-center justify-between font-bold text-sm">
                  <span className={done ? 'line-through opacity-75' : ''}>
                    {item.quantity}x {item.product.name}
                  </span>
                                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 text-white">
                    {packed} / {item.quantity}
                  </span>
                                </div>
                                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                                    Mat-Nr: {item.product.materialNumber}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-3 rounded-xl bg-slate-900 text-white text-xs">
                    <div className="text-slate-400 uppercase font-bold text-[10px] mb-1">Aktuell in den Händen:</div>
                    {carrying ? (
                        <div className="font-bold text-amber-300 text-sm">📦 {carrying.name} → Ab zur Packstation!</div>
                    ) : (
                        <div className="text-slate-300">Hände frei – hol das nächste Teil aus dem Regal.</div>
                    )}
                </div>
            </div>
        </div>
    );
};