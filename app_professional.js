// app_professional.js - tailored for repo Saeed-ameen (relative paths used)
const STORAGE_KEY = 'pwa_saeed_ameen_v1';
const qs = s=>document.querySelector(s), qsa=s=>document.querySelectorAll(s);

let state = {products:[], customers:[], invoices:[], settings:{storeName:'محلي', currency:'₪'}};

function load(){ const raw = localStorage.getItem(STORAGE_KEY); if(raw) state = JSON.parse(raw); else save(); }
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function uid(prefix='id'){ return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function money(v){ return (v||0).toFixed(2) + ' ' + (state.settings.currency||'₪'); }
function download(filename, text, mime='text/plain'){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:mime})); a.download=filename; a.click(); }

// modal helpers
function showModal(title, html, onOk){ const modal = document.getElementById('modal'); if(!modal) return alert('المودال غير متوفر'); document.getElementById('modalTitle').textContent = title; document.getElementById('modalBody').innerHTML = html; modal.classList.remove('hidden'); document.getElementById('modalCancel').onclick = ()=>{ modal.classList.add('hidden'); }; document.getElementById('modalSave').onclick = ()=>{ onOk && onOk(); modal.classList.add('hidden'); }; }
function closeModal(){ const modal=document.getElementById('modal'); if(modal) modal.classList.add('hidden'); }

// Render dashboard
function renderDashboard(){ if(qs('#totalProducts')) qs('#totalProducts').textContent = state.products.length; if(qs('#totalCustomers')) qs('#totalCustomers').textContent = state.customers.length; if(qs('#totalInvoices')) qs('#totalInvoices').textContent = state.invoices.length; if(qs('#recentList')){ qs('#recentList').innerHTML=''; state.invoices.slice(0,10).forEach(inv=>{ const li=document.createElement('li'); li.textContent = `${inv.date.split('T')[0]} - فاتورة ${inv.number} - ${money(inv.total)}`; qs('#recentList').appendChild(li); }); } }

// PRODUCTS page
function productsPageInit(){
  const tbody = qs('#productsTable tbody'), search = qs('#searchProd');
  function render(list){ tbody.innerHTML=''; list.forEach(p=>{ const tr=document.createElement('tr'); tr.innerHTML = `<td>${p.name}</td><td>${money(p.cost)}</td><td>${money(p.price)}</td><td>${p.qty}</td><td><button onclick="editProduct('${p.id}')">تعديل</button> <button onclick="deleteProduct('${p.id}')">حذف</button></td>`; tbody.appendChild(tr); }); }
  window.editProduct = id=>{ const p = state.products.find(x=>x.id===id); if(!p) return alert('مش موجود'); showModal('تعديل منتج', `<label>الاسم</label><input id="m_name" value="${p.name}"><label>سعر التكلفة</label><input id="m_cost" type="number" value="${p.cost}"><label>سعر البيع</label><input id="m_price" type="number" value="${p.price}"><label>الكمية</label><input id="m_qty" type="number" value="${p.qty}">`, ()=>{ p.name=qs('#m_name').value; p.cost=parseFloat(qs('#m_cost').value||0); p.price=parseFloat(qs('#m_price').value||0); p.qty=parseInt(qs('#m_qty').value||0); save(); render(state.products); }); }
  window.deleteProduct = id=>{ if(!confirm('تأكيد حذف المنتج؟')) return; state.products = state.products.filter(x=>x.id!==id); save(); render(state.products); }

  qs('#addProduct').addEventListener('click', ()=>{ showModal('إضافة منتج', `<label>الاسم</label><input id="m_name"><label>سعر التكلفة</label><input id="m_cost" type="number"><label>سعر البيع</label><input id="m_price" type="number"><label>الكمية</label><input id="m_qty" type="number" value="0">`, ()=>{ const name=qs('#m_name').value.trim(); if(!name) return alert('حط اسم'); state.products.push({id:uid('p'), name, cost:parseFloat(qs('#m_cost').value||0), price:parseFloat(qs('#m_price').value||0), qty:parseInt(qs('#m_qty').value||0)}); save(); render(state.products); }); });

  qs('#doImportProducts').addEventListener('click', ()=> qs('#importProducts').click());
  qs('#importProducts').addEventListener('change', e=>{ const f=e.target.files[0]; if(!f) return; const reader=new FileReader(); reader.onload = ev=>{ try{ const rows = ev.target.result.split(/\r?\n/).filter(Boolean); const header = rows.shift().split(',').map(h=>h.trim()); rows.forEach(r=>{ const cols = r.split(','); const obj={}; header.forEach((h,i)=>obj[h]=cols[i]||''); const name = obj['Product Name']||cols[0]; const cost = parseFloat(obj['Cost Price']||obj['Cost']||0)||0; const price = parseFloat(obj['Sale Price']||obj['Price']||0)||0; const qty = parseInt(obj['Quantity']||obj['Qty']||0)||0; if(name) state.products.push({id:uid('p'), name, cost, price, qty}); }); save(); render(state.products); alert('تم استيراد المنتجات'); } catch(er){ alert('خطأ في قراءة الملف') } }; reader.readAsText(f,'utf-8'); });

  qs('#exportProducts').addEventListener('click', ()=>{ let csv='Product Name,Cost Price,Sale Price,Quantity\n'; state.products.forEach(p=>{ csv+=`${p.name},${p.cost},${p.price},${p.qty}\n`; }); download('products_export.csv', csv, 'text/csv'); });

  search.addEventListener('input', ()=>{ const q=search.value.trim().toLowerCase(); const rows = state.products.filter(p=>p.name.toLowerCase().includes(q)); render(rows); });

  render(state.products);
}

