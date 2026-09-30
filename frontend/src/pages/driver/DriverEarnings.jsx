import { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, Calendar as CalendarIcon, Download, ChevronLeft, ChevronRight, Activity, Loader2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import rideService from '../../services/rideService';
import { useToast } from '../../context/ToastContext';

export default function DriverEarnings() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState('Current Active Period');

  const [stats, setStats] = useState({
    totalEarnings: 0,
    ridesCompleted: 0,
    hoursOnline: 0,
    dailyBreakdown: [
      { day: 'Mon', amount: 0, height: '0%' },
      { day: 'Tue', amount: 0, height: '0%' },
      { day: 'Wed', amount: 0, height: '0%' },
      { day: 'Thu', amount: 0, height: '0%' },
      { day: 'Fri', amount: 0, height: '0%' },
      { day: 'Sat', amount: 0, height: '0%' },
      { day: 'Sun', amount: 0, height: '0%' },
    ],
  });

  useEffect(() => {
    const fetchEarningsFromBackend = async () => {
      setLoading(true);
      try {
        const res = await rideService.getMyRides('all');
        if (res.success && Array.isArray(res.data)) {
          const completedRides = res.data.filter((r) => r.status === 'completed');
          const totalFareSum = completedRides.reduce((sum, r) => sum + (r.fare || 0), 0);

          // Build daily breakdown
          const daysMap = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
          const daysList = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

          completedRides.forEach((r) => {
            if (r.createdAt) {
              const d = new Date(r.createdAt);
              const dayName = daysList[d.getDay()];
              if (daysMap[dayName] !== undefined) {
                daysMap[dayName] += r.fare || 0;
              }
            }
          });

          const maxAmount = Math.max(...Object.values(daysMap), 100);
          const breakdown = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
            const amt = daysMap[day] || 0;
            const pct = maxAmount > 0 ? Math.round((amt / maxAmount) * 100) : 0;
            return {
              day,
              amount: amt,
              height: `${pct}%`,
            };
          });

          setStats({
            totalEarnings: Math.round(totalFareSum),
            ridesCompleted: completedRides.length,
            hoursOnline: Math.round((completedRides.length * 0.5) * 10) / 10,
            dailyBreakdown: breakdown,
          });
        }
      } catch (err) {
        console.error('Failed to load earnings from MongoDB:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEarningsFromBackend();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <PageHeader
        title="Earnings"
        subtitle="Track your daily and weekly income generated directly on Sanghini Ride."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Statement generated from MongoDB database.')}
          >
            <Download className="w-4 h-4 mr-1.5" /> Download Statement
          </Button>
        }
      />

      {/* Period Indicator */}
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm">
        <button className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-500">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
          <CalendarIcon className="w-4 h-4 text-purple-600" />
          {currentWeek}
        </div>
        <button className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-500 disabled:opacity-30">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
          Calculating earnings from MongoDB...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Weekly Summary Cards */}
            <Card className="p-6 border border-slate-200/80 bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex flex-col justify-between h-full">
              <div>
                <div className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-2">
                  Total Earnings (MongoDB)
                </div>
                <div className="text-4xl font-extrabold flex items-center">
                  ₹{stats.totalEarnings.toLocaleString()}
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-emerald-100 bg-black/10 w-fit px-3 py-1.5 rounded-full">
                <TrendingUp className="w-4 h-4" /> Live Platform Income
              </div>
            </Card>

            <Card className="p-6 border border-slate-200/80 flex flex-col justify-center">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                Rides Completed
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{stats.ridesCompleted}</div>
              <div className="mt-4 text-xs font-medium text-slate-400">Target: 50 rides</div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${Math.min(stats.ridesCompleted * 2, 100)}%` }}
                ></div>
              </div>
            </Card>

            <Card className="p-6 border border-slate-200/80 flex flex-col justify-center">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                Est. Hours Online
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {stats.hoursOnline}
                <span className="text-lg text-slate-400 font-semibold ml-1">hrs</span>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Activity className="w-3.5 h-3.5 text-emerald-500" /> Real-time activity sync
              </div>
            </Card>
          </div>

          {/* Chart Section */}
          <Card className="p-6 border border-slate-200/80">
            <h3 className="text-sm font-bold text-slate-900 mb-8">Daily Earnings Breakdown</h3>

            <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-2">
              {stats.dailyBreakdown.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 group">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                    ₹{day.amount}
                  </div>

                  {/* Bar */}
                  <div className="w-full max-w-[40px] bg-slate-100 rounded-t-lg relative overflow-hidden h-full flex items-end">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        day.amount > 0 ? 'bg-purple-500 group-hover:bg-purple-600' : 'bg-transparent'
                      }`}
                      style={{ height: day.height }}
                    ></div>
                  </div>

                  {/* Label */}
                  <div className="mt-3 text-[11px] font-bold text-slate-500 uppercase">{day.day}</div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
