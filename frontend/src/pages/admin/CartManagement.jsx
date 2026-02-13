import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { shippingApi } from '../../api/shippingApi';
import { couponApi } from '../../api/couponApi';
import { getGovernorateLabel } from '../../localization/governorates';

const CartManagement = () => {
  const { token } = useAuth();

  const [shipping, setShipping] = useState([]);
  const [shippingDraft, setShippingDraft] = useState([]);
  const [shippingLoading, setShippingLoading] = useState(true);
  const [shippingError, setShippingError] = useState('');
  const [shippingSavingId, setShippingSavingId] = useState(null);
  const [shippingBulkSaving, setShippingBulkSaving] = useState(false);
  const [shippingSuccess, setShippingSuccess] = useState('');

  const [coupons, setCoupons] = useState([]);
  const [couponLoading, setCouponLoading] = useState(true);
  const [couponError, setCouponError] = useState('');

  const [newCoupon, setNewCoupon] = useState({ code: '', type: 'percentage', value: 0, isActive: true });
  const [couponSaving, setCouponSaving] = useState(false);

  const loadShipping = async () => {
    try {
      setShippingLoading(true);
      setShippingError('');
      setShippingSuccess('');
      const list = await shippingApi.getAll();
      setShipping(list);
      setShippingDraft(list.map((g) => ({ ...g })));
    } catch (e) {
      setShippingError(e.message || 'Failed to load shipping');
    } finally {
      setShippingLoading(false);
    }
  };

  const loadCoupons = async () => {
    try {
      setCouponLoading(true);
      setCouponError('');
      const list = await couponApi.getAll(token);
      setCoupons(list);
    } catch (e) {
      setCouponError(e.message || 'Failed to load coupons');
    } finally {
      setCouponLoading(false);
    }
  };

  useEffect(() => {
    loadShipping();
    loadCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shippingSorted = useMemo(() => {
    return [...shippingDraft].sort((a, b) => String(a?.nameKey || a?.name || '').localeCompare(String(b?.nameKey || b?.name || '')));
  }, [shippingDraft]);

  const hasChanges = useMemo(() => {
    const byId = new Map(shipping.map((g) => [g._id, Number(g.shippingPrice || 0)]));
    return shippingDraft.some((g) => Number(g.shippingPrice || 0) !== Number(byId.get(g._id) || 0));
  }, [shipping, shippingDraft]);

  const updateDraftPrice = (id, nextValue) => {
    setShippingDraft((prev) => prev.map((g) => (g._id === id ? { ...g, shippingPrice: nextValue } : g)));
  };

  const updateShippingPrice = async (id, nextPrice) => {
    try {
      setShippingSavingId(id);
      setShippingError('');
      setShippingSuccess('');
      const updated = await shippingApi.update(token, id, { shippingPrice: nextPrice });
      setShipping((prev) => prev.map((g) => (g._id === id ? updated : g)));
      setShippingDraft((prev) => prev.map((g) => (g._id === id ? updated : g)));
      setShippingSuccess('Saved successfully.');
    } catch (e) {
      setShippingError(e.message || 'Failed to update shipping');
    } finally {
      setShippingSavingId(null);
    }
  };

  const saveAllShipping = async () => {
    try {
      setShippingBulkSaving(true);
      setShippingError('');
      setShippingSuccess('');

      const currentById = new Map(shipping.map((g) => [g._id, Number(g.shippingPrice || 0)]));
      const updates = shippingDraft
        .filter((g) => Number(g.shippingPrice || 0) !== Number(currentById.get(g._id) || 0))
        .map((g) => ({ id: g._id, shippingPrice: Number(g.shippingPrice || 0) }));

      if (updates.length === 0) {
        setShippingSuccess('No changes to save.');
        return;
      }

      const updatedDocs = await shippingApi.bulkUpdate(token, updates);
      setShipping(updatedDocs);
      setShippingDraft(updatedDocs.map((g) => ({ ...g })));
      setShippingSuccess(`Saved ${updates.length} governorate price(s).`);
    } catch (e) {
      setShippingError(e.message || 'Failed to save all shipping prices');
    } finally {
      setShippingBulkSaving(false);
    }
  };

  const createCoupon = async () => {
    try {
      setCouponSaving(true);
      setCouponError('');
      const payload = {
        code: newCoupon.code,
        type: newCoupon.type,
        value: Number(newCoupon.value),
        isActive: !!newCoupon.isActive,
      };
      const created = await couponApi.create(token, payload);
      setCoupons((prev) => [created, ...prev]);
      setNewCoupon({ code: '', type: 'percentage', value: 0, isActive: true });
    } catch (e) {
      setCouponError(e.message || 'Failed to create coupon');
    } finally {
      setCouponSaving(false);
    }
  };

  const updateCoupon = async (id, patch) => {
    try {
      setCouponError('');
      const updated = await couponApi.update(token, id, patch);
      setCoupons((prev) => prev.map((c) => (c._id === id ? updated : c)));
    } catch (e) {
      setCouponError(e.message || 'Failed to update coupon');
    }
  };

  const deleteCoupon = async (id) => {
    try {
      setCouponError('');
      await couponApi.remove(token, id);
      setCoupons((prev) => prev.filter((c) => c._id !== id));
    } catch (e) {
      setCouponError(e.message || 'Failed to delete coupon');
    }
  };

  return (
    <div className="space-y-8" style={{ backgroundColor: '#000000', minHeight: '100%' }}>
      <div>
        <h1 className="text-2xl font-bold text-gold">Cart Management</h1>
        <p className="text-beige mt-1">Manage shipping prices by governorate and discount coupons.</p>
      </div>

      {/* Shipping */}
      <section className="bg-dark-light rounded-xl shadow-sm border border-woody p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gold">Shipping Prices by Governorate</h2>
            <p className="text-sm text-beige">Prices are stored in MongoDB and fetched dynamically at checkout.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveAllShipping}
              disabled={shippingBulkSaving || shippingLoading || !hasChanges}
              className="px-4 py-2 border border-gold bg-gold text-dark-base rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {shippingBulkSaving ? 'Saving…' : 'Save All'}
            </button>
            <button
              onClick={loadShipping}
              disabled={shippingBulkSaving || shippingLoading}
              className="px-4 py-2 border border-woody bg-dark-base text-beige rounded-lg text-sm hover:text-gold disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {shippingError && (
          <div className="px-4 py-3 rounded-lg bg-woody/30 text-woody-light border border-woody text-sm">{shippingError}</div>
        )}
        {shippingSuccess && (
          <div className="px-4 py-3 rounded-lg bg-gold/20 text-gold border border-gold/30 text-sm">{shippingSuccess}</div>
        )}

        {shippingLoading ? (
          <div className="text-beige text-sm">Loading shipping…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-woody-light border-b border-woody">
                  <th className="py-3 pr-4">Governorate</th>
                  <th className="py-3 pr-4">Shipping Price (EGP)</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-woody/40">
                {shippingSorted.map((g) => (
                  <ShippingRow
                    key={`${g._id}-${g.updatedAt || ''}`}
                    row={g}
                    saving={shippingSavingId === g._id}
                    onChangePrice={updateDraftPrice}
                    onSave={updateShippingPrice}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Coupons */}
      <section className="bg-dark-light rounded-xl shadow-sm border border-woody p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gold">Discount / Coupon Codes</h2>
            <p className="text-sm text-beige">Coupons are validated against MongoDB during checkout and order creation.</p>
          </div>
          <button
            onClick={loadCoupons}
            className="px-4 py-2 border border-woody bg-dark-base text-beige rounded-lg text-sm hover:text-gold"
          >
            Refresh
          </button>
        </div>

        {couponError && (
          <div className="px-4 py-3 rounded-lg bg-woody/30 text-woody-light border border-woody text-sm">{couponError}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
          <div className="border border-woody rounded-xl p-4 bg-dark-base space-y-3">
            <h3 className="text-gold font-semibold">Add Coupon</h3>
            <div>
              <label className="block text-xs font-semibold text-beige mb-1">Code</label>
              <input
                value={newCoupon.code}
                onChange={(e) => setNewCoupon((p) => ({ ...p, code: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-woody bg-black text-gold placeholder-woody"
                placeholder="e.g., SAVE10"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-beige mb-1">Type</label>
                <select
                  value={newCoupon.type}
                  onChange={(e) => setNewCoupon((p) => ({ ...p, type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-woody bg-black text-gold"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-beige mb-1">Value</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newCoupon.value}
                  onChange={(e) => setNewCoupon((p) => ({ ...p, value: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-woody bg-black text-gold"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-beige">
              <input
                type="checkbox"
                checked={!!newCoupon.isActive}
                onChange={(e) => setNewCoupon((p) => ({ ...p, isActive: e.target.checked }))}
                className="accent-gold"
              />
              Active
            </label>
            <button
              onClick={createCoupon}
              disabled={couponSaving}
              className="w-full px-4 py-2 rounded-lg bg-gold text-dark-base font-semibold border border-gold disabled:opacity-50"
            >
              {couponSaving ? 'Saving…' : 'Create Coupon'}
            </button>
          </div>

          <div className="border border-woody rounded-xl p-4 bg-dark-base">
            {couponLoading ? (
              <div className="text-beige text-sm">Loading coupons…</div>
            ) : coupons.length === 0 ? (
              <div className="text-beige text-sm">No coupons yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-woody-light border-b border-woody">
                      <th className="py-3 pr-4">Code</th>
                      <th className="py-3 pr-4">Type</th>
                      <th className="py-3 pr-4">Value</th>
                      <th className="py-3 pr-4">Active</th>
                      <th className="py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-woody/40">
                    {coupons.map((c) => (
                      <CouponRow key={`${c._id}-${c.updatedAt || ''}`} row={c} onUpdate={updateCoupon} onDelete={deleteCoupon} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

const ShippingRow = ({ row, saving, onChangePrice, onSave }) => {
  return (
    <tr className="text-beige">
      <td className="py-3 pr-4 whitespace-nowrap">{getGovernorateLabel(row)}</td>
      <td className="py-3 pr-4">
        <input
          type="number"
          min="0"
          step="0.01"
          value={row.shippingPrice ?? 0}
          onChange={(e) => onChangePrice(row._id, e.target.value)}
          className="w-40 px-3 py-2 rounded-lg border border-woody bg-black text-gold"
        />
      </td>
      <td className="py-3">
        <button
          onClick={() => onSave(row._id, Number(row.shippingPrice || 0))}
          disabled={saving}
          className="px-4 py-2 rounded-lg border border-gold bg-gold text-dark-base font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </td>
    </tr>
  );
};

const CouponRow = ({ row, onUpdate, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ code: row.code, type: row.type, value: row.value, isActive: row.isActive });

  const save = async () => {
    await onUpdate(row._id, { ...draft, value: Number(draft.value) });
    setEditing(false);
  };

  return (
    <tr className="text-beige">
      <td className="py-3 pr-4 whitespace-nowrap">
        {editing ? (
          <input
            value={draft.code}
            onChange={(e) => setDraft((p) => ({ ...p, code: e.target.value }))}
            className="w-40 px-3 py-2 rounded-lg border border-woody bg-black text-gold"
          />
        ) : (
          <span className="font-semibold text-gold">{row.code}</span>
        )}
      </td>
      <td className="py-3 pr-4">
        {editing ? (
          <select
            value={draft.type}
            onChange={(e) => setDraft((p) => ({ ...p, type: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-woody bg-black text-gold"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed</option>
          </select>
        ) : (
          row.type
        )}
      </td>
      <td className="py-3 pr-4">
        {editing ? (
          <input
            type="number"
            min="0"
            step="0.01"
            value={draft.value}
            onChange={(e) => setDraft((p) => ({ ...p, value: e.target.value }))}
            className="w-28 px-3 py-2 rounded-lg border border-woody bg-black text-gold"
          />
        ) : (
          Number(row.value).toFixed(2)
        )}
      </td>
      <td className="py-3 pr-4">
        <button
          onClick={() => onUpdate(row._id, { isActive: !row.isActive })}
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
            row.isActive ? 'border-gold bg-gold text-dark-base' : 'border-woody bg-black text-beige'
          }`}
        >
          {row.isActive ? 'Enabled' : 'Disabled'}
        </button>
      </td>
      <td className="py-3 space-x-2">
        {editing ? (
          <>
            <button onClick={save} className="px-3 py-1.5 rounded-lg bg-gold text-dark-base font-semibold border border-gold">
              Save
            </button>
            <button
              onClick={() => {
                setDraft({ code: row.code, type: row.type, value: row.value, isActive: row.isActive });
                setEditing(false);
              }}
              className="px-3 py-1.5 rounded-lg border border-woody bg-black text-beige"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} className="px-3 py-1.5 rounded-lg border border-woody bg-black text-beige">
              Edit
            </button>
            <button
              onClick={() => onDelete(row._id)}
              className="px-3 py-1.5 rounded-lg border border-woody bg-black text-beige hover:text-gold"
            >
              Delete
            </button>
          </>
        )}
      </td>
    </tr>
  );
};

export default CartManagement;

