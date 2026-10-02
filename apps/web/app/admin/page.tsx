"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  Gamepad2,
  LayoutDashboard,
  LifeBuoy,
  PackageCheck,
  Search,
  Settings2,
  ShoppingBag,
  Users,
  Zap,
} from "lucide-react";
import { formatPrice } from "@/data/catalog";

const demoOrders = [
  { id: "DK-DEMO-1042", customer: "Player_47", item: "VALORANT · 475 VP", kind: "เติมเกม", status: "กำลังตรวจสอบ", tone: "review", time: "10:42" },
  { id: "DK-DEMO-1041", customer: "MintK", item: "Hades II", kind: "Game Key", status: "สำเร็จ", tone: "success", time: "10:18" },
  { id: "DK-DEMO-1040", customer: "Naru_21", item: "ROV · 240 Vouchers", kind: "เติมเกม", status: "ต้องตรวจสอบ", tone: "warning", time: "09:56" },
  { id: "DK-DEMO-1039", customer: "Krit S.", item: "Stardew Valley", kind: "Game Key", status: "สำเร็จ", tone: "success", time: "09:32" },
];

const metrics = [
  { label: "ยอดขายตัวอย่าง", value: formatPrice(24_860), foot: "ตัวเลขจำลองสำหรับหน้าจอ", icon: CircleDollarSign, color: "violet" },
  { label: "คำสั่งซื้อ", value: "248", foot: "รายการตัวอย่างในเดือนนี้", icon: ClipboardList, color: "cyan" },
  { label: "ส่งมอบสำเร็จ", value: "238", foot: "Top-up + Game Key", icon: PackageCheck, color: "blue" },
  { label: "ต้องตรวจสอบ", value: "3", foot: "รายการที่ต้องมีคนดูแล", icon: AlertTriangle, color: "amber" },
];

const actionItems = [
  { title: "Top-up ต้องตรวจสอบ", detail: "มี 2 รายการรอผลจาก mock provider", count: "02", icon: Zap, target: "#recent-orders", tone: "amber" },
  { title: "Game Key ใกล้ขั้นต่ำ", detail: "สินค้า demo 4 รายการมี stock ต่ำ", count: "04", icon: Boxes, target: "#inventory", tone: "violet" },
  { title: "Payment review", detail: "มี 1 รายการรอการตรวจสอบ", count: "01", icon: CircleDollarSign, target: "#recent-orders", tone: "blue" },
];

const disabledNavigation = [
  { label: "สินค้าและแพ็กเกจ", icon: ShoppingBag },
  { label: "ผู้ใช้งาน", icon: Users },
  { label: "รายงาน", icon: ArrowDownRight },
  { label: "ผู้ให้บริการ", icon: Settings2 },
];

