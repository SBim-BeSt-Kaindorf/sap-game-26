import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Clock, Smile, Building2 } from 'lucide-react';
import type {
  CustomerScenario,
  GamePhase,
  OrderItem,
  Product,
  ReceiptPrintPayload,
  SapLogEntry,
} from './types/game';
import { IntroScreen } from './components/IntroScreen';
import { SalesStage } from './components/SalesStage';
import { WarehouseStage } from './components/WarehouseStage';
import { AccountingStage } from './components/AccountingStage';
import { SummaryScreen } from './components/SummaryScreen';
import { SapTicker } from './components/SapTicker';
import { triggerReceiptPrint } from './utils/printer';
import { sound } from './utils/sound';

// Produktkatalog
// Produktkatalog
const PRODUCTS: Record<string, Product> = {
  pc: {
    id: 'pc',
    name: 'Gaming-PC RTX',
    materialNumber: 'MAT-1001',
    unitPrice: 1200,
    color: '#38bdf8',
    iconType: 'pc',
  },
  mug: {
    id: 'mug',
    name: 'RGB-Kaffeetasse',
    materialNumber: 'MAT-2045',
    unitPrice: 25,
    color: '#a855f7',
    iconType: 'mug',
  },
  keyboard: {
    id: 'keyboard',
    name: 'Mechanical Keyboard',
    materialNumber: 'MAT-2088',
    unitPrice: 110,
    color: '#22c55e',
    iconType: 'keyboard',
  },
  mousepad: {
    id: 'mousepad',
    name: 'XXL-Mauspad',
    materialNumber: 'MAT-3099',
    unitPrice: 0,
    color: '#10b981',
    iconType: 'keyboard',
  },
  banana: {
    id: 'banana',
    name: 'Bananenschale',
    materialNumber: 'ERR-001',
    unitPrice: 0,
    color: '#facc15',
    iconType: 'banana',
    isDistractor: true,
  },
  broken_printer: {
    id: 'broken_printer',
    name: 'Defekter Drucker',
    materialNumber: 'ERR-002',
    unitPrice: 0,
    color: '#ef4444',
    iconType: 'broken_printer',
    isDistractor: true,
  },
  duck: {
    id: 'duck',
    name: 'Debug-Quietscheente',
    materialNumber: 'ERR-003',
    unitPrice: 0,
    color: '#fbbf24',
    iconType: 'duck',
    isDistractor: true,
  },
};

const DISTRACTORS: Product[] = [PRODUCTS.banana, PRODUCTS.broken_printer, PRODUCTS.duck];

