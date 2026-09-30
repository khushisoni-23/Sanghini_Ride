import { useState } from 'react';
import { Car, CheckCircle2, Settings, FileText, AlertTriangle } from 'lucide-react';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';

export default function DriverVehicle() {
  const [vehicle] = useState({
    make: 'Maruti Suzuki',
    model: 'Swift Dzire',
    year: '2022',
    color: 'White',
    plateNumber: 'RJ 27 TA 4321',
    type: 'Sedan (Sanghini Comfort)',
    status: 'active'
  });

  const docs = [
    { name: 'Vehicle Registration (RC)', status: 'valid', expiry: 'Jan 2037' },
    { name: 'Commercial Insurance', status: 'valid', expiry: 'Nov 2025' },
    { name: 'Pollution (PUC)', status: 'warning', expiry: 'Expires in 15 days' },
    { name: 'Commercial Permit', status: 'valid', expiry: 'Dec 2026' },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <PageHeader
        title="My Vehicle"
        subtitle="Manage your registered vehicle and documents."
        actions={
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-1.5" /> Manage Vehicle
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Col: Vehicle Details */}
        <div className="space-y-6">
          <Card className="p-0 overflow-hidden border border-slate-200/80">
            <div className="h-40 bg-gradient-to-r from-slate-800 to-slate-900 relative">
               <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,_rgba(255,255,255,1)_0%,_rgba(0,0,0,0)_100%)]"></div>
               <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
                 <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{vehicle.make} {vehicle.model}</h2>
                    <div className="text-slate-300 text-sm">{vehicle.year} • {vehicle.color}</div>
                 </div>
                 <div className="bg-yellow-400 text-black font-mono font-bold px-3 py-1.5 rounded border-2 border-black/20 shadow-md">
                    {vehicle.plateNumber}
                 </div>
               </div>
            </div>
            
            <div className="p-6">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Vehicle Category</div>
                   <div className="text-sm font-semibold text-slate-800">{vehicle.type}</div>
                 </div>
                 <div>
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</div>
                   <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                     <CheckCircle2 className="w-3.5 h-3.5" /> Active
                   </div>
                 </div>
               </div>
            </div>
          </Card>
        </div>

        {/* Right Col: Vehicle Documents */}
        <div className="space-y-6">
           <Card className="p-6 border border-slate-200/80">
            <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" /> Vehicle Documents
            </h3>
            
            <div className="space-y-4">
               {docs.map((doc, idx) => (
                 <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/50 transition-colors">
                   <div>
                     <div className="font-semibold text-slate-800 text-sm mb-1">{doc.name}</div>
                     <div className={`text-xs font-bold flex items-center gap-1 ${
                       doc.status === 'warning' ? 'text-amber-600' : 'text-slate-500'
                     }`}>
                       {doc.status === 'warning' && <AlertTriangle className="w-3 h-3" />}
                       {doc.expiry}
                     </div>
                   </div>
                   <Button variant="ghost" size="sm">Update</Button>
                 </div>
               ))}
            </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