// INVOICES page
function invoicesPageInit(){
  const tbody = qs('#invoicesTable tbody'), search = qs('#searchInv');
  function render(){ tbody.innerHTML=''; state.invoices.forEach(inv=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${inv.number}</td><td>${inv.date.split('T')[0]}</td><td>${inv.customerName||'نقدي'}</td><td>${money(inv.total)}</td><td>${inv.status||'غير مدفوع'}</td><td><button onclick="viewInvoice('${inv.id}')">عرض</button> <button onclick="deleteInvoice('${inv.id}')">حذف</button> <button onclick="printInvoice('${inv.id}')">طبع</button></td>`; tbody.appendChild(tr); }); }
  window.viewInvoice = id=>{ const inv = state.invoices.find(x=>x.id===id); if(!inv) return alert('مش موجود'); showModal(`عرض فاتورة ${inv.number}`, `<div>تاريخ: ${inv.date.split('T')[0]}</div><div>عميل: ${inv.customerName||'نقدي'}</div><div>المجموع: ${money(inv.total)}</div><div>الحالة: ${inv.status}</div><h4>الأصناف</h4><ul>${inv.items.map(it=>`<li>${it.name} - ${it.qty} * ${money(it.price)}</li>`).join('')}</ul>`, ()=>{ /* read only */ }); }
  window.deleteInvoice = id=>{ if(!confirm('تأكيد حذف الفاتورة؟ العملية لا تُلغي الدفعات المسجلة')) return; state.invoices = state.invoices.filter(x=>x.id!==id); save(); render(); alert('تم حذف الفاتورة'); }
  window.printInvoice = id=>{ const inv = state.invoices.find(x=>x.id===id); if(!inv) return; const w = window.open('','_blank'); const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>فاتورة ${inv.number}</title><style>body{font-family:Arial,Helvetica,sans-serif;direction:rtl;text-align:right;padding:20px}table{width:100%;border-collapse:collapse}td,th{padding:8px;border:1px solid #ccc}</style></head><body><h2>فاتورة ${inv.number}</h2><div>تاريخ: ${inv.date.split('T')[0]}</div><div>العميل: ${inv.customerName||'نقدي'}</div><table><thead><tr><th>المنتج</th><th>كمية</th><th>سعر</th><th>المجموع</th></tr></thead><tbody>${inv.items.map(it=>`<tr><td>${it.name}</td><td>${it.qty}</td><td>${it.price}</td><td>${(it.qty*it.price).toFixed(2)}</td></tr>`).join('')}</tbody></table><h3>الإجمالي: ${inv.total}</h3><script>window.onload=function(){window.print(); setTimeout(()=>window.close(),500)}</script></body></html>`; w.document.write(html); w.document.close(); }

  qs('#newInvoice').addEventListener('click', ()=>{
    const customerOptions = `<option value="">نقدي</option>` + state.customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
    showModal('إنشاء فاتورة', `<label>رقم الفاتورة</label><input id="inv_number" value="${'INV'+(state.invoices.length+1)}"><label>العميل</label><select id="inv_customer">${customerOptions}</select><label>البحث عن المنتج (اكتب الاسم واضغط Enter)</label><input id="inv_search"><div id="inv_items"></div><label>الخصم</label><input id="inv_discount" type="number" value="0"><label>الضريبة (%)</label><input id="inv_tax" type="number" value="0">`, ()=>{
      const number = qs('#inv_number').value.trim(); const customerId = qs('#inv_customer').value; const customerName = (state.customers.find(x=>x.id===customerId)||{}).name || ''
      const itemsEl = Array.from(document.querySelectorAll('#inv_items .item-row')); const items = itemsEl.map(el=>({name:el.querySelector('.iname').value, qty:parseInt(el.querySelector('.iqty').value||0), price:parseFloat(el.querySelector('.iprice').value||0)})).filter(it=>it.qty>0)
      const discount = parseFloat(qs('#inv_discount').value||0), tax = parseFloat(qs('#inv_tax').value||0)
      if(items.length===0) return alert('ضيف اصناف')
      const subtotal = items.reduce((s,it)=>s+it.qty*it.price,0); const total = +(subtotal - discount + (subtotal*(tax/100))).toFixed(2)
      const inv = {id:uid('inv'), number, date:new Date().toISOString(), customerId, customerName, items, discount, tax, subtotal, total, status:'غير مدفوع'}
      items.forEach(it=>{ const p = state.products.find(x=>x.name===it.name); if(p) p.qty = Math.max(0, p.qty - it.qty) })
      state.invoices.unshift(inv); save(); closeModal(); render();
    });
    // attach search listener inside modal (add items by Enter)
    const interval = setInterval(()=>{ const s = document.getElementById('inv_search'); if(s){ s.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); const q=s.value.trim(); const p = state.products.find(x=>x.name===q); if(!p) return alert('المنتج مش موجود'); const container = document.getElementById('inv_items'); const div = document.createElement('div'); div.className='item-row'; div.innerHTML = `<input class="iname" value="${p.name}"><input class="iqty' type="number" value="1"><input class="iprice' type="number" value="${p.price}"><button onclick="this.parentElement.remove()">حذف</button>`; container.appendChild(div); s.value='' } }) clearInterval(interval) } },200)
  });

  qs('#exportInvoicesJSON').addEventListener('click', ()=>{ download('invoices_export.json', JSON.stringify(state.invoices), 'application/json'); alert('تم تصدير JSON') })
  qs('#exportInvoicesCSV').addEventListener('click', ()=>{ let csv='number,date,customer,total,status\n'; state.invoices.forEach(i=>{ csv+=`${i.number},${i.date},${i.customerName||''},${i.total},${i.status}\n`; }); download('invoices_export.csv', csv, 'text/csv'); alert('تم تصدير CSV') })

  qs('#importInvoices') && qs('#importInvoices').addEventListener('click', ()=> qs('#importInvoicesFile').click())
  qs('#importInvoicesFile') && qs('#importInvoicesFile').addEventListener('change', e=>{ const f=e.target.files[0]; if(!f) return; const reader=new FileReader(); reader.onload=ev=>{ try{ const arr = JSON.parse(ev.target.result); if(Array.isArray(arr)){ arr.forEach(it=> state.invoices.push(Object.assign({id:uid('inv')}, it))); save(); render(); alert('تم استيراد الفواتير') } }catch(er){ alert('خطأ في الملف: تأكد أنه JSON صحيح') } }; reader.readAsText(f,'utf-8') })

  render();
}

