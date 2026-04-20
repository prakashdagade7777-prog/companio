// pages/admin/settings.jsx
import { useState } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import toast from 'react-hot-toast';
import { RiSaveLine, RiShieldCheckLine, RiMoneyDollarCircleLine, RiTimeLine } from 'react-icons/ri';

export default function AdminSettingsPage() {
  const [surge, setSurge] = useState({ evening: 1.15, weekend: 1.25, weekendEvening: 1.5 });
  const [commission, setCommission] = useState(15);
  const [payment, setPayment] = useState({ upiId: 'companio@ybl', bankName: 'HDFC Bank', accountNo: '1234567890123', ifsc: 'HDFC0001234', accountName: 'Companio Tech Pvt Ltd' });
  const [limits, setLimits]   = useState({ freeUserBookings: 3, freeCompanionBookings: 5, maxHoursPerBooking: 8 });
  const [kyc, setKyc]         = useState({ autoNotifyEmail: true, reviewSLAHours: 24 });
  const [busy, setBusy]       = useState(false);

  const save = async (section) => {
    setBusy(true);
    setTimeout(() => {
      toast.success(`${section} settings saved!`);
      setBusy(false);
    }, 600);
  };

  return (
    <AdminLayout title="Platform Settings">
      <Head><title>Settings – Admin</title></Head>

      <div className="max-w-2xl space-y-8">

        {/* ── Surge Pricing ── */}
        <Section icon={<RiTimeLine />} title="Surge Pricing Multipliers" onSave={() => save('Surge pricing')}>
          <div className="space-y-4">
            {[
              { label: 'Evening (6 PM – 11 PM)', key: 'evening', min: 1.0, max: 2.0, step: 0.05 },
              { label: 'Weekend (Sat + Sun)',      key: 'weekend', min: 1.0, max: 2.0, step: 0.05 },
              { label: 'Weekend Evening (peak)',   key: 'weekendEvening', min: 1.0, max: 3.0, step: 0.1 },
            ].map(f => (
              <div key={f.key} className="flex items-center justify-between gap-4">
                <label className="text-sm text-gray-400 flex-1">{f.label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range" min={f.min} max={f.max} step={f.step}
                    value={surge[f.key]}
                    onChange={e => setSurge(p => ({ ...p, [f.key]: parseFloat(e.target.value) }))}
                    className="w-24"
                  />
                  <span className="text-white font-mono text-sm w-12 text-right">{surge[f.key]}×</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Commission ── */}
        <Section icon={<RiMoneyDollarCircleLine />} title="Platform Commission" onSave={() => save('Commission')}>
          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-400 flex-1">Commission Rate (% of booking total)</label>
            <div className="flex items-center gap-2">
              <input
                type="number" min={5} max={30} step={1}
                value={commission}
                onChange={e => setCommission(Number(e.target.value))}
                className="glass-input w-20 text-center font-mono"
              />
              <span className="text-gray-400">%</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">Current: Companions earn {100 - commission}% of each booking.</p>
        </Section>

        {/* ── Payment ── */}
        <Section icon={<RiMoneyDollarCircleLine />} title="Payment Collection Details" onSave={() => save('Payment details')}>
          <div className="space-y-3">
            {[
              { label: 'UPI ID',        key: 'upiId'       },
              { label: 'Bank Name',     key: 'bankName'    },
              { label: 'Account No.',   key: 'accountNo'   },
              { label: 'IFSC Code',     key: 'ifsc'        },
              { label: 'Account Name',  key: 'accountName' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                <input
                  type="text"
                  className="glass-input font-mono text-sm"
                  value={payment[f.key]}
                  onChange={e => setPayment(p => ({ ...p, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </Section>

        {/* ── Booking Limits ── */}
        <Section icon={<RiShieldCheckLine />} title="Booking Limits" onSave={() => save('Booking limits')}>
          <div className="space-y-4">
            {[
              { label: 'Free User — Max bookings/month',       key: 'freeUserBookings',       min: 1, max: 20 },
              { label: 'Free Companion — Max bookings/month',  key: 'freeCompanionBookings',  min: 1, max: 20 },
              { label: 'Max hours per booking',               key: 'maxHoursPerBooking',     min: 1, max: 12 },
            ].map(f => (
              <div key={f.key} className="flex items-center justify-between gap-4">
                <label className="text-sm text-gray-400 flex-1">{f.label}</label>
                <input
                  type="number" min={f.min} max={f.max}
                  value={limits[f.key]}
                  onChange={e => setLimits(p => ({ ...p, [f.key]: Number(e.target.value) }))}
                  className="glass-input w-20 text-center font-mono text-sm"
                />
              </div>
            ))}
          </div>
        </Section>

        {/* ── KYC Settings ── */}
        <Section icon={<RiShieldCheckLine />} title="KYC & Verification" onSave={() => save('KYC settings')}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">Auto-notify companions of KYC status via email</label>
              <div
                onClick={() => setKyc(p => ({ ...p, autoNotifyEmail: !p.autoNotifyEmail }))}
                className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative ${kyc.autoNotifyEmail ? 'bg-emerald-500' : 'bg-gray-700'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${kyc.autoNotifyEmail ? 'left-5' : 'left-0.5'}`} />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm text-gray-400 flex-1">KYC review SLA (hours)</label>
              <input
                type="number" min={1} max={72}
                value={kyc.reviewSLAHours}
                onChange={e => setKyc(p => ({ ...p, reviewSLAHours: Number(e.target.value) }))}
                className="glass-input w-20 text-center font-mono text-sm"
              />
            </div>
          </div>
        </Section>

      </div>
    </AdminLayout>
  );
}

function Section({ icon, title, onSave, children }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <span className="text-indigo-400">{icon}</span>
          {title}
        </h2>
        <button onClick={onSave} className="btn-ghost flex items-center gap-2 py-2 px-4 text-xs">
          <RiSaveLine /> Save
        </button>
      </div>
      {children}
    </div>
  );
}
