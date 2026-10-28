import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ChevronDown, ChevronLeft, ChevronRight, BarChart3, Layers,
  Users, Database, ShoppingBag, Warehouse, ShoppingCart, Landmark,
  UserRound, ShieldCheck, Package, Tags, Ruler, Handshake, Truck,
  ClipboardList, PackageCheck, ArrowLeftRight, SlidersHorizontal,
  BookOpen, FileText, CreditCard, Receipt, Wallet, ScrollText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resources, menu, permFor } from '../config/resources';
import Avatar from './Avatar';
import Topbar from './Topbar';

const GROUP_ICONS = {
  'Pengguna': Users,
  'Master Data': Database,
  'Pengadaan': ShoppingBag,
  'Inventori': Warehouse,
  'Penjualan': ShoppingCart,
  'Keuangan': Landmark,
};

const ITEM_ICONS = {
  users: UserRound,
  roles: ShieldCheck,
  products: Package,
  'product-categories': Tags,
  units: Ruler,
  customers: Handshake,
  suppliers: Truck,
  'purchase-orders': ClipboardList,
  'goods-receipts': PackageCheck,
  inventory: Warehouse,
  'stock-movements': ArrowLeftRight,
  'stock-adjustments': SlidersHorizontal,
  'sales-orders': ShoppingCart,
  accounts: BookOpen,
  'journal-entries': FileText,
  payments: CreditCard,
  'accounts-payable': Receipt,
  'accounts-receivable': Wallet,
};

const SIDEBAR_KEY = 'erp_sidebar_collapsed';
const GROUPS_KEY = 'erp_sidebar_groups';

export default function Layout() {
  const { user, can } = useAuth();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === '1');
  const [openGroups, setOpenGroups] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(GROUPS_KEY)) || {};
    } catch {
      return {};
    }
  });

  // Grup yang memuat halaman aktif
  const activeGroup = menu.find(g => g.items.some(k => pathname.startsWith(`/r/${k}`)))?.group;

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(openGroups));
  }, [openGroups]);

  // Saat berpindah ke halaman di grup yang tertutup (misalnya lewat Ctrl+K), buka grup tersebut
  useEffect(() => {
    if (activeGroup) {
      setOpenGroups(o => (o[activeGroup] ? o : { ...o, [activeGroup]: true }));
    }
  }, [activeGroup]);

  // Grup yang belum pernah diatur: tertutup, kecuali grup halaman aktif
  const isOpen = group => openGroups[group] ?? group === activeGroup;
  const toggleGroup = group => setOpenGroups(o => ({ ...o, [group]: !isOpen(group) }));

  // Sembunyikan modul yang tidak punya izin read, lalu grup yang jadi kosong
  const visibleMenu = menu
    .map(g => ({ ...g, items: g.items.filter(k => can(permFor(k, 'read'))) }))
    .filter(g => g.items.length > 0);
  const canReports = can('reports:read');

  return (
    <div className={`layout${collapsed ? ' collapsed' : ''}`}>
      <aside>
        <div className="brand">
          <div className="brand-mark"><Layers size={18} /></div>
          <div className="brand-text">
            <b>Small ERP</b>
            <small>Manajemen bisnis</small>
          </div>
          <button
            className="icon-btn"
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="side-nav">
          <NavLink to="/" end className="nav-item" title="Dashboard">
            <LayoutDashboard size={18} />
            {!collapsed && <span>Dashboard</span>}
          </NavLink>

          {visibleMenu.map(g => {
            const GroupIcon = GROUP_ICONS[g.group] || Database;
            const open = isOpen(g.group);
            const show = open || collapsed;
            return (
              <div className="nav-group" key={g.group}>
                <button className="group-head" onClick={() => toggleGroup(g.group)} title={g.group}>
                  <GroupIcon size={18} />
                  {!collapsed && (
                    <>
                      <span>{g.group}</span>
                      <ChevronDown size={16} className={`chev${open ? ' open' : ''}`} />
                    </>
                  )}
                </button>

                <div className={`collapse${show ? ' show' : ''}`}>
                  <div className="collapse-inner">
                    <div className="nav-items">
                      {g.items.map((k, i) => {
                        const Icon = ITEM_ICONS[k] || Package;
                        return (
                          <NavLink
                            key={k}
                            to={`/r/${k}`}
                            className="nav-item"
                            title={resources[k].title}
                            style={{ '--d': `${i * 40}ms` }}
                          >
                            <Icon size={16} />
                            {!collapsed && <span>{resources[k].title}</span>}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {canReports && (
            <div className="nav-group">
              <NavLink to="/reports" className="nav-item" title="Laporan">
                <BarChart3 size={18} />
                {!collapsed && <span>Laporan</span>}
              </NavLink>
            </div>
          )}
          {can('audit:read') && (
            <div className="nav-group">
              <NavLink to="/audit" className="nav-item" title="Audit log">
                <ScrollText size={18} />
                {!collapsed && <span>Audit log</span>}
              </NavLink>
            </div>
          )}
        </nav>

        <NavLink to="/profile" className="side-user" title="Profil saya">
          <Avatar name={user?.username} size={34} />
          <div>
            <b>{user?.username}</b>
            <small>{user?.role}</small>
          </div>
        </NavLink>
      </aside>

      <div className="content">
        <Topbar />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}