// CUSTOMERS page
function customersPageInit(){
  const tbody = qs('#customersTable tbody'), search = qs('#searchCust');
  function render(){ tbody.innerHTML=''; state.customers.forEach(c=>{ const tr=document.createElement('tr'); tr.innerHTML = `<td>${c.name}</td><td>${c.phone||''}</td><td>${money(c.balance)}</td><td><button onclick="viewCustomer('${c.id}')">عرض</button> <button onclick="deleteCustomer('${c.id}')">حذف</button></td>`; tbody.appendChild(tr); }); qs('#selectCustomer') && (qs('#selectCustomer').innerHTML = '<option value="">-- اختر --</option>' + state.customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')); }
  window.viewCustomer = id=>{ const c = state.customers.find(x=>x.id===id); if(!c) return alert('مش موجود'); showModal('العميل', `<div>الاسم: ${c.name}</div><div>الهاتف: ${c.phone||''}</div><h4>الفواتير</h4><ul>${state.invoices.filter(i=>i.customerId===id).map(i=>`<li>${i.number} - ${i.date.split('T')[0]} - ${money(i.total)} - ${i.status}</li>`).join('')}</ul>`, ()=>{}); }
  window.deleteCustomer = id=>{ if(!confirm('تأكيد حذف العميل؟')) return; state.customers = state.customers.filter(x=>x.id!==id); save(); render(); }
  qs('#addCustomer').addEventListener('click', ()=>{ showModal('إضافة عميل', `<label>الاسم</label><input id="c_name"><label>الهاتف</label><input id="c_phone">`, ()=>{ const name=qs('#c_name').value.trim(); if(!name) return alert('حط اسم'); state.customers.push({id:uid('c'), name, phone:qs('#c_phone').value, balance:0}); save(); render(); closeModal(); }); });

  qs('#doImportCustomers').addEventListener('click', ()=> qs('#importCustomers').click());
  qs('#importCustomers').addEventListener('change', e=>{ const f=e.target.files[0]; if(!f) return; const reader=new FileReader(); reader.onload=ev=>{ const rows = ev.target.result.split(/\r?\n/).filter(Boolean); const header = rows.shift().split(',').map(h=>h.trim()); rows.forEach(r=>{ const cols=r.split(','); const name = cols[0]; const phone = cols[1]||''; if(name) state.customers.push({id:uid('c'), name, phone, balance:0}); }); save(); render(); alert('تم استيراد العملاء') }; reader.readAsText(f,'utf-8') })

  qs('#exportCustomers').addEventListener('click', ()=>{ let csv='Name,Phone\n'; state.customers.forEach(c=>{ csv+=`${c.name},${c.phone||''}\n`; }); download('customers_export.csv', csv, 'text/csv'); })

  search.addEventListener('input', ()=>{ const q=search.value.trim().toLowerCase(); const rows = state.customers.filter(c=>c.name.toLowerCase().includes(q)); tbody.innerHTML=''; rows.forEach(c=>{ const tr=document.createElement('tr'); tr.innerHTML = `<td>${c.name}</td><td>${c.phone||''}</td><td>${money(c.balance)}</td><td><button onclick="viewCustomer('${c.id}')">عرض</button> <button onclick="deleteCustomer('${c.id}')">حذف</button></td>`; tbody.appendChild(tr); }) })

  render();
}

// REPORTS page
function reportsPageInit(){
  const area = qs('#reportsArea');
  function render(){ const totalSales = state.invoices.reduce((s,i)=>s+i.total,0); const totalPaid = state.invoices.filter(i=>i.status==='مدفوع').reduce((s,i)=>s+i.total,0); area.innerHTML = `<p>إجمالي المبيعات: ${money(totalSales)}</p><p>إجمالي المدفوعات: ${money(totalPaid)}</p><p>عدد الفواتير: ${state.invoices.length}</p>` }
  qs('#printReport') && qs('#printReport').addEventListener('click', ()=> window.print())
  qs('#exportReportCSV') && qs('#exportReportCSV').addEventListener('click', ()=>{ let csv='metric,value\n'; const totalSales = state.invoices.reduce((s,i)=>s+i.total,0); csv+=`totalSales,${totalSales}\n`; csv+=`invoicesCount,${state.invoices.length}\n`; download('report.csv', csv, 'text/csv'); })
  render();
}

// CUSTOMER STATEMENT
function customerStatementInit(){
  const select = qs('#selectCustomer'), loadBtn = qs('#loadStatement'), area = qs('#statementArea');
  select.innerHTML = '<option value="">-- اختر --</option>' + state.customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
  loadBtn.addEventListener('click', ()=>{ const cid = select.value; if(!cid) return alert('اختر زبون'); const customer = state.customers.find(c=>c.id===cid); const entries = []; state.invoices.filter(i=>i.customerId===cid).forEach(i=> entries.push({date:i.date, type:'فاتورة', ref:i.number, amount:i.total})); entries.sort((a,b)=> new Date(a.date) - new Date(b.date)); let running = 0; const rows = entries.map(e=>{ running += e.amount; return `<tr><td>${e.date.split('T')[0]}</td><td>${e.type}</td><td>${e.ref}</td><td>${money(e.amount)}</td><td>${money(running)}</td></tr>` }).join(''); area.innerHTML = `<h4>كشف حساب: ${customer.name}</h4><table><thead><tr><th>التاريخ</th><th>النوع</th><th>المرجع</th><th>المبلغ</th><th>الرصيد المتراكم</th></tr></thead><tbody>${rows}</tbody></table>` });
  qs('#exportStatementPDF') && qs('#exportStatementPDF').addEventListener('click', ()=>{ alert('يمكنك طباعة صفحة الكشف أو تصديره لاحقاً بصيغة PDF'); window.print(); });
}

// Modal helper
function showModal(title, html, onOk){ const modal=document.getElementById('modal'); if(!modal){ alert('مودال غير موجود'); return } document.getElementById('modalTitle').textContent = title; document.getElementById('modalBody').innerHTML = html; modal.classList.remove('hidden'); document.getElementById('modalCancel').onclick = ()=> modal.classList.add('hidden'); document.getElementById('modalSave').onclick = ()=>{ onOk && onOk(); modal.classList.add('hidden'); } }
function closeModal(){ const modal=document.getElementById('modal'); if(modal) modal.classList.add('hidden'); }

// Boot
document.addEventListener('DOMContentLoaded', ()=>{ load(); const path = location.pathname.split('/').pop() || 'index.html'; if(path==='index.html' || path==='') renderDashboard(); if(path==='products.html') productsPageInit(); if(path==='invoices.html') invoicesPageInit(); if(path==='customers.html') customersPageInit(); if(path==='reports.html') reportsPageInit(); if(path==='customer_statement.html') customerStatementInit(); });

// Service worker registration
if('serviceWorker' in navigator){ navigator.serviceWorker.register('./sw.js').catch(()=>console.log('sw failed')); }
