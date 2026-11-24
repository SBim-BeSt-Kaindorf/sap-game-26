import React, { useState } from 'react';
import {
    FileCheck2,
    Landmark,
    Printer,
    AlertCircle,
    CheckCircle2,
    Wrench,
    BadgeCheck,
} from 'lucide-react';
import type {OrderItem} from '../types/game';
import { sound } from '../utils/sound';

interface AccountingStageProps {
    playerName: string;
    customerName: string;
    orderItems: OrderItem[];
    discountPercent: number;
    onFinishAndPrint: (grandTotal: number, subtotal: number, discountAmount: number, taxAmount: number) => void;
    onSapLog: (module: 'FI' | 'CO', tcode: string, message: string) => void;
}

export const AccountingStage: React.FC<AccountingStageProps> = ({
                                                                    playerName,
                                                                    customerName,
                                                                    orderItems,
                                                                    discountPercent,
                                                                    onFinishAndPrint,
                                                                    onSapLog,
                                                                }) => {
    // Kleiner lustiger Fehler in der Rechnung, den der Buchhalter korrigieren muss
    const [shippingFeeFixed, setShippingFeeFixed] = useState(false);
    const [paymentMatched, setPaymentMatched] = useState(false);

    const subtotal = orderItems.reduce((sum, i) => sum + i.product.unitPrice * i.quantity, 0);
    const discountAmount = subtotal * (discountPercent / 100);
    const netAfterDiscount = subtotal - discountAmount;
    const shippingCost = shippingFeeFixed ? 0 : 9999;
    const taxAmount = (netAfterDiscount + shippingCost) * 0.2;
    const grandTotal = netAfterDiscount + shippingCost + taxAmount;

    const handleFixShipping = () => {
        sound.playStamp();
        setShippingFeeFixed(true);
        onSapLog('FI', 'VF02', 'Tippfehler bei Versandkosten (9.999 €) korrigiert – Faktura freigegeben.');
    };

    const handleMatchPayment = () => {
        if (!shippingFeeFixed) {
            sound.playError();
            return;
        }
        sound.playStamp();
        setPaymentMatched(true);
        onSapLog('FI', 'F-28', `Zahlungseingang über ${grandTotal.toFixed(2)} € mit Debitor ausgeglichen!`);
    };

    const handlePrint = () => {
        if (!shippingFeeFixed || !paymentMatched) return;
        sound.playSuccess();
        onFinishAndPrint(grandTotal, subtotal, discountAmount, taxAmount);
    };

    return (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 max-w-6xl w-full mx-auto items-stretch">
            {/* Linke Seite: Virtueller Schreibtisch mit Ausgangsrechnung */}
            <div className="flex-1 bg-slate-800/80 border border-slate-700 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                <div>
                    <div className="flex items-center justify-between mb-4">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
              Rolle 3/3: Buchhaltung / Büro (FI)
            </span>
                        <span className="text-xs font-mono text-slate-400">Faktura-Nr: 90004711</span>
                    </div>

                    {/* Papier-Rechnung auf dem Schreibtisch */}
                    <div className="relative bg-white text-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200">
                        {/* Stempel wenn bezahlt */}
                        {paymentMatched && (
                            <div className="absolute top-12 right-8 border-4 border-emerald-600 text-emerald-600 font-black text-2xl px-4 py-1.5 rounded-xl uppercase tracking-widest pointer-events-none animate-stamp">
                                BEZAHLT & GEBUCHT
                            </div>
                        )}

                        <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
                            <div>
                                <div className="font-black text-lg text-slate-900">HTL Kaindorf GmbH</div>
                                <div className="text-xs text-slate-500">Abteilung Informatik • Vertiefung SAP</div>
                            </div>
                            <div className="text-right text-xs text-slate-600">
                                <div><strong>Kunde:</strong> {customerName}</div>
                                <div><strong>Sachbearbeiter:</strong> {playerName}</div>
                            </div>
                        </div>

                        <table className="w-full text-sm mb-4">
                            <thead>
                            <tr className="border-b border-slate-200 text-left text-xs text-slate-500 uppercase">
                                <th className="py-2">Artikel</th>
                                <th className="py-2 text-center">Menge</th>
                                <th className="py-2 text-right">Summe</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {orderItems.map((item) => (
                                <tr key={item.product.id}>
                                    <td className="py-2 font-medium">{item.product.name}</td>
                                    <td className="py-2 text-center">{item.quantity}</td>
                                    <td className="py-2 text-right font-mono">
                                        {(item.product.unitPrice * item.quantity).toFixed(2)} €
                                    </td>
                                </tr>
                            ))}
                            {discountPercent > 0 && (
                                <tr className="text-emerald-700 font-medium">
                                    <td className="py-2">Verhandelter Sonderrabatt ({discountPercent}%)</td>
                                    <td className="py-2 text-center">-</td>
                                    <td className="py-2 text-right font-mono">-{discountAmount.toFixed(2)} €</td>
                                </tr>
                            )}
                            {/* Bug-Zeile */}
                            <tr className={shippingFeeFixed ? 'text-slate-500' : 'bg-rose-100 text-rose-800 font-bold'}>
                                <td className="py-2 flex items-center gap-1.5">
                                    {!shippingFeeFixed && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                                    Express-Versandpauschale {shippingFeeFixed ? '(Gratis-Aktion)' : '(TIPPFEHLER!)'}
                                </td>
                                <td className="py-2 text-center">1</td>
                                <td className="py-2 text-right font-mono">{shippingCost.toFixed(2)} €</td>
                            </tr>
                            </tbody>
                        </table>

                        <div className="border-t-2 border-slate-200 pt-3 space-y-1 text-sm">
                            <div className="flex justify-between text-slate-500">
                                <span>Umsatzsteuer (20%):</span>
                                <span className="font-mono">{taxAmount.toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between text-xl font-black text-slate-900">
                                <span>Rechnungsbetrag:</span>
                                <span className="font-mono">{grandTotal.toFixed(2)} €</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Schritt 1 in FI: Fehler beheben */}
                <div className="mt-4">
                    {!shippingFeeFixed ? (
                        <button
                            onClick={handleFixShipping}
                            className="w-full py-3.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-sm md:text-base shadow-lg flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                        >
                            <Wrench className="w-5 h-5" />
                            STEP 1: TIPPFEHLER (9.999 € VERSAND) KORRIGIEREN!
                        </button>
                    ) : (
                        <div className="py-2.5 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-bold flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Step 1 erledigt: Rechnungssumme ist korrekt!
                        </div>
                    )}
                </div>
            </div>

            {/* Rechte Seite: Online-Banking Terminal & Druck-Button */}
            <div className="w-full lg:w-96 flex flex-col gap-5 justify-between">
                {/* Bank-Konto Box */}
                <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center gap-2 text-purple-300 font-bold text-sm uppercase tracking-wider mb-4">
                        <Landmark className="w-5 h-5" />
                        Firmenkonto (Bankeingang)
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-4">
                        <div className="text-xs text-slate-400 mb-1">Neue Echtzeit-Überweisung eingegangen:</div>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-bold text-white text-sm">{customerName}</div>
                                <div className="text-xs text-slate-500 font-mono">Verwendungszweck: RE-90004711</div>
                            </div>
                            <div className="text-lg font-black text-emerald-400 font-mono">
                                +{(netAfterDiscount * 1.2).toFixed(2)} €
                            </div>
                        </div>
                    </div>

                    {!paymentMatched ? (
                        <button
                            onClick={handleMatchPayment}
                            disabled={!shippingFeeFixed}
                            className={`w-full py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                                shippingFeeFixed
                                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg cursor-pointer'
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            <FileCheck2 className="w-5 h-5" />
                            STEP 2: ZAHLUNGSEINGANG ABHAKEN & AUSGLEICHEN
                        </button>
                    ) : (
                        <div className="py-3 px-4 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-200 text-sm font-bold flex items-center justify-center gap-2 animate-pop-in">
                            <BadgeCheck className="w-5 h-5 text-purple-300" /> Offener Posten ausgeglichen!
                        </div>
                    )}
                </div>

                {/* Großer Rechnungsdrucker-Trigger */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-500/40 rounded-3xl p-6 text-center shadow-2xl">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center mx-auto mb-3">
                        <Printer className="w-7 h-7" />
                    </div>
                    <h3 className="font-black text-lg text-white mb-1">Prozess abschließen</h3>
                    <p className="text-xs text-slate-400 mb-5">
                        Schließt den kompletten Order-to-Cash-Durchlauf ab und sendet deinen Beleg an den Rechnungsdrucker!
                    </p>

                    <button
                        onClick={handlePrint}
                        disabled={!shippingFeeFixed || !paymentMatched}
                        className={`w-full py-4 px-5 rounded-2xl font-black text-base md:text-lg flex items-center justify-center gap-2 transition-all ${
                            shippingFeeFixed && paymentMatched
                                ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 shadow-xl shadow-cyan-500/25 cursor-pointer scale-[1.02]'
                                : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
                        }`}
                    >
                        <Printer className="w-5 h-5" />
                        RECHNUNG JETZT DRUCKEN!
                    </button>
                </div>
            </div>
        </div>
    );
};