import React, { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  SlidersHorizontal,
  History,
  AlertTriangle,
  CheckCircle,
  X,
  TrendingDown,
} from 'lucide-react';
import { api } from '../api/client';
import { Product } from '../types/api';
import { useLanguage } from '../i18n/LanguageContext';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';

export const ProductsPage: React.FC = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Staples',
    description: '',
    cost_price: 10,
    selling_price: 15,
    current_stock: 50,
    reorder_threshold: 10,
    supplier: '',
  });

  const [adjustData, setAdjustData] = useState({
    quantity_change: 10,
    reason: 'Distributor shipment received',
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProduct(formData);
      setIsAddModalOpen(false);
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to create product');
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await api.updateProduct(editingProduct.id, {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        cost_price: formData.cost_price,
        selling_price: formData.selling_price,
        reorder_threshold: formData.reorder_threshold,
        supplier: formData.supplier,
      });
      setEditingProduct(null);
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to update product');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    try {
      await api.adjustStock(
        adjustingProduct.id,
        adjustData.quantity_change,
        adjustData.reason
      );
      setAdjustingProduct(null);
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock');
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProductId) return;
    try {
      await api.deleteProduct(deletingProductId);
      setDeletingProductId(null);
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku,
      name: p.name,
      category: p.category,
      description: p.description || '',
      cost_price: Number(p.cost_price),
      selling_price: Number(p.selling_price),
      current_stock: p.current_stock,
      reorder_threshold: p.reorder_threshold,
      supplier: p.supplier || '',
    });
  };

  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];

  const filtered = products.filter((p) => {
    const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchStat = statusFilter === 'ALL' || p.stock_status === statusFilter;
    const matchSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchStat && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t.products.title}
          </h1>
          <p className="text-xs text-slate-500 mt-1">{t.products.subtitle}</p>
        </div>

        <button
          onClick={() => {
            setFormData({
              sku: `SKU-${Date.now().toString().slice(-5)}`,
              name: '',
              category: 'Staples',
              description: '',
              cost_price: 20,
              selling_price: 25,
              current_stock: 50,
              reorder_threshold: 10,
              supplier: '',
            });
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t.products.addProduct}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          {/* Stock status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">Status: All</option>
            <option value="CRITICAL">Critical (&lt; 3 Days)</option>
            <option value="LOW">Low Stock</option>
            <option value="HEALTHY">Healthy Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-3xs">
              <tr>
                <th className="py-3 px-4">{t.products.sku}</th>
                <th className="py-3 px-4">{t.products.name}</th>
                <th className="py-3 px-4">{t.products.category}</th>
                <th className="py-3 px-4">{t.products.costPrice}</th>
                <th className="py-3 px-4">{t.products.sellingPrice}</th>
                <th className="py-3 px-4">{t.products.currentStock}</th>
                <th className="py-3 px-4">{t.products.daysCover}</th>
                <th className="py-3 px-4">{t.products.status}</th>
                <th className="py-3 px-4 text-right">{t.products.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading inventory catalogue...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No products matched your search or filters.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500">{p.sku}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 text-slate-600">{p.category}</td>
                    <td className="py-3 px-4 text-slate-500">₹{p.cost_price}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{p.selling_price}</td>
                    <td className="py-3 px-4 font-bold">
                      <span
                        className={
                          p.current_stock <= p.reorder_threshold
                            ? 'text-rose-600'
                            : 'text-slate-800'
                        }
                      >
                        {p.current_stock}
                      </span>
                      <span className="text-3xs text-slate-400 block font-normal">
                        reorder at {p.reorder_threshold}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {p.days_of_stock ? (
                        <span className="font-semibold text-slate-700">
                          ~{p.days_of_stock} days
                        </span>
                      ) : (
                        <span className="text-slate-400 text-3xs">No recent 30d sales</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-3xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          p.stock_status === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : p.stock_status === 'LOW'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {p.stock_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setAdjustingProduct(p);
                            setAdjustData({
                              quantity_change: 10,
                              reason: 'Restock from distributor',
                            });
                          }}
                          className="p-1 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded"
                          title="Adjust Stock"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded"
                          title="Edit Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingProductId(p.id)}
                          className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Edit Product Details' : 'Add New Product'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-semibold text-slate-700 block mb-1">SKU Code</label>
                <input
                  type="text"
                  required
                  disabled={!!editingProduct}
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {!editingProduct && (
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Initial Stock</label>
                    <input
                      type="number"
                      required
                      value={formData.current_stock}
                      onChange={(e) => setFormData({ ...formData, current_stock: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                )}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Reorder Threshold</label>
                  <input
                    type="number"
                    required
                    value={formData.reorder_threshold}
                    onChange={(e) => setFormData({ ...formData, reorder_threshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Adjust Inventory Stock</h3>
                <p className="text-2xs text-slate-500">
                  {adjustingProduct.name} (Current: {adjustingProduct.current_stock})
                </p>
              </div>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Quantity Change (+ for addition, − for damage/loss)
                </label>
                <input
                  type="number"
                  required
                  value={adjustData.quantity_change}
                  onChange={(e) => setAdjustData({ ...adjustData, quantity_change: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                />
                <span className="text-3xs text-slate-400 mt-1 block">
                  New Stock will be: {adjustingProduct.current_stock + adjustData.quantity_change}
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reason for Adjustment</label>
                <input
                  type="text"
                  required
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  placeholder="e.g. Stock shipment received, physical audit correction"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingProductId}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete"
        isDestructive={true}
        onConfirm={handleDeleteProduct}
        onCancel={() => setDeletingProductId(null)}
      />
    </div>
  );
};
