import React, { useState, useRef } from "react";

const botAvatar = (
  <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#ddb892 0%,#9b6644 100%)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',color:'#fff',fontSize:18,marginRight:8,boxShadow:'0 2px 8px #ddb89288'}}>🤖</div>
);
const userAvatar = (
  <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#774f38 0%,#e7cdb3 100%)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',color:'#fff',fontSize:18,marginLeft:8,boxShadow:'0 2px 8px #774f3888'}}>👤</div>
);

export default function AIChatWidget({ storeDomain }) {
  React.useEffect(() => {
    console.log('[AIChatWidget] Mounted');
  }, []);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I'm Aiysha, your AI Beauty Advisor. Ready to find your perfect match? Upload a selfie and I'll do the rest!" }
  ]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const fileInputRef = useRef();

  const handleFileChange = async (e) => {
    console.log('[AIChatWidget] File input changed');
    const file = e.target.files[0];
    if (!file) {
      console.warn('[AIChatWidget] No file selected');
      return;
    }
    console.log('[AIChatWidget] File selected:', file.name, file.type, file.size + ' bytes');
    setUploading(true);
    console.log('[AIChatWidget] Uploading started');
    setMessages(msgs => {
      const newMsgs = [
        ...msgs,
        { from: "user", text: "[Selfie uploaded]" },
        { from: "bot", text: "Analyzing your selfie for your unique skin tone... ✨" }
      ];
      console.log('[AIChatWidget] Messages updated:', newMsgs);
      return newMsgs;
    });
    const formData = new FormData();
    formData.append("selfie", file);
    console.log('[AIChatWidget] FormData prepared for upload');
    try {
      const resp = await fetch("/api/skin-shade", { method: "POST", body: formData });
      console.log('[AIChatWidget] /api/skin-shade response status:', resp.status);
      const data = await resp.json();
      console.log('[AIChatWidget] /api/skin-shade response data:', data);
      setUploading(false);
      if (data.shade) {
        setProcessing(true);
        console.log('[AIChatWidget] Processing started');
        setMessages(msgs => {
          const newMsgs = [
            ...msgs,
            { from: "bot", text: `Detected skin shade: `, shade: data.shade },
            { from: "bot", text: "Finding your best beauty matches... 💄" }
          ];
          console.log('[AIChatWidget] Messages updated:', newMsgs);
          return newMsgs;
        });
        // Fetch product recommendations
        const recResp = await fetch(`/api/recommend-products?shade=${encodeURIComponent(data.shade)}`);
        console.log('[AIChatWidget] /api/recommend-products response status:', recResp.status);
        const recData = await recResp.json();
        console.log('[AIChatWidget] /api/recommend-products response data:', recData);
        setProcessing(false);
        console.log('[AIChatWidget] Processing finished');
        setRecommendations(recData.matches || []);
        console.log('[AIChatWidget] Recommendations set:', recData.matches || []);
        if (recData.matches && recData.matches.length) {
          setMessages(msgs => ([
            ...msgs,
            { from: "bot", text: "Here are your best matches! Let me know if you want more info on any product." }
          ]));
          console.log('[AIChatWidget] Messages updated:', msgs);
        } else {
          setMessages(msgs => ([
            ...msgs,
            { from: "bot", text: "Sorry, I couldn't find any perfect matches in this store right now. Want to try another selfie?" }
          ]));
        }
      } else {
        setMessages(msgs => {
          const newMsgs = [...msgs, { from: "bot", text: "Sorry, I couldn't detect a skin shade from your photo. Try again with a clear selfie!", isError: true }];
          console.error('[AIChatWidget] No skin shade detected. Messages updated:', newMsgs);
          return newMsgs;
        });
      }
    } catch (err) {
      setUploading(false);
      setProcessing(false);
      setMessages(msgs => {
        const newMsgs = [...msgs, { from: "bot", text: "Oops! Something went wrong. Please try again.", isError: true }];
        console.error('[AIChatWidget] Upload/processing error:', err);
        console.error('[AIChatWidget] Messages updated:', newMsgs);
        return newMsgs;
      });
    }
  };

  const handleBuyNow = (product) => {
    window.open(product.checkoutUrl, "_blank");
  };

  return (
    <div style={{
      position: "fixed", bottom: 32, right: 32, zIndex: 1000, width: 380, background: "#e7cdb3", borderRadius: 18, boxShadow: "0 4px 32px #9b664433, 0 1.5px 12px #774f3822", padding: 0, overflow: "hidden", fontFamily: 'Lato, sans-serif', border: '1.5px solid #ddb892', animation: 'popIn .8s cubic-bezier(.4,2,.6,1)'}}>
      <div style={{background:"linear-gradient(90deg,#ddb892 0%,#e7cdb3 100%)",padding:18,paddingBottom:12,color:'#774f38',fontWeight:700,fontSize:20,letterSpacing:0.3,display:'flex',alignItems:'center',boxShadow:'0 1px 8px #ddb89288'}}>Aiysha</div>
      <div style={{ maxHeight: 320, overflowY: "auto", padding: 18, background: '#fff' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.from === "bot" ? 'flex-start' : 'flex-end', alignItems: 'center', margin: '10px 0' }}>
            {msg.from === "bot" && botAvatar}
            <div style={{
              background: msg.isError
                ? '#ffd6d6'
                : msg.from === "bot"
                ? 'linear-gradient(90deg,#e7cdb3 0%,#ddb892 100%)'
                : 'linear-gradient(90deg,#ddb89233 0%,#e7cdb333 100%)',
              color: msg.isError ? '#9b6644' : '#774f38',
              borderRadius: 12,
              padding: '10px 16px',
              fontSize: 15,
              maxWidth: 240,
              boxShadow: msg.from === "bot" ? '0 2px 8px #ddb89244' : '0 2px 8px #774f3844',
              border: msg.isError ? '2px solid #9b6644' : msg.shade ? `2.5px solid ${msg.shade}` : 'none',
              display: 'flex', alignItems: 'center',
              gap: msg.shade ? 8 : 0,
              fontWeight: msg.isError ? 600 : 500
            }}>
              {msg.text}
              {msg.shade && <span style={{marginLeft:8,display:'inline-block',width:18,height:18,borderRadius:'50%',background:msg.shade,border:'1.5px solid #fff',boxShadow:'0 0 4px #0002'}}></span>}
            </div>
            {msg.from === "user" && userAvatar}
          </div>
        ))}
        {(uploading || processing) && (
          <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0', color: '#9b6644', fontWeight: 600 }}>
            <span className="dot-flashing" style={{marginRight:8}}></span> {uploading ? "Uploading your selfie..." : "Processing..."}
          </div>
        )}
      </div>
      <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'center',
        minHeight: 0,
        padding: '0 18px 12px 18px',
        background: 'linear-gradient(90deg,#ddb892 0%,#e7cdb3 100%)',
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 18,
      }}>
        <div style={{
          display: 'flex',
          flex: 1,
          minHeight: 48,
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}>
          <button
            disabled={uploading || processing}
            style={{
              minWidth: 140,
              padding: '8px 0',
              borderRadius: 10,
              border: 'none',
              background: uploading || processing ? '#ddb89299' : 'linear-gradient(90deg,#774f38 0%,#9b6644 100%)',
              color: uploading || processing ? '#fff' : '#fff',
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: 0.2,
              boxShadow: uploading || processing ? 'none' : '0 1.5px 8px #774f3844',
              cursor: uploading || processing ? 'not-allowed' : 'pointer',
              transition: 'all .2s',
              borderTop: '2px solid #e7cdb3',
              borderBottom: '2px solid #9b6644',
              margin: '0 auto',
            }}
            onClick={() => fileInputRef.current.click()}
          >
            {uploading ? "Uploading..." : processing ? "Processing..." : "Upload Selfie"}
          </button>
        </div>
        {recommendations.length > 0 && (
          <div style={{marginTop:12, width:'100%'}}>
            {recommendations.map((rec, i) => (
              <div key={i} style={{ border: `2px solid ${rec.shade || '#9b664444'}`, borderRadius: 12, padding: 12, marginBottom: 12, background: '#e7cdb3', boxShadow: '0 1.5px 8px #774f3822', transition: 'box-shadow .2s' }}>
                <div style={{fontWeight:700,fontSize:16,marginBottom:2,color:'#774f38'}}>{rec.product.title}</div>
                <div style={{display:'flex',alignItems:'center',marginBottom:2}}>Shade: <span style={{ background: rec.shade, padding: '0 10px', borderRadius: 8, marginLeft: 6, color: '#fff', fontWeight: 600 }}>{rec.shade}</span></div>
                <div style={{fontSize:14}}>Confidence: <span style={{color:'#9b6644',fontWeight:700}}>{rec.confidence.toFixed(1)}%</span></div>
                <button style={{marginTop:8,width:'100%',padding:'10px 0',borderRadius:8,border:'none',background:'linear-gradient(90deg,#774f38 0%,#ddb892 100%)',color:'#fff',fontWeight:700,fontSize:15,boxShadow:'0 1.5px 8px #774f3844',cursor:'pointer'}} onClick={() => handleBuyNow(rec.product)}>Buy Now</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Animation keyframes for pop-in and dot-flashing */}
      <style>{`
        @keyframes popIn {0%{transform:scale(0.7);opacity:0} 100%{transform:scale(1);opacity:1}}
        .dot-flashing {position: relative;width: 10px;height: 10px;border-radius: 5px;background-color: #fda085;color: #fda085;animation: dotFlashing 1s infinite linear alternate;}
        @keyframes dotFlashing {0%{background-color:#fda085;}50%,100%{background-color:#fff;}}
      `}</style>
    </div>
  );
}