// 4 abwechslungsreiche Kundenszenarien für Messebesucher
const SCENARIOS: CustomerScenario[] = [
  {
    id: 'creator-setup',
    customerName: 'Lara_Streams',
    customerHandle: '@lara_creates',
    avatarBg: 'bg-pink-600',
    avatarInitials: 'LS',
    openingMessage:
        'Hey! Ich richte mir gerade mein neues Streaming- & Video-Schnitt-Setup ein und brauche 2x Gaming-PC RTX und 2x RGB-Kaffeetasse!',
    items: [
      { product: PRODUCTS.pc, quantity: 2 },
      { product: PRODUCTS.mug, quantity: 2 },
    ],
    negotiationPrompt:
        '2.450 € sprengt mein Creator-Budget aber ganz schön... Könnt ihr beim Preis noch was machen?',
    options: [
      {
        id: 'bonus',
        label: 'Der Preis bleibt fix – aber ich leg dir gratis ein XXL-Mauspad dazu!',
        discountPercent: 0,
        bonusItem: { product: PRODUCTS.mousepad, quantity: 1 },
        customerReply: 'Mega nice, ein XXL-Mauspad hab ich eh noch gebraucht! Deal!',
        satisfactionDelta: 15,
        scoreBonus: 200,
      },
      {
        id: 'discount',
        label: 'Weil ich deine Videos feier: Ich geb dir 10 % Creator-Rabatt!',
        discountPercent: 10,
        customerReply: 'Oha wie cool, danke! Schick die Bestellung direkt raus!',
        satisfactionDelta: 12,
        scoreBonus: 130,
      },
      {
        id: 'strict',
        label: 'Sorry, kein Rabatt drin – gute Hardware hat ihren Preis!',
        discountPercent: 0,
        customerReply: 'Autsch, knallhart... Na gut, für 4K-Rendering brauch ich die PCs trotzdem.',
        satisfactionDelta: -8,
        scoreBonus: 80,
      },
    ],
  },
  {
    id: 'teacher-setup',
    customerName: 'Prof. Hubmann',
    customerHandle: '@htl_edv_saal',
    avatarBg: 'bg-teal-600',
    avatarInitials: 'PH',
    openingMessage:
        'Guten Tag! Für unseren neuen Informatik-Saal benötigen wir 3x Gaming-PC RTX und 1x RGB-Kaffeetasse für den Serverraum.',
    items: [
      { product: PRODUCTS.pc, quantity: 3 },
      { product: PRODUCTS.mug, quantity: 1 },
    ],
    negotiationPrompt:
        'Können wir bei einer Bestellung von drei Rechnern noch ein kleines Entgegenkommen vereinbaren?',
    options: [
      {
        id: 'bonus',
        label: 'Der Preis ist fix, aber wir legen ein gratis XXL-Mauspad oben drauf!',
        discountPercent: 0,
        bonusItem: { product: PRODUCTS.mousepad, quantity: 1 },
        customerReply: 'Ausgezeichnet, das spart uns eine extra Bestellung. Deal!',
        satisfactionDelta: 15,
        scoreBonus: 200,
      },
      {
        id: 'discount',
        label: 'Für Schulen machen wir eine Ausnahme: 15 % Bildungsrabatt!',
        discountPercent: 15,
        customerReply: 'Wunderbar, da freut sich unser Controlling! Bitte liefern.',
        satisfactionDelta: 12,
        scoreBonus: 130,
      },
      {
        id: 'strict',
        label: 'Leider nein, die Grafikkarten-Preise lassen keinen Spielraum.',
        discountPercent: 0,
        customerReply: 'Verständlich in der heutigen Zeit. Wir bestellen trotzdem.',
        satisfactionDelta: -5,
        scoreBonus: 90,
      },
    ],
  },
  {
    id: 'esports-team',
    customerName: 'Kaindorf E-Sports',
    customerHandle: '@kaindorf_esports',
    avatarBg: 'bg-indigo-600',
    avatarInitials: 'KE',
    openingMessage:
        'Servus! Unser Schul-Team hat nächste Woche ein großes Turnier und braucht dringend 2x Gaming-PC RTX und 1x Mechanical Keyboard!',
    items: [
      { product: PRODUCTS.pc, quantity: 2 },
      { product: PRODUCTS.keyboard, quantity: 1 },
    ],
    negotiationPrompt:
        'Unsere Teamkasse ist fast leer – geht da noch ein kleiner Sponsor-Rabatt für uns?',
    options: [
      {
        id: 'bonus',
        label: 'Preis bleibt, aber wir sponsorn euch ein gratis XXL-Mauspad dazu!',
        discountPercent: 0,
        bonusItem: { product: PRODUCTS.mousepad, quantity: 1 },
        customerReply: 'Stark! Perfekt für Low-Sense-Aiming. Wir nehmen das Paket!',
        satisfactionDelta: 15,
        scoreBonus: 200,
      },
      {
        id: 'discount',
        label: 'Klar, wir unterstützen den Schul-Sport: 10 % Team-Rabatt!',
        discountPercent: 10,
        customerReply: 'Ehrenmänner! Damit sind wir ready fürs Finale!',
        satisfactionDelta: 10,
        scoreBonus: 125,
      },
      {
        id: 'strict',
        label: 'Sorry, unsere Margen sind schon am Limit – Fixpreis!',
        discountPercent: 0,
        customerReply: 'Schade, aber ohne neue PCs verlieren wir. Auftrag geht raus!',
        satisfactionDelta: -7,
        scoreBonus: 85,
      },
    ],
  },
  {
    id: 'startup-graz',
    customerName: 'AI-Startup Graz',
    customerHandle: '@next_unicorn_graz',
    avatarBg: 'bg-amber-600',
    avatarInitials: 'AI',
    openingMessage:
        'Hi! Wir gründen gerade in Graz ein KI-Startup und brauchen sofort 1x Gaming-PC RTX, 2x Mechanical Keyboard und 2x RGB-Kaffeetasse!',
    items: [
      { product: PRODUCTS.pc, quantity: 1 },
      { product: PRODUCTS.keyboard, quantity: 2 },
      { product: PRODUCTS.mug, quantity: 2 },
    ],
    negotiationPrompt:
        'Unser Investor überweist erst nächste Woche – könnt ihr uns preislich etwas entgegenkommen?',
    options: [
      {
        id: 'bonus',
        label: 'Kein Rabatt, aber für lange Nächte gibt’s ein XXL-Mauspad gratis!',
        discountPercent: 0,
        bonusItem: { product: PRODUCTS.mousepad, quantity: 1 },
        customerReply: 'Top, genau so arbeitet man effizient! Schickt die Rechnung!',
        satisfactionDelta: 15,
        scoreBonus: 200,
      },
      {
        id: 'discount',
        label: 'Deal! Wir geben euch 12 % Startup-Starthilfe-Rabatt.',
        discountPercent: 12,
        customerReply: 'Genial, damit reicht das Budget sogar noch für Pizza! Deal!',
        satisfactionDelta: 12,
        scoreBonus: 130,
      },
      {
        id: 'strict',
        label: 'Wir sind ein seriöses Unternehmen – keine Rabatte ohne Vorkasse!',
        discountPercent: 0,
        customerReply: 'Harte Business-Schule... Passt, wir nehmen es trotzdem.',
        satisfactionDelta: -6,
        scoreBonus: 90,
      },
    ],
  },
];

