'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Search, ChevronDown, Loader2, RefreshCw, IndianRupee, Eye, Truck, X } from 'lucide-react';
import client from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { toast } from 'sonner';

type StatusFilter = 'ALL' | 'PENDING' | 'ACCEPTED' | 'PACKED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

const STATUS_COLOR: Record<string, string> = {
  PENDING:    'bg-yellow-100 text-yellow-700',
  ACCEPTED:   'bg-blue-100 text-blue-700',
  PACKED:     'bg-purple-100 text-purple-700',
  PICKED_UP:  'bg-orange-100 text-orange-700',
  IN_TRANSIT: 'bg-indigo-100 text-indigo-700',
  ON_THE_WAY: 'bg-indigo-100 text-indigo-700',
  DELIVERED:  'bg-green-100 text-green-700',
  CANCELLED:  'bg-red-100 text-red-700',
};

const ALL_STATUSES: StatusFilter[] = ['ALL','PENDING','ACCEPTED','PACKED','PICKED_UP','IN_TRANSIT','DELIVERED','CANCELLED'];

export default function AdminOrders() {
  const [orders, setOrders]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [query, setQuery]         = useState('');
  const [statusFilter, setStatus] = useState<StatusFilter>('ALL');
  const [actionId, setActionId]   = useState<string | null>(null);
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [assigningAgent, setAssigningAgent] = useState(false);
  const [agentId, setAgentId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await client.get('/api/admin/orders');
      setOrders(res.data?.data ?? []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (orderId: string, status: string) => {
    setActionId(orderId);
    try {
      await client.put(`/api/admin/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status }));
      }
    } catch {}
    finally { setActionId(null); }
  };

  const handleAssignAgent = async () => {
    if (!agentId.trim() || !selectedOrder) return;
    setAssigningAgent(true);
    try {
      await client.put(`/api/admin/orders/${selectedOrder.id}/delivery`, { deliveryAgentId: agentId });
      toast.success('Agent assigned successfully');
      // Update local state
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, deliveryAgentId: agentId, status: 'ASSIGNED' } : o));
      setSelectedOrder((prev: any) => ({ ...prev, deliveryAgentId: agentId, status: 'ASSIGNED' }));
      setAgentId('');
    } catch (e: any) {
      toast.error('Failed to assign agent');
    } finally {
      setAssigningAgent(false);
    }
  };

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const q = query.toLowerCase();
    const matchQ = !q || o.id?.toLowerCase().includes(q) || o.buyerName?.toLowerCase().includes(q);
    return matchStatus && matchQ;
  });

  const revenue = orders.filter(o => o.status === 'DELIVERED').reduce((s: number, o: any) => s + (o.totalAmount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Orders</h1>
          <p className="text-ink-2 mt-1">{orders.length} total orders</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-success/10 text-success font-bold rounded-xl px-4 py-2">
            <IndianRupee className="size-4" />{formatINR(revenue)} revenue
          </div>
          <button onClick={load} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="size-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${statusFilter === s ? 'bg-primary text-white' : 'bg-bg text-ink-2 hover:bg-border'}`}
          >
            {s === 'ALL' ? `All (${orders.length})` : `${s} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-3" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by order ID or buyer…" className="input pl-9 w-full" />
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-ink-2 text-left">
                <th className="px-4 py-3 font-semibold">Order ID</th>
                <th className="px-4 py-3 font-semibold">Buyer</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Update Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-ink-2">No orders found</td></tr>
              ) : filtered.map((order, i) => (
                <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-border last:border-0 hover:bg-bg">
                  <td className="px-4 py-3 font-mono text-xs text-ink-2">#{order.id?.slice(-6).toUpperCase()}</td>
                  <td className="px-4 py-3 font-semibold">{order.buyerName || order.buyerId?.slice(0,8) || '—'}</td>
                  <td className="px-4 py-3 font-bold text-primary">{formatINR(order.totalAmount ?? 0)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status] ?? 'bg-bg text-ink-2'}`}>{order.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${order.paymentStatus === 'PAID' ? 'bg-success/10 text-success' : 'bg-yellow-100 text-yellow-700'}`}>{order.paymentStatus ?? 'PENDING'}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-2 whitespace-nowrap">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <select
                        value={order.status}
                        onChange={e => updateStatus(order.id, e.target.value)}
                        disabled={actionId === order.id}
                        className="text-xs border border-border rounded-lg px-2 py-1 pr-6 bg-white appearance-none"
                      >
                        {['PENDING','ACCEPTED','ASSIGNED','PACKED','PICKED_UP','IN_TRANSIT','DELIVERED','CANCELLED'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {actionId === order.id ? <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 size-3 animate-spin" /> : <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 size-3 text-ink-3 pointer-events-none" />}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedOrder(order)} className="btn-secondary px-3 py-1.5 text-xs text-primary bg-primary/10 hover:bg-primary/20 border-0 flex items-center gap-1">
                      <Eye className="size-3" /> View
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-border p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-extrabold flex items-center gap-2">Order Details</h2>
                <div className="font-mono text-xs text-ink-2 mt-1">#{selectedOrder.id}</div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-bg rounded-full transition"><X className="size-5" /></button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="card bg-bg border-0 p-4">
                  <div className="text-xs font-bold text-ink-3 uppercase mb-1">Buyer</div>
                  <div className="font-semibold">{selectedOrder.buyerName || 'Unknown'}</div>
                </div>
                <div className="card bg-bg border-0 p-4">
                  <div className="text-xs font-bold text-ink-3 uppercase mb-1">Farmer</div>
                  <div className="font-semibold">{selectedOrder.farmerName || 'Unknown'}</div>
                </div>
              </div>

              <div className="card bg-primary/5 border border-primary/20">
                <h3 className="font-extrabold text-sm flex items-center gap-2 mb-4">
                  <Truck className="size-4 text-primary" /> Delivery Assignment
                </h3>
                {selectedOrder.deliveryAgentId ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-primary">Assigned to Agent</div>
                      <div className="text-xs font-mono text-ink-2 mt-1">{selectedOrder.deliveryAgentId}</div>
                    </div>
                    <span className="bg-success/10 text-success text-xs font-bold px-3 py-1 rounded-full">Assigned</span>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Assign an agent (UUID)</label>
                    <div className="flex gap-2">
                      <input 
                        value={agentId} 
                        onChange={(e) => setAgentId(e.target.value)} 
                        className="input flex-1 py-2 text-sm" 
                        placeholder="e.g. 123e4567-e89b-12d3..." 
                      />
                      <button 
                        onClick={handleAssignAgent} 
                        disabled={assigningAgent || !agentId.trim()} 
                        className="btn-primary py-2 px-6"
                      >
                        {assigningAgent ? <Loader2 className="size-4 animate-spin" /> : 'Assign'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-extrabold text-sm mb-3">Items</h3>
                <div className="space-y-2">
                  {(selectedOrder.items || []).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-bg p-3 rounded-xl text-sm">
                      <div>
                        <span className="font-semibold">{item.productName || 'Product'}</span>
                        <span className="text-ink-2 ml-2">x{item.quantity}</span>
                      </div>
                      <div className="font-bold">{formatINR((item.price || item.pricePerUnit) * item.quantity)}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-between items-center text-lg font-extrabold pt-4 border-t border-border">
                  <span>Total Amount</span>
                  <span className="text-primary">{formatINR(selectedOrder.totalAmount)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
