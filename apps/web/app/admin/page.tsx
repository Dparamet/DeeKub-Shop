"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Boxes,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Download,
  Gamepad2,
  LayoutDashboard,
  LifeBuoy,
  PackageCheck,
  Search,
  Settings2,
  ShoppingBag,
  Users,
  X,
  Zap,
} from "lucide-react";
import { formatPrice } from "@/data/catalog";
import { AdminCatalog } from "@/components/admin-catalog";

const demoOrders = [
  { id: "DK-DEMO-1042", customer: "Player_47", item: "VALORANT · 475 VP", kind: "เติมเกม", status: "กำลังตรวจสอบ", tone: "review", time: "10:42", amount: 159, payment: "รอตรวจสอบการชำระเงิน", note: "รอตรวจสอบยอดชำระก่อนส่งคำขอเติมเกม" },
  { id: "DK-DEMO-1041", customer: "MintK", item: "Hades II", kind: "Game Key", status: "สำเร็จ", tone: "success", time: "10:18", amount: 689, payment: "ชำระแล้ว (จำลอง)", note: "จำลองการส่งมอบ Game Key สำเร็จ ไม่มีรหัสเกมจริง" },
  { id: "DK-DEMO-1040", customer: "Naru_21", item: "ROV · 240 Vouchers", kind: "เติมเกม", status: "ต้องตรวจสอบ", tone: "warning", time: "09:56", amount: 109, payment: "ชำระแล้ว (จำลอง)", note: "Mock provider ไม่ตอบกลับ ต้องตรวจสอบผลก่อนลองส่งใหม่" },
  { id: "DK-DEMO-1039", customer: "Krit S.", item: "Stardew Valley", kind: "Game Key", status: "สำเร็จ", tone: "success", time: "09:32", amount: 179, payment: "ชำระแล้ว (จำลอง)", note: "จำลองการส่งมอบ Game Key สำเร็จ ไม่มีรหัสเกมจริง" },
];

const completedOrders = demoOrders.filter((order) => order.tone === "success");
const reviewCount = demoOrders.length - completedOrders.length;

const metrics = [
  { label: "ยอดส่งมอบสำเร็จ", value: formatPrice(completedOrders.reduce((sum, order) => sum + order.amount, 0)), foot: "รวมจากออเดอร์ตัวอย่างที่สำเร็จ", icon: CircleDollarSign, color: "violet" },
  { label: "คำสั่งซื้อ", value: String(demoOrders.length), foot: "รายการในข้อมูลตัวอย่างชุดนี้", icon: ClipboardList, color: "cyan" },
  { label: "ส่งมอบสำเร็จ", value: String(completedOrders.length), foot: "Top-up + Game Key", icon: PackageCheck, color: "blue" },
  { label: "ต้องตรวจสอบ", value: String(reviewCount), foot: "รายการที่ต้องมีคนดูแล", icon: AlertTriangle, color: "amber" },
];

const actionItems = [
  { title: "Top-up ต้องตรวจสอบ", detail: "มี 2 รายการรอตรวจสอบการชำระเงินหรือผลเติมเกม", count: "02", icon: Zap, target: "#recent-orders", tone: "amber" },
  { title: "Game Key ใกล้ขั้นต่ำ", detail: "สินค้า demo 4 รายการมี stock ต่ำ", count: "04", icon: Boxes, target: "#inventory", tone: "violet" },
  { title: "Payment review", detail: "มี 1 รายการรอการตรวจสอบ", count: "01", icon: CircleDollarSign, target: "#recent-orders", tone: "blue" },
];

const disabledNavigation = [
  { label: "ผู้ใช้งาน", icon: Users },
  { label: "รายงาน", icon: ArrowDownRight },
  { label: "ผู้ให้บริการ", icon: Settings2 },
];

const navigation = [
  { id: "overview", label: "ภาพรวม", icon: LayoutDashboard },
  { id: "products", label: "สินค้าและแพ็กเกจ", icon: ShoppingBag },
  { id: "recent-orders", label: "คำสั่งซื้อ", icon: ClipboardList },
  { id: "inventory", label: "คลัง Game Key", icon: Boxes },
];

