const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const normalize = (body) => ({
  code: String(body.code || '').trim(),
  name: String(body.name || '').trim(),
  activationDeactivationYn: body.activationDeactivationYn ? 'Y' : 'N',
  activationDeactivationSysId: body.activationDeactivationSysId || null,
  activationDeactivationCode: body.activationDeactivationCode || null,
  activationDeactivationName: body.activationDeactivationName || null,
  companies: Array.isArray(body.companies) ? body.companies : []
});

function validate(data) {
  if (!data.code || !data.name) return 'Cost Center Code and Cost Center Name are required.';
  if (data.code.length > 100) return 'Cost Center Code cannot exceed 100 characters.';
  if (data.name.length > 250) return 'Cost Center Name cannot exceed 250 characters.';
  if (data.activationDeactivationYn === 'Y' && !data.activationDeactivationCode) {
    return 'Select an Activation & Deactivation Code when the checkbox is enabled.';
  }
  for (const c of data.companies) {
    if (!c.companySysId || !c.companyCode || !c.companyName) return 'Each applicable company row must have SysID, Code and Name.';
  }
  return null;
}

app.get('/api/health', (req, res) => res.json({ message: 'Cost Center API is running' }));

app.get('/api/cost-centers', async (req, res) => {
  try {
    const [centers] = await pool.query('SELECT * FROM cost_centers ORDER BY sys_id DESC');
    if (!centers.length) return res.json([]);
    const ids = centers.map(c => c.sys_id);
    const [companies] = await pool.query(
      `SELECT sys_id, cost_center_sys_id, company_sys_id, company_code, company_name
       FROM applicable_companies WHERE cost_center_sys_id IN (?) ORDER BY sys_id`, [ids]
    );
    const map = new Map();
    companies.forEach(c => {
      if (!map.has(c.cost_center_sys_id)) map.set(c.cost_center_sys_id, []);
      map.get(c.cost_center_sys_id).push({
        sysId: c.sys_id, companySysId: c.company_sys_id,
        companyCode: c.company_code, companyName: c.company_name
      });
    });
    res.json(centers.map(c => ({
      sysId: c.sys_id, code: c.code, name: c.name,
      activationDeactivationYn: c.activation_deactivation_yn,
      activationDeactivationSysId: c.activation_deactivation_sys_id,
      activationDeactivationCode: c.activation_deactivation_code,
      activationDeactivationName: c.activation_deactivation_name,
      companies: map.get(c.sys_id) || []
    })));
  } catch (e) { console.error(e); res.status(500).json({message:'Failed to load cost centers'}); }
});

app.get('/api/cost-centers/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cost_centers WHERE sys_id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({message:'Cost Center not found'});
    const c = rows[0];
    const [companies] = await pool.query('SELECT sys_id, company_sys_id, company_code, company_name FROM applicable_companies WHERE cost_center_sys_id=? ORDER BY sys_id', [c.sys_id]);
    res.json({
      sysId:c.sys_id, code:c.code, name:c.name,
      activationDeactivationYn:c.activation_deactivation_yn,
      activationDeactivationSysId:c.activation_deactivation_sys_id,
      activationDeactivationCode:c.activation_deactivation_code,
      activationDeactivationName:c.activation_deactivation_name,
      companies: companies.map(x=>({sysId:x.sys_id, companySysId:x.company_sys_id, companyCode:x.company_code, companyName:x.company_name}))
    });
  } catch(e){ console.error(e); res.status(500).json({message:'Failed to load cost center'}); }
});

app.post('/api/cost-centers', async (req, res) => {
  const data = normalize(req.body); const error = validate(data);
  if (error) return res.status(400).json({message:error});
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO cost_centers (code,name,activation_deactivation_yn,activation_deactivation_sys_id,activation_deactivation_code,activation_deactivation_name)
       VALUES (?,?,?,?,?,?)`,
      [data.code,data.name,data.activationDeactivationYn,data.activationDeactivationSysId,data.activationDeactivationCode,data.activationDeactivationName]
    );
    for (const c of data.companies) {
      await conn.query('INSERT INTO applicable_companies (cost_center_sys_id,company_sys_id,company_code,company_name) VALUES (?,?,?,?)', [result.insertId,c.companySysId,c.companyCode,c.companyName]);
    }
    await conn.commit(); res.status(201).json({message:'Cost Center saved successfully',sysId:result.insertId});
  } catch(e){ await conn.rollback(); console.error(e); if(e.code==='ER_DUP_ENTRY') return res.status(409).json({message:'Cost Center Code already exists.'}); res.status(500).json({message:'Failed to save Cost Center'}); }
  finally { conn.release(); }
});

app.put('/api/cost-centers/:id', async (req, res) => {
  const data = normalize(req.body); const error = validate(data);
  if (error) return res.status(400).json({message:error});
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      `UPDATE cost_centers SET code=?,name=?,activation_deactivation_yn=?,activation_deactivation_sys_id=?,activation_deactivation_code=?,activation_deactivation_name=? WHERE sys_id=?`,
      [data.code,data.name,data.activationDeactivationYn,data.activationDeactivationSysId,data.activationDeactivationCode,data.activationDeactivationName,req.params.id]
    );
    if (!result.affectedRows) { await conn.rollback(); return res.status(404).json({message:'Cost Center not found'}); }
    await conn.query('DELETE FROM applicable_companies WHERE cost_center_sys_id=?',[req.params.id]);
    for (const c of data.companies) await conn.query('INSERT INTO applicable_companies (cost_center_sys_id,company_sys_id,company_code,company_name) VALUES (?,?,?,?)',[req.params.id,c.companySysId,c.companyCode,c.companyName]);
    await conn.commit(); res.json({message:'Cost Center updated successfully'});
  } catch(e){ await conn.rollback(); console.error(e); if(e.code==='ER_DUP_ENTRY') return res.status(409).json({message:'Cost Center Code already exists.'}); res.status(500).json({message:'Failed to update Cost Center'}); }
  finally { conn.release(); }
});

app.delete('/api/cost-centers/:id', async (req,res)=>{
  try { const [r]=await pool.query('DELETE FROM cost_centers WHERE sys_id=?',[req.params.id]); if(!r.affectedRows) return res.status(404).json({message:'Cost Center not found'}); res.json({message:'Deleted successfully'}); }
  catch(e){ console.error(e); res.status(500).json({message:'Failed to delete Cost Center'}); }
});

app.get('/api/lookups/activation', async (req,res)=>{
  try { const [rows]=await pool.query('SELECT sys_id AS sysId, code, name FROM activation_deactivation_master ORDER BY code'); res.json(rows); }
  catch(e){res.status(500).json({message:'Failed to load activation lookup'});}
});
app.get('/api/lookups/companies', async (req,res)=>{
  try { const [rows]=await pool.query('SELECT sys_id AS sysId, code, name FROM companies ORDER BY code'); res.json(rows); }
  catch(e){res.status(500).json({message:'Failed to load company lookup'});}
});

const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, ()=>console.log(`API listening on http://localhost:${PORT}`));
