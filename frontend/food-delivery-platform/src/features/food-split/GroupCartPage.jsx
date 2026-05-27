import React, { useMemo, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Users, Trash2, CreditCard, Check } from "lucide-react";
import { useFoodSplitSocket } from "../../hooks/useFoodSplitSocket.js";
import { authorizeMockPayment, fetchSplit } from "../../api/foodSplit.js";
import { ROUTES } from "../../utils/roleRoutes.js";
import "./food-split.css";

const PAYMENT_LABELS = ["Очікує", "Холд", "Оплачено", "Помилка"];

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function GroupCartPage() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const guestName = searchParams.get("name") || "Гість";
  const accessToken = localStorage.getItem("accessToken");
  const storedToken = localStorage.getItem(`fs_token_${sessionId}`);

  const [myShare, setMyShare] = useState(null);
  const [paymentIntents, setPaymentIntents] = useState([]);

  const {
    connected,
    room,
    split,
    participantId,
    isHost,
    error,
    addItem,
    removeItem,
    changeStatus,
  } = useFoodSplitSocket(sessionId, {
    accessToken,
    sessionToken: storedToken,
    name: guestName,
    onPaymentStarted: (payload) => {
      setPaymentIntents(payload.intents || []);
      setMyShare(
        payload.split?.participants?.find((p) => p.participantId === participantId)
      );
    },
  });

  const itemsByParticipant = useMemo(() => {
    if (!room?.items || !room?.participants) return [];
    return room.participants.map((p) => ({
      ...p,
      items: room.items.filter((i) => i.participantId === p.id),
    }));
  }, [room]);

  const myParticipant = room?.participants?.find((p) => p.id === participantId);
  const editable = room?.session?.editable;

  const handleRefreshSplit = async () => {
    const s = await fetchSplit(sessionId);
    setMyShare(s.participants?.find((p) => p.participantId === participantId));
  };

  const handleAuthorize = async (intentId) => {
    await authorizeMockPayment(intentId);
    await handleRefreshSplit();
  };

  const demoAddItem = () => {
    if (!editable) return;
    addItem({
      menuItemId: crypto.randomUUID(),
      quantity: 1,
      price: 189,
      name: "Демо-страва",
    });
  };

  return (
    <div className="fs-page">
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="fs-flex fs-items-center fs-justify-between fs-gap-3" style={{ marginBottom: "1rem" }}>
          <h1 className="fs-title">Food Split</h1>
          <span className={`fs-badge ${connected ? "" : ""}`}>
            {connected ? "Онлайн" : "Підключення…"}
          </span>
        </div>

        {error && <div className="fs-error">{error}</div>}

        {room && (
          <>
            <div className="fs-card" style={{ marginBottom: "1rem" }}>
              <div className="fs-flex fs-items-center fs-gap-2" style={{ marginBottom: "0.75rem" }}>
                <Users size={18} />
                <span className="fs-font-bold">Учасники</span>
              </div>
              <div className="fs-flex fs-flex-wrap fs-gap-3">
                {room.participants.map((p) => (
                  <div key={p.id} className="fs-flex fs-items-center fs-gap-2">
                    <div className="fs-avatar">{initials(p.name)}</div>
                    <div>
                      <div className="fs-font-bold">
                        {p.name}
                        {p.id === participantId && " (Ти)"}
                        {p.isHost && " ★"}
                      </div>
                      <div className="fs-text-xs fs-text-muted">
                        {editable ? "Збирає кошик" : PAYMENT_LABELS[p.paymentStatus] || "Оплата"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="fs-card" style={{ marginBottom: "1rem" }}>
              <h2 className="fs-font-bold" style={{ marginBottom: "0.75rem" }}>
                Спільний кошик
              </h2>
              {itemsByParticipant.map((group) => (
                <div key={group.id} style={{ marginBottom: "1rem" }}>
                  <div className="fs-text-sm fs-font-bold" style={{ marginBottom: "0.35rem" }}>
                    {group.name}
                    {group.id === participantId ? " (Ти)" : ""}: {group.items.length} поз.
                  </div>
                  {group.items.length === 0 ? (
                    <p className="fs-text-muted fs-text-sm">Поки порожньо</p>
                  ) : (
                    group.items.map((item) => (
                      <div key={item.id} className="fs-item-row">
                        <span>
                          {item.quantity}× · {item.notes || item.menuItemId.slice(0, 8)} — {item.lineTotal} ₴
                        </span>
                        {group.id === participantId && editable && (
                          <button
                            type="button"
                            className="fs-btn fs-btn-ghost"
                            style={{ padding: "0.25rem 0.5rem" }}
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ))}

              {editable && (
                <button type="button" className="fs-btn fs-btn-ghost" onClick={demoAddItem}>
                  + Додати демо-страву
                </button>
              )}
            </div>

            <div className="fs-card fs-total-box">
              <div className="fs-flex fs-justify-between fs-text-sm">
                <span>Загальна сума (страва)</span>
                <span>{room.subtotal ?? 0} ₴</span>
              </div>
              {split && (
                <div className="fs-flex fs-justify-between fs-text-sm" style={{ marginTop: "0.5rem" }}>
                  <span>З доставкою та зборами</span>
                  <span>{split.grandTotal} ₴</span>
                </div>
              )}
              <div style={{ marginTop: "0.75rem" }}>
                <span className="fs-text-muted fs-text-sm">Твоя частка (прогноз)</span>
                <div className="fs-share-highlight">
                  {myShare?.totalDue ??
                    split?.participants?.find((p) => p.participantId === participantId)?.totalDue ??
                    "—"}{" "}
                  ₴
                </div>
              </div>
            </div>

            <div className="fs-flex fs-gap-3" style={{ marginTop: "1.25rem", flexWrap: "wrap" }}>
              {isHost && editable && (
                <button
                  type="button"
                  className="fs-btn fs-btn-primary"
                  onClick={() => changeStatus("PAYMENT_PROCESSING")}
                >
                  <CreditCard size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
                  Перейти до роздільної оплати
                </button>
              )}
              {!isHost && editable && (
                <button type="button" className="fs-btn fs-btn-ghost" onClick={() => {}}>
                  <Check size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
                  Я закінчив вибір
                </button>
              )}
              <Link to={ROUTES.customer.root} className="fs-btn fs-btn-ghost">
                На головну
              </Link>
            </div>

            {paymentIntents.length > 0 && (
              <div className="fs-card" style={{ marginTop: "1rem" }}>
                <h3 className="fs-font-bold">Оплата (тестовий холд)</h3>
                {paymentIntents.map((pi) => (
                  <div key={pi.paymentIntentId} className="fs-flex fs-justify-between fs-items-center" style={{ marginTop: "0.5rem" }}>
                    <span>
                      {pi.name}: {pi.amount} ₴
                    </span>
                    {pi.participantId === participantId && (
                      <button
                        type="button"
                        className="fs-btn fs-btn-primary"
                        onClick={() => handleAuthorize(pi.paymentIntentId)}
                      >
                        Захолдити
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