export function App() {
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [playerName, setPlayerName] = useState('Gast-Manager');
  const [scenarioIdx, setScenarioIdx] = useState(0);

  // Laufende Prozessdaten
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [satisfaction, setSatisfaction] = useState(85);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sapLogs, setSapLogs] = useState<SapLogEntry[]>([]);
  const [finalReceipt, setFinalReceipt] = useState<ReceiptPrintPayload | null>(null);
  const [muted, setMuted] = useState(false);

  const currentScenario = SCENARIOS[scenarioIdx % SCENARIOS.length];

  // Timer während des Spiels
  useEffect(() => {
    if (phase === 'intro' || phase === 'summary') return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const addSapLog = (module: SapLogEntry['module'], tcode: string, message: string) => {
    setSapLogs((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        module,
        tcode,
        message,
        timestamp: new Date().toLocaleTimeString('de-AT'),
      },
    ]);
  };

  const handleStartGame = (name: string) => {
    setPlayerName(name);
    setElapsedSeconds(0);
    setSatisfaction(85);
    setSapLogs([]);
    addSapLog('SD', 'VA00', `Neuer Verkaufsprozess von Sachbearbeiter "${name}" gestartet.`);
    setPhase('sales');
  };

  const handleSalesComplete = (
      finalItems: OrderItem[],
      discount: number,
      satisfactionDelta: number
  ) => {
    setOrderItems(finalItems);
    setDiscountPercent(discount);
    setSatisfaction((s) => Math.max(0, Math.min(100, s + satisfactionDelta)));
    setPhase('warehouse');
  };

  const handleWarehouseComplete = (mistakesCount: number) => {
    setSatisfaction((s) => Math.max(0, s - mistakesCount * 5));
    setPhase('accounting');
  };

  const handleFinishAndPrint = (
      grandTotal: number,
      subtotal: number,
      discountAmount: number,
      taxAmount: number
  ) => {
    let rankTitle = 'Junior SAP Explorer';
    if (elapsedSeconds <= 75 && satisfaction >= 90) {
      rankTitle = 'Master SAP S/4HANA Architect 🏆';
    } else if (elapsedSeconds <= 110 && satisfaction >= 75) {
      rankTitle = 'Senior ERP Process Consultant ⭐';
    }

    const receiptPayload: ReceiptPrintPayload = {
      company: 'HTL Kaindorf GmbH',
      department: 'Informatik – Vertiefung SAP',
      employeeName: playerName,
      customerName: currentScenario.customerName,
      orderNumber: 'AUF-4711',
      invoiceNumber: 'RE-90004711',
      items: orderItems.map((i) => ({
        materialNumber: i.product.materialNumber,
        name: i.product.name,
        quantity: i.quantity,
        unitPrice: i.product.unitPrice,
        totalPrice: i.product.unitPrice * i.quantity,
      })),
      subtotal,
      discountPercent,
      discountAmount,
      taxRate: 20,
      taxAmount,
      grandTotal,
      durationSeconds: elapsedSeconds,
      satisfactionScore: satisfaction,
      rankTitle,
      printedAt: new Date().toISOString(),
    };

    // Hier wird deine Druckschnittstelle aufgerufen (aktuell console.log)
    triggerReceiptPrint(receiptPayload);

    setFinalReceipt(receiptPayload);
    setPhase('summary');
  };

  const handleRestart = () => {
    setScenarioIdx((idx) => idx + 1);
    setPhase('intro');
  };

  const toggleMute = () => {
    sound.muted = !muted;
    setMuted(!muted);
  };

  return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between select-none">
        {/* Top-Navigationsleiste */}
        <header className="bg-slate-950/90 border-b border-slate-800 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-sm md:text-base tracking-tight text-white">
                HTL Kaindorf GmbH
              </div>
              <div className="text-[11px] text-cyan-400 font-semibold">
                Order-to-Cash Simulation • Vertiefung SAP
              </div>
            </div>
          </div>

          {/* Fortschritt & Live-Stats */}
          {phase !== 'intro' && (
              <div className="hidden md:flex items-center gap-2">
                {[
                  { id: 'sales', label: '1. Vertrieb' },
                  { id: 'warehouse', label: '2. Lager' },
                  { id: 'accounting', label: '3. Buchhaltung' },
                ].map((step) => {
                  const active = phase === step.id;
                  return (
                      <span
                          key={step.id}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                              active
                                  ? 'bg-cyan-500 text-slate-950 shadow'
                                  : 'bg-slate-800 text-slate-400'
                          }`}
                      >
                  {step.label}
                </span>
                  );
                })}
              </div>
          )}

          <div className="flex items-center gap-3">
            {phase !== 'intro' && (
                <>
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{elapsedSeconds}s</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono">
                    <Smile className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{satisfaction}%</span>
                  </div>
                </>
            )}
            <button
                onClick={toggleMute}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 cursor-pointer"
                title={muted ? 'Ton einschalten' : 'Ton stummschalten'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Hauptbereich je nach Spielphase */}
        <main className="flex-1 flex flex-col">
          {phase === 'intro' && <IntroScreen onStart={handleStartGame} />}

          {phase === 'sales' && (
              <SalesStage
                  scenario={currentScenario}
                  playerName={playerName}
                  onComplete={handleSalesComplete}
                  onSapLog={addSapLog}
              />
          )}

          {phase === 'warehouse' && (
              <WarehouseStage
                  orderItems={orderItems}
                  distractorProducts={DISTRACTORS}
                  onComplete={handleWarehouseComplete}
                  onSapLog={addSapLog}
              />
          )}

          {phase === 'accounting' && (
              <AccountingStage
                  playerName={playerName}
                  customerName={currentScenario.customerName}
                  orderItems={orderItems}
                  discountPercent={discountPercent}
                  onFinishAndPrint={handleFinishAndPrint}
                  onSapLog={addSapLog}
              />
          )}

          {phase === 'summary' && finalReceipt && (
              <SummaryScreen receipt={finalReceipt} onRestart={handleRestart} />
          )}
        </main>

        {/* Unterer Live-ERP-Ticker */}
        <SapTicker logs={sapLogs} />
      </div>
  );
}

export default App;