const express=require('express'),axios=require('axios'),cors=require('cors');
require('dotenv').config();
const app=express(),port=process.env.PORT||3000;
app.use(cors());
app.get('/api/backgrounds',async(req,res)=>{
  const q=req.query.q||'islamic pattern';
  try{
    const r=await axios.get(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=15`,{headers:{Authorization:process.env.PEXELS_API_KEY_SERVER}});
    res.json(r.data);
  }catch(e){res.status(500).json({error:'fail'});}
});
app.listen(port,()=>console.log(`Proxy@${port}`));
