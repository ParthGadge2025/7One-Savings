const KEY="7oneSaving_v1";
const todayISO=()=>new Date().toISOString().slice(0,10);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const money=n=>`${currency()}${Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2})}`;
const currency=()=>({ "₹ INR":"₹","$ USD":"$","€ EUR":"€","£ GBP":"£"})[state.settings.currency]||"₹";
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const dateObj=s=>new Date(`${s}T00:00:00`);
const fmt=s=>dateObj(s).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
const addDays=(s,n)=>{let d=dateObj(s);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
const addPeriod=(s,repeat)=>{let d=dateObj(s); if(repeat==="daily")d.setDate(d.getDate()+1); if(repeat==="weekly")d.setDate(d.getDate()+7); if(repeat==="monthly")d.setMonth(d.getMonth()+1); if(repeat==="yearly")d.setFullYear(d.getFullYear()+1); return d.toISOString().slice(0,10)};
const diffDays=(a,b)=>Math.round((dateObj(b)-dateObj(a))/86400000);
let state=JSON.parse(localStorage.getItem(KEY)||"null")||{
 settings:{name:"Parth Gadge",budget:20000,currency:"₹ INR",theme:"light"},
 expenses:[],payments:[],competitions:[],goals:[],subscriptions:[]
};
let calDate=new Date(); calDate.setDate(1); let activeComp=null;

function save(){localStorage.setItem(KEY,JSON.stringify(state)); renderAll()}
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");clearTimeout(window._toast);window._toast=setTimeout(()=>t.classList.remove("show"),2400)}
function currentMonthExpenses(){const m=todayISO().slice(0,7);return state.expenses.filter(x=>x.date.startsWith(m))}
function adjustedDate(p){
 let d=p.date, guard=0;
 while(p.adjust==="yes" && p.offs?.includes(d) && guard++<370)d=addDays(d,1);
 return d;
}
function nextOccurrence(p){
 let d=p.date, today=todayISO(), guard=0;
 while(d<today && guard++<1000)d=addPeriod(d,p.repeat);
 return {actual:d, adjusted:adjustedDate({...p,date:d})};
}
function page(name){
 document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
 document.getElementById(name).classList.add("active");
 document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===name));
 document.getElementById("page-title").textContent=({dashboard:"Dashboard",expenses:"Expenses",payments:"Payments",calendar:"Calendar",competition:"Competition",goals:"Saving Goals",subscriptions:"Subscriptions",reports:"Reports & PDF",insights:"Insights",settings:"Settings"})[name];
 if(name==="calendar")renderCalendar();
 if(name==="reports")renderReport();
}
document.querySelectorAll(".nav").forEach(b=>b.addEventListener("click",()=>page(b.dataset.page)));
document.addEventListener("click",e=>{
 const p=e.target.closest("[data-page]"); if(p && !p.classList.contains("nav"))page(p.dataset.page);
 const m=e.target.closest("[data-modal]"); if(m)openModal(m.dataset.modal);
 if(e.target.matches("[data-close]"))e.target.closest(".modal").classList.remove("open");
});
function openModal(id){
 const el=document.getElementById(id);el.classList.add("open");
 const form=el.querySelector("form"); if(form){const date=form.querySelector('input[name="date"]');if(date&&!date.value)date.value=todayISO()}
}
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.remove("open")}));
document.getElementById("hamburger").onclick=()=>document.getElementById("sidebar").classList.toggle("open");
document.getElementById("theme").onclick=()=>{state.settings.theme=state.settings.theme==="dark"?"light":"dark";applyTheme();save()};
function applyTheme(){document.body.classList.toggle("dark",state.settings.theme==="dark")}
document.getElementById("expenseForm").onsubmit=e=>{
 e.preventDefault();let f=new FormData(e.target);
 state.expenses.push({id:uid(),date:f.get("date"),description:f.get("description"),category:f.get("category"),paidBy:f.get("paidBy")||state.settings.name,amount:+f.get("amount"),note:f.get("note")});
 e.target.reset();document.getElementById("expenseModal").classList.remove("open");toast("Expense added");save();
};
document.getElementById("paymentForm").onsubmit=e=>{
 e.preventDefault();let f=new FormData(e.target);
 state.payments.push({id:uid(),name:f.get("name"),amount:+f.get("amount"),date:f.get("date"),repeat:f.get("repeat"),reminder:+f.get("reminder"),type:f.get("type"),adjust:f.get("adjust"),offs:(f.get("offs")||"").split(",").map(x=>x.trim()).filter(Boolean)});
 e.target.reset();document.getElementById("paymentModal").classList.remove("open");toast("Payment reminder added");save();
};
document.getElementById("goalForm").onsubmit=e=>{
 e.preventDefault();let f=new FormData(e.target);state.goals.push({id:uid(),name:f.get("name"),target:+f.get("target"),saved:+f.get("saved"),date:f.get("date")});e.target.reset();document.getElementById("goalModal").classList.remove("open");toast("Saving goal created");save();
};
document.getElementById("subscriptionForm").onsubmit=e=>{
 e.preventDefault();let f=new FormData(e.target);state.subscriptions.push({id:uid(),name:f.get("name"),amount:+f.get("amount"),cycle:f.get("cycle"),date:f.get("date")});e.target.reset();document.getElementById("subscriptionModal").classList.remove("open");toast("Subscription added");save();
};
document.getElementById("competitionForm").onsubmit=e=>{
 e.preventDefault();let f=new FormData(e.target);
 const start=f.get("date"),dur=+f.get("duration"),unit=f.get("unit");
 let end=unit==="days"?addDays(start,dur):unit==="weeks"?addDays(start,dur*7):addPeriodN(start,dur);
 state.competitions.push({id:uid(),name:f.get("name"),p1:f.get("p1"),p2:f.get("p2"),start:+f.get("start"),duration:dur,unit,startDate:start,endDate:end,spends:[]});
 e.target.reset();document.getElementById("competitionModal").classList.remove("open");toast("Competition started");save();
};
function addPeriodN(s,n){let d=dateObj(s);d.setMonth(d.getMonth()+n);return d.toISOString().slice(0,10)}
document.getElementById("competitionSpendForm").onsubmit=e=>{
 e.preventDefault();let f=new FormData(e.target),c=state.competitions.find(x=>x.id===f.get("id"));if(!c)return;
 if(f.get("date")<c.startDate||f.get("date")>c.endDate){toast("Date is outside competition");return}
 c.spends.push({id:uid(),player:f.get("player"),amount:+f.get("amount"),date:f.get("date"),description:f.get("description")});
 document.getElementById("competitionSpendModal").classList.remove("open");e.target.reset();toast("Competition spending recorded");save();
};
function renderDashboard(){
 const ex=currentMonthExpenses(), spent=ex.reduce((a,x)=>a+x.amount,0), budget=+state.settings.budget||0;
 document.getElementById("d-spent").textContent=money(spent);
 document.getElementById("d-left").textContent=money(Math.max(0,budget-spent));
 document.getElementById("d-budget-sub").textContent=budget?`${Math.round(spent/budget*100)}% of budget used`:"Set a monthly budget";
 document.getElementById("d-rate").textContent=budget?`${Math.max(0,Math.round((budget-spent)/budget*100))}%`:"0%";
 const ps=state.payments.map(p=>({p,...nextOccurrence(p)})).sort((a,b)=>a.adjusted.localeCompare(b.adjusted));
 document.getElementById("d-next").textContent=ps[0]?fmt(ps[0].adjusted):"—";document.getElementById("d-next-name").textContent=ps[0]?ps[0].p.name:"No payment added";
 document.getElementById("recent").innerHTML=state.expenses.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6).map(x=>`<div class="activity"><div class="circle-icon">₹</div><div class="activity-main"><b>${esc(x.description)}</b><small>${esc(x.category)} · ${fmt(x.date)}</small></div><span class="amount">${money(x.amount)}</span></div>`).join("")||'<div class="empty">No expenses yet. Add your first expense.</div>';
 document.getElementById("upcoming").innerHTML=ps.slice(0,5).map(x=>`<div class="pay-row"><div class="circle-icon">↻</div><div style="flex:1"><b>${esc(x.p.name)}</b><small>${fmt(x.adjusted)} ${x.adjusted!==x.actual?"· adjusted":"· actual"}</small></div><span>${money(x.p.amount)}</span></div>`).join("")||'<div class="empty">No recurring payments.</div>';
 const g=state.goals[0];document.getElementById("goal-progress").textContent=g?`${Math.min(100,Math.round(g.saved/g.target*100))}%`:"0%";document.getElementById("goal-name").textContent=g?`${money(g.saved)} of ${money(g.target)}`:"No active goal";
 const c=state.competitions.find(x=>x.endDate>=todayISO());document.getElementById("comp-status").textContent=c?`${c.p1} vs ${c.p2}`:"None";
 const tips=[["Track first","You cannot improve what you never measure."],["Try a no-spend day","One planned no-spend day can expose unnecessary purchases."],["Protect recurring costs","Small subscriptions become large yearly expenses."],["Use goals","A named target makes saving more concrete."]];
 const t=tips[new Date().getDate()%tips.length];document.getElementById("tip-title").textContent=t[0];document.getElementById("tip-text").textContent=t[1];
}
function renderExpenses(){
 const q=(document.getElementById("expenseSearch").value||"").toLowerCase(),cat=document.getElementById("expenseFilter").value,month=document.getElementById("expenseMonth").value;
 let a=state.expenses.filter(x=>(!q||`${x.description} ${x.category}`.toLowerCase().includes(q))&&(cat==="all"||x.category===cat)&&(!month||x.date.startsWith(month))).sort((x,y)=>y.date.localeCompare(x.date));
 document.getElementById("expenseTable").innerHTML=a.map(x=>`<tr><td>${fmt(x.date)}</td><td><b>${esc(x.description)}</b><br><small>${esc(x.note||"")}</small></td><td>${esc(x.category)}</td><td>${esc(x.paidBy)}</td><td><b>${money(x.amount)}</b></td><td><button class="delete" onclick="deleteExpense('${x.id}')">Delete</button></td></tr>`).join("")||'<tr><td colspan="6"><div class="empty">No matching expenses.</div></td></tr>';
}
window.deleteExpense=id=>{state.expenses=state.expenses.filter(x=>x.id!==id);toast("Expense deleted");save()};
["expenseSearch","expenseFilter","expenseMonth"].forEach(id=>document.getElementById(id).addEventListener("input",renderExpenses));
function renderPayments(){
 const today=todayISO();
 document.getElementById("paymentCards").innerHTML=state.payments.map(p=>{let n=nextOccurrence(p), overdue=n.adjusted<today;return `<article class="pay-card"><div class="pay-top"><span class="tag ${overdue?"overdue":""}">${overdue?"EXCEEDED":"ACTIVE"} · ${esc(p.type)}</span><button class="delete" onclick="deletePayment('${p.id}')">Delete</button></div><h3>${esc(p.name)}</h3><small>${esc(p.repeat)} · reminder ${p.reminder===0?"on due date":p.reminder+" day(s) before"}</small><div class="pay-meta"><div><small>Actual date</small><b>${fmt(n.actual)}</b></div><div><small>Adjusted date</small><b>${fmt(n.adjusted)}</b></div><div><small>Amount</small><b>${money(p.amount)}</b></div><div><small>Off-days</small><b>${p.offs?.length||0}</b></div></div><div class="pay-actions"><button class="secondary" onclick="markPayment('${p.id}')">Mark paid</button><button class="secondary" onclick="showOffs('${p.id}')">Manage off-days</button></div></article>`}).join("")||'<div class="empty">No payment reminders. Add recharge, mess, rent or subscription dates.</div>';
}
window.deletePayment=id=>{state.payments=state.payments.filter(x=>x.id!==id);toast("Payment deleted");save()};
window.markPayment=id=>{let p=state.payments.find(x=>x.id===id);if(!p)return;const n=nextOccurrence(p);state.expenses.push({id:uid(),date:todayISO(),description:`Payment: ${p.name}`,category:p.type==="Recharge"?"Recharge":"Bills",paidBy:state.settings.name,amount:p.amount,note:`Recurring payment due ${n.actual}`});p.date=addPeriod(n.actual,p.repeat);toast("Payment marked paid and next date calculated");save()};
window.showOffs=id=>{let p=state.payments.find(x=>x.id===id);if(!p)return;const s=prompt("Enter holiday/off-days as YYYY-MM-DD, separated by commas:",(p.offs||[]).join(", "));if(s!==null){p.offs=s.split(",").map(x=>x.trim()).filter(Boolean);toast("Off-days updated");save()}};
function renderCalendar(){
 const y=calDate.getFullYear(),m=calDate.getMonth();document.getElementById("calTitle").textContent=calDate.toLocaleDateString("en-IN",{month:"long",year:"numeric"});
 const first=new Date(y,m,1),days=new Date(y,m+1,0).getDate(),start=(first.getDay()+6)%7;
 let html=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(x=>`<div class="cal-head">${x}</div>`).join("");
 for(let i=0;i<start;i++)html+=`<div class="cal-day muted"></div>`;
 for(let d=1;d<=days;d++){let s=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`,events=[];
 state.expenses.filter(x=>x.date===s).slice(0,3).forEach(x=>events.push(`<span class="event expense">₹ ${esc(x.description)}</span>`));
 state.payments.forEach(p=>{let n=nextOccurrence(p);if(n.actual===s)events.push(`<span class="event payment">● ${esc(p.name)} · actual</span>`);if(n.adjusted===s&&n.adjusted!==n.actual)events.push(`<span class="event adjusted">↳ ${esc(p.name)} · adjusted</span>`);});
 html+=`<div class="cal-day ${s===todayISO()?"today":""}"><div class="day-num">${d}</div>${events.join("")}${state.payments.some(p=>nextOccurrence(p).adjusted<s)?`<span class="event overdue">Exceeded payment</span>`:""}</div>`;
 }
 document.getElementById("calendarGrid").innerHTML=html;
}
document.getElementById("prevMonth").onclick=()=>{calDate.setMonth(calDate.getMonth()-1);renderCalendar()};
document.getElementById("nextMonth").onclick=()=>{calDate.setMonth(calDate.getMonth()+1);renderCalendar()};
function renderCompetitions(){
 const today=todayISO();
 document.getElementById("competitions").innerHTML=state.competitions.slice().reverse().map(c=>{
  const s1=c.spends.filter(x=>x.player===c.p1).reduce((a,x)=>a+x.amount,0),s2=c.spends.filter(x=>x.player===c.p2).reduce((a,x)=>a+x.amount,0);
  const f1=c.start-s1,f2=c.start-s2,done=today>c.endDate,winner=done?(f1>f2?c.p1:f2>f1?c.p2:"Tie"):null;
  const elapsed=Math.max(0,Math.min(100,Math.round(diffDays(c.startDate,Math.min(today,c.endDate))/Math.max(1,diffDays(c.startDate,c.endDate))*100)));
  return `<article class="comp-card"><div class="comp-head"><div><p class="eyebrow">${done?"FINISHED":"LIVE"} · ${fmt(c.startDate)} — ${fmt(c.endDate)}</p><h3>${esc(c.name)}</h3></div><button class="delete" onclick="deleteCompetition('${c.id}')">Delete</button></div><div class="progress"><i style="width:${elapsed}%"></i></div><div class="players"><div class="player ${winner===c.p1?"winner":""}"><b>${esc(c.p1)} ${winner===c.p1?"🏆":""}</b><strong>${money(f1)}</strong><small>Spent ${money(s1)} · ${c.spends.filter(x=>x.player===c.p1).length} records</small></div><div class="player ${winner===c.p2?"winner":""}"><b>${esc(c.p2)} ${winner===c.p2?"🏆":""}</b><strong>${money(f2)}</strong><small>Spent ${money(s2)} · ${c.spends.filter(x=>x.player===c.p2).length} records</small></div></div><div class="button-row"><button class="primary" onclick="openCompetitionSpend('${c.id}')">${done?"View / Add":"Add spending"}</button><span class="muted">${winner?`Winner: ${esc(winner)}`:"Higher final balance wins."}</span></div></article>`;
 }).join("")||'<div class="empty">Create your first saving competition.</div>';
}
window.deleteCompetition=id=>{state.competitions=state.competitions.filter(x=>x.id!==id);save()};
window.openCompetitionSpend=id=>{activeComp=id;const c=state.competitions.find(x=>x.id===id);document.getElementById("spendPlayer").innerHTML=`<option>${esc(c.p1)}</option><option>${esc(c.p2)}</option>`;document.querySelector('#competitionSpendForm input[name="id"]').value=id;document.querySelector('#competitionSpendForm input[name="date"]').value=todayISO();openModal("competitionSpendModal")};
function renderGoals(){
 document.getElementById("goalsGrid").innerHTML=state.goals.map(g=>{let p=Math.min(100,Math.round(g.saved/g.target*100));return `<article class="goal-card"><div class="pay-top"><span class="tag">${p}% COMPLETE</span><button class="delete" onclick="deleteGoal('${g.id}')">Delete</button></div><h3>${esc(g.name)}</h3><div class="goal-amount">${money(g.saved)} / ${money(g.target)}</div><div class="progress"><i style="width:${p}%"></i></div><small>${g.date?`Target: ${fmt(g.date)}`:"No target date"}</small><div class="button-row"><button class="secondary" onclick="addGoalMoney('${g.id}')">+ Add saving</button></div></article>`}).join("")||'<div class="empty">Create a goal to start building a saving habit.</div>';
}
window.deleteGoal=id=>{state.goals=state.goals.filter(x=>x.id!==id);save()};
window.addGoalMoney=id=>{let g=state.goals.find(x=>x.id===id),n=+prompt("How much did you save?");if(n>0){g.saved+=n;toast("Goal updated");save()}};
function renderSubscriptions(){
 let monthly=0;state.subscriptions.forEach(s=>monthly+=s.cycle==="monthly"?s.amount:s.cycle==="weekly"?s.amount*4.33:s.amount/12);
 document.getElementById("sub-monthly").textContent=money(monthly);document.getElementById("sub-yearly").textContent=money(monthly*12);document.getElementById("sub-count").textContent=state.subscriptions.length;
 document.getElementById("subscriptionsGrid").innerHTML=state.subscriptions.map(s=>`<article class="sub-card"><div class="pay-top"><span class="tag">${esc(s.cycle)}</span><button class="delete" onclick="deleteSub('${s.id}')">Delete</button></div><h3>${esc(s.name)}</h3><strong>${money(s.amount)}</strong><p class="muted">Next billing: ${fmt(s.date)}</p></article>`).join("")||'<div class="empty">No subscriptions added.</div>';
}
window.deleteSub=id=>{state.subscriptions=state.subscriptions.filter(x=>x.id!==id);save()};
function renderReport(){
 const from=document.getElementById("reportFrom").value,to=document.getElementById("reportTo").value;if(!from||!to)return;
 const a=state.expenses.filter(x=>x.date>=from&&x.date<=to),total=a.reduce((s,x)=>s+x.amount,0),cats={};a.forEach(x=>cats[x.category]=(cats[x.category]||0)+x.amount);
 document.getElementById("reportPreview").innerHTML=`<p class="eyebrow">PREVIEW · ${fmt(from)} — ${fmt(to)}</p><h3>${esc(document.getElementById("reportTitle").value||"Expense report")}</h3><div class="report-summary"><div><span>Total</span><b>${money(total)}</b></div><div><span>Transactions</span><b>${a.length}</b></div><div><span>Average / expense</span><b>${money(a.length?total/a.length:0)}</b></div></div><h4>Category totals</h4>${Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="bar"><label>${esc(k)}</label><div class="bar-track"><i style="width:${total?v/total*100:0}%"></i></div><b>${money(v)}</b></div>`).join("")||'<div class="empty">No expenses in this period.</div>'}<h4>Detailed history</h4>${a.sort((x,y)=>x.date.localeCompare(y.date)).map(x=>`<div class="pay-row"><div style="flex:1"><b>${esc(x.description)}</b><small>${fmt(x.date)} · ${esc(x.category)} · ${esc(x.paidBy)}</small></div><b>${money(x.amount)}</b></div>`).join("")}`;
}
["reportFrom","reportTo","reportTitle"].forEach(id=>document.getElementById(id).addEventListener("input",renderReport));
function pdfData(){
 const from=document.getElementById("reportFrom").value,to=document.getElementById("reportTo").value,title=document.getElementById("reportTitle").value||"7one Saving Expense Report";
 if(!from||!to){toast("Choose a From and To date first");return null}
 return {from,to,title,a:state.expenses.filter(x=>x.date>=from&&x.date<=to)};
}
document.getElementById("pdfBtn").onclick=()=>{
 const d=pdfData();if(!d)return;
 if(!window.jspdf){toast("PDF library did not load. Use Print / Save as PDF.");return}
 const {jsPDF}=window.jspdf,doc=new jsPDF(),total=d.a.reduce((s,x)=>s+x.amount,0),cats={};
 d.a.forEach(x=>cats[x.category]=(cats[x.category]||0)+x.amount);
 doc.setFont("helvetica","bold");doc.setFontSize(20);doc.text("7one Saving",15,18);doc.setFontSize(10);doc.setFont("helvetica","normal");doc.text("by Parth Gadge",15,25);
 doc.setFontSize(15);doc.setFont("helvetica","bold");doc.text(d.title,15,37);doc.setFontSize(10);doc.setFont("helvetica","normal");doc.text(`Period: ${d.from} to ${d.to}`,15,44);doc.text(`Total: ${money(total)}   Transactions: ${d.a.length}`,15,51);
 let y=63;doc.setFont("helvetica","bold");doc.text("Category",15,y);doc.text("Amount",160,y,{align:"right"});y+=7;doc.setFont("helvetica","normal");
 Object.entries(cats).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>{doc.text(k,15,y);doc.text(money(v),160,y,{align:"right"});y+=6});
 y+=5;doc.setFont("helvetica","bold");doc.text("Expense history",15,y);y+=8;doc.setFont("helvetica","normal");
 d.a.sort((x,y)=>x.date.localeCompare(y.date)).forEach(x=>{if(y>280){doc.addPage();y=18}doc.text(`${x.date}  ${x.description}`.slice(0,75),15,y);doc.text(money(x.amount),190,y,{align:"right"});y+=6});
 doc.save(`7one-saving-${d.from}-to-${d.to}.pdf`);toast("PDF generated");
};
document.getElementById("printBtn").onclick=()=>{const d=pdfData();if(d)window.print()};
document.getElementById("shareBtn").onclick=async()=>{
 const d=pdfData();if(!d)return;const total=d.a.reduce((s,x)=>s+x.amount,0),text=`${d.title}\n${d.from} to ${d.to}\nTotal spent: ${money(total)}\nTransactions: ${d.a.length}\nGenerated with 7one Saving by Parth Gadge.`;
 if(navigator.share){try{await navigator.share({title:d.title,text})}catch{}}
 else{await navigator.clipboard?.writeText(text);toast("Summary copied to clipboard")}
};
document.getElementById("csvBtn").onclick=()=>{
 const rows=[["Date","Description","Category","Paid by","Amount","Note"],...state.expenses.map(x=>[x.date,x.description,x.category,x.paidBy,x.amount,x.note||""])];
 const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n"),a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="7one-expenses.csv";a.click();URL.revokeObjectURL(a.href);
};
function renderInsights(){
 const cats={};state.expenses.forEach(x=>cats[x.category]=(cats[x.category]||0)+x.amount);const total=Object.values(cats).reduce((a,b)=>a+b,0),top=Object.entries(cats).sort((a,b)=>b[1]-a[1]);
 document.getElementById("categoryBars").innerHTML=top.map(([k,v])=>`<div class="bar"><label>${esc(k)}</label><div class="bar-track"><i style="width:${total?v/total*100:0}%"></i></div><b>${money(v)}</b></div>`).join("")||'<div class="empty">Add expenses to see your breakdown.</div>';
 const budget=+state.settings.budget||0,month=currentMonthExpenses().reduce((a,x)=>a+x.amount,0),goal=state.goals[0];
 document.getElementById("health").innerHTML=`<div class="health-line"><span>Monthly budget</span><b>${money(budget)}</b></div><div class="health-line"><span>Spent this month</span><b>${money(month)}</b></div><div class="health-line"><span>Budget remaining</span><b>${money(Math.max(0,budget-month))}</b></div><div class="health-line"><span>Largest category</span><b>${top[0]?esc(top[0][0]):"—"}</b></div><div class="health-line"><span>Active goal</span><b>${goal?esc(goal.name):"—"}</b></div>`;
 const obs=[];if(top[0])obs.push(`Your largest recorded category is <b>${esc(top[0][0])}</b> at ${money(top[0][1])}.`);if(budget&&month>budget)obs.push(`You are <b>${money(month-budget)}</b> over this month's budget.`);if(state.subscriptions.length)obs.push(`Your recurring subscriptions are estimated at <b>${money(state.subscriptions.reduce((s,x)=>s+(x.cycle==="monthly"?x.amount:x.cycle==="weekly"?x.amount*4.33:x.amount/12),0))}</b> per month.`);if(!obs.length)obs.push("Add more expenses and goals to unlock more useful observations.");document.getElementById("observations").innerHTML=obs.map(x=>`<p>✦ ${x}</p>`).join("");
}
function renderSettings(){document.getElementById("setName").value=state.settings.name;document.getElementById("setBudget").value=state.settings.budget;document.getElementById("setCurrency").value=state.settings.currency}
document.getElementById("saveSettings").onclick=()=>{state.settings.name=document.getElementById("setName").value||"Parth Gadge";state.settings.budget=+document.getElementById("setBudget").value||0;state.settings.currency=document.getElementById("setCurrency").value;toast("Settings saved");save()};
document.getElementById("backupBtn").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:"application/json"}));a.download="7one-saving-backup.json";a.click()};
document.getElementById("importBtn").onclick=()=>document.getElementById("importFile").click();
document.getElementById("importFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{state=JSON.parse(r.result);save();toast("Backup imported")}catch{toast("Invalid backup file")}};r.readAsText(f)};
document.getElementById("clearBtn").onclick=()=>{if(confirm("Delete all 7one Saving data? This cannot be undone.")){localStorage.removeItem(KEY);location.reload()}};
function renderAll(){applyTheme();document.getElementById("today").textContent=new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});renderDashboard();renderExpenses();renderPayments();renderCalendar();renderCompetitions();renderGoals();renderSubscriptions();renderReport();renderInsights();renderSettings()}
renderAll();
window.addEventListener("storage",renderAll);