export default function AdminPage() {
  const [announcement, setAnnouncement] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const visibleOrders = demoOrders.filter((order) => {
    const matchesSearch = `${order.id} ${order.customer} ${order.item}`.toLocaleLowerCase("th-TH").includes(orderSearch.trim().toLocaleLowerCase("th-TH"));
    const matchesStatus = statusFilter === "all" || (statusFilter === "success" ? order.tone === "success" : order.tone !== "success");
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    if (!announcement) return;
    const timeout = window.setTimeout(() => setAnnouncement(""), 4200);
    return () => window.clearTimeout(timeout);
  }, [announcement]);

  return (
    <main className="admin-shell">
      <a className="skip-link" href="#admin-content">ข้ามไปยังเนื้อหาหลัก</a>
      <aside className="admin-sidebar" aria-label="เมนูระบบจัดการ">
        <Link className="brand admin-brand" href="/" aria-label="deeKub CMS กลับหน้าร้าน">
          <span className="brand-symbol"><Gamepad2 size={18} aria-hidden="true" /></span><span>dee<span className="brand-accent">Kub</span><small>CONTROL ROOM</small></span>
        </Link>
        <div className="admin-nav-section">
          <span className="admin-nav-label">WORKSPACE</span>
          <a className="admin-nav-item active" href="#overview" aria-current="page"><LayoutDashboard size={17} />ภาพรวม</a>
          <a className="admin-nav-item" href="#recent-orders"><ClipboardList size={17} />คำสั่งซื้อ<span className="sidebar-count">3</span></a>
          <a className="admin-nav-item" href="#inventory"><Boxes size={17} />คลัง Game Key</a>
        </div>
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
          <div className="admin-breadcrumb"><span>Control Room</span><span>/</span><strong>ภาพรวม</strong></div>
          <div className="admin-top-actions">
            <span className="environment-pill"><span /> DEMO ENVIRONMENT</span>
            <button className="icon-button admin-search" aria-label="ค้นหารายการ" onClick={() => document.getElementById("order-search")?.focus()}><Search size={18} /></button>
            <button className="icon-button admin-notice" aria-label="การแจ้งเตือน มี 3 รายการ" onClick={() => setAnnouncement("มี 3 รายการตัวอย่างที่ต้องตรวจสอบ") }><Bell size={18} /><i>3</i></button>
            <Link href="/" className="back-to-store">ไปหน้าร้าน <ArrowUpRight size={15} /></Link>
          </div>
        </header>

        <div className="admin-content" id="admin-content">
          <section className="admin-welcome" id="overview">
            <div>
              <div className="section-kicker">DEE KUB CMS · DEMO SNAPSHOT</div>
              <h1>ภาพรวมร้านค้า</h1>
              <p>รายการด้านล่างเป็นข้อมูลจำลองสำหรับออกแบบและทดสอบหน้าจอ</p>
            </div>
            <div className="admin-welcome-actions"><button className="admin-outline-button" onClick={() => setAnnouncement("Report export จะเพิ่มหลังมีข้อมูลจาก API")}>Export report <ArrowUpRight size={15} /></button><button className="admin-primary-button" onClick={() => setAnnouncement("เพิ่มสินค้าได้เมื่อ Catalog CMS พร้อมใช้งาน")}>จัดการสินค้า <ArrowRight size={15} /></button></div>
          </section>

          <div className="demo-data-banner"><span className="demo-banner-icon"><AlertTriangle size={15} /></span><span><strong>ข้อมูลตัวอย่าง</strong> — ยอดขาย ลูกค้า และคำสั่งซื้อในหน้านี้ไม่ได้มาจากธุรกรรมจริง</span></div>

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
                <span className="action-total"><span /> 3 รายการ</span>
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
                <button className="panel-icon-button" aria-label="เปิดหน้าคลัง Game Key" onClick={() => setAnnouncement("การจัดการ inventory จะเปิดใน slice ถัดไป") }><ArrowUpRight size={16} /></button>
              </div>
              <div className="inventory-summary"><strong>100</strong><span>Keys รวมในข้อมูลทดสอบ</span><span className="inventory-health"><Check size={13} /> stock จำลอง</span></div>
              <div className="inventory-stats">
                <div><span className="inventory-dot available" /><span>Available</span><strong>73</strong></div>
                <div><span className="inventory-dot reserved" /><span>Reserved</span><strong>02</strong></div>
                <div><span className="inventory-dot sold" /><span>Sold</span><strong>25</strong></div>
              </div>
              <div className="inventory-progress" role="img" aria-label="ตัวอย่างคลัง: available 73%, reserved 2%, sold 25%"><span /><span /><span /></div>
              <button className="inventory-link" onClick={() => setAnnouncement("ข้อมูลคลังเป็น demo — ยังไม่มี Key จริงในระบบ")}>ดูรายการ Key <ArrowRight size={14} /></button>
            </section>
          </div>

          <section className="admin-panel orders-panel" id="recent-orders" aria-labelledby="orders-title">
            <div className="panel-heading orders-heading">
              <div><span className="panel-kicker">LATEST ACTIVITY · DEMO</span><h2 id="orders-title">คำสั่งซื้อล่าสุด</h2></div>
              <div className="orders-tools">
                <label className="order-search-field"><Search size={15} /><span className="sr-only">ค้นหาออเดอร์</span><input id="order-search" value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} placeholder="ค้นหาออเดอร์" /></label>
                <label className="filter-select"><span className="sr-only">กรองสถานะ</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">ทุกสถานะ</option><option value="success">สำเร็จ</option><option value="review">ต้องตรวจสอบ</option></select><ChevronDown size={14} aria-hidden="true" /></label>
                <button className="panel-icon-button" aria-label="ตัวเลือกเพิ่มเติม" onClick={() => setAnnouncement("ตัวเลือกเพิ่มเติมจะเพิ่มในรุ่นถัดไป")}><ArrowUpRight size={16} /></button>
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
                      <td><button className="row-action" onClick={() => setAnnouncement(`${order.id} เป็นรายการจำลอง — หน้ารายละเอียดออเดอร์จะเพิ่มภายหลัง`)}>ดูรายการ</button></td>
                    </tr>
                  ))}
                  {visibleOrders.length === 0 && <tr><td colSpan={6}><span className="orders-empty">ไม่พบคำสั่งซื้อในข้อมูลตัวอย่างชุดนี้</span></td></tr>}
                </tbody>
              </table>
            </div>
            <div className="orders-footer"><span>แสดง {visibleOrders.length} จาก 248 รายการตัวอย่าง</span><a href="#recent-orders">ดูคำสั่งซื้อทั้งหมด <ArrowRight size={14} /></a></div>
          </section>

          <footer className="admin-footer"><span>deeKub Admin · Demo build</span><span>Go API foundation connected in a later slice</span></footer>
        </div>
      </div>
      <div className="toast-region" role="status" aria-live="polite">{announcement}</div>
    </main>
  );
}
