import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createGroupSession } from "../../api/foodSplit.js";
import { ROUTES } from "../../utils/roleRoutes.js";
import "./food-split.css";

export default function CreateGroupSplitPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const businessId = params.get("businessId") || "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreate = async () => {
    if (!businessId) {
      setError("Потрібен businessId у URL (?businessId=...)");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await createGroupSession(businessId);
      localStorage.setItem(`fs_token_${data.sessionId}`, data.sessionToken);
      navigate(`/customer/split/${data.sessionId}`);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Помилка створення");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fs-page">
      <div className="fs-card" style={{ maxWidth: 420, margin: "2rem auto" }}>
        <h1 className="fs-title">Створити Food Split</h1>
        <p className="fs-text-muted fs-text-sm" style={{ margin: "1rem 0" }}>
          Групове замовлення з роздільною оплатою для закладу {businessId || "(вкажіть businessId)"}.
        </p>
        {error && <div className="fs-error">{error}</div>}
        <button
          type="button"
          className="fs-btn fs-btn-primary"
          disabled={loading}
          onClick={handleCreate}
        >
          {loading ? "Створення…" : "Створити кімнату"}
        </button>
      </div>
    </div>
  );
}
