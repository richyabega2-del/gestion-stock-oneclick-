import { useState, useEffect, useRef } from "react"
import axios from "axios"

function Chatbot() {
  const [ouvert, setOuvert] = useState(false)
  const [messages, setMessages] = useState([{ role: "assistant", content: "Bonjour ! Je suis l assistant ONECLICK.\n\nJe peux vous aider avec :\n- Stock disponible\n- CA du mois\n- Ventes du jour\n- Prix des produits\n- Alertes stock\n\nComment puis-je vous aider ?" }])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [nonLus, setNonLus] = useState(0)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { if (ouvert) { setNonLus(0); setTimeout(() => inputRef.current?.focus(), 100) } }, [ouvert])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const effacerConversation = () => setMessages([{ role: "assistant", content: "Conversation effacee. Comment puis-je vous aider ?" }])

  const envoyerMessage = async () => {
    const texte = input.trim()
    if (!texte || loading) return
    const historique = [...messages, { role: "user", content: texte }]
    setMessages(historique)
    setInput("")
    setLoading(true)
    try {
      const { data } = await axios.post("/api/chat", {
        messages: historique.filter(m => m.role === "user" || m.role === "assistant").map(m => ({ role: m.role, content: m.content }))
      })
      setMessages(prev => [...prev, { role: "assistant", content: data.content || "Desole, erreur." }])
      if (!ouvert) setNonLus(prev => prev + 1)
    } catch (err) {
      console.error("Erreur chatbot:", err)
      setMessages(prev => [...prev, { role: "assistant", content: "Erreur de connexion. Reessayez." }])
    } finally { setLoading(false) }
  }

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyerMessage() } }

  const suggestions = ["Quel est le stock disponible ?", "Quel est le CA ce mois ?", "Quels sont vos prix ?", "Quels sont vos horaires ?"]

  const formatMessage = (texte) => texte.split("\n").map((ligne, i, arr) => <span key={i}>{ligne}{i < arr.length - 1 && <br />}</span>)

  return (
    <>
      <div style={{ position: "fixed", bottom: "28px", right: "28px", zIndex: 9999 }}>
        {nonLus > 0 && !ouvert && <div style={{ position: "absolute", top: "-6px", right: "-6px", backgroundColor: "#ef4444", color: "white", width: "20px", height: "20px", borderRadius: "50%", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>{nonLus}</div>}
        <button style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: ouvert ? "#1a1d27" : "#ff6b00", color: "white", border: "none", fontSize: "14px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 20px rgba(255,107,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setOuvert(!ouvert)}>
          {ouvert ? "X" : "OC"}
        </button>
      </div>

      {ouvert && (
        <div style={{ position: "fixed", bottom: "96px", right: "28px", zIndex: 9998, width: "380px", height: "560px", backgroundColor: "#0f1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.6)", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
          <div style={{ padding: "16px 20px", background: "linear-gradient(135deg, #ff6b00, #cc5500)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", color: "white" }}>AI</div>
              <div>
                <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>Assistant ONECLICK</div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "rgba(255,255,255,0.8)" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#22c55e", display: "inline-block" }}></span>
                  En ligne
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", fontSize: "10px", fontWeight: "700" }} onClick={effacerConversation}>DEL</button>
              <button style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", fontSize: "14px", fontWeight: "700" }} onClick={() => setOuvert(false)}>X</button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-end", gap: "8px", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                {msg.role === "assistant" && <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#ff6b00", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "700", flexShrink: 0 }}>AI</div>}
                <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: "14px", fontSize: "13px", lineHeight: "1.5", backgroundColor: msg.role === "user" ? "#ff6b00" : "#1a1d27", color: msg.role === "user" ? "white" : "#d1d5db", border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  {formatMessage(msg.content)}
                </div>
                {msg.role === "user" && <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#ff6b0033", color: "#ff6b00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", flexShrink: 0 }}>U</div>}
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#ff6b00", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "700" }}>AI</div>
                <div style={{ padding: "10px 14px", borderRadius: "14px", backgroundColor: "#1a1d27", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ color: "#8b8fa8", fontSize: "13px" }}>En train d ecrire...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div style={{ padding: "8px 12px", display: "flex", flexWrap: "wrap", gap: "6px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {suggestions.map((s, i) => (
                <button key={i} style={{ padding: "6px 10px", backgroundColor: "#1a1d27", border: "1px solid rgba(255,107,0,0.3)", borderRadius: "20px", color: "#ff6b00", fontSize: "11px", cursor: "pointer" }} onClick={() => { setInput(s); inputRef.current?.focus() }}>{s}</button>
              ))}
            </div>
          )}

          <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <textarea ref={inputRef} style={{ flex: 1, padding: "10px 14px", backgroundColor: "#1a1d27", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", fontSize: "13px", resize: "none", outline: "none", fontFamily: "'Inter', sans-serif", lineHeight: "1.4", maxHeight: "80px" }} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ecrivez votre message..." rows={1} disabled={loading} />
            <button style={{ width: "38px", height: "38px", borderRadius: "10px", backgroundColor: "#ff6b00", border: "none", color: "white", fontSize: "16px", fontWeight: "700", cursor: "pointer", flexShrink: 0, opacity: (!input.trim() || loading) ? 0.5 : 1 }} onClick={envoyerMessage} disabled={!input.trim() || loading}>→</button>
          </div>
          <div style={{ textAlign: "center", fontSize: "10px", color: "#4b5563", padding: "6px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>Propulse par Claude AI · ONECLICK</div>
        </div>
      )}
    </>
  )
}

export default Chatbot