export default function AdminPage() {
  const [announcement, setAnnouncement] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedOrder, setSelectedOrder] = useState<typeof demoOrders[number] | null>(null);
  const orderDialog = useRef<HTMLDialogElement>(null);

  const visibleOrders = demoOrders.filter((order) => {
    const matchesSearch = `${order.id} ${order.customer} ${order.item}`.toLocaleLowerCase("th-TH").includes(orderSearch.trim().toLocaleLowerCase("th-TH"));
    const matchesStatus = statusFilter === "all" || (statusFilter === "success" ? order.tone === "success" : order.tone !== "success");
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    function syncSection() {
      const section = window.location.hash.slice(1);
      setActiveSection(navigation.some((item) => item.id === section) ? section : "overview");
    }
    syncSection();
    window.addEventListener("hashchange", syncSection);
    return () => window.removeEventListener("hashchange", syncSection);
  }, []);

  useEffect(() => {
    if (selectedOrder && orderDialog.current && !orderDialog.current.open) orderDialog.current.showModal();
  }, [selectedOrder]);

  useEffect(() => {
    if (!announcement) return;
    const timeout = window.setTimeout(() => setAnnouncement(""), 4200);
    return () => window.clearTimeout(timeout);
  }, [announcement]);

  const csvRows = [
    ["demo_order_id", "customer", "product", "type", "amount_thb", "status", "time"],
    ...visibleOrders.map((order) => [order.id, order.customer, order.item, order.kind, String(order.amount), order.status, order.time]),
  ];
  const csv = csvRows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(`\uFEFF${csv}`)}`;

  return (
    <main className="admin-shell">
      <a className="skip-link" href="#admin-content">ข้ามไปยังเนื้อหาหลัก</a>
      <aside className="admin-sidebar" aria-label="เมนูระบบจัดการ">
        <Link className="brand admin-brand" href="/" aria-label="deeKub CMS กลับหน้าร้าน">
          <span className="brand-symbol"><Gamepad2 size={18} aria-hidden="true" /></span><span>dee<span className="brand-accent">Kub</span><small>CONTROL ROOM</small></span>
        </Link>
        <nav className="admin-nav-section" aria-label="ส่วนต่าง ๆ ของระบบจัดการ">
          <span className="admin-nav-label">WORKSPACE</span>
          {navigation.map(({ id, label, icon: Icon }) => <a className={`admin-nav-item${activeSection === id ? " active" : ""}`} href={`#${id}`} aria-label={label} aria-current={activeSection === id ? "location" : undefined} key={id}><Icon size={17} aria-hidden="true" />{label}{id === "recent-orders" && <span className="sidebar-count">{reviewCount}</span>}</a>)}
        </nav>
        <div className="admin-nav-section">
          <span className="admin-nav-label">กำลังพัฒนา</span>
          {disabledNavigation.map(({ label, icon: Icon }) => (
            <span className="admin-nav-item admin-nav-disabled" aria-disabled="true" key={label}><Icon size={17} />{label}<small>เร็ว ๆ นี้</small></span>
          ))}
        </div>
        <div className="admin-sidebar-bottom">
          <div className="sidebar-support"><span><LifeBuoy size={17} /></span><div><strong>ต้องการความช่วยเหลือ?</strong><small>ส่วนนี้เป็นข้อมูลทดสอบ</small></div></div>
          <button className="admin-profile" onClick={() => setAnnouncement("การยืนยัน ADMIN จะเชื่อม Supabase Auth ในขั้นตอนถัดไป") }>
            <span className="profile-avatar">DK</span><span><strong>Admin Demo</strong><small>สิทธิ์ตัวอย่าง</small></span><ChevronDown size={15} />
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb"><span>Control Room</span><span>/</span><strong>{navigation.find((item) => item.id === activeSection)?.label}</strong></div>
          <div className="admin-top-actions">
            <span className="environment-pill"><span /> DEMO ENVIRONMENT</span>
            <button className="icon-button admin-search" aria-label="ค้นหารายการ" onClick={() => document.getElementById("order-search")?.focus()}><Search size={18} /></button>
            <a className="icon-button admin-notice" href="#recent-orders" aria-label={`คำสั่งซื้อที่ต้องตรวจสอบ ${reviewCount} รายการ`} onClick={() => setStatusFilter("review")}><Bell size={18} /><i>{reviewCount}</i></a>
            <Link href="/" className="back-to-store">ไปหน้าร้าน <ArrowUpRight size={15} /></Link>
          </div>
        </header>

        <div className="admin-content" id="admin-content">
          <section className="admin-welcome" id="overview">
            <div>
              <div className="section-kicker">DEEKUB ADMIN</div>
              <h1>ภาพรวมร้านค้า</h1>
              <p>ตรวจสินค้า เติมเกม และติดตามการส่งมอบ Game Key ในที่เดียว</p>
            </div>
            <div className="admin-welcome-actions"><a className="admin-outline-button" href={visibleOrders.length > 0 ? csvHref : undefined} download="deekub-demo-orders.csv" aria-disabled={visibleOrders.length === 0} onClick={() => { if (visibleOrders.length > 0) setAnnouncement(`CSV มี ${visibleOrders.length} ออเดอร์ตัวอย่างตามตัวกรองปัจจุบัน`); }}>Export CSV (demo) <Download size={15} /></a><a className="admin-primary-button" href="#products">ดูสินค้า <ArrowRight size={15} /></a></div>
          </section>

          <div className="demo-data-banner"><span className="demo-banner-icon"><AlertTriangle size={15} /></span><span><strong>Admin preview</strong> — ออเดอร์และคลัง Key เป็น demo หน้านี้ยังไม่มี login หรือการแก้ไขข้อมูลจริง</span></div>

          <section className="metric-grid" aria-label="ตัวชี้วัดตัวอย่าง">
            {metrics.map(({ label, value, foot, icon: Icon, color }) => (
              <article className="metric-card" key={label}>
                <div className={`metric-icon metric-${color}`}><Icon size={18} aria-hidden="true" /></div>
                <span className="metric-label">{label}</span>
                <strong className="metric-value">{value}</strong>
                <span className="metric-foot">{foot}</span>
              </article>
            ))}
          </section>

          <div className="admin-panel-grid">
            <section className="admin-panel action-panel" aria-labelledby="action-title">
              <div className="panel-heading">
                <div><span className="panel-kicker">NEEDS ATTENTION</span><h2 id="action-title">สิ่งที่ต้องตรวจสอบ</h2></div>
                <span className="action-total"><span /> {reviewCount} ออเดอร์</span>
              </div>
              <div className="action-list">
                {actionItems.map(({ title, detail, count, icon: Icon, target, tone }) => (
                  <a className="action-item" href={target} key={title}>
                    <span className={`action-icon action-${tone}`}><Icon size={16} aria-hidden="true" /></span>
                    <span className="action-text"><strong>{title}</strong><small>{detail}</small></span>
                    <span className="action-count">{count}</span><ArrowRight className="action-arrow" size={15} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </section>

            <section className="admin-panel inventory-panel" id="inventory" aria-labelledby="inventory-title">
              <div className="panel-heading">
                <div><span className="panel-kicker">DEMO INVENTORY</span><h2 id="inventory-title">Game Key ในคลัง</h2></div>
              </div>
              <div className="inventory-summary"><strong>100</strong><span>Keys รวมในข้อมูลทดสอบ</span><span className="inventory-health"><Check size={13} /> stock จำลอง</span></div>
              <div className="inventory-stats">
                <div><span className="inventory-dot available" /><span>Available</span><strong>73</strong></div>
                <div><span className="inventory-dot reserved" /><span>Reserved</span><strong>02</strong></div>
                <div><span className="inventory-dot sold" /><span>Sold</span><strong>25</strong></div>
              </div>
              <div className="inventory-progress" role="img" aria-label="ตัวอย่างคลัง: available 73%, reserved 2%, sold 25%"><span /><span /><span /></div>
              <p className="admin-catalog-note">ยังไม่มี Key จริง การนำเข้าและเปิดดูรหัสจะเชื่อม Admin API พร้อมสิทธิ์และ audit log</p>
            </section>
          </div>

          <section className="admin-panel orders-panel" id="recent-orders" aria-labelledby="orders-title">
            <div className="panel-heading orders-heading">
              <div><span className="panel-kicker">LATEST ACTIVITY · DEMO</span><h2 id="orders-title">คำสั่งซื้อล่าสุด</h2></div>
              <div className="orders-tools">
                <label className="order-search-field"><Search size={15} /><span className="sr-only">ค้นหาออเดอร์</span><input id="order-search" value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} placeholder="ค้นหาออเดอร์" /></label>
                <label className="filter-select"><span className="sr-only">กรองสถานะ</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">ทุกสถานะ</option><option value="success">สำเร็จ</option><option value="review">ต้องตรวจสอบ</option></select><ChevronDown size={14} aria-hidden="true" /></label>
              </div>
            </div>
            <div className="table-scroll">
              <table className="orders-table">
                <thead><tr><th>คำสั่งซื้อ</th><th>สินค้า</th><th>ประเภท</th><th>เวลา</th><th>สถานะ</th><th><span className="sr-only">การกระทำ</span></th></tr></thead>
                <tbody>
                  {visibleOrders.map((order) => (
                    <tr key={order.id}>
                      <td><strong className="order-id">{order.id}</strong><small>{order.customer}</small></td>
                      <td className="order-product">{order.item}</td>
                      <td><span className="order-type">{order.kind}</span></td>
                      <td className="order-time"><Clock3 size={13} /> วันนี้ {order.time}</td>
                      <td><span className={`order-status status-${order.tone}`}><i />{order.status}</span></td>
                      <td><button className="row-action" aria-label={`ดูรายการ ${order.id}`} onClick={() => setSelectedOrder(order)}>ดูรายการ</button></td>
                    </tr>
                  ))}
                  {visibleOrders.length === 0 && <tr><td colSpan={6}><span className="orders-empty">ไม่พบคำสั่งซื้อในข้อมูลตัวอย่างชุดนี้</span></td></tr>}
                </tbody>
              </table>
            </div>
            <div className="orders-footer"><span>แสดง {visibleOrders.length} จาก {demoOrders.length} รายการตัวอย่าง</span><button className="inventory-link" onClick={() => { setOrderSearch(""); setStatusFilter("all"); }}>ล้างตัวกรอง</button></div>
          </section>

          <AdminCatalog />

          <footer className="admin-footer"><span>deeKub Admin · Preview</span><span>Catalog จาก Go API เมื่อพร้อม · ออเดอร์และ inventory เป็น demo</span></footer>
        </div>
      </div>
      <dialog className="admin-order-dialog" ref={orderDialog} aria-labelledby="admin-order-title" onClose={() => setSelectedOrder(null)}>
        {selectedOrder && <div className="admin-order-detail">
          <button className="icon-button dialog-close" aria-label="ปิดรายละเอียดออเดอร์" onClick={() => orderDialog.current?.close()} autoFocus><X size={18} /></button>
          <span className="panel-kicker">DEMO ORDER</span>
          <h2 id="admin-order-title">{selectedOrder.id}</h2>
          <span className={`order-status status-${selectedOrder.tone}`}><i />{selectedOrder.status}</span>
          <dl><div><dt>ลูกค้า</dt><dd>{selectedOrder.customer}</dd></div><div><dt>สินค้า</dt><dd>{selectedOrder.item}</dd></div><div><dt>ประเภท</dt><dd>{selectedOrder.kind}</dd></div><div><dt>ยอดชำระ</dt><dd>{formatPrice(selectedOrder.amount)}</dd></div><div><dt>เวลา (ตัวอย่าง)</dt><dd>{selectedOrder.time}</dd></div><div><dt>การชำระเงิน</dt><dd>{selectedOrder.payment}</dd></div></dl>
          <p className="admin-order-note">{selectedOrder.note}</p>
          <p className="admin-catalog-note">ออเดอร์จำลองสำหรับทดสอบหน้าจอ ยังไม่มีการชำระเงินหรือส่งมอบจริง</p>
        </div>}
      </dialog>
      <div className="toast-region" role="status" aria-live="polite">{announcement}</div>
    </main>
  );
}
